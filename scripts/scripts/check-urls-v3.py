#!/usr/bin/env python3
"""URL checker - runs in background, saves progress, uses \n for log output."""
import asyncio, aiohttp, json, time, os, sys
from collections import Counter
from urllib.parse import urlparse

CATALOG = 'public/ai-catalog.json'
PROGRESS = 'public/.check_progress.json'
REPORT = 'public/url-check-report.json'
LOG = 'scripts/check-output.log'

stats = Counter()
start = time.time()

def valid_url(u):
    if not u or not isinstance(u, str) or len(u) < 10 or len(u) > 2048:
        return False
    if not u.startswith(('http://', 'https://')):
        return False
    try:
        p = urlparse(u)
        if not p.hostname or len(p.hostname) < 3:
            return False
        tld = p.hostname.split('.')[-1]
        if not tld or len(tld) < 2:
            return False
        return True
    except:
        return False

async def check(s, url, sem):
    async with sem:
        if not valid_url(url):
            return 'invalid'
        try:
            async with s.head(url, allow_redirects=False, ssl=False,
                               timeout=aiohttp.ClientTimeout(total=5)) as r:
                st = r.status
                if 200 <= st < 400 or st in (403, 429):
                    return 'ok'
                if st in (301, 302, 303, 307, 308):
                    loc = r.headers.get('Location', '')
                    if loc:
                        orig = urlparse(url).hostname or ''
                        if loc.startswith('/'):
                            return 'ok'
                        red = urlparse(loc).hostname or ''
                        if red and red.lower() == orig.lower():
                            return 'ok'
                    return 'badredir'
                return 'dead'
        except asyncio.TimeoutError:
            return 'timeout'
        except Exception as e:
            er = str(e).lower()
            if 'name or service not known' in er or 'nodename' in er or 'getaddrinfo' in er:
                return 'dns'
            if 'ssl' in er or 'certificate' in er:
                return 'ok'
            return 'error'

def log(msg):
    print(msg, flush=True)

async def main():
    log('Loading catalog...')
    sys.stdout.flush()
    with open(CATALOG) as f:
        data = json.load(f)
    tools = data['tools']
    cats = data['categories']
    ce = data['categoryEmojis']
    total = len(tools)
    log(f'Total: {total:,}')

    start_from = 0
    valid_idx = set()
    if os.path.exists(PROGRESS):
        try:
            with open(PROGRESS) as f:
                p = json.load(f)
            start_from = p['checked']
            valid_idx = set(p['valid_indices'])
            log(f'Resuming from {start_from:,} ({len(valid_idx):,} valid)')
        except Exception as e:
            log(f'Could not load progress: {e}')

    urls = [(i, t.get('u', '')) for i, t in enumerate(tools)]
    sem = asyncio.Semaphore(500)
    conn = aiohttp.TCPConnector(limit=500, limit_per_host=3, ssl=False)

    async with aiohttp.ClientSession(connector=conn) as s:
        BS = 1000
        for i in range(start_from, len(urls), BS):
            batch = urls[i:i + BS]
            coros = [check(s, u, sem) for _, u in batch]
            res = await asyncio.gather(*coros, return_exceptions=True)

            for (idx, _), r in zip(batch, res):
                st = 'error' if isinstance(r, Exception) else r
                stats[st] += 1
                if st == 'ok':
                    valid_idx.add(idx)

            done = min(i + BS, total)
            pct = done / total * 100
            el = time.time() - start
            rate = (done - start_from) / el if el > 0 else 0
            eta = (total - done) / rate if rate > 0 else 0

            log(f'[{pct:.1f}%] {done:,}/{total:,} OK:{stats["ok"]:,} Dead:{stats["dead"]:,} DNS:{stats["dns"]:,} TO:{stats["timeout"]:,} BR:{stats["badredir"]:,} Err:{stats["error"]:,} ETA:{int(eta // 60)}m{int(eta % 60)}s Rate:{rate:.0f}/s')

            if done % 10000 < BS:
                with open(PROGRESS, 'w') as f:
                    json.dump({'checked': done, 'valid_indices': list(valid_idx)}, f)
                log(f'  >> Progress saved: {len(valid_idx):,} valid')

    # Write final catalog
    valid_tools = [tools[i] for i in sorted(valid_idx)]
    log(f'Writing catalog with {len(valid_tools):,} valid tools...')
    with open(CATALOG, 'w') as f:
        json.dump({'tools': valid_tools, 'categories': cats, 'categoryEmojis': ce}, f)

    removed = total - len(valid_tools)
    report = {
        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
        'total_original': total,
        'total_valid': len(valid_tools),
        'total_removed': removed,
        'removal_rate': f'{removed / total * 100:.1f}%',
        'breakdown': dict(stats),
        'duration_s': round(time.time() - start, 1)
    }
    with open(REPORT, 'w') as f:
        json.dump(report, f, indent=2)

    try:
        os.remove(PROGRESS)
    except:
        pass

    log(f'COMPLETE: {total:,} -> {len(valid_tools):,} valid ({report["removal_rate"]} removed) in {report["duration_s"]}s')
    for k, v in sorted(stats.items()):
        log(f'  {k}: {v:,}')

if __name__ == '__main__':
    try:
        asyncio.run(main())
    except Exception as e:
        log(f'FATAL ERROR: {e}')
        import traceback
        traceback.print_exc()