const fs = require('fs');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const CATALOG_PATH = 'public/ai-catalog.json';
const OUTPUT_PATH = 'public/ai-catalog.json';
const REPORT_PATH = 'public/url-check-report.json';
const BATCH_SIZE = 80; // concurrent requests
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 2;

// Spam/invalid domains to reject
const SPAM_DOMAINS = [
  'localhost', '127.0.0.1', 'example.com', 'example.org',
  'test.com', 'fake.com', 'xxx', 'porn', 'gambling',
  'bit.ly', 't.co', 'tinyurl.com' // link shorteners often dead
];

const stats = {
  total: 0,
  valid: 0,
  dead: 0,
  timeout: 0,
  redirect_to_different: 0,
  invalid_url: 0,
  error: 0,
  checked: 0,
  startTime: Date.now()
};

function isSpamDomain(hostname) {
  const h = hostname.toLowerCase();
  return SPAM_DOMAINS.some(s => h.includes(s));
}

function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname || parsed.hostname.length < 3) return false;
    if (isSpamDomain(parsed.hostname)) return false;
    // Must have a TLD of at least 2 chars
    const tld = parsed.hostname.split('.').pop();
    if (!tld || tld.length < 2) return false;
    return true;
  } catch {
    return false;
  }
}

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!isValidUrl(url)) {
      stats.invalid_url++;
      resolve({ url, status: 'invalid_url', ok: false });
      return;
    }

    const startTime = Date.now();
    let redirects = 0;
    let currentUrl = url;
    let originalHost = '';

    try {
      originalHost = new URL(url).hostname;
    } catch {
      stats.invalid_url++;
      resolve({ url, status: 'invalid_url', ok: false });
      return;
    }

    function doRequest(reqUrl) {
      const timer = setTimeout(() => {
        stats.timeout++;
        resolve({ url, status: 'timeout', ok: false, time: Date.now() - startTime });
      }, TIMEOUT_MS);

      try {
        const parsed = new URL(reqUrl);
        const protocol = parsed.protocol === 'https:' ? https : http;
        const options = {
          hostname: parsed.hostname,
          port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
          path: parsed.pathname + parsed.search,
          method: 'HEAD',
          timeout: TIMEOUT_MS,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MarkbookBot/1.0; +https://markbook.top)',
            'Accept': 'text/html,application/xhtml+xml,*/*',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          rejectUnauthorized: false,
        };

        const req = protocol.request(options, (res) => {
          clearTimeout(timer);

          // Handle redirects
          if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
            redirects++;
            if (redirects > MAX_REDIRECTS) {
              stats.redirect_to_different++;
              resolve({ url, status: 'too_many_redirects', ok: false, time: Date.now() - startTime });
              return;
            }
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              redirectUrl = `${parsed.protocol}//${parsed.hostname}${redirectUrl}`;
            }
            // Check if redirect goes to different domain
            try {
              const redirectHost = new URL(redirectUrl).hostname;
              if (redirectHost !== originalHost) {
                stats.redirect_to_different++;
                resolve({ url, status: 'redirect_to_different', ok: false, finalHost: redirectHost, time: Date.now() - startTime });
                return;
              }
            } catch {}
            doRequest(redirectUrl);
            return;
          }

          const elapsed = Date.now() - startTime;

          if (res.statusCode >= 200 && res.statusCode < 400) {
            stats.valid++;
            resolve({ url, status: res.statusCode, ok: true, time: elapsed });
          } else if (res.statusCode === 403) {
            // 403 might still be a valid site (blocking bots), count as valid
            stats.valid++;
            resolve({ url, status: 403, ok: true, time: elapsed });
          } else if (res.statusCode === 429) {
            // Rate limited - consider valid (site exists)
            stats.valid++;
            resolve({ url, status: 429, ok: true, time: elapsed });
          } else {
            stats.dead++;
            resolve({ url, status: res.statusCode, ok: false, time: elapsed });
          }
        });

        req.on('error', (err) => {
          clearTimeout(timer);
          // DNS failure = dead
          if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
            stats.dead++;
            resolve({ url, status: 'dns_failure', ok: false, time: Date.now() - startTime });
          } else if (err.code === 'ECONNREFUSED') {
            stats.dead++;
            resolve({ url, status: 'connection_refused', ok: false, time: Date.now() - startTime });
          } else if (err.code === 'ECONNRESET') {
            stats.dead++;
            resolve({ url, status: 'connection_reset', ok: false, time: Date.now() - startTime });
          } else if (err.code === 'CERT_HAS_EXPIRED' || err.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
            // SSL errors but site exists - count as valid
            stats.valid++;
            resolve({ url, status: 'ssl_error_but_exists', ok: true, time: Date.now() - startTime });
          } else {
            stats.error++;
            resolve({ url, status: err.code || 'unknown_error', ok: false, time: Date.now() - startTime });
          }
        });

        req.on('timeout', () => {
          clearTimeout(timer);
          req.destroy();
          stats.timeout++;
          resolve({ url, status: 'timeout', ok: false, time: Date.now() - startTime });
        });

        req.end();
      } catch (err) {
        clearTimeout(timer);
        stats.error++;
        resolve({ url, status: 'request_error', ok: false, time: Date.now() - startTime });
      }
    }

    doRequest(currentUrl);
  });
}

