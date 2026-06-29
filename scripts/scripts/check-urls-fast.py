#!/usr/bin/env python3
"""Fast URL checker for AI catalog - truly concurrent with asyncio.gather."""

import asyncio
import json
import time
import os
from collections import Counter
from urllib.parse import urlparse
import aiohttp

CATALOG = 'public/ai-catalog.json'
REPORT = 'public/url-check-report.json'
CONCURRENCY = 300
TIMEOUT = 7
PROGRESS_FILE = 'public/.check_progress.json'

SPAM_DOMAINS = {'localhost', '127.0.0.1', 'example.com', 'example.org', 'test.com',
                'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'is.gd'}

stats = Counter()
start_time = time.time()

def is_valid_url(url):
    if not url or not isinstance(url, str):
        return False
    if not url.startswith(('http://', 'https://')):
        return False
    if len(url) < 10 or len(url) > 2048:
        return False
    try:
        p = urlparse(url)
        if not p.hostname or len(p.hostname) < 3:
            return False
        tld = p.hostname.split('.')[-1]
        if not tld or len(tld) < 2:
            return False
        if any(s in p.hostname.lower() for s in SPAM_DOMAINS):
            return False
        return True
    except:
        return False

async def check_one(session, url, sem):
    """Check one URL. Returns 'ok' or reason string."""
    async with sem:
        if not is_valid_url(url):
            return 'invalid'

        try:
            async with session.head(url, allow_redirects=False, ssl=False,
                                     timeout=aiohttp.ClientTimeout(total=TIMEOUT)) as resp:
                st = resp.status
                if 200 <= st < 400 or st in (403, 429):
                    return 'ok'
                elif st in (301, 302, 303, 307, 308):
                    loc = resp.headers.get('Location', '')
                    if loc:
                        orig = urlparse(url).hostname or ''
                        if loc.startswith('/'):
                            return 'ok'
                        red = urlparse(loc).hostname or ''
                        if red and red.lower() == orig.lower():
                            return 'ok'
                    return 'bad_redirect'
                else:
                    return 'dead'
        except asyncio.TimeoutError:
            return 'timeout'
        except Exception as e:
            err = str(e).lower()
            if 'name or service not known' in err or 'nodename' in err or 'getaddrinfo' in err:
                return 'dns'
            elif 'ssl' in err or 'certificate' in err:
                return 'ok'  # SSL error but domain exists
            elif 'refused' in err:
                return 'refused'
            elif 'reset' in err:
                return 'reset'
            elif 'too many open' in err or 'socket' in err:
                return 'error'
            else:
                return 'error'

async def check_batch(session, items, sem):
    """Check a batch concurrently using gather."""
    coros = [check_one(session, url, sem) for _, url in items]
    results = await asyncio.gather(*coros, return_exceptions=True)
    return [(idx, 'error' if isinstance(r, Exception) else r) for (idx, _), r in zip(items, results)]

async def main():
    print("Loading catalog...", flush=True)
    with open(CATALOG, 'r') as f:
        data = json.load(f)

    tools = data.get('tools', [])
    categories = data.get('categories', {})
    categoryEmojis = data.get('categoryEmojis', {})
    total = len(tools)
    print(f"Total tools: {total:,}", flush=True)

    # Check for existing progress
    start_from = 0
    valid_indices = set()
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE) as f:
                prog = json.load(f)
            start_from = prog.get('checked', 0)
            valid_indices = set(prog.get('valid_indices', []))
            print(f"Resuming from {start_from:,} (already found {len(valid_indices):,} valid)", flush=True)
        except:
            pass

    url_list = [(i, t.get('u', '')) for i, t in enumerate(tools)]
    sem = asyncio.Semaphore(CONCURRENCY)

    connector = aiohttp.TCPConnector(limit=CONCURRENCY, limit_per_host=3, ssl=False, ttl_dns_cache=300)
    async with aiohttp.ClientSession(connector=connector) as session:
        batch_size = 500  # URLs per gather call
        checked = start_from

        for i in range(start_from, len(url_list), batch_size):
            batch = url_list[i:i + batch_size]
            results = await check_batch(session, batch, sem)

            for idx, status in results:
                checked += 1
                stats[status] += 1
                if status == 'ok':
                    valid_indices.add(idx)

            pct = (checked / total) * 100
            elapsed = time.time() - start_time
            rate = (checked - start_from) / elapsed if elapsed > 0 else 0
            eta = (total - checked) / rate if rate > 0 else 0

            print(
                f"\r[{pct:5.1f}%] {checked:,}/{total:,} | "
                f"OK: {stats['ok']:,} | Dead: {stats['dead']:,} | "
                f"DNS: {stats['dns']:,} | TO: {stats['timeout']:,} | "
                f"BadRedir: {stats['bad_redirect']:,} | Err: {stats['error']:,} | "
                f"ETA: {int(eta//60)}m{int(eta%60)}s   ",
                end='', flush=True
            )

            # Save progress every 10000
            if checked % 10000 < batch_size:
                with open(PROGRESS_FILE, 'w') as f:
                    json.dump({'checked': checked, 'valid_indices': list(valid_indices)}, f)
                print(f"\n  >> Progress saved: {len(valid_indices):,} valid", flush=True)

    # Build final
    valid_tools = [tools[i] for i in sorted(valid_indices)]
    final = {"tools": valid_tools, "categories": categories, "categoryEmojis": categoryEmojis}

    print(f"\n\nWriting final catalog...", flush=True)
    with open(CATALOG, 'w') as f:
        json.dump(final, f)

    removed = total - len(valid_tools)
    report = {
        "timestamp": time.strftime('%Y-%m-%d %H:%M:%S'),
        "total_original": total,
        "total_valid": len(valid_tools),
        "total_removed": removed,
        "removal_rate": f"{(removed/total*100):.1f}%",
        "breakdown": dict(stats),
        "duration_seconds": round(time.time() - start_time, 1)
    }
    with open(REPORT, 'w') as f:
        json.dump(report, f, indent=2)

    try:
        os.remove(PROGRESS_FILE)
    except:
        pass

    print(f"\n{'='*50}")
    print(f"CHECK COMPLETE")
    print(f"{'='*50}")
    print(f"  Original:   {total:,}")
    print(f"  Valid:      {len(valid_tools):,}")
    print(f"  Removed:    {removed:,} ({report['removal_rate']})")
    for k, v in sorted(stats.items()):
        print(f"    {k}: {v:,}")
    print(f"  Duration:   {report['duration_seconds']}s")

if __name__ == '__main__':
    asyncio.run(main())