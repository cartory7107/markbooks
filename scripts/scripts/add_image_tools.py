#!/usr/bin/env python3
import json, csv, hashlib, re

# Category mapping from user's categories to system categories
CAT_MAP = {
    "AI Image Generator": "AI Image Generator",
    "AI Art": "AI Art Generator",
    "Stable Diffusion": "AI Art Generator",
    "Open Source AI Art": "AI Open Source",
    "AI Design": "AI Design",
    "AI Art Community": "AI Art Generator",
    "Anime & AI Art": "AI Anime Art",
    "Anime AI": "AI Anime Art",
    "AI Image & Video": "AI Image Generator",
    "AI Upscaler & Image Generation": "AI Image Upscaler",
    "AI Photo Enhancement": "AI Photo Enhancer",
    "Character & Portrait Generation": "AI Portrait Generator",
    "AI Photos & Headshots": "AI Headshot Generator",
    "AI Professional Headshots": "AI Headshot Generator",
    "AI Illustration": "AI Illustration Generator",
    "Game Asset Generation": "AI Image Generator",
    "Custom AI Model Training": "AI Training",
    "AI Image Suite": "AI Image Generator",
    "Structured AI Image Generation": "AI Image Generator",
    "AI Art & Image Generation": "AI Art Generator",
    "AI Art & Photo Editing": "AI Photo Editor",
    "AI Photos & Portraits": "AI Portrait Generator",
    "AI Photo Editing": "AI Photo Editor",
    "AI Design Platform": "AI Design",
    "AI Image Tools": "AI Image Generator",
    "Product Image Creator": "AI Product Photography",
    "AI Images & Avatars": "AI Avatar Generator",
    "AI Portrait Generator": "AI Portrait Generator",
    "Personalized AI Images": "AI Image Generator",
    "AI Image Editing": "AI Photo Editor",
    "AI Graphics Generator": "AI Graphic Design",
    "AI Image API": "AI API",
    "AI Product Images": "AI Product Photography",
    "AI Image Generation": "AI Image Generator",
    "AI Image Creator": "AI Image Generator",
    "AI Art & Images": "AI Art Generator",
    "Local AI Image Generator": "AI Open Source",
    "Stable Diffusion UI": "AI Art Generator",
    "Open Source Models": "AI Open Source",
    "AI Images with Text": "AI Image Generator",
    "AI Assistant & Images": "AI Assistant",
    "AI Creative Suite": "AI Design",
    "AI Image & Avatar": "AI Avatar Generator",
    "AI Image Generator": "AI Image Generator",
}

# Plan mapping
PLAN_MAP = {
    "\U0001f7e2 Free": "Free",
    "\U0001f7e2 Free + Paid": "Free + Paid",
    "\U0001f534 Paid": "Paid",
    "\U0001f7e2 Free Plan": "Free Plan",
    "\U0001f7e2 Free (Open Source)": "Free",
    "\U0001f7e0 Free Trial": "Free Trial",
}

