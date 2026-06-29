#!/usr/bin/env python3
"""
Research real AI tools by searching across many categories.
Extracts tool info from search results, filters out repos/platforms,
validates URLs, and outputs catalog-format JSON.
"""
import json
import subprocess
import re
import os
import time
from urllib.parse import urlparse
from collections import defaultdict

OUT_FILE = "scripts/researched_tools.json"
SEARCH_LOG = "scripts/search_log.txt"

# Exclude these domains (repos, platforms, non-individual tools)
EXCLUDE_DOMAINS = {
    'github.com', 'huggingface.co', 'huggingface.com', 'vercel.app', 'vercel.com',
    'github.io', 'gitlab.com', 'bitbucket.org', 'reddit.com', 'youtube.com',
    'wikipedia.org', 'medium.com', 'twitter.com', 'x.com', 'facebook.com',
    'instagram.com', 'linkedin.com', 'pinterest.com', 'tiktok.com',
    'news.ycombinator.com', 'producthunt.com', 'npmjs.com', 'pypi.org',
    'crunchbase.com', 'wikipedia.org', 'stackoverflow.com',
    'play.google.com', 'apps.apple.com',
}

# Search queries covering many AI categories
QUERIES = [
    # Writing & Content
    "best AI writing tools 2025 2026",
    "AI content generation tools",
    "AI copywriting software",
    "AI blog writing tools",
    "AI script writing tools",
    "AI paraphrasing tools",
    "AI grammar checker tools",
    "AI email writing tools",
    "AI SEO content tools",
    "AI social media content tools",
    # Image & Design
    "best AI image generation tools 2025",
    "AI logo design tools",
    "AI graphic design tools",
    "AI photo editing tools",
    "AI background removal tools",
    "AI image upscaling tools",
    "AI art generation tools",
    "AI icon design tools",
    "AI video editing tools",
    "AI thumbnail maker tools",
    # Video & Audio
    "AI video generation tools 2025",
    "AI text to video tools",
    "AI video editing software",
    "AI voice cloning tools",
    "AI text to speech tools",
    "AI music generation tools",
    "AI podcast tools",
    "AI transcription tools",
    "AI voice changer tools",
    "AI audio enhancement tools",
    # Code & Development
    "best AI coding tools 2025 2026",
    "AI code assistant tools",
    "AI code review tools",
    "AI website builder tools",
    "AI app builder tools",
    "AI API builder tools",
    "AI database tools",
    "AI testing tools",
    "AI debugging tools",
    "AI documentation tools",
    # Chat & Assistant
    "best AI chatbot tools 2025",
    "AI customer service chatbot",
    "AI personal assistant tools",
    "AI meeting assistant tools",
    "AI scheduling tools",
    "AI email assistant tools",
    "AI research assistant tools",
    "AI translation tools",
    "AI language learning tools",
    "AI tutoring tools",
    # Marketing & Sales
    "AI marketing tools 2025 2026",
    "AI email marketing tools",
    "AI social media management tools",
    "AI ad creative tools",
    "AI SEO tools",
    "AI analytics tools",
    "AI lead generation tools",
    "AI sales assistant tools",
    "AI A/B testing tools",
    "AI content marketing tools",
    # Data & Research
    "AI data analysis tools 2025",
    "AI spreadsheet tools",
    "AI research tools",
    "AI survey tools",
    "AI data visualization tools",
    "AI data cleaning tools",
    "AI web scraping tools",
    "AI competitive analysis tools",
    "AI market research tools",
    "AI academic research tools",
    # Business & Productivity
    "AI productivity tools 2025 2026",
    "AI project management tools",
    "AI note taking tools",
    "AI presentation tools",
    "AI document tools",
    "AI workflow automation tools",
    "AI HR tools",
    "AI finance tools",
    "AI accounting tools",
    "AI legal tools",
    # Healthcare
    "AI healthcare tools 2025",
    "AI medical diagnosis tools",
    "AI mental health tools",
    "AI fitness tools",
    "AI nutrition tools",
    "AI drug discovery tools",
    # Education
    "AI education tools 2025",
    "AI tutoring platforms",
    "AI grading tools",
    "AI course creation tools",
    "AI flashcard tools",
    # Creative
    "AI music production tools",
    "AI game development tools",
    "AI 3D modeling tools",
    "AI animation tools",
    "AI storytelling tools",
    # E-commerce
    "AI e-commerce tools 2025",
    "AI product description tools",
    "AI pricing tools",
    "AI inventory tools",
    "AI customer review tools",
    # Security & Privacy
    "AI cybersecurity tools 2025",
    "AI privacy tools",
    "AI fraud detection tools",
    "AI password manager tools",
    # Communications
    "AI communication tools 2025",
    "AI video conferencing tools",
    "AI collaboration tools",
    "AI knowledge base tools",
    # Real Estate
    "AI real estate tools 2025",
    "AI property valuation tools",
    # Travel
    "AI travel planning tools 2025",
    "AI booking tools",
    # Food & Recipe
    "AI recipe tools 2025",
    "AI meal planning tools",
    # Photography
    "AI photo enhancement tools",
    "AI portrait tools",
    "AI headshot tools",
    # More specific niches
    "AI presentation maker tools",
    "AI resume builder tools",
    "AI cover letter tools",
    "AI contract analysis tools",
    "AI invoice tools",
    "AI chatbot builder platforms",
    "AI agent builder tools",
    "AI workflow tools",
    "AI automation platforms",
    "AI no-code tools",
    "AI low-code tools",
    "AI interior design tools",
    "AI fashion design tools",
    "AI architecture tools",
    "AI legal research tools",
    "AI patent tools",
    "AI compliance tools",
    "AI customer support tools",
    "AI helpdesk tools",
    "AI knowledge management tools",
    "AI document summarization tools",
    "AI PDF tools",
    "AI form builder tools",
    "AI survey builder tools",
    "AI quiz maker tools",
    "AI webinar tools",
    "AI landing page builders with AI",
    "AI copywriting assistant",
    "AI brainstorming tools",
    "AI mind mapping tools",
    "AI diagram tools",
    "AI whiteboard tools",
    "AI slide design tools",
    "AI infographic tools",
]

