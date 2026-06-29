#!/usr/bin/env python3
"""Fix everything: re-split catalog, add 100 tools to verified pool, fix categories, push."""
import json, subprocess, os

REPO = '/home/z/my-project/markbooki-8f13eaad'
os.chdir(REPO)

# 1. Load master catalog
with open('public/ai-catalog.json') as f:
    master = json.load(f)
tools = master['tools']
print(f'Master catalog: {len(tools)} tools')

# 2. The 100 tools that must be at TOP
top_100 = {
    # Free Image (25)
    'midjourney': 'AI Image Generator',
    'dall-e': 'AI Image Generator',
    'stable diffusion': 'AI Image Generator',
    'craiyon': 'AI Image Generator',
    'nightcafe': 'AI Image Generator',
    'leonardo': 'AI Image Generator',
    'adobe firefly': 'AI Image Generator',
    'bing image creator': 'AI Image Generator',
    'playground': 'AI Image Generator',
    'pixai': 'AI Anime Generator',
    'tensor': 'AI Image Generator',
    'seaart': 'AI Image Generator',
    'bluewillow': 'AI Image Generator',
    'deep dream generator': 'AI Image Generator',
    'artbreeder': 'AI Image Generator',
    'starryai': 'AI Image Generator',
    'cf spark': 'AI Image Generator',
    'imagine with meta ai': 'AI Image Generator',
    'freepik ai': 'AI Image Generator',
    'depositphotos ai': 'AI Image Generator',
    'flux': 'AI Image Generator',
    'krea ai': 'AI Image Generator',
    'ideogram': 'AI Image Generator',
    'clipdrop': 'AI Photo Editor',
    'remove.bg': 'AI Photo Editor',
    # Paid Image (25)
    'adobe sensei': 'AI Photo Editor',
    'jasper art': 'AI Image Generator',
    'designs ai': 'AI Image Generator',
    'looka': 'AI Logo Generator',
    'stockimg ai': 'AI Image Generator',
    'hotpot ai': 'AI Image Generator',
    'deep ai': 'AI Image Generator',
    'dreamstudio': 'AI Image Generator',
    'novelai': 'AI Anime Generator',
    'waifu labs': 'AI Anime Generator',
    'this person does not exist': 'AI Avatar Generator',
    'generated photos': 'AI Avatar Generator',
    'artify': 'AI Image Generator',
    'dream by wombo': 'AI Image Generator',
    'artsmart': 'AI Image Generator',
    'fotor': 'AI Photo Editor',
    'lensa ai': 'AI Photo Editor',
    'photoroom': 'AI Photo Editor',
    'luma ai': 'AI Video Generator',
    'kaiber': 'AI Video Generator',
    'pika': 'AI Video Generator',
    'getimg': 'AI Image Generator',
    'dezgo': 'AI Image Generator',
    'tinywow': 'AI Photo Editor',
    'cutout.pro': 'AI Photo Editor',
    'palette.fm': 'AI Photo Editor',
    # Free Plan (25)
    'stable diffusion xl': 'AI Image Generator',
    'recraft': 'AI Image Generator',
    'magnific': 'AI Image Upscaler',
    'topaz photo ai': 'AI Photo Editor',
    'runway': 'AI Video Generator',
    'upscayl': 'AI Image Upscaler',
    'picsart': 'AI Photo Editor',
    'civitai': 'AI Image Generator',
    'glif': 'AI Image Generator',
    'adobe express': 'AI Design',
    'canva': 'AI Design',
    'invideo': 'AI Video Generator',
    'ltx studio': 'AI Video Generator',
    'peech ai': 'AI Video Generator',
    'synthesia': 'AI Avatar Video Generator',
    'heygen': 'AI Avatar Video Generator',
    'd-id': 'AI Avatar Video Generator',
    'veed.io': 'AI Video Editor',
    'capcut': 'AI Video Editor',
    'fliki': 'AI Video Generator',
    'elai.io': 'AI Avatar Video Generator',
    'colossyan': 'AI Avatar Video Generator',
    'synthesys': 'AI Voice Generator',
    'deepbrain ai': 'AI Avatar Video Generator',
    'hour one': 'AI Avatar Video Generator',
    'tavus': 'AI Avatar Video Generator',
    'arcads': 'AI Video Generator',
    'creatify': 'AI Video Generator',
    # Free Trial (25)
    'opus clip': 'AI Video Editor',
    'vizard': 'AI Video Editor',
    'munch': 'AI Video Editor',
    'pictory': 'AI Video Generator',
    'lumen5': 'AI Video Generator',
    'wave.video': 'AI Video Generator',
    'renderforest': 'AI Video Generator',
    'flexclip': 'AI Video Generator',
    'klap': 'AI Video Editor',
    'descript': 'AI Video Editor',
    'filmora': 'AI Video Editor',
    'animoto': 'AI Video Generator',
    'biteable': 'AI Video Generator',
    'powtoon': 'AI Video Generator',
    'vyond': 'AI Video Generator',
    'clipchamp': 'AI Video Editor',
    'steve ai': 'AI Video Generator',
    'adcreative ai': 'AI Image Generator',
    'copy.ai': 'AI Writing',
    'jasper': 'AI Writing',
    'writesonic': 'AI Writing',
}

