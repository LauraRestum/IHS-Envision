# Supporting the IHS Mission Through Federal Contract Solutions

An interactive, single-page HTML webinar presentation for Indian Health Service procurement professionals, presented by Dedra Griffin and Rob Narron (Envision). 10 slides, 16:9 stage, in the same family as the Envision capabilities decks.

**Status: post-review draft.** Dedra Griffin's September review and the October 12, 2026 IHS feedback (from Dedra and Rob's meeting with IHS) are incorporated. The October round retitled the deck for a wider audience (procurement officers who order office products, so the Dallas catalog is in scope), added the How to buy slide, and cut the deck from 15 to 10 slides to fit a 30 to 35 minute presentation plus questions. The shipped page is attendee-clean (no presenter notes or internal flags in the HTML). Judy at IHS reviews before anything goes live, and nothing ships publicly until Laura clears it. It carries `noindex` (meta tag plus an `X-Robots-Tag` header via `vercel.json`) until that clearance.

## Running it

Static site, no build step required to view. Open `index.html` in a browser, or serve the folder (`python3 -m http.server`) and open `http://localhost:8000`.

### Deploy (Vercel)

Import this repo in Vercel as a static project (no framework preset, no build command, output directory = repo root). `vercel.json` already sets the noindex header. Keep the deployment preview-only until Judy approves and Laura clears it for the open web.

## Using the deck

| Action | How |
|---|---|
| Advance / back | Right and Left arrows, Space, PageDown/PageUp, the Prev/Next buttons, edge tap zones, or swipe. One press per slide; builds play automatically on slide entry |
| Overview | O opens a jump-to-any-slide grid |
| Deep links | Every slide is addressable as `#slide-4` etc., for the follow-up email |
| Theme | Display button has Dark, Light, and High contrast themes, persisted per device; with no saved choice the system color scheme is honored. All three run through the same token system at WCAG 2.2 AA |
| Motion | Display button has a persisted Reduce motion toggle; the OS `prefers-reduced-motion` setting is always honored |
| Leave-behind PDF | "Print / PDF" (or Ctrl/Cmd+P): one slide per page, 16:9, printed in whichever theme is active, deck chrome excluded |

## Item explorer data

The item explorer (opened from slide 8, Contract at a glance) is populated: `data/items.js` is generated from `data/Envision_MSPV_Products.xlsx` (105 items, on contract as of September 2026) by `tools/convert_items.py`. The spreadsheet lives under `data/` so the "Download the full list (Excel)" link in the explorer deploys with the site (`tools/` is excluded by `.vercelignore`).

To refresh after the next contract modification:

```
pip install openpyxl
# replace data/Envision_MSPV_Products.xlsx (or update itemSpreadsheet in tools/config.json)
# update itemListAsOf in tools/config.json
python3 tools/convert_items.py
```

The converter matches the sheet's column headers exactly and fails loudly on a rename. Spot-check the result against the spreadsheet (row count, one sampled row, PVON statuses) and commit `data/items.js` with the spreadsheet. Product data is never retyped or edited by hand; the explorer keeps a pending state in code that shows automatically if the data file ever ships empty.

## Imagery

The deck carries no QR codes: envisionus.com is written out only where it is a general Envision reference (title byline, closing contact card); it is never pointed to as the place to find MSPV items. Photography is pulled from the `envision-capabilites-services` repo (the capabilities deck's image library) into `assets/img/`. White-background product shots render on the `.product-tile` white tile, which is what lets clear and white product photography read on the dark surfaces; environmental photos use the `.photo-card` framed card. `IMAGERY-AUDIT.md` maps every slide's imagery slots, what is wired in, and which capabilities-repo files fit the remaining slots (including the corrected HDPE/LLDPE mapping from Dedra's review).

## Open placeholders

| Item | Lives on | Status |
|---|---|---|
| Session date | Was on slide 1 | Removed from the byline until scheduled with Judy; add it back when the date is set |
| Dakota Western description | Slide 5 | Wording per Dedra's review ("an Indian-owned company that supplies film for our can liner production"); verify with Dakota Western before presenting |
| Light-ground logo files | Slides 1 and chrome | White Envision and IHS logos sit on a navy chip in the light theme until light-ground versions are supplied |

Resolved since the pre-review draft: Dedra's title and contact (done), the blind labor stat (82%), the second Prime Vendor question (both names are placeholders now), the contract end date (Oct 14, 2028 on the card; each item's own dates show in the explorer), the item spreadsheet conversion (populated), Rob Narron's print program contact (slide 9, plus a print card on the closing slide), and the Prime Vendor question (the October channels list names Medline for MSPV and Cardinal Health for DAPA, on slide 7). The sales inbox on slide 7 is written sales@envisionus.com; the October sheet spelled it "envisonus," read as a typo.

## Structure

```
index.html               The deck (10 slides, modals, glossary)
css/deck.css             Design system: tokens (dark, light, high contrast themes), motion, print stylesheet
js/deck.js               Deck engine (navigation, modals, item explorer, display preferences)
data/items.js            Item explorer data (generated from the spreadsheet; never hand-edited)
data/Envision_MSPV_Products.xlsx  The contract item list, September 2026 (also the explorer's download link)
assets/                  Self-hosted Montserrat woff2, Envision and IHS logos (white), headshot, favicons, OG image, photography
tools/                   Item spreadsheet converter, config (excluded from deploys)
IMAGERY-AUDIT.md         Slide-by-slide imagery audit and capabilities-repo image map
```

Slide order: 1 Title, 2 Built for federal scale, 3 How AbilityOne works, 4 Your mission and ours, 5 AbilityOne and the Buy Indian Act, 6 Everything Envision supplies (capabilities and services), 7 How to buy (contracts and channels for Wichita, Dallas and Print, plus authorized distributors), 8 Contract 36C10X23G0011 at a glance (MSPV detail and the item explorer), 9 Print, 10 Closing.

Removed in the October round: The AbilityOne Program (Dedra covers it in her slide 3 talking points), The MSPV program, Know your liners, Why order through MSPV, Training and support, and How to order. Slide behaviors in `js/deck.js` key off slide content (`.org`, `.next-steps`), not slide numbers, so the deck can be reordered safely.

The deck is attendee-facing: it contains no presenter notes, internal flags, or presenter tooling. Dedra's talk track is kept outside this repository.
