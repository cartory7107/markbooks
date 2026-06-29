#!/usr/bin/env python3
"""URL checker chunk - process tools[start:end], save results to chunk file."""
import asyncio, aiohttp, json, time, os, sys
from urllib.parse import urlparse

CATALOG = sys.argv[1]
START = int(sys.argv[2])
END = int(sys.argv[3])
CID = sys.argv[4]
OUT = f'public/.chunk_{CID}.json'

sem = asyncio.Semaphore(500)
ok_count = 0
total_checked = 0

async def check(s, url):
    global ok_count, total_checked
    async with sem:
        total_checked += 1
        if not url or not isinstance(url, str) or len(url) < 10 or len(url) > 2048:
            return False
        if not url.startswith(('http://', 'https://')):
            return False
        try:
            p = urlparse(url)
            if not p.hostname or len(p.hostname) < 3: return False
            tld = p.hostname.split('.')[-1]
            if not tld or len(tld) < 2: return False
        except: return False
        
        try:
            async with s.head(url, allow_redirects=False, ssl=False,
                               timeout=aiohttp.ClientTimeout(total=5)) as r:
                st = r.status
                if 200 <= st < 400 or st in (403, 429):
                    ok_count += 1
                    return True
                if st in (301, 302, 303, 307, 308):
                    loc = r.headers.get('Location', '')
                    if loc:
                        orig = urlparse(url).hostname or ''
                        if loc.startswith('/'):
                            ok_count += 1
                            return True
                        red = urlparse(loc).hostname or ''
                        if red and red.lower() == orig.lower():
                            ok_count += 1
                            return True
                    return False
                return False
        except asyncio.TimeoutError:
            return False
        except Exception as e:
            er = str(e).lower()
            if 'ssl' in er or 'certificate' in er:
                ok_count += 1
                return True
            return False

async def main():
    global ok_count, total_checked
    t0 = time.time()
    print(f'Loading catalog for chunk {CID} ({START}-{END})...', flush=True)
    with open(CATALOG) as f:
        data = json.load(f)
    tools = data['tools'][START:END]
    n = len(tools)
    print(f'Checking {n:,} URLs...', flush=True)

    conn = aiohttp.TCPConnector(limit=500, limit_per_host=3, ssl=False)
    valid = []
    BS = 1000

    async with aiohttp.ClientSession(connector=conn) as s:
        for i in range(0, n, BS):
            batch = tools[i:i + BS]
            res = await asyncio.gather(*[check(s, t.get('u', '')) for t in batch], return_exceptions=True)
            for j, r in enumerate(res):
                if r is True:
                    valid.append(START + i + j)
            done = min(i + BS, n)
            el = time.time() - t0
            rate = done / el if el > 0 else 0
            eta = (n - done) / rate if rate > 0 else 0
            print(f'  [{done:,}/{n:,}] ok={ok_count:,} rate={rate:.0f}/s eta={int(eta//60)}m{int(eta%60)}s', flush=True)

    # Save immediately
    result = {'chunk': CID, 'start': START, 'end': END, 'valid_indices': valid, 'ok': ok_count, 'total': n, 'time': round(time.time() - t0, 1)}
    with open(OUT, 'w') as f:
        json.dump(result, f)
    print(f'\nChunk {CID} DONE: {n:,} checked, {len(valid):,} valid in {result["time"]}s', flush=True)

asyncio.run(main())