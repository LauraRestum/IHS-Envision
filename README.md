# Supporting the IHS mission through MSPV

An interactive, single-page HTML webinar presentation for Indian Health Service procurement professionals, presented by Dedra Griffin (Envision). 13 slides, 16:9 stage, in the same family as the Envision capabilities decks.

**Status: pre-review draft.** The shipped page is attendee-clean (no presenter notes or internal flags in the HTML). Judy at IHS reviews before anything goes live, and nothing ships publicly until Laura clears it. It carries `noindex` (meta tag plus an `X-Robots-Tag` header via `vercel.json`) until that clearance.

## Shipping a change

`index.html` references its stylesheet and scripts with a version query
(`css/deck.css?v=2` etc.). Bump the number in all three references whenever
`deck.css`, `deck.js`, or `items.js` changes, so returning browsers cannot pair
a cached old stylesheet with new markup.

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
| Motion | Display button has a persisted Reduce motion toggle; the OS `prefers-reduced-motion` setting is always honored |
| Leave-behind PDF | "Print / PDF" (or Ctrl/Cmd+P): one slide per page, 16:9, dark surfaces preserved, notes excluded |

## Item explorer data (action needed)

The slide 7 item explorer reads `data/items.js`. The MSPV item spreadsheet (`MSPV_Items_7_27_26.xlsx`) was not available at build time, so the explorer currently shows its "item data pending" state and contains zero rows (nothing is fabricated). To populate it:

```
pip install openpyxl
python3 tools/convert_items.py path/to/MSPV_Items_7_27_26.xlsx
```

Then spot-check the result against the spreadsheet (row count, one sampled row, PVON statuses) and commit `data/items.js`.

## Imagery

The deck carries no QR codes: envisionus.com is written out wherever the catalog is referenced. Photography is pulled from the `envision-capabilites-services` repo (the capabilities deck's image library) into `assets/img/`. White-background product shots render on the `.product-tile` white tile, which is what lets clear and white product photography read on the dark surfaces; environmental photos use the `.photo-card` framed card. `IMAGERY-AUDIT.md` maps every slide's imagery slots, what is wired in, and which capabilities-repo files fit the remaining slots.

## Open placeholders

| Item | Lives on | Status |
|---|---|---|
| Session date | Slide 1 | Waiting on scheduling with Judy |
| Prime Vendor contact names, emails, phones | Slide 12 | Outstanding from the federal channel team |
| Second Prime Vendor: Concordance (CHS) vs Cardinal | Slide 12 notes | Confirm against the item data (data says CHS) |
| Contract end date: Oct 14, 2028 vs Jul 14, 2028 | Slide 7 | Confirm; deck currently uses Oct 14, 2028 per item data |
| Dakota Western description and any ownership language | Slide 10 | Verify with Dakota Western before presenting |
| HDPE and LLDPE property characterizations | Slide 8 | Verify against Envision spec sheets |
| MSPV item spreadsheet conversion | Item explorer | Run tools/convert_items.py when the file is supplied |

## Structure

```
index.html               The deck (13 slides, modals, glossary)
css/deck.css             Design system, motion, print stylesheet
js/deck.js               Deck engine
data/items.js            Item explorer data (generated; currently pending)
assets/                  Self-hosted Montserrat woff2, Envision and IHS logos (white), headshot, favicons, OG image, photography
tools/                   Item spreadsheet converter, config
IMAGERY-AUDIT.md         Slide-by-slide imagery audit and capabilities-repo image map
```

The deck is attendee-facing: it contains no presenter notes, internal flags, or presenter tooling. Dedra's talk track is kept outside this repository.
