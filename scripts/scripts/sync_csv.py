#!/usr/bin/env python3
import json
import csv
import re

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r'[^\w\s-]', '', s)
    s = re.sub(r'[\s_]+', '-', s)
    s = re.sub(r'-+', '-', s)
    return s.strip('-')

with open('public/ai-catalog.json') as f:
    data = json.load(f)

tools = data['tools']

rows = []
for i, t in enumerate(tools, 1):
    rows.append({
        'id': i,
        'slug': slugify(t['n']),
        'name': t['n'],
        'description': t['d'],
        'category': t['c'],
        'group': t.get('g', t['c']),
        'plan': t.get('p', 'Unknown'),
        'url': t['u'],
        'tags': t['c'],
        'logo': '',
    })

with open('supabase/ai_tools.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['id','slug','name','description','category','group','plan','url','tags','logo'])
    writer.writeheader()
    writer.writerows(rows)

print(f'CSV regenerated: {len(rows)} rows')
