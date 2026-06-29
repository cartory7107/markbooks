#!/usr/bin/env python3
"""
Cleanup duplicate/fake/garbage AI tools from catalog.
Rules:
1. Remove garbage names (non-tool names like "Try it!", "官网", "Cdn", etc.)
2. For duplicates with same name: keep the most official URL, remove fakes/affiliates
3. Remove affiliate/referral URLs (?via=, ?ref=, ?utm_, etc.)
4. Remove broken/malformed URLs (relative paths, no domain, etc.)
5. Remove entries pointing to CDN/non-tool domains
"""
import json
import re
from collections import Counter, defaultdict
from urllib.parse import urlparse, parse_qs, unquote

import os
os.chdir('/home/z/my-project/markbooki-655cc7bc')

with open('public/ai-catalog.json', 'r') as f:
    data = json.load(f)

tools = data['tools']
print(f"Starting with {len(tools)} tools")

# --- PHASE 1: Remove garbage entries ---
GARBAGE_NAMES = {
    "try it!", "官网", "url", "cdn", "website", "demo", "paper", "video",
    "privacy policy", "visit tool", "ai news", "automation", "email assistant",
    "about", "blog", "contact", "home", "null", "undefined", "none",
    "name", "description", "category", "tools", "tool", "ai tool",
    "more", "see more", "view all", "learn more", "get started", "try now",
    "sign up", "login", "register", "download", "free", "paid", "pricing",
    "features", "features & pricing", "read more", "click here", "go",
    "back", "next", "previous", "close", "open", "menu", "search",
    "subscribe", "follow", "share", "copy", "link", "bookmark", "save",
    "print", "send", "delete", "remove", "edit", "update", "create",
    "new", "old", "latest", "popular", "trending", "top", "best",
    "#", "-", "—", "–", "…", "...", "", " ", "  ", "   ",
    "www.hostinger.com", "dash", "gist ai", "summarize", "summarizer",
    "ai agents", "ai tools", "directory", "categories", "collections",
    "topics", "list", "all tools", "browse", "explore", "discover",
    "compare", "reviews", "ratings", "alternative", "alternatives",
    "similar", "related", "vs", "vs.", "or", "and", "the", "a", "an",
    "ai", "chat", "chatbot", "image", "video", "audio", "text", "code",
    "writing", "design", "art", "music", "photo", "voice", "speech",
    "n/a", "na", "tbd", "coming soon", "beta", "alpha", "v1", "v2",
    "free trial", "pro", "premium", "enterprise", "basic", "starter",
    "standard", "advanced", "ultimate", "plus", "max", "ultra",
    "page", "article", "post", "blog post", "guide", "tutorial",
    "documentation", "docs", "help", "support", "faq", "terms",
    "terms of service", "cookie policy", "refund policy", "disclaimer",
    "advertising", "sponsor", "partner", "affiliate", "promoted",
    "sponsored", "ad", "advertisement", "banner", "popup", "modal",
    "navigation", "header", "footer", "sidebar", "content", "main",
    "section", "block", "component", "element", "widget", "plugin",
    "extension", "add-on", "addon", "integration", "api", "sdk",
    "webhook", "endpoint", "service", "platform", "framework",
    "library", "package", "module", "app", "application", "software",
    "program", "system", "solution", "product", "service", "tool",
    "resource", "asset", "file", "document", "report", "template",
    "theme", "layout", "style", "design", "pattern", "component",
}

# Also remove single-char, very short names, and names that are just URLs
def is_garbage_name(name):
    n = name.strip().lower()
    if n in GARBAGE_NAMES:
        return True
    if len(n) <= 2 and not n.isalpha():
        return True
    # Names that are clearly not tool names
    if re.match(r'^[\d]+$', n):
        return True
    # Names that are just generic words with numbers
    if re.match(r'^(page|item|row|col|section|block)\s*\d+$', n):
        return True
    # Chinese junk names
    if n in {"官网", "链接", "访问", "下载", "更多", "查看", "返回"}:
        return True
    return False

# --- PHASE 2: URL validation ---
GARBAGE_DOMAINS = {
    'cdn.ziffstatic.com', 'cdn.static.zdbb.net', 'cdn.cookielaw.org',
    'cdn.jsdelivr.net', 'cdn.optimizely.com', 'cdn.doubleverify.com',
    'cdn.ttgtmedia.com', 'cdn.geekflare.com', 'cdn.convertbox.com',
    'cdn.ainave.com', 'cdn.aifordevelopers.org', 'cdn.tailwindcss.com',
    'cdn.altern.ai', 'cdn.dribbble.com', 'cdn.shopify.com',
    'cdn.prod.website-files.com', 'github.com', 'github.io',
    'gitlab.com', 'bitbucket.org', 'stackoverflow.com',
    'youtube.com', 'facebook.com', 'twitter.com', 'x.com',
    'linkedin.com', 'instagram.com', 'tiktok.com', 'reddit.com',
    'wikipedia.org', 'amazon.com', 'google.com', 'apple.com',
    'microsoft.com', 'netflix.com', 'spotify.com', 'twitch.tv',
}

AFFILIATE_PARAMS = {'via', 'ref', 'ref_code', 'aff_id', 'gr_pk', 'gr_uid',
    'lmref', 'sjv.io', 'go2cloud.org', 'utm_source', 'utm_medium', 'utm_campaign',
    'utm_id', 'utm_content', 'utm_term'}

