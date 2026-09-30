# Chrome Web Store assets

Opaque 24-bit PNGs (no alpha) for the listing form.

| File | Upload as | Size |
|---|---|---|
| `store-icon-128.png` | Store icon | 128×128 |
| `screenshot-1-landing.png` | Screenshot 1 | 1280×800 |
| `screenshot-2-chat.png` | Screenshot 2 | 1280×800 |
| `screenshot-3-signal.png` | Screenshot 3 | 1280×800 |
| `screenshot-4-news.png` | Screenshot 4 | 1280×800 |
| `small-promo-440x280.png` | Small promo tile | 440×280 · real UI |
| `marquee-promo-1400x560.png` | Marquee promo tile | 1400×560 · real UI |

Promo tiles use live product screens (chat / signal / news), not mock UI.

Copies also in `tmp/cws-screenshots/`.

Legacy mock screenshots (`screenshot-*-side-panel|sign-in|ask-anywhere.png`) may still exist from `pnpm --filter @exur/extension store-assets` — prefer the `screenshot-1-landing` … `screenshot-4-news` set for the listing.
