# Sentinel logo

Generated with the built-in `image_gen` tool and the `imagegen` skill, with transparency. The symbol combines an S, a shield, and a tower-shaped top using the interface's violet accent. The wordmark reads Sentinel.

## Files

- `frontend/public/brand/sentinel-logo.png`: horizontal logo with wordmark, transparent PNG, 1976 × 495 px.
- `frontend/public/brand/sentinel-mark.png`: standalone symbol, transparent PNG, 512 × 512 px.
- `frontend/public/brand/sentinel.ico`: ICO containing 16, 24, 32, 48, 64, 128, and 256 px images.
- `frontend/src/app/favicon.ico`: the same ICO, integrated through the Next.js favicon convention.
- `frontend/public/brand/sentinel-logo-source.png`: original generated image, preserved unchanged.

The symbol appears in navigation and on the login screen. Brand names and components retain accessible text. The favicon is automatically served at `/favicon.ico`.

Conversion and export logic lives in `scripts/build-sentinel-brand.cjs`. The script trims transparent logo margins, extracts the symbol, and packages the resolutions into an ICO. It requires no new dependencies and uses Sharp, which is already part of the project. Validation covered the ICO header, all seven sizes, and each image's alpha channel.

To regenerate exports from the original image:

```bash
node scripts/build-sentinel-brand.cjs
```

## Generation prompt

```text
Use case: logo-brand. Create one polished production logo for the cybersecurity operations platform named Sentinel. Exact wordmark text: "Sentinel" (capital S, then e n t i n e l), no other text. Layout: a single horizontal lockup, a compact standalone symbol on the left and the wordmark on the right, perfectly vertically aligned; use a wide canvas, tightly framed artwork with comfortable clear padding, actual transparent background. Symbol: a distinctive, very simple geometric watchtower / protective shield silhouette formed by a bold angular S in negative space, a compact square footprint. Flat solid deep violet #6250D9 symbol, dark ink #25283F wordmark. Lettering: modern precise geometric sans serif, medium-semibold weight, good optical kerning and legibility. Fits an elegant white and pale lavender enterprise security interface. The symbol must be independently legible at 16px as a favicon: strong silhouette, generous negative space, no fine lines. One logo only, not a presentation sheet, no extra variants, no mockups, no backdrop, no gradients, no glow, no shadows, no metallic or 3D effects, no watermark. Separate the left symbol and right lettering with generous transparent horizontal spacing so the symbol can be extracted cleanly for an ICO. Keep the symbol below 30 percent of the artwork width and lettering entirely to its right.
```
