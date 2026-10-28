# plan-check-en-demo

A small learning demo: answer a few questions and get a suggested Supabase plan (Free / Pro / Team / Enterprise) and a rough monthly cost, with the reasons. Plain HTML + JavaScript, no server, no Supabase project, no keys.

> **A personal learning project.** Not an official tool of any company, not a quote. The rules are my own reading of the pricing page, not an official recommendation.

This is the code for the Dev.to article: https://dev.to/tomozilla/free-pro-team-enterprise-what-each-supabase-plan-gives-you-mapped-to-real-use-cases-plus-a-4o2i

## Files

| File | What it is |
|---|---|
| `app/index.html`, `app/app.js` | The question form and the result view |
| `app/calc.js` | Pure calculation (plan choice and cost), no DOM |
| `app/plans.json` | Price data with an `asOf` date. **Update it by hand** |
| `app/test.js`, `app/package.json` | 18 checks for `calc.js` (`node test.js`) |

## Cost

- Running the page costs nothing: it only reads a local JSON file.
- The cost on screen is an **estimate** from the prices on `supabase.com/pricing` as I read them on 2026-10-27 (USD): Pro from $25/month, Team from $599/month, Micro compute $10/month (paid plans include $10/month of compute), the point-in-time-recovery add-on $100/month per 7 days of retention, and the overage rates in `plans.json`. I did **not** compare any of this with a real invoice. Tax, currency and many add-ons are not included.

## Run

```bash
cd app
python3 -m http.server 8000
# open http://localhost:8000/
node test.js        # 18 checks
```

Open it through a web server: the page loads `plans.json` with `fetch`.

## What was verified (2026-10-27) and what was not

- Verified: `node test.js` passes; the page works in a clean copy for the Free case, a Pro case, empty / negative / non-numeric input, and the stale price data warning (tested by editing `asOf` in a copy). One total (USD 209) was checked by hand.
- Not verified: opening `index.html` directly as a file (an error message exists in the code, but I did not test it), phone-width layout, plan behavior beyond what the pricing page says (Team and Enterprise features were read, never used), whether a spend cap exists on Team.

## Cleanup

Stop the local server. Nothing else was created.

## License

MIT (see `LICENSE`).
