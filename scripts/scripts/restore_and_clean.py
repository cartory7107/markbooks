import json, os

os.chdir('/home/z/my-project/markbooki-655cc7bc')
with open('public/ai-catalog.json', 'r') as f:
    data = json.load(f)

tools = data['tools']
print(f"Starting: {len(tools)} tools")

# Check what exists
urls = {t['u'].strip().rstrip('/') for t in tools}
names_lower = {t['n'].lower().strip() for t in tools}

# 1. Restore missing important tools
MUST_HAVE = [
    {"n": "Google Gemini", "d": "Free · Google's multimodal AI assistant · Image generation, text, code", "c": "AI Assistant", "g": "AI Assistant", "p": "Free", "u": "https://gemini.google.com"},
    {"n": "DALL-E 3", "d": "AI Image Generation by OpenAI · Text-to-image · Integrated with ChatGPT", "c": "AI Image Generator", "g": "AI Image Generator", "p": "Paid", "u": "https://openai.com/dall-e-3"},
    {"n": "DALL-E API", "d": "Free Trial · AI Image Generation · OpenAI's image generation API", "c": "AI Image Generator", "g": "AI Image Generator", "p": "Free Trial", "u": "https://platform.openai.com"},
    {"n": "Midjourney", "d": "Paid · AI Art & Image Generation · Create stunning images from text", "c": "AI Art Generator", "g": "AI Art Generator", "p": "Paid", "u": "https://midjourney.com"},
]

added = 0
for tool in MUST_HAVE:
    url_norm = tool['u'].strip().rstrip('/')
    if url_norm not in urls and tool['n'].lower() not in names_lower:
        tools.append(tool)
        urls.add(url_norm)
        names_lower.add(tool['n'].lower())
        added += 1
        print(f"  Restored: {tool['n']}")

print(f"Restored {added} missing tools")

# 2. Remove remaining ChatGPT fakes (tools using ChatGPT name but not official)
FAKE_CHATGPT_URLS = {
    'freeopenai.com', 'chat.aimakex.com', 'bilibili.com',
    'prompt-bin.com', 'allabtai.com', 'webutility.io',
}

before = len(tools)
tools = [t for t in tools if not (
    'chatgpt' in t['n'].lower() and 
    any(f in t['u'].lower() for f in FAKE_CHATGPT_URLS)
)]
print(f"Removed {before - len(tools)} ChatGPT fakes")

# 3. Remove remaining obvious fakes with brand names in URL but different tool
# e.g. "Free Open AI ChatGPT" pointing to freeopenai.com
FAKE_URL_DOMAINS = {
    'freemidjourney.com', 'api4midjourney.com',
    'geminigoogle.cc', 'chat.googlegemini.co',
    'googlegemini.cc', 'dall-efree.com',
}

before = len(tools)
tools = [t for t in tools if get_domain(t['u']) not in FAKE_URL_DOMAINS]
print(f"Removed {before - len(tools)} fake domain entries")

def get_domain(url):
    try:
        try:
        d = urlparse(url.strip()).netloc.lower()
        if d.startswith('www.'): d = d[4:]
        return d
    except:
        return ''

# Re-run fake domain check (function defined after use above, let me fix)
before = len(tools)
tools_clean = []
for t in tools:
    d = get_domain(t['u'])
    if d in FAKE_URL_DOMAINS:
        continue
    tools_clean.append(t)
print(f"Removed {len(tools) - len(tools_clean)} fake domain entries (pass 2)")

data['tools'] = tools_clean

with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"\nFinal: {len(data['tools'])} tools")

# Final verification
for check in ['Gemini', 'Midjourney', 'Claude', 'Leonardo', 'DALL-E', 'ChatGPT', 'Notion AI', 'Canva AI', 'Figma']:
    matches = [t for t in data['tools'] if check.lower() in t['n'].lower()]
    print(f"{check}: {len(matches)} results")
    for m in matches[:5]:
        print(f'  {m["n"]} -> {m["u"]}')
