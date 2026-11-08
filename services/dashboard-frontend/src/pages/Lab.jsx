import { useMemo, useState } from 'react';
import { Send, Shuffle } from 'lucide-react';
import { PageHead, Scene, scoreColor } from '../components/ui';
import { SERVICES, sampleAnomaly, sampleNormal, toFeatures } from '../lib/engine';
import { mulberry32 } from '../lib/iforest';
import { useLive } from '../lib/store';

// Slider ↔ value on a log scale.
const logMap = (min, max) => ({
  to: (v) => Math.log(v / min) / Math.log(max / min),
  from: (t) => min * Math.pow(max / min, t),
});
const LAT = logMap(2, 6000);
const PAY = logMap(0.2, 400);

const PRESETS = [
  ['healthy request', { latency: 70, errorRate: 0.4, payload: 4 }],
  ['slow upstream', { latency: 1800, errorRate: 1.2, payload: 4 }],
  ['error burst', { latency: 90, errorRate: 22, payload: 3 }],
  ['payload bomb', { latency: 420, errorRate: 2, payload: 220 }],
  ['subtle drift', { latency: 260, errorRate: 3.5, payload: 9 }],
];

function Gauge({ score, threshold }) {
  const a0 = Math.PI * 0.8;
  const a1 = Math.PI * 2.2;
  const r = 80;
  const at = (t) => {
    const a = a0 + (a1 - a0) * t;
    return [100 + Math.cos(a) * r, 100 + Math.sin(a) * r];
  };
  const arc = (t0, t1) => {
    const [x0, y0] = at(t0);
    const [x1, y1] = at(t1);
    return `M${x0},${y0} A${r},${r} 0 ${t1 - t0 > 0.5 ? 1 : 0} 1 ${x1},${y1}`;
  };
  const norm = (s) => Math.max(0, Math.min(1, (s - 0.3) / 0.5));
  const t = norm(score);
  const tt = norm(threshold);
  const [nx, ny] = at(t);
  const [tx0, ty0] = at(tt);
  const ticks = Array.from({ length: 21 }, (_, i) => i / 20);
  return (
    <div className="gauge">
      <svg viewBox="0 0 200 180">
        {ticks.map((k) => {
          const [x, y] = at(k);
          const [x2, y2] = [100 + (x - 100) * 0.9, 100 + (y - 100) * 0.9];
          return <line key={k} x1={x} y1={y} x2={x2} y2={y2} stroke={k >= tt ? 'var(--signal)' : 'var(--line-3)'} strokeWidth={k * 20 % 5 === 0 ? 1.5 : 0.75} />;
        })}
        <path d={arc(0, 1)} fill="none" stroke="var(--line)" strokeWidth="2" />
        <path d={arc(0, Math.max(0.001, t))} fill="none" stroke={scoreColor(score, threshold)} strokeWidth="2" />
        <line x1={tx0} y1={ty0} x2={100 + (tx0 - 100) * 1.12} y2={100 + (ty0 - 100) * 1.12} stroke="var(--amber)" strokeWidth="2" />
        <line x1="100" y1="100" x2={nx} y2={ny} stroke="var(--text)" strokeWidth="1" />
        <circle cx="100" cy="100" r="3" fill="var(--text)" />
        <text x="30" y="178" className="axis-t">0.30</text>
        <text x="170" y="178" className="axis-t" textAnchor="end">0.80</text>
      </svg>
      <div className="center" style={{ top: '38%' }}>
        <div className="v" style={{ color: scoreColor(score, threshold), fontSize: 32 }}>
          {score.toFixed(3)}
        </div>
        <div className="label" style={{ marginTop: 6 }}>
          {score >= threshold ? <span className="t-signal">anomaly</span> : score >= threshold - 0.07 ? <span className="t-amber">borderline</span> : <span className="t-ok">normal</span>}
        </div>
      </div>
    </div>
  );
}

