#!/usr/bin/env python3
"""Generate AI tools using LLM + web search, parse, validate, merge into catalog."""
import json
import subprocess
import re
import time
import os
import asyncio
import aiohttp
from urllib.parse import urlparse
from collections import Counter

CATALOG = 'public/ai-catalog.json'
OUT_RAW = 'scripts/raw_researched.json'
CATALOG_ADD = 'scripts/new_tools_to_add.json'

# Category-specific prompts for LLM - each targets a niche
PROMPTS = [
    "List 500 real AI writing and content tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites, NO github/huggingface/vercel. Include: AI copywriting, AI blog writing, AI email writing, AI paraphrasing, AI grammar, AI storytelling, AI script writing, AI poetry, AI translation, AI summarization, AI proofreading, AI content optimization tools.",
    "List 500 real AI image generation and design tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI art generators, AI logo makers, AI photo editors, AI background removal, AI image upscaling, AI avatar generators, AI icon design, AI poster design, AI infographic makers, AI fashion design, AI interior design tools.",
    "List 500 real AI video tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI video generators, AI video editors, AI text-to-video, AI video enhancers, AI subtitle generators, AI video compressors, AI animation tools, AI deepfake tools, AI video analytics, AI thumbnail makers.",
    "List 500 real AI audio and music tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI text-to-speech, AI voice cloning, AI music generation, AI podcast tools, AI transcription, AI audio enhancement, AI noise removal, AI sound effects, AI singing tools, AI audio mastering.",
    "List 500 real AI coding and developer tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI code assistants, AI code reviewers, AI website builders, AI API tools, AI testing tools, AI debugging tools, AI database tools, AI DevOps tools, AI documentation tools, AI security scanning tools.",
    "List 500 real AI chatbot and assistant tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI customer service bots, AI personal assistants, AI meeting assistants, AI scheduling tools, AI email assistants, AI research assistants, AI tutoring tools, AI companion AI, AI coaching tools.",
    "List 500 real AI marketing and sales tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI email marketing, AI social media management, AI ad creators, AI SEO tools, AI analytics, AI lead generation, AI sales assistants, AI CRM tools, AI A/B testing, AI influencer marketing tools.",
    "List 500 real AI data analysis and research tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI data visualization, AI spreadsheet tools, AI survey tools, AI web scraping, AI market research, AI academic research, AI statistical tools, AI business intelligence, AI reporting tools.",
    "List 500 real AI productivity and business tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI project management, AI note-taking, AI presentation makers, AI document tools, AI workflow automation, AI HR tools, AI finance tools, AI legal tools, AI accounting, AI contract analysis.",
    "List 500 real AI healthcare and science tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI medical diagnosis, AI mental health, AI fitness, AI nutrition, AI drug discovery, AI genomics, AI radiology, AI clinical trials, AI patient management, AI medical imaging.",
    "List 500 real AI education and learning tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI tutoring platforms, AI language learning, AI course creation, AI flashcard tools, AI grading tools, AI plagiarism detection, AI math solvers, AI science tools, AI coding education.",
    "List 500 real AI e-commerce and retail tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI product description writers, AI pricing tools, AI inventory management, AI customer review analyzers, AI recommendation engines, AI chatbot for e-commerce, AI visual search, AI return management.",
    "List 500 real AI communication and collaboration tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI video conferencing, AI team collaboration, AI knowledge bases, AI document sharing, AI translation, AI captioning, AI meeting notes, AI email management, AI CRM communication.",
    "List 500 real AI creative and entertainment tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI game development, AI 3D modeling, AI storytelling, AI comic creation, AI meme generators, AI joke generators, AI party games, AI virtual worlds, AI character creation.",
    "List 500 real AI photography and image tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI photo enhancement, AI portrait tools, AI headshot generators, AI photo colorization, AI photo restoration, AI object removal, AI style transfer, AI photo organizing.",
    "List 500 real AI SEO and website tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI keyword research, AI content optimization, AI link building, AI site audit, AI rank tracking, AI competitor analysis, AI backlink analysis, AI on-page SEO, AI technical SEO.",
    "List 500 real AI automation and workflow tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI workflow builders, AI no-code platforms, AI low-code tools, AI RPA tools, AI process automation, AI Zapier alternatives, AI integration platforms, AI task automation.",
    "List 500 real AI real estate, travel, and lifestyle tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI property valuation, AI travel planning, AI booking assistants, AI recipe generators, AI meal planning, AI fashion advice, AI dating assistants, AI pet care.",
    "List 500 real AI security, privacy, and compliance tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI cybersecurity, AI threat detection, AI privacy tools, AI fraud detection, AI compliance monitoring, AI risk assessment, AI identity verification, AI data protection.",
    "List 500 real AI niche and emerging tools. Format: NUMBER. NAME | URL | one sentence. ONLY real websites. Include: AI for agriculture, AI for construction, AI for manufacturing, AI for logistics, AI for sports, AI for music production, AI for architecture, AI for fashion, AI for legal, AI for finance.",
]

