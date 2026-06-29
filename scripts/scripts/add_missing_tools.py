#!/usr/bin/env python3
import json

with open('public/ai-catalog.json') as f:
    data = json.load(f)

tools = data['tools']
existing_names = {t['n'].lower() for t in tools}

new_tools = [
    {
        "n": "Craiyon",
        "d": "Free AI image generator formerly known as DALL-E Mini. Generate images from text descriptions instantly in your browser. No signup required. Supports various art styles and creates fun, creative visuals from any prompt you type.",
        "c": "AI Image Generator",
        "g": "AI Image Generator",
        "p": "Free",
        "u": "https://www.craiyon.com"
    },
    {
        "n": "Freepik AI",
        "d": "AI-powered image generator by Freepik. Create stunning visuals, illustrations, and stock photos using text prompts. Integrates with Freepik's massive asset library. Offers commercial licenses and high-quality outputs for designers and creators.",
        "c": "AI Image Generator",
        "g": "AI Image Generator",
        "p": "Freemium",
        "u": "https://www.freepik.com/ai-image-generator"
    },
    {
        "n": "Depositphotos AI",
        "d": "AI image generation tool by Depositphotos. Generate professional stock-quality images from text descriptions. Leverages trained models for commercial-ready visuals. Integrates seamlessly with Depositphotos' stock library for a complete creative workflow.",
        "c": "AI Image Generator",
        "g": "AI Image Generator",
        "p": "Paid",
        "u": "https://depositphotos.com"
    },
    {
        "n": "Palette.fm",
        "d": "AI-powered photo colorization and color grading tool. Transform black and white photos into vibrant color images using AI. Also offers color filters and style transfers to give your photos a cinematic, vintage, or artistic look with one click.",
        "c": "AI Image Editor",
        "g": "AI Image Editor",
        "p": "Freemium",
        "u": "https://palette.fm"
    },
    {
        "n": "Picsart AI",
        "d": "Comprehensive AI-powered photo and video editing platform. Features AI background removal, image generation, object removal, style transfer, and hundreds of creative tools. Used by millions for social media content creation and professional editing.",
        "c": "AI Image Editor",
        "g": "AI Image Editor",
        "p": "Free",
        "u": "https://picsart.com"
    },
    {
        "n": "Animoto",
        "d": "Cloud-based video creation platform with AI features. Create professional marketing videos, social media content, and presentations quickly. Offers drag-and-drop editing, licensed music library, and customizable templates for businesses and creators.",
        "c": "AI Video Generator",
        "g": "AI Video Generator",
        "p": "Free Trial",
        "u": "https://animoto.com"
    },
    {
        "n": "Biteable",
        "d": "AI-powered online video maker for businesses and teams. Create professional videos for marketing, internal communications, and social media in minutes. Features brand kit integration, real-time collaboration, and a vast template library with AI-assisted editing.",
        "c": "AI Video Generator",
        "g": "AI Video Generator",
        "p": "Free Trial",
        "u": "https://biteable.com"
    },
]

added = 0
for tool in new_tools:
    if tool['n'].lower() not in existing_names:
        tools.append(tool)
        existing_names.add(tool['n'].lower())
        added += 1
        print(f"  Added: {tool['n']}")
    else:
        print(f"  Skipped (exists): {tool['n']}")

# Update category counts
cat_counts = {}
for t in tools:
    cat = t['c']
    cat_counts[cat] = cat_counts.get(cat, 0) + 1
data['categories'] = cat_counts

with open('public/ai-catalog.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nTotal tools now: {len(tools)}")
print(f"Added {added} new tools")
