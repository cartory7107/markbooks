#!/usr/bin/env python3
"""Final cleanup pass: remove remaining fakes, deduplicate same-domain entries."""
import json, os, re
from urllib.parse import urlparse
from collections import defaultdict

os.chdir('/home/z/my-project/markbooki-655cc7bc')
with open('public/ai-catalog.json', 'r') as f:
    data = json.load(f)

tools = data['tools']
print(f"Starting: {len(tools)} tools")

# 1. Remove obvious fakes by name patterns
FAKE_PATTERNS = [
    r'^free\s*(midjourney|chatgpt|gpt|claude|gemini|dall.e|dalle|sora|copilot)',
    r'^(midjourney|chatgpt|gpt|claude|gemini|dall.e|sora)\s*(proxy|free|hack|mod|crack|unlocked|unlimited|bot|clone|alternative)',
    r'(proxy|unlocked|crack|hack|mod|pirate)\s*(midjourney|chatgpt|gpt|claude)',
    r'^open\s*(ai|chatgpt)\s*(free|writer|tool|bot|chat)',
]

def is_fake_by_pattern(name):
    n = name.lower().strip()
    for pat in FAKE_PATTERNS:
        if re.search(pat, n):
            return True
    return False

before = len(tools)
tools = [t for t in tools if not is_fake_by_pattern(t['n'])]
print(f"Removed {before - len(tools)} fake-by-pattern entries")

# 2. Deduplicate by root domain - keep the best entry per domain
def get_root_domain(url):
    try:
        p = urlparse(url.strip())
        d = p.netloc.lower()
        if d.startswith('www.'): d = d[4:]
        parts = d.split('.')
        if len(parts) >= 2:
            # Keep last 2 parts for root domain (e.g., claude.ai, anthropic.com)
            # But for co.uk etc keep 3
            if len(parts) >= 3 and parts[-2] in ('co', 'com', 'org', 'gov', 'net', 'io'):
                return '.'.join(parts[-3:])
            return '.'.join(parts[-2:])
        return d
    except:
        return ''

# Group by root domain, pick best per domain
domain_groups = defaultdict(list)
for t in tools:
    rd = get_root_domain(t['u'])
    domain_groups[rd].append(t)

def pick_best(group):
    """Pick the best tool entry from a group sharing the same root domain."""
    if len(group) == 1:
        return group[0]
    
    # Prefer: shortest name (most official), then no trailing slash
    scored = []
    for t in group:
        score = 0
        # Shorter name is better for official
        name_len = len(t['n'].strip())
        score -= name_len
        # No subpath is better (homepage)
        p = urlparse(t['u'].strip())
        path = p.path.strip('/')
        if not path or path == '/':
            score += 100
        else:
            score -= len(path)
        # No query params
        if not p.query:
            score += 10
        # .ai domain bonus
        if t['u'].strip().endswith('.ai') or '.ai/' in t['u']:
            score += 5
        scored.append((score, t))
    
    scored.sort(key=lambda x: -x[0])
    return scored[0][1]

kept = []
removed_domain_dups = 0

for rd, group in domain_groups.items():
    if len(group) == 1:
        kept.append(group[0])
    else:
        best = pick_best(group)
        kept.append(best)
        removed_domain_dups += len(group) - 1

print(f"Removed {removed_domain_dups} same-domain duplicates")
tools = kept

# 3. Final: remove entries with non-resolving or clearly bad domains
BAD_TLDS = ['.css', '.js', '.json', '.xml', '.png', '.jpg', '.svg', '.woff', '.woff2', '.mp4', '.mp3']
def has_bad_tld(url):
    try:
        path = urlparse(url.strip()).path.lower()
        for ext in BAD_TLDS:
            if path.endswith(ext):
                return True
    except:
        pass
    return False

before = len(tools)
tools = [t for t in tools if not has_bad_tld(t['u'])]
print(f"Removed {before - len(tools)} non-tool URL entries (CSS/JS/JSON files)")

data['tools'] = tools

with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"\nFinal: {len(data['tools'])} tools")

# Verify key brands
for check in ['Gemini', 'Midjourney', 'Claude', 'Leonardo', 'DALL-E', 'ChatGPT', 'Notion AI', 'Canva', 'Figma']:
    matches = [t for t in data['tools'] if check.lower() in t['n'].lower()]
    print(f"\n{check}: {len(matches)} results")
    for m in matches[:5]:
        print(f'  {m["n"]} -> {m["u"]}')