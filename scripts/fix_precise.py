#!/usr/bin/env python3
"""Precise fix: only touch the exact 100 tools, no collateral damage."""
import json, os

REPO = '/home/z/my-project/markbooki-8f13eaad'
SRC = '/home/z/my-project/markbooki-655cc7bc'

# 1. Start fresh from the CLEAN master catalog
with open(f'{SRC}/public/ai-catalog.json') as f:
    master = json.load(f)
tools = master['tools']
print(f'Clean master: {len(tools)} tools')

# 2. Exact name -> correct category mapping for the 100 tools
EXACT_FIXES = {
    'Midjourney': 'AI Image Generator',
    'Dalle 3': 'AI Image Generator',
    'Stable Diffusion': 'AI Image Generator',
    'Craiyon': 'AI Image Generator',
    'Nightcafe Studio': 'AI Image Generator',
    'Leonardo.Ai': 'AI Image Generator',
    'Adobe Firefly': 'AI Image Generator',
    'Playground v2.5': 'AI Image Generator',
    'PixAI': 'AI Anime Generator',
    'Tensor Art': 'AI Image Generator',
    'Seaart.ai': 'AI Image Generator',
    'BlueWillow': 'AI Image Generator',
    'Deep Dream Generator': 'AI Image Generator',
    'Artbreeder': 'AI Image Generator',
    'StarryAI': 'AI Image Generator',
    'CF Spark Pro': 'AI Image Generator',
    'Flux': 'AI Image Generator',
    'Krea AI': 'AI Image Generator',
    'Ideogram': 'AI Image Generator',
    'Clipdrop': 'AI Photo Editor',
    'Remove.bg': 'AI Photo Editor',
    'Jasper Art': 'AI Image Generator',
    'Designs AI': 'AI Image Generator',
    'Looka': 'AI Logo Generator',
    'Stockimg AI': 'AI Image Generator',
    'Hotpot.ai': 'AI Image Generator',
    'Deep AI': 'AI Image Generator',
    'DreamStudio': 'AI Image Generator',
    'NovelAI': 'AI Anime Generator',
    'Waifu Labs': 'AI Anime Generator',
    'This Person Does Not Exist': 'AI Avatar Generator',
    'Generated Photos': 'AI Avatar Generator',
    'ArtSmart': 'AI Image Generator',
    'Fotor AI Pro': 'AI Photo Editor',
    'Lensa AI': 'AI Photo Editor',
    'Photo Room': 'AI Photo Editor',
    'Luma AI': 'AI Video Generator',
    'Kaiber': 'AI Video Generator',
    'Pika': 'AI Video Generator',
    'Getimg.ai': 'AI Image Generator',
    'Dezgo': 'AI Image Generator',
    'TinyWow': 'AI Photo Editor',
    'Cutout.pro': 'AI Photo Editor',
    'Palette.fm': 'AI Photo Editor',
    'Stable Diffusion XL': 'AI Image Generator',
    'Recraft': 'AI Image Generator',
    'Magnific': 'AI Image Upscaler',
    'Topaz Video Ai': 'AI Photo Editor',
    'Runway Gen 4.5': 'AI Video Generator',
    'Upscayl': 'AI Image Upscaler',
    'Picsart AI': 'AI Photo Editor',
    'Civitai': 'AI Image Generator',
    'Glif': 'AI Image Generator',
    'Canva AI': 'AI Design',
    'Invideo AI': 'AI Video Generator',
    'LTX Studio': 'AI Video Generator',
    'Synthesia': 'AI Avatar Video Generator',
    'HeyGen': 'AI Avatar Video Generator',
    'D-ID': 'AI Avatar Video Generator',
    'VEED.IO': 'AI Video Editor',
    'CapCut': 'AI Video Editor',
    'Fliki AI': 'AI Video Generator',
    'Elai.io': 'AI Avatar Video Generator',
    'Colossyan Creator': 'AI Avatar Video Generator',
    'Deepbrain': 'AI Avatar Video Generator',
    'Hour One': 'AI Avatar Video Generator',
    'Tavus': 'AI Avatar Video Generator',
    'Arcads': 'AI Video Generator',
    'Creatify': 'AI Video Generator',
    'Opus Clip': 'AI Video Editor',
    'Vizard.ai': 'AI Video Editor',
    'Munch': 'AI Video Editor',
    'Pictory': 'AI Video Generator',
    'InVideo': 'AI Video Generator',
    'Lumen5': 'AI Video Generator',
    'Wavevideo': 'AI Video Generator',
    'Renderforest': 'AI Video Generator',
    'FlexClip AI Image Generator': 'AI Video Generator',
    'Klap': 'AI Video Editor',
    'Descript': 'AI Video Editor',
    'Filmora': 'AI Video Editor',
    'Animoto': 'AI Video Generator',
    'Biteable': 'AI Video Generator',
    'Powtoon': 'AI Video Generator',
    'Vyond': 'AI Video Generator',
    'Steve AI': 'AI Video Generator',
    'AdCreative.ai': 'AI Image Generator',
    'Copy Ai': 'AI Writing',
    'Jasper AI': 'AI Writing',
    'Writesonic': 'AI Writing',
    'Freepik AI': 'AI Image Generator',
    'Depositphotos AI': 'AI Image Generator',
    'Wombo': 'AI Image Generator',
    'Artify Gg': 'AI Image Generator',
    'Neurons AI': 'AI Image Generator',
    'Firefly III': 'AI Image Generator',
    'Synthesys.io': 'AI Voice Generator',
    'Topaz Video Ai': 'AI Photo Editor',
}