def is_excluded(url):
    try:
        host = urlparse(url).hostname or ''
        host = host.lower()
        for ex in EXCLUDE_DOMAINS:
            if host == ex or host.endswith('.' + ex):
                return True
        return False
    except:
        return True

def is_individual_tool(url, name, snippet):
    """Heuristic: is this likely an individual AI product page?"""
    if is_excluded(url):
        return False
    # Must have a real domain (not a generic search result)
    host = urlparse(url).hostname or ''
    if len(host) < 4:
        return False
    # Filter out obvious non-tool pages
    non_tool_words = ['best', 'top 10', 'top 50', 'list of', 'comparison', 
                       'vs ', ' versus', 'alternative', 'alternatives',
                       'review', 'reviews', 'how to', 'what is', 'guide',
                       'tutorial', 'blog', 'news', 'article']
    combined = (name + ' ' + snippet).lower()
    # If the title starts with "Best" or "Top" it's likely a listicle
    for w in non_tool_words:
        if name.lower().startswith(w) or name.lower().startswith('the ' + w):
            return False
    return True

def extract_tool_name(url, title):
    """Try to extract a clean tool name."""
    # Use the domain name as base
    host = urlparse(url).hostname or ''
    # Remove TLD
    parts = host.replace('www.', '').split('.')
    if len(parts) >= 2:
        name = parts[0]
    else:
        name = host
    # Clean up
    name = name.replace('-',' ').replace('_',' ').title()
    return name

def categorize_from_query(query):
    """Map search query to a category."""
    q = query.lower()
    if any(w in q for w in ['writ', 'copywrit', 'blog', 'script', 'paraphras', 'grammar', 'seo content', 'email writ']):
        return 'AI Writing'
    if any(w in q for w in ['image', 'photo', 'art', 'logo', 'design', 'icon', 'thumbnail', 'background']):
        return 'AI Image & Design'
    if any(w in q for w in ['video', 'text to video']):
        return 'AI Video'
    if any(w in q for w in ['audio', 'voice', 'speech', 'music', 'podcast', 'transcri', 'sound']):
        return 'AI Audio & Music'
    if any(w in q for w in ['code', 'develop', 'program', 'debug', 'api', 'website builder', 'app builder']):
        return 'AI Developer Tools'
    if any(w in q for w in ['chatbot', 'chat', 'assistant', 'meeting', 'schedul', 'tutor', 'translat']):
        return 'AI Chatbot & Assistant'
    if any(w in q for w in ['market', 'ad', 'seo', 'analyt', 'lead', 'sales', 'a/b', 'social media']):
        return 'AI Marketing'
    if any(w in q for w in ['data', 'spreadsheet', 'research', 'survey', 'visuali', 'scrap']):
        return 'AI Data Analysis'
    if any(w in q for w in ['productiv', 'project', 'note', 'present', 'document', 'workflow', 'hr', 'finance', 'account', 'legal']):
        return 'AI Productivity'
    if any(w in q for w in ['health', 'medical', 'mental', 'fitness', 'nutrition', 'drug']):
        return 'AI Healthcare'
    if any(w in q for w in ['educat', 'tutor', 'grade', 'course', 'flashcard']):
        return 'AI Education'
    if any(w in q for w in ['music prod', 'game', '3d', 'animation', 'storytell', 'creative']):
        return 'AI Creative'
    if any(w in q for w in ['ecommerce', 'product desc', 'pricing', 'inventory', 'review']):
        return 'AI E-Commerce'
    if any(w in q for w in ['security', 'cyber', 'privacy', 'fraud', 'password']):
        return 'AI Security'
    if any(w in q for w in ['communicat', 'conferenc', 'collaborat', 'knowledge base']):
        return 'AI Communication'
    if any(w in q for w in ['real estate', 'property']):
        return 'AI Real Estate'
    if any(w in q for w in ['travel', 'booking']):
        return 'AI Travel'
    if any(w in q for w in ['recipe', 'meal', 'food']):
        return 'AI Food & Recipe'
    if any(w in q for w in ['portrait', 'headshot', 'enhancement']):
        return 'AI Photography'
    if any(w in q for w in ['resume', 'cover letter', 'contract', 'invoice', 'compliance', 'patent']):
        return 'AI Business'
    if any(w in q for w in ['no-code', 'low-code', 'agent builder', 'automation', 'workflow']):
        return 'AI Automation'
    if any(w in q for w in ['pdf', 'form', 'quiz', 'webinar', 'landing page', 'diagram', 'mind map', 'whiteboard', 'infographic', 'slide', 'brainstorm']):
        return 'AI Productivity'
    return 'AI Tool'