EXCLUDE_DOMAINS = {
    'github.com', 'huggingface.co', 'huggingface.com', 'vercel.app',
    'github.io', 'gitlab.com', 'bitbucket.org', 'reddit.com', 'youtube.com',
    'wikipedia.org', 'medium.com', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'linkedin.com', 'pinterest.com', 'tiktok.com',
    'news.ycombinator.com', 'producthunt.com', 'npmjs.com', 'pypi.org',
    'crunchbase.com', 'stackoverflow.com', 'play.google.com', 'apps.apple.com',
    'blogspot.com', 'wordpress.com', 'wix.com', 'squarespace.com',
}

def parse_llm_output(content):
    """Parse LLM output into tool dicts."""
    tools = []
    for line in content.split('\n'):
        line = line.strip()
        # Remove numbering like "1. " or "123. "
        line = re.sub(r'^\d+[\.\)]\s*', '', line)
        if '|' not in line or 'http' not in line:
            continue
        
        parts = line.split('|')
        if len(parts) < 3:
            continue
        
        name = parts[0].strip().lstrip('*').rstrip('*').strip()
        url = ''
        desc = ''
        
        for part in parts[1:]:
            part = part.strip()
            if part.startswith('http'):
                url = part
            elif url and not desc:
                desc = part
        
        if not url or not name:
            continue
        
        # Clean URL
        url = url.split()[0]  # Take first word only
        if not url.startswith('http'):
            url = 'https://' + url
        
        # Validate domain
        try:
            host = urlparse(url).hostname or ''
            if any(host == ex or host.endswith('.' + ex) for ex in EXCLUDE_DOMAINS):
                continue
            if len(host) < 4:
                continue
        except:
            continue
        
        tools.append({'n': name, 'u': url, 'd': desc[:200]})
    
    return tools

def run_llm(prompt, output_file):
    """Run LLM chat and save result."""
    try:
        result = subprocess.run(
            ['z-ai', 'chat', '-p', prompt, '-o', output_file],
            capture_output=True, text=True, timeout=180,
            cwd='/home/z/my-project/markbook'
        )
        with open(output_file) as f:
            data = json.load(f)
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        return content
    except Exception as e:
        print(f'  ERROR: {e}')
        return ''