def is_bad_url(url):
    if not url or not url.strip():
        return True
    u = url.strip()
    # Relative URLs (no domain)
    if u.startswith('/'):
        return True
    # No protocol
    if not u.startswith('http://') and not u.startswith('https://'):
        return True
    parsed = urlparse(u)
    domain = parsed.netloc.lower()
    if domain.startswith('www.'):
        domain = domain[4:]
    # Remove trailing slash for comparison
    if domain.endswith('/'):
        domain = domain[:-1]
    # CDN / non-tool domains
    if domain in GARBAGE_DOMAINS:
        return True
    # Contains affiliate params
    qs = parse_qs(parsed.query)
    for param in AFFILIATE_PARAMS:
        if param in qs:
            return True
    # Very long URLs with obvious tracking params
    if len(u) > 300:
        return True
    # URLs with %20 or encoded junk
    if '%20' in u or '%0A' in u:
        return True
    # toolspedia.io / aitoolnet.com internal category links
    if 'toolspedia.io/ai-tools/' in u or 'aitoolnet.com/' in u:
        return True
    # URLs that are clearly just category/tag pages
    path = parsed.path.lower()
    if path in {'/categories', '/category', '/topics', '/collections', '/blog',
                '/news', '/tools', '/ai-tools', '/privacy', '/terms', '/about'}:
        return True
    return False

def normalize_url(url):
    """Normalize URL for dedup comparison."""
    u = url.strip().rstrip('/')
    parsed = urlparse(u)
    domain = parsed.netloc.lower()
    if domain.startswith('www.'):
        domain = domain[4:]
    path = parsed.path.rstrip('/')
    return f"{domain}{path}"

def normalize_name(name):
    """Normalize tool name for comparison."""
    n = name.strip()
    # Remove trailing punctuation
    n = re.sub(r'[\s]+', ' ', n)
    n = n.strip()
    return n.lower()

# --- PHASE 3: Score URLs for "most official" ---
OFFICIAL_DOMAINS = {
    'openai.com': 10, 'anthropic.com': 10, 'google.com': 10, 'microsoft.com': 10,
    'midjourney.com': 10, 'stability.ai': 10, 'meta.com': 10, 'adobe.com': 10,
    'canva.com': 10, 'notion.so': 10, 'figma.com': 10, 'vercel.com': 10,
    'huggingface.co': 10, 'github.com': 8, 'runwayml.com': 10, 'leonardo.ai': 10,
}

def url_official_score(url):
    """Higher = more likely the official site."""
    parsed = urlparse(url.strip())
    domain = parsed.netloc.lower()
    if domain.startswith('www.'):
        domain = domain[4:]
    score = 0
    # .ai / .com / .io are more official for AI tools
    if domain.endswith('.ai'):
        score += 5
    elif domain.endswith('.com'):
        score += 4
    elif domain.endswith('.io'):
        score += 3
    elif domain.endswith('.co'):
        score += 2
    # No trailing slash
    if not url.rstrip().endswith('/'):
        score += 1
    # Shorter path = more official (homepage)
    path = parsed.path.rstrip('/')
    if path in ('', '/'):
        score += 3
    elif len(path) < 15:
        score += 1
    # No query params = cleaner
    if not parsed.query:
        score += 2
    # Known official domains
    for od, s in OFFICIAL_DOMAINS.items():
        if od in domain:
            score += s
    return score

# --- EXECUTE ---

# Step 1: Remove garbage names
before = len(tools)
tools = [t for t in tools if not is_garbage_name(t['n'])]
removed_garbage = before - len(tools)
print(f"Removed {removed_garbage} garbage-name entries")

# Step 2: Remove bad URLs
before = len(tools)
tools = [t for t in tools if not is_bad_url(t['u'])]
removed_badurl = before - len(tools)
print(f"Removed {removed_badurl} bad-URL entries")

# Step 3: Deduplicate by normalized name
name_groups = defaultdict(list)
for t in tools:
    key = normalize_name(t['n'])
    name_groups[key].append(t)

kept = []
removed_dups = 0

for name_key, group in name_groups.items():
    if len(group) == 1:
        kept.append(group[0])
        continue
    
    # Multiple entries with same name - pick the best one
    # Score each by URL official-ness
    scored = []
    for t in group:
        score = url_official_score(t['u'])
        scored.append((score, t))
    
    # Sort by score descending, keep the best
    scored.sort(key=lambda x: -x[0])
    kept.append(scored[0][1])
    removed_dups += len(group) - 1

print(f"Removed {removed_dups} duplicate-name entries (kept best URL each)")

data['tools'] = kept

# Step 4: Deduplicate by normalized URL (same site listed under different names)
url_map = {}
final = []
removed_url_dups = 0

for t in kept:
    norm = normalize_url(t['u'])
    if norm in url_map:
        removed_url_dups += 1
        continue
    url_map[norm] = t['n']
    final.append(t)

print(f"Removed {removed_url_dups} duplicate-URL entries")
data['tools'] = final

# Save
with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"\nFinal: {len(data['tools'])} tools (removed {removed_garbage + removed_badurl + removed_dups + removed_url_dups} total)")

# Show some stats
cats = Counter(t['c'] for t in data['tools'])
print(f"\nTop 10 categories: {cats.most_common(10)}")
plans = Counter(t['p'] for t in data['tools'])
print(f"Pricing: {plans.most_common(10)}")