def search_and_extract(query, num=10):
    """Run a web search and extract tool info from results."""
    try:
        result = subprocess.run(
            ['z-ai', 'function', '-n', 'web_search', '-a', json.dumps({"query": query, "num": num})],
            capture_output=True, text=True, timeout=30, cwd='/home/z/my-project/markbook'
        )
        # Parse output - the CLI outputs to stdout with some prefix text
        output = result.stdout
        # Try to find JSON in output
        # The CLI might output the results after the emoji text
        # Let's look for array or object patterns
        tools_found = []
        
        # Search for URLs in the output
        url_pattern = r'(https?://[^\s"\'\)>]+)'
        urls = re.findall(url_pattern, output)
        
        # Also look for structured data patterns
        # Try to find the actual JSON response
        lines = output.split('\n')
        json_lines = []
        in_json = False
        for line in lines:
            if '[' in line or '{' in line:
                in_json = True
            if in_json:
                json_lines.append(line)
        
        if json_lines:
            json_str = '\n'.join(json_lines)
            try:
                data = json.loads(json_str)
                if isinstance(data, list):
                    for item in data:
                        if isinstance(item, dict):
                            url = item.get('url', '')
                            name = item.get('name', '')
                            snippet = item.get('snippet', '')
                            if url and is_individual_tool(url, name, snippet):
                                tools_found.append({
                                    'name': name,
                                    'url': url,
                                    'snippet': snippet,
                                    'category': categorize_from_query(query)
                                })
                elif isinstance(data, dict):
                    results = data.get('result', data.get('data', data.get('items', [])))
                    if isinstance(results, list):
                        for item in results:
                            if isinstance(item, dict):
                                url = item.get('url', '')
                                name = item.get('name', '')
                                snippet = item.get('snippet', '')
                                if url and is_individual_tool(url, name, snippet):
                                    tools_found.append({
                                        'name': name,
                                        'url': url,
                                        'snippet': snippet,
                                        'category': categorize_from_query(query)
                                    })
            except json.JSONDecodeError:
                pass
        
        return tools_found
    except subprocess.TimeoutExpired:
        return []
    except Exception as e:
        return []

def main():
    all_tools = {}
    total_queries = len(QUERIES)
    
    print(f"Starting research with {total_queries} queries...", flush=True)
    
    for i, query in enumerate(QUERIES):
        pct = (i + 1) / total_queries * 100
        print(f"\r[{pct:.0f}%] Query {i+1}/{total_queries}: {query[:60]}...", end='', flush=True)
        
        results = search_and_extract(query, num=10)
        for tool in results:
            url = tool['url']
            if url not in all_tools:
                all_tools[url] = tool
        
        # Small delay to avoid rate limiting
        time.sleep(0.5)
    
    print(f"\n\nTotal unique tools found: {len(all_tools)}", flush=True)
    
    # Convert to catalog format
    catalog_tools = []
    seen_names = set()
    
    for url, tool in all_tools.items():
        name = tool.get('name', '') or extract_tool_name(url, '')
        if not name or name in seen_names:
            name = extract_tool_name(url, '')
        if name and name not in seen_names:
            seen_names.add(name)
            catalog_tools.append({
                'n': name,
                'd': tool.get('snippet', '')[:200],
                'c': tool.get('category', 'AI Tool'),
                'p': '',
                'u': url
            })
    
    with open(OUT_FILE, 'w') as f:
        json.dump(catalog_tools, f, indent=2)
    
    print(f"Saved {len(catalog_tools)} tools to {OUT_FILE}", flush=True)

if __name__ == '__main__':
    main()