tools_data = [
    # Table 1: Free tools
    ("DrawAny", "\U0001f7e2 Free", "AI Image Generator", "https://drawany.art"),
    ("Raphael AI", "\U0001f7e2 Free", "AI Image Generator", "https://raphael.app"),
    ("Bubio AI", "\U0001f7e2 Free", "AI Image Generator", "https://bubio.ai"),
    ("Craiyon", "\U0001f7e2 Free", "AI Art", "https://www.craiyon.com"),
    ("Perchance AI", "\U0001f7e2 Free", "AI Image Generator", "https://perchance.org/ai-text-to-image"),
    ("Mage Space", "\U0001f7e2 Free", "Stable Diffusion", "https://www.mage.space"),
    ("Pixray", "\U0001f7e2 Free", "Open Source AI Art", "https://pixray.gob.io"),
    ("Dezgo", "\U0001f7e2 Free", "Stable Diffusion", "https://dezgo.com"),
    ("Playground AI", "\U0001f7e2 Free + Paid", "AI Image Generator", "https://playground.com"),
    ("Leonardo AI", "\U0001f7e2 Free + Paid", "AI Art", "https://leonardo.ai"),
    ("Microsoft Designer (Image Creator)", "\U0001f7e2 Free", "AI Image Generator", "https://designer.microsoft.com"),
    ("Adobe Express AI", "\U0001f7e2 Free", "AI Design", "https://express.adobe.com"),
    ("Canva AI", "\U0001f7e2 Free + Paid", "AI Design", "https://www.canva.com"),
    ("Google Gemini Image Generation", "\U0001f7e2 Free", "AI Image Generator", "https://gemini.google.com"),
    ("Hugging Face Spaces", "\U0001f7e2 Free", "Open Source Models", "https://huggingface.co/spaces"),
    ("Tensor.Art", "\U0001f7e2 Free + Paid", "AI Art Community", "https://tensor.art"),
    ("SeaArt AI", "\U0001f7e2 Free + Paid", "Anime & AI Art", "https://www.seaart.ai"),
    ("PixAI", "\U0001f7e2 Free + Paid", "Anime AI", "https://pixai.art"),
    ("NightCafe", "\U0001f7e2 Free + Paid", "AI Art", "https://creator.nightcafe.studio"),
    ("Dream by WOMBO", "\U0001f7e2 Free + Paid", "AI Art", "https://dream.ai"),
    ("Krea AI", "\U0001f7e2 Free + Paid", "Realtime Image Generation", "https://www.krea.ai"),
    ("Recraft AI", "\U0001f7e2 Free + Paid", "Vector & AI Images", "https://www.recraft.ai"),
    ("Ideogram", "\U0001f7e2 Free + Paid", "AI Images with Text", "https://ideogram.ai"),
    ("Fooocus", "\U0001f7e2 Free (Open Source)", "Stable Diffusion UI", "https://github.com/lllyasviel/Fooocus"),
    ("InvokeAI", "\U0001f7e2 Free (Open Source)", "Local AI Image Generator", "https://invoke.ai"),
    # Table 2: Paid tools
    ("Midjourney", "\U0001f534 Paid", "AI Art & Image Generation", "https://www.midjourney.com"),
    ("Flux Pro (Black Forest Labs)", "\U0001f534 Paid", "AI Image Generation", "https://bfl.ai"),
    ("Reve AI", "\U0001f534 Paid", "AI Image Generation", "https://reve.art"),
    ("Magnific AI", "\U0001f534 Paid", "AI Upscaler & Image Generation", "https://magnific.ai"),
    ("Runway", "\U0001f534 Paid", "AI Image & Video", "https://runwayml.com"),
    ("Topaz Photo AI", "\U0001f534 Paid", "AI Photo Enhancement", "https://www.topazlabs.com/photo-ai"),
    ("CF Spark Pro", "\U0001f534 Paid", "AI Image Generator", "https://creator.freepik.com"),
    ("RenderNet AI", "\U0001f534 Paid", "Character & Portrait Generation", "https://rendernet.ai"),
    ("Mystic AI", "\U0001f534 Paid", "AI Image Generation", "https://www.freepik.com/ai"),
    ("ImagineArt Pro", "\U0001f534 Paid", "AI Art Generator", "https://www.imagine.art"),
    ("DreamStudio Pro", "\U0001f534 Paid", "Stable Diffusion", "https://dreamstudio.ai"),
    ("OpenArt Pro", "\U0001f534 Paid", "AI Image Generation", "https://openart.ai"),
    ("Fotor AI Pro", "\U0001f534 Paid", "AI Art & Photo Editing", "https://www.fotor.com"),
    ("Picsart AI Premium", "\U0001f534 Paid", "AI Design", "https://picsart.com"),
    ("PhotoAI", "\U0001f534 Paid", "AI Photos & Headshots", "https://photoai.com"),
    ("HeadshotPro", "\U0001f534 Paid", "AI Headshots", "https://www.headshotpro.com"),
    ("Aragon AI", "\U0001f534 Paid", "AI Professional Headshots", "https://www.aragon.ai"),
    ("Exactly.ai", "\U0001f534 Paid", "AI Illustration", "https://exactly.ai"),
    ("Scenario", "\U0001f534 Paid", "Game Asset Generation", "https://scenario.com"),
    ("Astria AI", "\U0001f534 Paid", "Custom AI Model Training", "https://www.astria.ai"),
    ("getimg.ai Pro", "\U0001f534 Paid", "AI Image Suite", "https://getimg.ai"),
    ("Visinvoke", "\U0001f534 Paid", "Structured AI Image Generation", "https://visinvoke.com"),
    ("Z-Image Pro", "\U0001f534 Paid", "AI Image Generator", "https://z-image.io"),
    ("Quibaro AI", "\U0001f534 Paid", "AI Image Generator", "https://www.quibaro.com"),
    ("GPTImage2.ai", "\U0001f534 Paid", "AI Image Generation", "https://gptimage2.ai"),
    # Table 3: Free Plan tools
    ("Stable Assistant", "\U0001f7e2 Free Plan", "AI Image Generation", "https://stability.ai/stable-assistant"),
    ("PicLumen", "\U0001f7e2 Free Plan", "AI Image Generator", "https://www.piclumen.com"),
    ("Vivago AI", "\U0001f7e2 Free Plan", "AI Image & Video", "https://vivago.ai"),
    ("Shakker AI", "\U0001f7e2 Free Plan", "AI Art Generator", "https://www.shakker.ai"),
    ("GenCraft", "\U0001f7e2 Free Plan", "AI Art & Images", "https://gencraft.com"),
    ("Easy-Peasy AI", "\U0001f7e2 Free Plan", "AI Image Generator", "https://easy-peasy.ai"),
    ("Clipdrop", "\U0001f7e2 Free Plan", "AI Image Editing", "https://clipdrop.co"),
    ("DeepAI", "\U0001f7e2 Free Plan", "AI Image Generator", "https://deepai.org"),
    ("Artguru AI", "\U0001f7e2 Free Plan", "AI Art Generator", "https://www.artguru.ai"),
    ("LightX AI", "\U0001f7e2 Free Plan", "AI Image Creator", "https://www.lightxeditor.com"),
    ("ImgCreator.AI", "\U0001f7e2 Free Plan", "AI Image Generator", "https://imgcreator.ai"),
    ("AirBrush AI", "\U0001f7e2 Free Plan", "AI Photos & Portraits", "https://airbrush.com"),
    ("Phot.AI", "\U0001f7e2 Free Plan", "AI Photo Editing", "https://phot.ai"),
    ("Dzine AI", "\U0001f7e2 Free Plan", "AI Design Platform", "https://www.dzine.ai"),
    ("AI Ease", "\U0001f7e2 Free Plan", "AI Image Tools", "https://www.aiease.ai"),
    ("Pixelcut AI", "\U0001f7e2 Free Plan", "Product Image Creator", "https://www.pixelcut.ai"),
    ("insMind AI", "\U0001f7e2 Free Plan", "AI Photo Editor", "https://www.insmind.com"),
    ("Vheer AI", "\U0001f7e2 Free Plan", "AI Image Generator", "https://vheer.com"),
    ("Aitubo AI", "\U0001f7e2 Free Plan", "AI Art Generator", "https://aitubo.ai"),
    ("Fooocus Online", "\U0001f7e2 Free Plan", "AI Image Generator", "https://fooocus.one"),
    ("Akool", "\U0001f7e2 Free Plan", "AI Images & Avatars", "https://akool.com"),
    ("YouCam AI", "\U0001f7e2 Free Plan", "AI Portrait Generator", "https://www.youcam.ai"),
    ("OpenDream AI", "\U0001f7e2 Free Plan", "AI Art Generator", "https://opendream.ai"),
    ("StarryAI", "\U0001f7e2 Free Plan", "AI Art Generator", "https://starryai.com"),
    ("ImagineMe", "\U0001f7e2 Free Plan", "Personalized AI Images", "https://imagineme.ai"),
    # Table 4: Free Trial tools
    ("DALL-E API", "\U0001f7e0 Free Trial", "AI Image Generation", "https://platform.openai.com"),
    ("Adobe Firefly Premium", "\U0001f7e0 Free Trial", "AI Image Generation", "https://firefly.adobe.com"),
    ("Bria AI", "\U0001f7e0 Free Trial", "AI Image Generation", "https://bria.ai"),
    ("Imagine Studios AI", "\U0001f7e0 Free Trial", "AI Image Generator", "https://www.imaginestudios.ai"),
    ("PicSo AI", "\U0001f7e0 Free Trial", "AI Art Generator", "https://picso.ai"),
    ("AI Picasso", "\U0001f7e0 Free Trial", "AI Image Generator", "https://aipicasso.app"),
    ("Deep Dream Generator", "\U0001f7e0 Free Trial", "AI Art Generator", "https://deepdreamgenerator.com"),
    ("Neural Love", "\U0001f7e0 Free Trial", "AI Image Generator", "https://neural.love"),
    ("Hotpot.ai", "\U0001f7e0 Free Trial", "AI Graphics Generator", "https://hotpot.ai"),
    ("Media.io AI Image Generator", "\U0001f7e0 Free Trial", "AI Image Generator", "https://www.media.io"),
    ("Nero AI Image Generator", "\U0001f7e0 Free Trial", "AI Image Creator", "https://ai.nero.com"),
    ("FlexClip AI Image Generator", "\U0001f7e0 Free Trial", "AI Design", "https://www.flexclip.com"),
    ("Monica AI Image Generator", "\U0001f7e0 Free Trial", "AI Assistant & Images", "https://monica.im"),
    ("Appy Pie AI Image Generator", "\U0001f7e0 Free Trial", "AI Image Generator", "https://www.appypie.com"),
    ("Simplified AI Image Generator", "\U0001f7e0 Free Trial", "AI Design", "https://simplified.com"),
    ("Designs.ai", "\U0001f7e0 Free Trial", "AI Creative Suite", "https://designs.ai"),
    ("Wondershare Virbo AI", "\U0001f7e0 Free Trial", "AI Image & Avatar", "https://virbo.wondershare.com"),
    ("Face26 AI", "\U0001f7e0 Free Trial", "AI Photo Enhancement", "https://face26.com"),
    ("Remaker AI", "\U0001f7e0 Free Trial", "AI Image Tools", "https://remaker.ai"),
    ("Icons8 Face Swapper", "\U0001f7e0 Free Trial", "AI Image Editing", "https://icons8.com"),
    ("A1.art", "\U0001f7e0 Free Trial", "AI Image Generator", "https://a1.art"),
    ("Leap AI", "\U0001f7e0 Free Trial", "AI Image API", "https://tryleap.ai"),
    ("PhotoRoom AI", "\U0001f7e0 Free Trial", "AI Product Images", "https://www.photoroom.com"),
    ("Booth AI", "\U0001f7e0 Free Trial", "AI Product Photography", "https://booth.ai"),
    ("Stylized.ai", "\U0001f7e0 Free Trial", "AI Product Photography", "https://www.stylized.ai"),
]

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    return s

