# Lighthouse — 14/11/2026

## Production (Vercel) — plan 5.2 pass

Target: `https://tominhoi.vercel.app` (simulated mobile throttle, Chrome Windows, after env-var fix + redeploy).

| Page | FCP | LCP | TBT | CLS | Perf | A11y | BP | SEO |
|------|-----|-----|-----|-----|------|------|----|-----|
| home-mobile | 0.9 s | 2.3 s | 70 ms | 0.001 | 98 | 100 | 100 | 100 |

FCP < 2 s: **pass**.

## Local dev (superseded by prod run)

| Page | FCP | LCP | TBT | CLS | Perf | A11y | BP | SEO |
|------|-----|-----|-----|-----|------|------|----|-----|
| home-desktop.json | 0.2 s | 0.2 s | 30 ms | 0 | 100 | - | - | - |
| home-mobile.json | 0.8 s | 0.8 s | 470 ms | 0 | 88 | 96 | 96 | 100 |
| troly-mobile.json | 0.8 s | 0.8 s | 440 ms | 0 | 89 | - | - | - |

FCP numeric (ms): home-desktop.json=231.505, home-mobile.json=777.8970999999999, troly-mobile.json=773.6704

Pass local (FCP < 2000ms): home-desktop.json=true, home-mobile.json=true, troly-mobile.json=true
