// Synthetic telemetry generator. Shapes match the payloads emitted by
// services/log-ingestion-api so swapping in the real backend is a drop-in.
import { IsolationForest, mulberry32 } from './iforest.js';

export const SERVICES = [
  { id: 'edge-proxy', stage: 'ingress', base: 38, rps: 420 },
  { id: 'gateway', stage: 'ingress', base: 62, rps: 380 },
  { id: 'auth-api', stage: 'app', base: 74, rps: 210 },
  { id: 'checkout', stage: 'app', base: 120, rps: 96 },
  { id: 'payment-svc', stage: 'app', base: 180, rps: 64 },
  { id: 'db-master', stage: 'data', base: 22, rps: 510 },
  { id: 'log-processor', stage: 'stream', base: 14, rps: 860 },
  { id: 'ml-engine', stage: 'stream', base: 18, rps: 300 },
  { id: 'alert-mgr', stage: 'ops', base: 40, rps: 12 },
];

export const SERVICE_IDS = SERVICES.map((s) => s.id);
export const LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

const NORMAL_MSGS = {
  'edge-proxy': ['GET /api/v1/health 200', 'TLS session resumed', 'cache HIT /static/app.js', 'upstream keepalive reused'],
  gateway: ['routed POST /v1/ingest → log-ingestion-api', 'rate-limit bucket refilled', 'JWT verified for tenant acme'],
  'auth-api': ['login ok user_{n}', 'refresh token rotated user_{n}', 'mfa challenge passed user_{n}'],
  checkout: ['order #{n} placed', 'cart merged for session {h}', 'shipping quote returned in {l}ms'],
  'payment-svc': ['charge ch_{h} captured', 'stripe webhook ack evt_{h}', 'refund rf_{h} queued'],
  'db-master': ['replica lag 12ms', 'checkpoint complete', 'vacuum logs_2026_11 done'],
  'log-processor': ['batch of {n} records indexed', 'committed offset {n} on raw-logs/3', 'mapping cache warm'],
  'ml-engine': ['scored batch of {n} in {l}ms', 'model iforest-v3 heartbeat', 'feature window rolled'],
  'alert-mgr': ['dedupe window flushed', 'slack channel #ops reachable', 'pagerduty heartbeat ok'],
};

const ANOMALY_MSGS = {
  'edge-proxy': ['upstream reset by peer x{c}', '502 burst from pool b'],
  gateway: ['p99 latency {l}ms on /v1/ingest', 'circuit breaker OPEN → auth-api'],
  'auth-api': ['signing key expired, {c} sessions rejected', 'brute-force pattern from 10.4.{c}.7'],
  checkout: ['retry storm against billing ({c} retries/s)', 'inventory lock timeout'],
  'payment-svc': ['stripe timeout after {l}ms', 'idempotency collision on ch_{h}'],
  'db-master': ['replica lag {l}ms and rising', 'deadlock detected on orders'],
  'log-processor': ['consumer lag {n} msgs on raw-logs', 'ES bulk rejected (429)'],
  'ml-engine': ['inference queue saturated ({c} pending)', 'feature drift on latency_p95'],
  'alert-mgr': ['slack webhook 403 Forbidden', 'smtp relay refused connection'],
};

const fill = (tpl, rand, latency) =>
  tpl
    .replace('{n}', String(Math.floor(rand() * 90000 + 1000)))
    .replace('{h}', Math.floor(rand() * 0xffffff).toString(16).padStart(6, '0'))
    .replace('{l}', String(Math.round(latency)))
    .replace('{c}', String(Math.floor(rand() * 40 + 4)));

// Box–Muller.
const gauss = (rand) => {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// Feature vector the model sees: [log10 latency, error-rate %, log2 payload KB].
export const toFeatures = ({ latency, errorRate, payload }) => [
  Math.log10(Math.max(latency, 1)),
  errorRate,
  Math.log2(Math.max(payload, 0.1)),
];

// Normalised 3D coordinates for scenes, roughly in [-1, 1].
export const toSpace = ({ latency, errorRate, payload }) => [
  (Math.log10(Math.max(latency, 1)) - 2.1) / 1.1,
  errorRate / 20 - 0.6,
  (Math.log2(Math.max(payload, 0.1)) - 2) / 3,
];

export const sampleNormal = (rand, svc) => {
  const s = svc || SERVICES[Math.floor(rand() * SERVICES.length)];
  return {
    latency: Math.max(2, s.base * Math.exp(gauss(rand) * 0.35)),
    errorRate: Math.max(0, Math.abs(gauss(rand)) * 0.9),
    payload: Math.max(0.2, 4 * Math.exp(gauss(rand) * 0.4)),
  };
};

export const sampleAnomaly = (rand, svc) => {
  const s = svc || SERVICES[Math.floor(rand() * SERVICES.length)];
  const kind = Math.floor(rand() * 3);
  const n = sampleNormal(rand, s);
  if (kind === 0) n.latency = s.base * (8 + rand() * 20);
  if (kind === 1) n.errorRate = 8 + rand() * 25;
  if (kind === 2) {
    n.payload = 40 + rand() * 200;
    n.latency *= 3;
  }
  if (rand() > 0.6) n.errorRate += 5 + rand() * 10;
  return n;
};

export const trainForest = ({ trees = 100, sampleSize = 256, seed = 7 } = {}) => {
  const rand = mulberry32(seed);
  const data = [];
  for (let i = 0; i < 2048; i++) data.push(toFeatures(sampleNormal(rand)));
  // A little contamination, like real production logs.
  for (let i = 0; i < 40; i++) data.push(toFeatures(sampleAnomaly(rand)));
  return new IsolationForest({ trees, sampleSize, seed }).fit(data);
};

let seq = 0;

export const makeLog = (rand, model, threshold, { forceAnomaly = false, service, metrics } = {}) => {
  const svc = service ? SERVICES.find((s) => s.id === service) : SERVICES[Math.floor(rand() * SERVICES.length)];
  const injected = forceAnomaly || rand() < 0.035;
  const m = metrics ? { ...metrics } : injected ? sampleAnomaly(rand, svc) : sampleNormal(rand, svc);
  const score = model.score(toFeatures(m));
  const anomaly = score >= threshold;
  let level = 'INFO';
  if (injected) level = m.errorRate > 15 ? 'CRITICAL' : rand() > 0.4 ? 'ERROR' : 'WARN';
  else if (rand() < 0.06) level = 'WARN';
  else if (rand() < 0.12) level = 'DEBUG';
  const pool = injected ? ANOMALY_MSGS[svc.id] : NORMAL_MSGS[svc.id];
  seq += 1;
  return {
    id: `${Date.now().toString(36)}-${seq}`,
    ts: Date.now(),
    service: svc.id,
    level,
    msg: fill(pool[Math.floor(rand() * pool.length)], rand, m.latency),
    ...m,
    score,
    anomaly,
    injected,
    traceId: Math.floor(rand() * 0xffffffff).toString(16).padStart(8, '0'),
  };
};

export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString('en-GB', { hour12: false });

export const fmtNum = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e4 ? `${(n / 1e3).toFixed(1)}k` : Math.round(n).toLocaleString();

export const fmtDur = (ms) => {
  if (ms == null || Number.isNaN(ms)) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
};
