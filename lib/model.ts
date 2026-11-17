// The token radar's model, radar-3: one snapshot of the protocol universe in, one ranked board out.
//
// The board covers every protocol the snapshot's watchlist names (the floor, never a ceiling) plus
// every other pre-token protocol the snapshot carries that is rankable at all: no cap on the early
// radar, so the board holds all of them. A protocol is pre-token when its record carries no token
// (no market cap, no CoinGecko id, no symbol), and rankable only when it is not a wrapped, staked or
// bridged product of a token that already trades, by the watchlist's own rule; the snapshot's
// live-token protocols are kept apart and shown with the market's own values, never mixed into the
// ranked board.
//
// Implied value follows only from the snapshot's own figures, through five stated factors:
//
//   comps      = the category's own market multiple, partially pooled: the median market-cap-to-TVL
//                ratio of the token-bearing protocols in the same category, blended toward the
//                snapshot-wide median with a weight of four phantom comps, so a category with one
//                or two live protocols is not priced on a guess and a category with thirty is
//                barely moved. On this snapshot more than half the board used to fall back to one
//                global number; now every category carries its own blended multiple.
//                Clamped to [0.05, 1.5]. A lending protocol is priced like lending protocols that
//                already trade, not like a bridge: that is what a comparable multiple means.
//   base       = tvl_usd x comps
//   growth     = clamp(change_7d, -60, 120) per cent
//   growthMult = 1 + (growth / 100) x 0.5
//   maturity   = 0.6 + min(age_days, 1095) / 1095 x 0.4   (age_days unknown: 365)
//   breadth    = 1 + 0.04 x min(log2(chain count), 3): a protocol live on more chains reaches
//                more users, so each doubling of its chain count adds four per cent, up to three
//                doublings (1.12). A single-chain protocol gets 1.00.
//   implied    = max(1, round(base x growthMult x maturity x breadth))
//
// Every farm plan carries the protocol's own farm budget: the capital its TVL band asks for, plus
// the gas its main chain charges, so a farmer sees the whole cost before starting. The constants
// are the model's, stated in the dashboard and changeable in the model sandbox. No protocol name
// is ever special-cased: the same function scores every row, and the comps table the dashboard
// prints is computed from the snapshot at run time, never written by hand.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  comps_min: number;
  multiple_floor: number;
  multiple_cap: number;
  shrink_phantoms: number;
  breadth_weight: number;
  breadth_doublings: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 120,
  maturity_floor: 0.6,
  maturity_range: 0.4,
  maturity_days: 1095,
  unknown_age_days: 365,
  comps_min: 3,
  multiple_floor: 0.05,
  multiple_cap: 1.5,
  shrink_phantoms: 4,
  breadth_weight: 0.04,
  breadth_doublings: 3,
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-3';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 32;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  farm_cost_usd: number;
  farm_days: number;
  model: {
    comps_multiple: number;
    comps_n: number;
    comps_shrunk: boolean;
    comps_global: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    breadth_multiplier: number;
    breadth_chains: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  farm_cost_usd: number;
  farm_days: number;
  comps_multiple: number;
  comps_n: number;
  comps_shrunk: boolean;
  comps_global: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  breadth_multiplier: number;
  breadth_chains: number;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** One row of the comps table the dashboard prints: a category's blended multiple, from the snapshot. */
export interface CompsRow {
  category: string;
  multiple: number;
  comps_n: number;
  shrunk: boolean;
}

/** Everything the dashboard needs: the board, the live set, the comps table, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  global_multiple: number;
  comps: CompsRow[];
  watchlist: string[];
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** The median of a non-empty list of numbers. */
function median(values: number[]): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/**
 * The market multiples, from the snapshot's own live-token protocols, partially pooled: for each
 * category, the median market-cap-to-TVL ratio of the token-bearing protocols in it, blended toward
 * the snapshot-wide median with `shrink_phantoms` phantom comps at the global value. A category
 * with a single live protocol is no longer priced on that one protocol alone, and a category with
 * thirty is barely moved; a category with no live protocol at all takes the global median whole.
 * Every multiple is clamped to [multiple_floor, multiple_cap].
 */
export function compsTable(snapshot: Snapshot, model: ModelConstants = MODEL): { byCategory: Map<string, { multiple: number; n: number; shrunk: boolean }>; global: number } {
  const live = snapshot.protocols.filter(
    (p) => p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0 && p.category !== 'CEX',
  );
  const global = Math.min(model.multiple_cap, Math.max(model.multiple_floor, median(live.map((p) => p.mcap_usd! / p.tvl_usd))));
  const byCat = new Map<string, number[]>();
  for (const p of live) {
    const key = p.category ?? 'Other';
    const list = byCat.get(key);
    if (list) list.push(p.mcap_usd! / p.tvl_usd);
    else byCat.set(key, [p.mcap_usd! / p.tvl_usd]);
  }
  const byCategory = new Map<string, { multiple: number; n: number; shrunk: boolean }>();
  for (const [cat, ratios] of byCat) {
    const raw = median(ratios);
    const blended = (ratios.length * raw + model.shrink_phantoms * global) / (ratios.length + model.shrink_phantoms);
    byCategory.set(cat, {
      multiple: Math.min(model.multiple_cap, Math.max(model.multiple_floor, blended)),
      n: ratios.length,
      shrunk: Math.abs(blended - raw) / raw > 0.1,
    });
  }
  return { byCategory, global };
}

/** A protocol's blended multiple: its category's, or the snapshot-wide one when its category has no live comps. */
export function compsFor(category: string | null, table: { byCategory: Map<string, { multiple: number; n: number; shrunk: boolean }>; global: number }): { multiple: number; n: number; shrunk: boolean } {
  const hit = category === null ? undefined : table.byCategory.get(category);
  if (hit) return { multiple: hit.multiple, n: hit.n, shrunk: hit.shrunk };
  return { multiple: table.global, n: 0, shrunk: true };
}

/** How far a protocol's reach stretches: each doubling of its chain count adds `breadth_weight`, up to `breadth_doublings` doublings. */
export function breadthMultiplier(chainCount: number, model: ModelConstants): number {
  const doublings = Math.min(Math.max(Math.log2(Math.max(chainCount, 1)), 0), model.breadth_doublings);
  return 1 + doublings * model.breadth_weight;
}

/** The five multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  table: { byCategory: Map<string, { multiple: number; n: number; shrunk: boolean }>; global: number },
  model: ModelConstants,
): { implied: number; comps: { multiple: number; n: number; shrunk: boolean }; globalMultiple: number; growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; breadthChains: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const comps = compsFor(protocol.category, table);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const breadthChains = protocol.chains.length;
  const breadthMult = breadthMultiplier(breadthChains, model);
  const base = protocol.tvl_usd * comps.multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult * breadthMult));
  return { implied, comps, globalMultiple: table.global, growthPct, growthMult, maturityMult, breadthMult, breadthChains, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** The watchlist's own exclusion rule, applied to every row the board ranks, not just the watchlist:
 * a wrapped, staked or bridged product of a token that already trades is not a protocol still waiting
 * on a launch of its own. Categories that are such products, names carrying a whole word wrapped,
 * staked or staking, and names beginning with an exchange's name are all out. */
const WRAPPED_PRODUCT_CATEGORY = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);
const WRAPPED_WORD = /\b(wrapped|staked|staking)\b/i;
const EXCHANGE_PREFIX = /^(Binance|Coinbase|Bybit|Kraken|Bitget|OKX|Bitfinex|Gemini)\b/;

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol is one the board may rank: pre-token by the watchlist's own rule — no token
 * recorded, and not a wrapped, staked or bridged product of one that trades, not an exchange, and not
 * a versioned pool. The watchlist is the floor, and this rule is the same floor's edge. */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (p.category !== null && WRAPPED_PRODUCT_CATEGORY.has(p.category)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const table = compsTable(snapshot, model);
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but
  // the board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol, below the floor or not. No cap: the
  // radar exists to find them all, and the board's 4,000-row cap is far above the 289 they come to.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, table, model);
    const budget = farmBudget(p, v.age);
    return { p, ...v, budget };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    farm_cost_usd: s.budget.costUsd,
    farm_days: s.budget.days,
    model: {
      comps_multiple: s.comps.multiple,
      comps_n: s.comps.n,
      comps_shrunk: s.comps.shrunk,
      comps_global: round4(s.globalMultiple),
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      breadth_multiplier: round4(s.breadthMult),
      breadth_chains: s.breadthChains,
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** The second chain a protocol names, or null when it runs on one chain only. */
function secondChainOf(p: SnapshotProtocol): string | null {
  return p.chains.length > 1 ? p.chains[1]! : null;
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt token.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator') || c.includes('risk')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the vault shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('farm')) return `Deposit $${capital} into ${name}'s farm on ${chain} and keep the position open.`;
  if (c.includes('synthetic') || c.includes('synthetics')) return `Mint $${capital} of the synthetic asset on ${name} on ${chain} and hold the position.`;
  if (c.includes('options')) return `Buy $${capital} of options on ${name} on ${chain} and let one expiry pass.`;
  if (c.includes('launchpad')) return `Stake $${capital} through ${name} on ${chain} to join its next launch allocation.`;
  if (c.includes('index') || c.includes('indexes')) return `Buy $${capital} of the index on ${name} on ${chain} and hold the basket.`;
  if (c.includes('payment')) return `Route $${capital} of payments through ${name} on ${chain} and keep the receipts.`;
  if (c.includes('aggregator')) return `Deposit $${capital} into the ${name} aggregator on ${chain} and keep the receipt token.`;
  if (c.includes('reserve')) return `Deposit $${capital} into the ${name} reserve on ${chain} and hold the position.`;
  if (c.includes('privacy')) return `Deposit $${capital} through ${name}'s private pool on ${chain} and keep the note.`;
  if (c.includes('governance')) return `Deposit $${capital} into ${name} on ${chain} and vote in its next round.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** The weekly qualifying action for the category, so the plan is not the same sentence twice. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return 'a supply top-up, a borrow or a repayment';
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return 'a swap through the pool or a liquidity top-up';
  if (c.includes('bridge')) return 'a bridge of a small amount and one use of the bridged funds';
  if (c.includes('staking') || c.includes('restak')) return 'a stake top-up or a claim of the staking rewards';
  if (c.includes('perpetual') || c.includes('derivative')) return 'one small trade or a margin adjustment';
  if (c.includes('prediction')) return 'one market position or a claim of a settled market';
  if (c.includes('curator') || c.includes('allocator') || c.includes('risk')) return 'a deposit into the vault or a rebalance the vault offers';
  if (c.includes('rwa')) return 'a mint of the yield asset or a claim of its yield';
  if (c.includes('synthetic') || c.includes('synthetics')) return 'a mint of the synthetic asset or a rebalance of the position';
  if (c.includes('options')) return 'one options trade or a roll to the next expiry';
  if (c.includes('launchpad')) return 'a stake top-up or a claim from a finished launch';
  if (c.includes('index') || c.includes('indexes')) return 'a buy into the index or a rebalance it offers';
  if (c.includes('payment')) return 'one payment routed through the protocol';
  if (c.includes('aggregator')) return 'a deposit into the aggregator or a claim of its yield';
  return 'a deposit, a swap, a borrow or a vote';
}

/** What one transaction costs on a chain, in whole dollars: Ethereum is the expensive one, Bitcoin
 * sits in the middle, and most other chains charge well under a dollar. These are rough, current
 * figures for sizing a farm budget, not a quote. */
export function gasUsdFor(chain: string): number {
  if (chain === 'Ethereum') return 9;
  if (chain === 'Bitcoin') return 4;
  return 1;
}

/** One farm's whole budget: the capital its TVL band asks for, plus gas for two setup transactions
 * and one weekly transaction across the hold. */
export function farmBudget(p: SnapshotProtocol, age: number | null): { costUsd: number; days: number; capital: number; gasUsd: number; holdDays: number } {
  const capital = capitalFor(p);
  const gasUsd = gasUsdFor(chainOf(p));
  const holdDays = holdDaysFor(age);
  const weeklyTx = Math.max(1, Math.ceil(holdDays / 7));
  const costUsd = capital + gasUsd * (2 + weeklyTx);
  return { costUsd, days: holdDays, capital, gasUsd, holdDays };
}

/**
 * A protocol's farm plan: nine steps, each an action with a cost and a time. The plan is derived
 * from the protocol's own record (category, chains, TVL, age, seven-day growth), never from a
 * hand-written list of names, and every cost is priced on the protocol's own chain, so an Ethereum
 * farm and a cheap-chain farm do not pretend to cost the same.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const second = secondChainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const gas = gasUsdFor(chain);
  const secondGas = second === null ? gas : gasUsdFor(second);
  const action = actionFor(p, capital, chain);
  const weekly = weeklyActionFor(p);
  const growth = p.change_7d;
  const growthNote =
    growth !== null && growth > 25
      ? ` TVL is up ${growth.toFixed(1)}% in seven days, so start this week while the protocol is growing.`
      : growth !== null && growth < -25
        ? ` TVL is down ${Math.abs(growth).toFixed(1)}% in seven days, so keep the position small and watch it weekly.`
        : '';
  const steps: FarmStep[] = [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: `about $${gas} of gas for the first transaction on ${chain}`,
      time: '5 minutes',
    },
    {
      text: action + growthNote,
      cost: `$${capital} of capital and about $${gas * 2} of gas for the two setup transactions`,
      time: '15 minutes to set up',
    },
    {
      text: second === null
        ? `Do the same position a second time from the same wallet a week later, so the activity shows as two separate dates.`
        : `Repeat the position on ${second}, the protocol's second chain, with half the capital, so the activity spans two chains.`,
      cost: second === null ? `$${capital} of capital, already in the position` : `$${Math.ceil(capital / 2)} of capital and about $${secondGas} of gas on ${second}`,
      time: '15 minutes',
    },
    {
      text: `Make one qualifying action each week, such as ${weekly}.`,
      cost: `about $${gas} of gas a week on ${chain}`,
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Check the protocol's own points or rewards page once a week and confirm your wallet's activity is showing.`,
      cost: 'no fee to check',
      time: '5 minutes a week',
    },
    {
      text: `Before you withdraw, open the protocol's own points or rewards page and claim only from the link it publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
    {
      text: `Once a month, re-check the protocol's TVL and its points page: if TVL has halved, or a token has launched, unwind the position and log the exit.`,
      cost: 'no fee to check',
      time: '10 minutes a month',
    },
  ];
  return steps;
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** A board row's compact form for data.js, with the farm plan generated in the page. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    farm_cost_usd: row.farm_cost_usd,
    farm_days: row.farm_days,
    comps_multiple: row.model.comps_multiple,
    comps_n: row.model.comps_n,
    comps_shrunk: row.model.comps_shrunk,
    comps_global: row.model.comps_global,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
    breadth_chains: row.model.breadth_chains,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const table = compsTable(snapshot, model);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const comps: CompsRow[] = [...table.byCategory.entries()]
    .map(([category, v]) => ({ category, multiple: v.multiple, comps_n: v.n, shrunk: v.shrunk }))
    .sort((a, b) => b.multiple - a.multiple || (a.category < b.category ? -1 : a.category > b.category ? 1 : 0));
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    global_multiple: round4(table.global),
    comps,
    watchlist: snapshot.watchlist.slice(),
    rows: board.map(radarRow),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
