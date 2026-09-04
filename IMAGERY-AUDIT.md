# Imagery audit: slide-by-slide

The QR codes are gone (slides 12 and 13, the SVG asset, the generator, its
config keys). This audit maps where photography belongs in the deck, what is
already wired in, and which files in the sibling `envision-capabilites-services`
repo (`images/` and `images/products/`) fit the remaining slots.

## The two treatments

The deck stays on the approved dark surfaces; photography enters through two
contained components, never as page backgrounds:

- **`.product-tile`** is a white tile (8px padding, 2px radius). It exists
  because the product photography is shot on white, and clear or white
  polymer product is invisible on the dark deck without a white ground. It is
  the same pattern the capabilities deck uses for partner logos on card covers.
- **`.photo-card`** is a framed card for environmental photography (facility,
  people, operations): image on top with `object-fit: cover`, one-line caption
  below in muted text.

Rules that travel with every image added:

1. Alt text is written when the image is wired in, never later. Describe what
   is shown; do not restate the caption.
2. No text baked into images as the only carrier of information.
3. Copy referring to Envision's workforce says "people who are blind or have
   low vision," never an abbreviation.
4. Web-optimized JPGs only (target under 500KB). The capabilities repo's
   `images/products/_source/` holds TIF print masters; they are not web-usable.
5. Do **not** pull the `ChatGPT Image ...` files from the capabilities repo.
   This deck is presented to federal procurement professionals; AI-generated
   scenes must not stand in for real Envision operations here.
6. Keep captions evergreen: no dates, no "currently," no schedule language.

To pull an image (repos are sibling checkouts):

```
cp ../envision-capabilites-services/images/<file> assets/img/<descriptive-name>.jpg
```

## Wired in now

| Slide | Image | Source in capabilities repo | Treatment |
|---|---|---|---|
| 8, Know your liners | `assets/img/can-liner-hdpe.jpg` on the HDPE panel | `images/products/can-liner-lldpe.jpg` (the capabilities repo's filenames were flipped; Dedra's review confirmed the swap. The crisp-creased thin-film shot now sits under HDPE) | `.product-tile` (white) |
| 8, Know your liners | `assets/img/can-liner-lldpe.jpg` on the LLDPE panel | `images/products/can-liner-hdpe.jpg` (the taut, stretched-film shot now sits under LLDPE) | `.product-tile` (white) |
| 12, How to order | `assets/img/wichita-manufacturing-floor.jpg` in the side column (replaces the QR card) | `images/envision-manufacturing-floor-bag-machines.jpg` | `.photo-card` |

## Slide-by-slide

| Slide | Verdict | Notes and candidates |
|---|---|---|
| 1 Title | No image | The ambient gradient treatment is the design. A photo would compete with the display title. |
| 2 Built for federal scale | Open slot, needs a copy trim first | The natural proof photo lives here, but the slide is full (4 stats + 5 bullets). If a bullet is cut, add a two-up campus strip: `images/campus-card-wichita.jpg` + `images/campus-card-dallas.jpg`, or a single `.photo-card` with `images/envision-dallas-warehouse-aisle.jpg`. |
| 3 AbilityOne Program | No image | Stat slide; the numbers are the visual. |
| 4 How AbilityOne works | No image | The org chart is the visual. |
| 5 Your mission and ours | Optional | A single people-centric `.photo-card` under the panels could work if desired: `images/envision-employee-with-guide-dog-factory.jpg` or `images/employee-factory-wichita.jpg`. Not required; the paired quotes carry the slide. |
| 6 The MSPV program | No image | The order-flow diagram is the visual. |
| 7 Contract at a glance | No image | Card grid is full. |
| 8 Know your liners | **Wired** + two ready | HDPE and LLDPE product tiles are in. Ready when wanted: `images/products/medical-isolation-bags.jpg` (the color-coded isolation liners named in the closing line) and `images/products/can-liner-compostable.jpg`, both white-ground shots that drop straight onto a `.product-tile`. |
| 9 Why order through MSPV | Optional | The "Employment with every order" row could carry a small portrait tile (`images/envision-workforce-team-member-headset.jpg`), but the five-row rhythm is tight; only add if a row is shortened. |
| 10 Buy Indian Act | No image | Legal content; the quote card is the focus. |
| 11 Training and support | No image | Interactive tile grid is full. |
| 12 How to order | **Wired** | Manufacturing-floor photo card fills the space the QR card held, above the Prime Vendor contacts. |
| 13 Closing | Complete | Dedra's headshot carries the card; the QR tile is removed and the card rebalances without it. |

## Accessibility check on the additions

- Every wired image has descriptive alt text; the slide-12 caption is a
  visible `figcaption`, so the alt describes the scene rather than repeating it.
- The white product tiles are content grounds inside cards, not page
  backgrounds; the dark system and its verified contrast pairs are unchanged.
- Captions use `--text-muted` (0.62 white on the card surface), above the
  0.52 floor for informational text on the dark surfaces.
- No new motion was introduced; the removed QR glow animation took the deck's
  only decorative box-shadow pulse with it.