# 3. Fix categories ONLY for exact matches
fixed = 0
for t in tools:
    if t['n'] in EXACT_FIXES:
        new_cat = EXACT_FIXES[t['n']]
        if t['c'] != new_cat:
            print(f'  Fix: {t["n"]}: {t["c"]} -> {new_cat}')
            t['c'] = new_cat
            t['g'] = new_cat
            fixed += 1

# Also fix the 7 newly added tools by exact name
for t in tools:
    if t['n'] == 'Craiyon' and t['c'] != 'AI Image Generator':
        t['c'] = t['g'] = 'AI Image Generator'
        fixed += 1

print(f'Fixed {fixed} tool categories')

# Recount
cat_counts = {}
for t in tools:
    cat_counts[t['c']] = cat_counts.get(t['c'], 0) + 1
master['categories'] = cat_counts

with open(f'{REPO}/public/ai-catalog.json', 'w') as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

# 4. Split into 3 parts
n = len(tools)
ps = n // 3
for i in range(3):
    start = i * ps
    end = ps if i < 2 else n
    part = tools[start:end]
    with open(f'{REPO}/public/ai-catalog-{i}.json', 'w') as f:
        json.dump(part, f, ensure_ascii=False, indent=2)
    print(f'Part {i}: {len(part)} tools')

# 5. Meta
meta = {
    'categories': cat_counts,
    'categoryEmojis': master.get('categoryEmojis', {}),
    'parts': 3
}
with open(f'{REPO}/public/ai-catalog-meta.json', 'w') as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

# 6. Verified pool - add ONLY the real 100 tools
with open(f'{REPO}/public/verified-top-pool.json') as f:
    pool = json.load(f)

# Remove any false additions from previous run (tools with garbage names that shouldn't be there)
bad_keywords = ['tensorflow', 'tensorzero', 'tensorlayer', 'tensordock', 'tensorplex', 'jobtensor', 'autopixaicreditclaimer', 'lookalikey', 'nail designs', 'sapphirecraft', 'pikapiku', 'chartify', 'llm playground', 'gocode playground', 'aitozee', 'decrackle', 'scoopika', 'magicanimate', 'civitai green', 'artsmart ai', 'playgroundai', 'lamdai', 'explorium', 'socialpika', 'wondershare filmora es', 'tinywow cc', 'this person does not exist com', 'opus clip ai', 'descriptify', 'munchlog', 'flexclip ai', 'pictory ai', 'fliki ai', 'klap ai', 'ltx studio ai', 'codescript', 'investinvideos', 'picture description', 'product description generator by aidirectories', 'descriptionwise', 'jobdescriptiongenerator', 'unstable diffusion', 'justcopy', 'videomaker by invideo', 'gohire job', 'listingcopy', 'adcopy.ai', 'munch studio', 'android tensorflow', 'how i got tensorflow', 'deep learning with tensorflow', 'awesome tensorflow', 'tensorflow deep learning', 'webcam pix2pix', 'the 12 best ai tools', '→ launch playground', 'ai youtube title', 'ai youtube description', 'wayinvideo', 'irl playground', 'prodescription', 'tensor video', 'neurons ai', 'firefly iii', 'powtoon - unified', 'free luma ai video']
pool = [p for p in pool if not any(bk in p['n'].lower() for bk in bad_keywords)]
pool_names = {p['n'].lower() for p in pool}

added = 0
for t in tools:
    if t['n'] in EXACT_FIXES and t['n'].lower() not in pool_names:
        pool.append({'n': t['n'], 'd': t['d'], 'c': t['c'], 'g': t['g'], 'p': t['p'], 'u': t['u']})
        pool_names.add(t['n'].lower())
        added += 1

with open(f'{REPO}/public/verified-top-pool.json', 'w') as f:
    json.dump(pool, f, ensure_ascii=False, indent=2)
print(f'Pool: added {added}, cleaned, total: {len(pool)}')

# 7. Update category-map.json
with open(f'{REPO}/public/category-map.json') as f:
    catmap = json.load(f)
needed = {
    'AI Image Generator': 'AI Image Generator',
    'AI Photo Editor': 'AI Photo Editor',
    'AI Video Generator': 'AI Video Generator',
    'AI Video Editor': 'AI Video Editor',
    'AI Image Upscaler': 'AI Image Upscaler',
    'AI Avatar Video Generator': 'AI Avatar Video Generator',
    'AI Anime Generator': 'AI Anime Generator',
    'AI Logo Generator': 'AI Logo Generator',
    'AI Avatar Generator': 'AI Avatar Generator',
    'AI Design': 'AI Design',
    'AI Voice Generator': 'AI Voice Generator',
    'AI Writing': 'AI Writing',
}
for k, v in needed.items():
    if k not in catmap:
        catmap[k] = v
with open(f'{REPO}/public/category-map.json', 'w') as f:
    json.dump(catmap, f, ensure_ascii=False, indent=2)

print('\n=== ALL DONE ===')