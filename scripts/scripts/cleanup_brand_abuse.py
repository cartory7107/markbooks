#!/usr/bin/env python3
"""
Remove brand-name abuse: tools that use famous AI brand names
but point to completely different/unofficial websites.
Keep only the REAL official tool.
"""
import json, re, os
from urllib.parse import urlparse

os.chdir('/home/z/my-project/markbooki-655cc7bc')

with open('public/ai-catalog.json', 'r') as f:
    data = json.load(f)

tools = data['tools']
print(f"Starting: {len(tools)} tools")

# Official brands: (brand_keyword, official_domain_pattern, official_urls_set)
BRANDS = {
    'gemini': {
        'official': ['gemini.google.com'],
        'allow_suffix': ['pdf', 'pro', 'flash', 'omni', 'cli', 'api', 'coder', 'bot', 'agent'],
    },
    'midjourney': {
        'official': ['midjourney.com'],
        'allow_suffix': ['sref', 'prompt', 'style', 'guide', 'library', 'calculator', 'tracker'],
    },
    'chatgpt': {
        'official': ['chat.openai.com', 'openai.com', 'chatgpt.com'],
        'allow_suffix': ['prompt', 'wrapper', 'plugin', 'extension', 'sidebar', 'for outlook', 'for gmail', 'for slack', 'shortcut', 'alternatives'],
    },
    'claude': {
        'official': ['claude.ai', 'anthropic.com'],
        'allow_suffix': ['skills', 'code'],
    },
    'gpt': {
        'official': ['openai.com', 'chat.openai.com'],
        'exclude_exact': ['gpt'],  # Don't match just "GPT" alone
        'allow_suffix': ['prompt', 'wrapper', 'agent', 'bot'],
    },
    'dall-e': {
        'official': ['openai.com'],
        'allow_suffix': ['free', 'api', 'prompt'],
    },
    'sora': {
        'official': ['openai.com', 'sora.com'],
        'allow_suffix': ['prompt'],
    },
    'copilot': {
        'official': ['github.com', 'microsoft.com'],
        'allow_suffix': ['for', 'alternative'],
    },
    'figma': {
        'official': ['figma.com'],
        'allow_suffix': ['for', 'plugin', 'extension', 'to'],
    },
    'notion': {
        'official': ['notion.so', 'notion.com'],
        'allow_suffix': ['for', 'template', 'plugin'],
    },
    'canva': {
        'official': ['canva.com'],
        'allow_suffix': ['for', 'template', 'plugin', 'app'],
    },
    'stability': {
        'official': ['stability.ai'],
        'allow_suffix': [],
    },
    'hugging face': {
        'official': ['huggingface.co'],
        'allow_suffix': [],
    },
    'runway': {
        'official': ['runwayml.com', 'runway.com'],
        'allow_suffix': [],
    },
    'leonardo': {
        'official': ['leonardo.ai'],
        'allow_suffix': [],
    },
    'perplexity': {
        'official': ['perplexity.ai'],
        'allow_suffix': [],
    },
    'deepseek': {
        'official': ['deepseek.com'],
        'allow_suffix': [],
    },
    'grammarly': {
        'official': ['grammarly.com'],
        'allow_suffix': ['alternative'],
    },
    'jasper': {
        'official': ['jasper.ai'],
        'allow_suffix': [],
    },
    'cursor': {
        'official': ['cursor.sh', 'cursor.com'],
        'allow_suffix': [],
    },
    'vercel': {
        'official': ['vercel.com'],
        'allow_suffix': [],
    },
    'github': {
        'official': ['github.com'],
        'allow_suffix': ['copilot'],
    },
    'adobe': {
        'official': ['adobe.com'],
        'allow_suffix': [],
    },
    'google': {
        'official': ['google.com'],
        'exclude_if_alone': True,
        'allow_suffix': [],
    },
    'meta': {
        'official': ['meta.com', 'facebook.com'],
        'allow_suffix': [],
    },
    'openai': {
        'official': ['openai.com'],
        'allow_suffix': [],
    },
    'anthropic': {
        'official': ['anthropic.com'],
        'allow_suffix': [],
    },
}

def get_domain(url):
    try:
        parsed = urlparse(url.strip())
        d = parsed.netloc.lower()
        if d.startswith('www.'): d = d[4:]
        return d
    except:
        return ''

def is_official_domain(url, official_domains):
    domain = get_domain(url)
    for od in official_domains:
        if od in domain or domain.endswith(od):
            return True
    return False

def has_allowed_suffix(name, brand, allowed):
    lower = name.lower()
    brand_stripped = lower.replace(brand, '').strip()
    if not brand_stripped or brand_stripped in ('ai', 'bot', 'chat', 'free', 'pro', 'premium'):
        return False
    for suffix in allowed:
        if suffix in brand_stripped:
            return True
    return False

removed = 0
kept = []

for t in tools:
    name_lower = t['n'].lower().strip()
    domain = get_domain(t['u'])
    is_fake = False
    
    for brand, info in BRANDS.items():
        if brand not in name_lower:
            continue
        
        # Skip if brand is excluded when alone
        if info.get('exclude_if_alone') and name_lower == brand:
            continue
        if info.get('exclude_exact') and name_lower == info['exclude_exact']:
            continue
        
        # Is this the official tool?
        if is_official_domain(t['u'], info['official']):
            continue
        
        # Is it a legitimate tool that USES the brand (has allowed suffix)?
        if has_allowed_suffix(t['n'], brand, info.get('allow_suffix', [])):
            continue
        
        # It uses the brand name but points to a different domain
        # This is likely a fake/clone - REMOVE
        is_fake = True
        break
    
    if is_fake:
        removed += 1
    else:
        kept.append(t)

data['tools'] = kept

with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"Removed {removed} brand-abuse fakes")
print(f"Final: {len(data['tools'])} tools")

# Verify
for check in ['Gemini', 'Midjourney', 'ChatGPT', 'Claude']:
    matches = [t for t in data['tools'] if check.lower() in t['n'].lower()]
    print(f"{check}: {len(matches)} results")
    for m in matches[:5]:
        print(f'  - {m["n"]} -> {m["u"]}')
