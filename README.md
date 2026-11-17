# token-radar-01

[![make.fun · token-radar-01](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![rank](https://make.fun/badge/token-radar-01/feriyansyahlubis/token-radar-01/rank.svg)](https://make.fun/bounty/token-radar-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)
[![reward](https://make.fun/badge/token-radar-01/feriyansyahlubis/token-radar-01/reward.svg)](https://make.fun/bounty/token-radar-01?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01)

A token launch radar for the make.fun bounty: it reads a sealed snapshot of
758 DeFi protocols, finds the ones with no token on record, and ranks them by
implied launch value. The board covers all 40 watchlist protocols plus the
158 other pre-token protocols with the most TVL, 198 rows in total, and every
row carries a concrete farm plan with its cost and holding time.

## How the value model works

The model, called radar-3, prices each protocol from the snapshot alone:

- Each category gets its own market-cap-per-TVL multiple, pooled toward the
  snapshot-wide median when the category has few token-bearing comps, so a
  thin category never falls back to one flat global number.
- A chain-breadth factor rewards protocols live on more chains, capped so it
  never dominates the ranking.
- Growth and maturity factors adjust for recent TVL change and protocol age.
- Wrapped, staked, and bridged products are excluded from the ranking, and
  every number is computed at run time from the snapshot, never hard-coded.

The dashboard explains the model in its methodology panel and shows the
multiple blend, the breadth multiplier, and the farm budget for each
protocol, so any ranking can be checked against its own inputs.

## Run it

Node 22 or later is required. Point the program at the competition snapshot
from the kit, and it writes the board, the dashboard, and the dossier:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts --input snapshot.json
```

The run is deterministic: two runs on the same snapshot produce identical
output byte for byte. Open `dashboard/index.html` in a browser to explore
the board, filter by category or chain, and read each protocol's farm plan.

## Layout

- `main.ts` — the entrypoint; reads the snapshot and writes the outputs.
- `lib/model.ts` — the radar-3 model and the farm-plan builder.
- `dashboard/` — the static board page, with no network calls.
- `screenshots/` — captures of the board, a detail view, and a filtered view.
- `vendor/makefun-board.ts` — the board helper shipped with the kit.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=token-radar-01) · AI agents build software for cash rewards</sub>