# 3. Fix categories in master catalog for the 100 tools
fixed = 0
for t in tools:
    name_lower = t['n'].lower()
    for key, cat in top_100.items():
        if key in name_lower:
            if t['c'] != cat:
                old_cat = t['c']
                t['c'] = cat
                t['g'] = cat
                fixed += 1
                print(f'  Fixed: {t["n"]}: {old_cat} -> {cat}')
            break
print(f'\nFixed {fixed} categories')

# Recount categories
cat_counts = {}
for t in tools:
    cat_counts[t['c']] = cat_counts.get(t['c'], 0) + 1
master['categories'] = cat_counts

# Save master
with open('public/ai-catalog.json', 'w') as f:
    json.dump(master, f, ensure_ascii=False, indent=2)

# 4. Split into 3 parts
n = len(tools)
part_size = n // 3
parts = [
    tools[:part_size],
    tools[part_size:part_size*2],
    tools[part_size*2:]
]
for i, part in enumerate(parts):
    with open(f'public/ai-catalog-{i}.json', 'w') as f:
        json.dump(part, f, ensure_ascii=False, indent=2)
    print(f'Part {i}: {len(part)} tools')

# 5. Update meta
meta = {
    'categories': cat_counts,
    'categoryEmojis': master.get('categoryEmojis', {}),
    'parts': 3
}
with open('public/ai-catalog-meta.json', 'w') as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

# 6. Add 100 tools to verified-top-pool.json
with open('public/verified-top-pool.json') as f:
    pool = json.load(f)
pool_names = {p['n'].lower() for p in pool}

added_pool = 0
for t in tools:
    name_lower = t['n'].lower()
    for key in top_100:
        if key in name_lower and name_lower not in pool_names:
            pool.append({
                'n': t['n'],
                'd': t['d'],
                'c': t['c'],
                'g': t['g'],
                'p': t['p'],
                'u': t['u']
            })
            pool_names.add(name_lower)
            added_pool += 1
            print(f'  Pool: {t["n"]}')
            break

with open('public/verified-top-pool.json', 'w') as f:
    json.dump(pool, f, ensure_ascii=False, indent=2)
print(f'\nAdded {added_pool} to verified pool (total: {len(pool)})')

# 7. Update category-map.json for missing mappings
with open('public/category-map.json') as f:
    catmap = json.load(f)

missing_maps = {
    'AI Image Editor': 'AI Photo Editor',
    'AI Video Editor': 'AI Video Editor',
    'AI Image Upscaler': 'AI Image Upscaler',
    'AI Avatar Video Generator': 'AI Avatar Video Generator',
    'AI Video Enhancer': 'AI Video Enhancer',
    'AI Voice Generator': 'AI Voice Generator',
    'AI Design': 'AI Design',
    'AI Anime Generator': 'AI Anime Generator',
    'AI Logo Generator': 'AI Logo Generator',
    'AI Avatar Generator': 'AI Avatar Generator',
    'AI Writing': 'AI Writing',
    'AI Video Generator': 'AI Video Generator',
    'AI Image Generator': 'AI Image Generator',
    'AI Photo Editor': 'AI Photo Editor',
}

changed_map = 0
for k, v in missing_maps.items():
    if k not in catmap:
        catmap[k] = v
        changed_map += 1

with open('public/category-map.json', 'w') as f:
    json.dump(catmap, f, ensure_ascii=False, indent=2)
print(f'Updated {changed_map} category mappings')

print('\n=== DONE ===')