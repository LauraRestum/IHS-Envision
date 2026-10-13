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

The October 2026 restructure (15 slides to 10) removed Know your liners and
How to order, so the HDPE/LLDPE product tiles and the Wichita
manufacturing-floor photo card no longer appear. The files stay in
`assets/img/` for reuse.

| Slide | Image | Source in capabilities repo | Treatment |
|---|---|---|---|
| 9, Print | `assets/img/rob-narron.jpg` on the print program contact card | Supplied by Laura (uploaded Sept 23), not from the capabilities repo | `.contact-photo--sm` |
| 10, Closing | `assets/img/dedra-griffin.jpg` and `assets/img/rob-narron.jpg` on the contact cards | Supplied headshots | `.contact-photo` |

Unused but ready: `can-liner-hdpe.jpg` and `can-liner-lldpe.jpg` (the
capabilities repo's filenames were flipped; Dedra's review confirmed the
swap), and `wichita-manufacturing-floor.jpg`
(`images/envision-manufacturing-floor-bag-machines.jpg`).

## Slide-by-slide

| Slide | Verdict | Notes and candidates |
|---|---|---|
| 1 Title | No image | The ambient gradient treatment is the design. A photo would compete with the display title. |
| 2 Built for federal scale | Open slot, needs a copy trim first | The slide is full (4 stats + 6 bullets). If a bullet is cut, add a two-up campus strip: `images/campus-card-wichita.jpg` + `images/campus-card-dallas.jpg`. |
| 3 How AbilityOne works | No image | The org chart is the visual. |
| 4 Your mission and ours | Optional | A single people-centric `.photo-card` could work: `images/envision-employee-with-guide-dog-factory.jpg` or `images/employee-factory-wichita.jpg`. |
| 5 Buy Indian Act | No image | Legal content; the quote card is the focus. |
| 6 Everything Envision supplies | No image | Capabilities and services tile grid fills the slide. |
| 7 How to buy | No image | Three channel columns and the distributor card fill the slide. |
| 8 Contract at a glance | No image | Card grid is full. |
| 9 Print | Optional | A small `.photo-card` with `images/Envision-print-lableroll.jpg` could sit under the contact card if wanted. |
| 10 Closing | Complete | Dedra's and Rob's headshots carry the contact cards. |

## Accessibility check on the additions

- Every wired image has descriptive alt text.
- Captions, when used, are a visible `figcaption`, and use `--text-muted` (0.62 white on the card surface), above the
  0.52 floor for informational text on the dark surfaces.
- No new motion was introduced; the removed QR glow animation took the deck's
  only decorative box-shadow pulse with it.