async def validate_urls(tools, batch_size=1000):
    """Quick URL validation."""
    sem = asyncio.Semaphore(500)
    valid = []
    
    async def check(s, idx_url):
        idx, url = idx_url
        async with sem:
            if not url.startswith('http'): return None
            try:
                p = urlparse(url)
                if not p.hostname or len(p.hostname) < 3: return None
                tld = p.hostname.split('.')[-1]
                if len(tld) < 2: return None
            except: return None
            try:
                async with s.head(url, allow_redirects=False, ssl=False,
                                   timeout=aiohttp.ClientTimeout(total=4)) as r:
                    if 200 <= r.status < 400 or r.status in (403, 429):
                        return idx
                    if r.status in (301, 302, 303, 307, 308):
                        loc = r.headers.get('Location', '')
                        if loc:
                            orig = urlparse(url).hostname or ''
                            if loc.startswith('/') or (urlparse(loc).hostname or '').lower() == orig.lower():
                                return idx
            except:
                pass
            return None
    
    conn = aiohttp.TCPConnector(limit=500, limit_per_host=3, ssl=False)
    async with aiohttp.ClientSession(connector=conn) as s:
        for i in range(0, len(tools), batch_size):
            batch = [(j, tools[j]['u']) for j in range(i, min(i + batch_size, len(tools)))]
            res = await asyncio.gather(*[check(s, iu) for iu in batch], return_exceptions=True)
            for r in res:
                if r is not None and not isinstance(r, Exception):
                    valid.append(r)
            print(f'  Validated {min(i + batch_size, len(tools)):,}/{len(tools):,} ({len(valid):,} ok)', flush=True)
    
    return valid

def main():
    t0 = time.time()
    all_tools = {}  # url -> tool dict (dedup by URL)
    
    print(f"Running {len(PROMPTS)} LLM calls...", flush=True)
    
    for i, prompt in enumerate(PROMPTS):
        pct = (i + 1) / len(PROMPTS) * 100
        print(f"\r[{pct:.0f}%] Batch {i+1}/{len(PROMPTS)}...", end='', flush=True)
        
        out_file = f'scripts/llm_batch_{i}.json'
        content = run_llm(prompt, out_file)
        
        if content:
            parsed = parse_llm_output(content)
            for tool in parsed:
                url = tool['u']
                if url not in all_tools:
                    all_tools[url] = tool
        
        time.sleep(1)  # Rate limit
    
    tools_list = list(all_tools.values())
    print(f"\n\nLLM generated {len(tools_list):,} unique tools", flush=True)
    
    # Save raw
    with open(OUT_RAW, 'w') as f:
        json.dump(tools_list, f)
    
    # Validate URLs
    print(f"\nValidating {len(tools_list):,} URLs...", flush=True)
    valid_indices = asyncio.run(validate_urls(tools_list))
    
    valid_tools = [tools_list[i] for i in valid_indices]
    print(f"\nValid URLs: {len(valid_tools):,} / {len(tools_list):,}", flush=True)
    
    # Load existing catalog to check for duplicates
    with open(CATALOG) as f:
        existing = json.load(f)
    existing_urls = set(t.get('u', '') for t in existing['tools'])
    
    # Filter out duplicates
    new_tools = [t for t in valid_tools if t['u'] not in existing_urls]
    print(f"New (not in catalog): {len(new_tools):,}", flush=True)
    
    # Assign categories and pricing
    cat_map = {
        0: 'AI Writing', 1: 'AI Design', 2: 'AI Video', 3: 'AI Audio & Music',
        4: 'AI Developer Tools', 5: 'AI Chatbot', 6: 'AI Marketing',
        7: 'AI Data Analysis', 8: 'AI Productivity', 9: 'AI Healthcare',
        10: 'AI Education', 11: 'AI E-Commerce', 12: 'AI Communication',
        13: 'AI Creative', 14: 'AI Photography', 15: 'AI SEO',
        16: 'AI Automation', 17: 'AI Lifestyle', 18: 'AI Security'
    }
    
    final_new = []
    for t in new_tools:
        final_new.append({
            'n': t['n'],
            'd': t['d'] or f"{t['n']} - AI tool",
            'c': t.get('c', 'AI Tool'),
            'p': '',
            'u': t['u']
        })
    
    with open(CATALOG_ADD, 'w') as f:
        json.dump(final_new, f)
    
    print(f"\nSaved {len(final_new):,} new tools to {CATALOG_ADD}", flush=True)
    print(f"Total time: {time.time()-t0:.0f}s", flush=True)

if __name__ == '__main__':
    main()