def get_logo(url):
    from urllib.parse import urlparse
    domain = urlparse(url).netloc
    if domain.startswith('www.'):
        domain = domain[4:]
    if 'github.com' in domain:
        return f"https://icon.horse/icon/github.com"
    return f"https://icon.horse/icon/{domain}"

# Load existing catalog
with open('public/ai-catalog.json', 'r') as f:
    catalog = json.load(f)

existing_names = {t['n'] for t in catalog['tools']}
existing_urls = {t['u'] for t in catalog['tools']}

new_tools = []
skipped = []

for name, plan_raw, cat_raw, url in tools_data:
    if name in existing_names or url in existing_urls:
        skipped.append(name)
        continue
    
    cat = CAT_MAP.get(cat_raw, "AI Image Generator")
    plan = PLAN_MAP.get(plan_raw, plan_raw)
    
    new_tools.append({
        "n": name,
        "d": f"{plan} {cat} tool",
        "c": cat,
        "g": cat,
        "p": plan,
        "u": url
    })

print(f"Total tools to add: {len(new_tools)}")
print(f"Skipped (already exist): {len(skipped)} - {skipped}")

catalog['tools'].extend(new_tools)

with open('public/ai-catalog.json', 'w') as f:
    json.dump(catalog, f, ensure_ascii=False)

print(f"Catalog now has {len(catalog['tools'])} tools")

# Also update CSV
with open('supabase/ai_tools.csv', 'a', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    for t in new_tools:
        tid = 't-' + hashlib.md5(t['n'].encode()).hexdigest()[:12]
        slug = slugify(t['n'])
        logo = get_logo(t['u'])
        has_free = 'true' if 'Free' in t['p'] else 'false'
        writer.writerow([
            tid, t['n'], slug, t['u'], logo, t['d'], t['d'], '[]',
            f'["cat-ai-image-generator"]' if 'Image' in t['c'] else f'["cat-ai-art-generator"]',
            t['p'].split()[0], has_free, '["Web"]', '["English"]',
            '[]', '[]', '[]', '[]', 0, 'false', 'false', 'approved', '', 'catalog'
        ])

print("CSV updated too")
print(f"New tools added: {[t['n'] for t in new_tools]}")