async function processBatch(tools, startIdx) {
  const batch = tools.slice(startIdx, startIdx + BATCH_SIZE);
  const results = await Promise.allSettled(batch.map(async (tool) => {
    const result = await checkUrl(tool.u);
    return { tool, result };
  }));

  const validTools = [];
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.result.ok) {
      validTools.push(r.value.tool);
    }
  }
  return validTools;
}

async function main() {
  console.log('Loading catalog...');
  const raw = fs.readFileSync(CATALOG_PATH, 'utf-8');
  const data = JSON.parse(raw);
  const tools = data.tools || [];
  const categories = data.categories || {};
  const categoryEmojis = data.categoryEmojis || {};

  stats.total = tools.length;
  console.log(`Total tools to check: ${stats.total.toLocaleString()}`);

  const validTools = [];
  const batchSize = BATCH_SIZE;
  const totalBatches = Math.ceil(tools.length / batchSize);

  // Save progress every 5000 tools
  const SAVE_INTERVAL = 5000;

  for (let i = 0; i < tools.length; i += batchSize) {
    const batchNum = Math.floor(i / batchSize) + 1;
    const progress = ((i / tools.length) * 100).toFixed(1);

    const elapsed = (Date.now() - stats.startTime) / 1000;
    const rate = stats.checked / elapsed;
    const remaining = (tools.length - i) / rate;

    process.stdout.write(
      `\r[${progress}%] Batch ${batchNum}/${totalBatches} | ` +
      `Valid: ${stats.valid.toLocaleString()} | Dead: ${stats.dead.toLocaleString()} | ` +
      `Timeout: ${stats.timeout.toLocaleString()} | Bad redirect: ${stats.redirect_to_different.toLocaleString()} | ` +
      `ETA: ${Math.floor(remaining / 60)}m ${Math.floor(remaining % 60)}s   `
    );

    const batchValid = await processBatch(tools, i);
    validTools.push(...batchValid);
    stats.checked = stats.valid + stats.dead + stats.timeout + stats.redirect_to_different + stats.invalid_url + stats.error;

    // Save progress periodically
    if (i > 0 && i % (SAVE_INTERVAL) < batchSize) {
      const progressData = {
        tools: validTools,
        categories,
        categoryEmojis
      };
      fs.writeFileSync(OUTPUT_PATH + '.partial', JSON.stringify(progressData));
      console.log(`\n  [SAVED PROGRESS: ${validTools.length.toLocaleString()} valid so far]`);
    }
  }

  console.log('\n\n=== CHECK COMPLETE ===');

  const finalData = {
    tools: validTools,
    categories,
    categoryEmojis
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(finalData));

  const report = {
    timestamp: new Date().toISOString(),
    total_original: stats.total,
    total_valid: validTools.length,
    total_removed: stats.total - validTools.length,
    breakdown: {
      valid: stats.valid,
      dead: stats.dead,
      timeout: stats.timeout,
      redirect_to_different_domain: stats.redirect_to_different,
      invalid_url: stats.invalid_url,
      other_errors: stats.error
    },
    duration_seconds: ((Date.now() - stats.startTime) / 1000).toFixed(1)
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log(`\nResults:`);
  console.log(`  Original:  ${stats.total.toLocaleString()}`);
  console.log(`  Valid:     ${validTools.length.toLocaleString()}`);
  console.log(`  Removed:   ${(stats.total - validTools.length).toLocaleString()}`);
  console.log(`    - Dead (4xx/5xx/DNS fail): ${stats.dead.toLocaleString()}`);
  console.log(`    - Timeout:                 ${stats.timeout.toLocaleString()}`);
  console.log(`    - Redirect to diff domain:  ${stats.redirect_to_different.toLocaleString()}`);
  console.log(`    - Invalid URL:              ${stats.invalid_url.toLocaleString()}`);
  console.log(`    - Other errors:             ${stats.error.toLocaleString()}`);
  console.log(`  Duration:  ${report.duration_seconds}s`);
  console.log(`\nSaved: ${OUTPUT_PATH}`);
  console.log(`Report: ${REPORT_PATH}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});