#!/usr/bin/env python3
"""Pass 2: More aggressive brand abuse cleanup.
Remove any tool whose name starts with or is primarily a brand name
but doesn't point to the brand's official domain.
"""
import json, os, re
from urllib.parse import urlparse

os.chdir('/home/z/my-project/markbooki-655cc7bc')
with open('public/ai-catalog.json', 'r') as f:
    data = json.load(f)

tools = data['tools']
print(f"Starting: {len(tools)} tools")

# Brand -> list of official domains (substring match)
STRICT_BRANDS = {
    'gemini': ['gemini.google.com', 'deepmind.google'],
    'midjourney': ['midjourney.com'],
    'claude': ['claude.ai', 'claude.com', 'anthropic.com'],
    'dall-e': ['openai.com'],
    'dall\u0113': ['openai.com'],
    'sora': ['openai.com', 'sora.com'],
    'perplexity': ['perplexity.ai'],
    'deepseek': ['deepseek.com'],
    'leonardo ai': ['leonardo.ai'],
    'runway': ['runwayml.com', 'runway.com'],
    'stability ai': ['stability.ai'],
    'figma': ['figma.com'],
    'canva': ['canva.com'],
    'notion': ['notion.so', 'notion.com'],
    'grammarly': ['grammarly.com'],
    'cursor': ['cursor.sh', 'cursor.com'],
    'vercel': ['vercel.com'],
    'hugging face': ['huggingface.co'],
    'copilot': ['github.com/copilot', 'microsoft.com'],
    'flux': ['bfl.ai', 'blackforestlabs.ai'],
    'stable diffusion': ['stability.ai', 'huggingface.co'],
    'adobe firefly': ['firefly.adobe.com', 'adobe.com'],
    'microsoft designer': ['designer.microsoft.com', 'microsoft.com'],
    'ideogram': ['ideogram.ai'],
    'recraft': ['recraft.ai'],
    'krea': ['krea.ai'],
    'seaart': ['seaart.ai'],
    'pixai': ['pixai.art'],
    'nightcafe': ['nightcafe.studio', 'creator.nightcafe.studio'],
    'craiyon': ['craiyon.com'],
    'invokeai': ['invoke.ai'],
    'fooocus': ['fooocus.one', 'github.com/lllyasviel/fooocus'],
    'magnific': ['magnific.ai'],
    'topaz': ['topazlabs.com'],
    'scenari': ['scenario.com'],
    'getimg': ['getimg.ai'],
    'photroom': ['photoroom.com'],
    'booth ai': ['booth.ai'],
    'clipdrop': ['clipdrop.co'],
    'deepai': ['deepai.org'],
    'starryai': ['starryai.com'],
    'artguru': ['artguru.ai'],
    'akool': ['akool.com'],
    'dreamstudio': ['dreamstudio.ai'],
    'bria': ['bria.ai'],
    'tensor.art': ['tensor.art'],
    'dream by wombo': ['dream.ai'],
    'playground ai': ['playground.com'],
    'mage.space': ['mage.space'],
    'dezgo': ['dezgo.com'],
    'pixray': ['pixray.gob.io'],
    'raphael': ['raphael.app'],
    'drawany': ['drawany.art'],
    'bubio': ['bubio.ai'],
    'perchance': ['perchance.org'],
    'adobe express': ['express.adobe.com'],
    'lightx': ['lightxeditor.com'],
    'imgcreator': ['imgcreator.ai'],
    'airbrush': ['airbrush.com'],
    'phot.ai': ['phot.ai'],
    'dzine': ['dzine.ai'],
    'ai ease': ['aiease.ai'],
    'pixelcut': ['pixelcut.ai'],
    'insmind': ['insmind.com'],
    'vheer': ['vheer.com'],
    'aitubo': ['aitubo.ai'],
    'opendream': ['opendream.ai'],
    'shakker': ['shakker.ai'],
    'gencraft': ['gencraft.com'],
    'easy-peasy': ['easy-peasy.ai'],
    'vivago': ['vivago.ai'],
    'piclumen': ['piclumen.com'],
    'youcam': ['youcam.ai'],
    'imagineme': ['imagineme.ai'],
    'headshotpro': ['headshotpro.com'],
    'aragon': ['aragon.ai'],
    'exactly': ['exactly.ai'],
    'photoai': ['photoai.com'],
    'fotor': ['fotor.com'],
    'picsart': ['picsart.com'],
    'openart': ['openart.ai'],
    'imagineart': ['imagine.art'],
    'rendernet': ['rendernet.ai'],
    'astria': ['astria.ai'],
    'remaker': ['remaker.ai'],
    'face26': ['face26.com'],
    'neural love': ['neural.love'],
    'hotpot': ['hotpot.ai'],
    'nero ai': ['ai.nero.com'],
    'monica': ['monica.im'],
    'appypie': ['appypie.com'],
    'simplified': ['simplified.com'],
    'designs.ai': ['designs.ai'],
    'virbo': ['virbo.wondershare.com'],
    'icons8': ['icons8.com'],
    'a1.art': ['a1.art'],
    'leap ai': ['tryleap.ai'],
    'stylized': ['stylized.ai'],
    'media.io': ['media.io'],
    'flexclip': ['flexclip.com'],
    'aipicasso': ['aipicasso.app'],
    'deep dream generator': ['deepdreamgenerator.com'],
    'picso': ['picso.ai'],
    'imagine studios': ['imaginestudios.ai'],
    'quibaro': ['quibaro.com'],
    'z-image': ['z-image.io'],
    'visinvoke': ['visinvoke.com'],
    'gptimage2': ['gptimage2.ai'],
    'reve': ['reve.art'],
    'mystic ai': ['freepik.com'],
    'cf spark': ['freepik.com', 'creator.freepik.com'],
}

def get_domain(url):
    try:
        p = urlparse(url.strip())
        d = p.netloc.lower()
        if d.startswith('www.'): d = d[4:]
        return d
    except:
        return ''

def is_official(url, official_domains):
    domain = get_domain(url)
    for od in official_domains:
        if od in domain:
            return True
    return False

removed = 0
kept = []

for t in tools:
    name_lower = t['n'].lower().strip()
    is_fake = False
    
    for brand, official_domains in STRICT_BRANDS.items():
        if brand not in name_lower:
            continue
        
        if is_official(t['u'], official_domains):
            continue
        
        # Name contains the brand but URL doesn't match official domain
        is_fake = True
        break
    
    if is_fake:
        removed += 1
    else:
        kept.append(t)

data['tools'] = kept

with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False)

print(f"Removed {removed} brand fakes")
print(f"Final: {len(data['tools'])} tools")

# Verify
for check in ['Gemini', 'Midjourney', 'ChatGPT', 'Claude', 'Leonardo AI', 'Notion AI', 'DALL-E']:
    matches = [t for t in data['tools'] if check.lower() in t['n'].lower()]
    print(f"\n{check}: {len(matches)} results")
    for m in matches[:8]:
        print(f'  {m["n"]} -> {m["u"]}')