export default function Lab() {
  const { model, modelVersion, settings, setSettings, injectCustom } = useLive();
  const [m, setM] = useState(PRESETS[2][1]);
  const [svc, setSvc] = useState('payment-svc');
  const [sent, setSent] = useState(0);

  const paths = useMemo(() => model.paths(toFeatures(m)), [model, m]);
  const score = useMemo(() => model.score(toFeatures(m)), [model, m]);
  const meanPath = paths.reduce((a, b) => a + b, 0) / paths.length;

  // Held-out test set → ROC curve, recomputed whenever the forest is regrown.
  const evalSet = useMemo(() => {
    const rand = mulberry32(99);
    const rows = [];
    for (let i = 0; i < 900; i++) rows.push({ y: 0, s: model.score(toFeatures(sampleNormal(rand))) });
    for (let i = 0; i < 90; i++) rows.push({ y: 1, s: model.score(toFeatures(sampleAnomaly(rand))) });
    return rows.sort((a, b) => b.s - a.s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, modelVersion]);

  const roc = useMemo(() => {
    const P = evalSet.filter((r) => r.y).length;
    const N = evalSet.length - P;
    let tp = 0;
    let fp = 0;
    const pts = [[0, 0]];
    let auc = 0;
    let prevF = 0;
    let prevT = 0;
    for (const r of evalSet) {
      if (r.y) tp++;
      else fp++;
      const fpr = fp / N;
      const tpr = tp / P;
      auc += (fpr - prevF) * (tpr + prevT) / 2;
      prevF = fpr;
      prevT = tpr;
      pts.push([fpr, tpr]);
    }
    const at = evalSet.filter((r) => r.s >= settings.threshold);
    const tpT = at.filter((r) => r.y).length;
    const fpT = at.length - tpT;
    return { pts, auc, op: [fpT / N, tpT / P], tp: tpT, fp: fpT, fn: P - tpT, tn: N - fpT, P, N };
  }, [evalSet, settings.threshold]);

  const buckets = Array(14).fill(0);
  paths.forEach((p) => (buckets[Math.min(13, Math.floor(p))] += 1));
  const bmax = Math.max(1, ...buckets);

  const sliders = [
    ['latency', `${m.latency.toFixed(0)} ms`, LAT.to(m.latency), (t) => setM({ ...m, latency: LAT.from(t) })],
    ['error rate', `${m.errorRate.toFixed(1)} %`, m.errorRate / 40, (t) => setM({ ...m, errorRate: t * 40 })],
    ['payload', `${m.payload.toFixed(1)} KB`, PAY.to(m.payload), (t) => setM({ ...m, payload: PAY.from(t) })],
  ];

  const rocPath = roc.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * 200).toFixed(1)},${(200 - y * 200).toFixed(1)}`).join('');

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="06"
          kicker="detector lab"
          title={
            <>
              Poke the <em>forest</em>
            </>
          }
          actions={
            <>
              <button
                className="btn"
                onClick={() => {
                  const r = Math.random;
                  setM(r() > 0.5 ? sampleAnomaly(r) : sampleNormal(r));
                }}
              >
                <Shuffle size={13} /> random sample
              </button>
              <button
                className="btn signal"
                onClick={() => {
                  injectCustom(svc, m, score >= settings.threshold);
                  setSent((n) => n + 1);
                }}
              >
                <Send size={13} /> send to stream {sent ? `(${sent})` : ''}
              </button>
            </>
          }
        >
          This is the same Isolation Forest that scores the live stream. Shape a log record, watch where it lands in feature space, and
          tune the threshold against a held-out test set.
        </PageHead>

        <div className="grid g-main">
          <div className="panel ticks" style={{ overflow: 'hidden' }}>
            <Scene
              kind="cloud"
              height={520}
              probe={m}
              probeScore={score}
              autoRotate={false}
              hud={
                <>
                  <span>probe vs. live traffic</span>
                  <span>drag to orbit</span>
                </>
              }
            />
          </div>
          <div className="grid" style={{ alignContent: 'start' }}>
            <div className="panel">
              <div className="panel-head">
                <h3>
                  <span className="idx">A</span> Record
                </h3>
                <select className="field" value={svc} onChange={(e) => setSvc(e.target.value)} style={{ height: 28 }}>
                  {SERVICES.map((s) => (
                    <option key={s.id}>{s.id}</option>
                  ))}
                </select>
              </div>
              <div className="panel-body" style={{ display: 'grid', gap: 14 }}>
                <div className="row wrap-f" style={{ gap: 6 }}>
                  {PRESETS.map(([name, v]) => (
                    <button key={name} className="btn sm" onClick={() => setM(v)}>
                      {name}
                    </button>
                  ))}
                </div>
                {sliders.map(([k, v, t, on]) => (
                  <label key={k} style={{ display: 'grid', gap: 2 }}>
                    <span className="row between">
                      <span className="label">{k}</span>
                      <span className="mono" style={{ fontSize: 13 }}>
                        {v}
                      </span>
                    </span>
                    <input type="range" min="0" max="1" step="0.001" value={t} onChange={(e) => on(Number(e.target.value))} />
                  </label>
                ))}
              </div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <h3>
                  <span className="idx">B</span> Score
                </h3>
                <span className="label">mean path {meanPath.toFixed(2)} / c(ψ) {model.c?.toFixed(2)}</span>
              </div>
              <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'center' }}>
                <Gauge score={score} threshold={settings.threshold} />
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>
                    path lengths · {paths.length} trees
                  </div>
                  <svg viewBox="0 0 140 80" className="chart" style={{ height: 110 }}>
                    {buckets.map((b, i) => (
                      <rect key={i} x={i * 10} width={8} y={74 - (b / bmax) * 70} height={(b / bmax) * 70} fill={i < 5 ? 'var(--signal)' : 'var(--steel)'} />
                    ))}
                    <line x1="0" x2="140" y1="74.5" y2="74.5" className="grid-l" />
                  </svg>
                  <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                    s = 2<sup>−E(h)/c(ψ)</sup>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid g-3 mt-12">
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">C</span> ROC · held-out set
              </h3>
              <span className="tag ok">AUC {roc.auc.toFixed(3)}</span>
            </div>
            <div className="panel-body">
              <svg viewBox="-24 -6 232 232" className="chart" style={{ height: 260 }}>
                {[0, 0.25, 0.5, 0.75, 1].map((g) => (
                  <g key={g}>
                    <line className="grid-l" x1={g * 200} x2={g * 200} y1="0" y2="200" strokeDasharray="2 4" />
                    <line className="grid-l" y1={200 - g * 200} y2={200 - g * 200} x1="0" x2="200" strokeDasharray="2 4" />
                  </g>
                ))}
                <line x1="0" y1="200" x2="200" y2="0" stroke="var(--line-2)" strokeDasharray="4 4" />
                <path d={rocPath} fill="none" stroke="var(--amber)" strokeWidth="1.5" />
                <circle cx={roc.op[0] * 200} cy={200 - roc.op[1] * 200} r="4" fill="var(--signal)" />
                <text className="axis-t" x="100" y="222" textAnchor="middle">false positive rate</text>
                <text className="axis-t" x="-12" y="100" textAnchor="middle" transform="rotate(-90 -12 100)">true positive rate</text>
              </svg>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">D</span> Threshold
              </h3>
              <span className="mono">{settings.threshold.toFixed(3)}</span>
            </div>
            <div className="panel-body">
              <input type="range" min="0.45" max="0.8" step="0.005" value={settings.threshold} onChange={(e) => setSettings({ threshold: Number(e.target.value) })} />
              <p className="muted" style={{ fontSize: 12.5 }}>Applies to the live stream immediately. Lower catches more, pages more.</p>
              <div className="matrix mt-12">
                <div className="h" />
                <div className="h">flagged</div>
                <div className="h">passed</div>
                <div className="h">fault</div>
                <div className="big t-ok">{roc.tp}</div>
                <div className="big t-signal">{roc.fn}</div>
                <div className="h">normal</div>
                <div className="big t-amber">{roc.fp}</div>
                <div className="big">{roc.tn}</div>
              </div>
              <dl className="kv mt-12">
                <dt>precision</dt>
                <dd>{roc.tp + roc.fp ? ((roc.tp / (roc.tp + roc.fp)) * 100).toFixed(1) : '0.0'}%</dd>
                <dt>recall</dt>
                <dd>{((roc.tp / roc.P) * 100).toFixed(1)}%</dd>
                <dt>alerts / 1k logs</dt>
                <dd>{(((roc.tp + roc.fp) / (roc.P + roc.N)) * 1000).toFixed(0)}</dd>
              </dl>
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">E</span> Forest
              </h3>
              <span className="label">regrows on change</span>
            </div>
            <div className="panel-body" style={{ display: 'grid', gap: 18 }}>
              <label style={{ display: 'grid', gap: 2 }}>
                <span className="row between">
                  <span className="label">trees</span>
                  <span className="mono">{settings.trees}</span>
                </span>
                <input type="range" min="10" max="300" step="10" value={settings.trees} onChange={(e) => setSettings({ trees: Number(e.target.value) })} />
              </label>
              <label style={{ display: 'grid', gap: 2 }}>
                <span className="row between">
                  <span className="label">sample size ψ</span>
                  <span className="mono">{settings.sampleSize}</span>
                </span>
                <input type="range" min="32" max="1024" step="32" value={settings.sampleSize} onChange={(e) => setSettings({ sampleSize: Number(e.target.value) })} />
              </label>
              <dl className="kv">
                <dt>max depth</dt>
                <dd>{Math.ceil(Math.log2(settings.sampleSize))}</dd>
                <dt>trained on</dt>
                <dd>{model.trainedOn} vectors</dd>
                <dt>features</dt>
                <dd>log₁₀ latency · err % · log₂ KB</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
