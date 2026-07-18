# TavBookAI Catalog — Import Guide

Your catalog is ready! Here's how to get it into your live site.

## What's in this folder

| File | Size | Purpose |
|------|------|---------|
| `seed_ai_catalog.sql` | 7.9 MB | SQL INSERT statements — easiest path |
| `categories.csv` | 26 KB | Categories table data (CSV) |
| `ai_tools.csv` | 3.9 MB | AI tools table data (CSV) |

## Catalog stats

- **Tools**: 10,870 (was 16,356 — removed 8,233 internal duplicates + 82 spam/NSFW)
- **Categories**: 438
- **Each tool has**: name, slug, official URL, logo URL, description, category, pricing, free-plan flag

---

## Option 1: Run SQL in Supabase SQL Editor (RECOMMENDED, easiest)

1. Go to: https://supabase.com/dashboard/project/aqonvdypfdrhusdoizpq/sql/new
2. Click **"Open SQL file"** or just paste the contents of `seed_ai_catalog.sql`
3. Click **Run** (it will take ~2-5 minutes due to the file size — be patient)
4. Verify at: https://supabase.com/dashboard/project/aqonvdypfdrhusdoizpq/editor → `ai_tools` table

The SQL uses `ON CONFLICT (slug) DO NOTHING` so it's safe to re-run.

## Option 2: CSV import via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/aqonvdypfdrhusdoizpq/editor
2. Open `categories` table → click **"Import data from CSV"** → upload `categories.csv`
3. Open `ai_tools` table → click **"Import data from CSV"** → upload `ai_tools.csv`
4. For the `ai_tools` table, make sure columns map correctly (the CSV has all schema columns)

## Option 3: REST API import (advanced, scripted)

Use this if you want to re-import later or run as a cron job:

```bash
# Get your service_role key from:
# https://supabase.com/dashboard/project/aqonvdypfdrhusdoizpq/settings/api
# (NOT the publishable/anon key — that one is blocked by RLS)

export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

# Run the import script
python3 /home/z/my-project/scripts/import_to_supabase.py
```

The script:
- Inserts categories first (batch of 100)
- Fetches category UUIDs back
- Inserts tools in batches of 250 with proper category_ids linkage
- Skips duplicates via RLS-friendly upsert pattern

---

## Catalog schema changes

The enriched `public/ai-catalog.json` now has a new field per tool:

```json
{
  "n": "Midjourney",
  "d": "AI image generator...",
  "c": "AI Image Generator",
  "g": "Paid AI Image Generator",
  "p": "Paid Plans",
  "u": "https://midjourney.com",
  "fl": "Free trial available...",
  "logo_url": "https://icon.horse/icon/midjourney.com"  // ← NEW
}
```

Your frontend already has runtime logo fallback (icon.horse → Google favicon → DuckDuckGo → initials). The pre-computed `logo_url` makes the first paint faster.

---

## Quality improvements applied

1. **Removed 8,233 internal duplicates** — your original 16k catalog had the same tools listed under different category labels
2. **Removed 41 NSFW/spam entries** (porn, escort, gambling)
3. **Removed 34 entries on spam TLDs** (.xyz, .tk, .ml, .click, .cam, etc.)
4. **Removed 3 generic-name entries** (literally named "AI Writer" with no brand)
5. **Removed 2 localhost URLs**, 1 IP URL, 1 URL shortener
6. **Normalized 807 tool names** (whitespace, casing)
7. **Enriched 44 short descriptions** with auto-generated context

---

## Next steps for scaling to 50k

To genuinely hit 50k unique tools, you'll need to scrape directories with bot protection. Options:

1. **Use a scraping API** like Apify, ScraperAPI, or Bright Data — they handle Cloudflare bypass
2. **Self-host Playwright with rotating proxies** — ~$50-100/month
3. **Pay TAAFT/Toolify for API access** — some directories have paid data feeds

Want me to build any of these next?
