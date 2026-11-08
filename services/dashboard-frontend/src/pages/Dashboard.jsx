import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, Cpu, Download, Pause, Play, Search, Trash2, X } from 'lucide-react';
import { PageHead, Readout, Scene, scoreColor } from '../components/ui';
import { SERVICES, SERVICE_IDS, fmtNum, fmtTime, toFeatures } from '../lib/engine';
import { useLive } from '../lib/store';

const LEVEL_OPTS = ['all', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];

const download = (name, body, type) => {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

function LogDetail({ log, onClose }) {
  const { model, settings } = useLive();
  const paths = useMemo(() => model.paths(toFeatures(log)), [model, log]);
  const mean = paths.reduce((a, b) => a + b, 0) / paths.length;
  const svc = SERVICES.find((s) => s.id === log.service);
  const reasons = [
    ['latency', `${log.latency.toFixed(0)} ms`, svc ? log.latency / svc.base : 1, `typical ${svc?.base ?? '—'} ms`],
    ['error rate', `${log.errorRate.toFixed(2)} %`, log.errorRate / 0.8, 'typical < 1 %'],
    ['payload', `${log.payload.toFixed(1)} KB`, log.payload / 4, 'typical ~4 KB'],
  ];
  const buckets = Array(12).fill(0);
  paths.forEach((p) => (buckets[Math.min(11, Math.floor(p))] += 1));
  const bmax = Math.max(...buckets);

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div className="modal" initial={{ y: 10 }} animate={{ y: 0 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            <span className="idx">trace {log.traceId}</span> {log.service}
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="panel-body">
          <p className="mono" style={{ margin: '0 0 16px', fontSize: 13 }}>
            <span className={`lvl lvl-${log.level}`}>{log.level}</span> {log.msg}
          </p>
          <div className="grid g-2" style={{ gap: 24 }}>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                why it scored {log.score.toFixed(3)}
              </div>
              <div className="bars-h">
                {reasons.map(([k, v, ratio, hint]) => (
                  <div key={k} className="row" style={{ gridTemplateColumns: '80px 1fr 80px' }}>
                    <span className="n">{k}</span>
                    <span className="track" title={hint}>
                      <i className={ratio > 3 ? 'hot' : ''} style={{ width: `${Math.min(100, ratio * 20)}%` }} />
                    </span>
                    <span className="v">{v}</span>
                  </div>
                ))}
              </div>
              <dl className="kv mt-24">
                <dt>score</dt>
                <dd style={{ color: scoreColor(log.score, settings.threshold) }}>{log.score.toFixed(4)}</dd>
                <dt>threshold</dt>
                <dd>{settings.threshold.toFixed(2)}</dd>
                <dt>verdict</dt>
                <dd className={log.anomaly ? 't-signal' : 't-ok'}>{log.anomaly ? 'ANOMALY' : 'normal'}</dd>
                <dt>ground truth</dt>
                <dd>{log.injected ? 'injected fault' : 'organic traffic'}</dd>
                <dt>time</dt>
                <dd>{new Date(log.ts).toISOString()}</dd>
              </dl>
            </div>
            <div>
              <div className="label" style={{ marginBottom: 10 }}>
                path length across {paths.length} trees · mean {mean.toFixed(2)}
              </div>
              <svg viewBox="0 0 240 120" className="chart" style={{ height: 160 }}>
                {buckets.map((b, i) => (
                  <rect key={i} x={i * 20 + 2} width={16} y={110 - (b / bmax) * 100} height={(b / bmax) * 100} fill={i < 5 ? 'var(--signal)' : 'var(--steel)'} opacity={0.85} />
                ))}
                <line x1="0" x2="240" y1="110.5" y2="110.5" className="grid-l" />
              </svg>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
                Short paths (left, red) mean the record was separated from the herd in only a few random cuts.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Inference({ onClose }) {
  const { logs, model, settings } = useLive();
  const res = useMemo(() => {
    const t0 = performance.now();
    const scored = logs.slice(0, 500).map((l) => ({ ...l, s: model.score(toFeatures(l)) }));
    const ms = performance.now() - t0;
    const c = { tp: 0, fp: 0, fn: 0, tn: 0 };
    scored.forEach((l) => {
      const p = l.s >= settings.threshold;
      if (p && l.injected) c.tp++;
      else if (p) c.fp++;
      else if (l.injected) c.fn++;
      else c.tn++;
    });
    const hist = Array(20).fill(0);
    scored.forEach((l) => (hist[Math.min(19, Math.floor(((l.s - 0.3) / 0.5) * 20))] += 1));
    return { ms, n: scored.length, c, hist };
  }, [logs, model, settings.threshold]);
  const { c } = res;
  const prec = c.tp + c.fp ? c.tp / (c.tp + c.fp) : 0;
  const rec = c.tp + c.fn ? c.tp / (c.tp + c.fn) : 0;
  const f1 = prec + rec ? (2 * prec * rec) / (prec + rec) : 0;
  const hmax = Math.max(1, ...res.hist);
  const thX = ((settings.threshold - 0.3) / 0.5) * 400;

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div className="modal" initial={{ y: 10 }} animate={{ y: 0 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>
            <Cpu size={14} /> Batch inference · {res.n} records in {res.ms.toFixed(1)} ms
          </h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        </div>
        <div className="strip" style={{ '--n': 4, margin: 16 }}>
          <Readout label="precision" value={(prec * 100).toFixed(1)} unit="%" />
          <Readout label="recall" value={(rec * 100).toFixed(1)} unit="%" />
          <Readout label="f1" value={f1.toFixed(3)} />
          <Readout label="flagged" value={c.tp + c.fp} unit={`/ ${res.n}`} />
        </div>
        <div className="panel-body" style={{ paddingTop: 0 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            score distribution · threshold {settings.threshold.toFixed(2)}
          </div>
          <svg viewBox="0 0 400 120" className="chart" style={{ height: 150 }}>
            {res.hist.map((h, i) => (
              <rect key={i} x={i * 20 + 1} width={18} y={110 - (h / hmax) * 100} height={(h / hmax) * 100} fill={i * 20 >= thX ? 'var(--signal)' : 'var(--steel)'} opacity={0.85} />
            ))}
            <line x1={thX} x2={thX} y1="0" y2="112" stroke="var(--amber)" strokeDasharray="3 3" />
            <text className="axis-t" x="0" y="120">0.30</text>
            <text className="axis-t" x="400" y="120" textAnchor="end">0.80</text>
          </svg>
          <div className="matrix mt-24">
            <div className="h" />
            <div className="h">predicted anomaly</div>
            <div className="h">predicted normal</div>
            <div className="h">injected fault</div>
            <div className="big t-ok">{c.tp}</div>
            <div className="big t-signal">{c.fn}</div>
            <div className="h">organic</div>
            <div className="big t-amber">{c.fp}</div>
            <div className="big">{c.tn}</div>
          </div>
          <p className="label mt-12">model: iforest · {model.nTrees} trees · ψ {model.sampleSize} · trained on {model.trainedOn} vectors</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function Dashboard() {
  const live = useLive();
  const { logs, series, svcStats, settings, setSettings, incidents, inject, clearLogs } = live;
  const [q, setQ] = useState('');
  const [svc, setSvc] = useState('all');
  const [level, setLevel] = useState('all');
  const [onlyAnom, setOnlyAnom] = useState(false);
  const [detail, setDetail] = useState(null);
  const [infer, setInfer] = useState(false);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return logs.filter(
      (l) =>
        (svc === 'all' || l.service === svc) &&
        (level === 'all' || l.level === level) &&
        (!onlyAnom || l.anomaly) &&
        (!n || `${l.service} ${l.level} ${l.msg} ${l.traceId}`.toLowerCase().includes(n)),
    );
  }, [logs, q, svc, level, onlyAnom]);

  const perSec = settings.tickMs / 1000;
  const tput = series.map((p) => p.total / perSec);
  const anomRate = series.map((p) => (p.total ? (p.anomalies / p.total) * 100 : 0));
  const scoreS = series.map((p) => p.score);
  const recent = logs.slice(0, 200);
  const lat = recent.map((l) => l.latency).sort((a, b) => a - b);
  const p95 = lat.length ? lat[Math.floor(lat.length * 0.95)] : 0;
  const open = incidents.filter((i) => i.status !== 'resolved');
  const anomalies = logs.filter((l) => l.anomaly).slice(0, 14);

  const exportNd = () => download('logsentinel-logs.ndjson', filtered.map((l) => JSON.stringify(l)).join('\n'), 'application/x-ndjson');
  const exportCsv = () =>
    download(
      'logsentinel-logs.csv',
      ['ts,service,level,score,anomaly,latency_ms,error_rate,payload_kb,message', ...filtered.map((l) => [new Date(l.ts).toISOString(), l.service, l.level, l.score.toFixed(4), l.anomaly, l.latency.toFixed(1), l.errorRate.toFixed(2), l.payload.toFixed(1), JSON.stringify(l.msg)].join(','))].join('\n'),
      'text/csv',
    );

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="02"
          kicker="live operations"
          title={
            <>
              Operations <em>floor</em>
            </>
          }
          actions={
            <>
              <button className={`btn ${settings.paused ? 'on' : ''}`} onClick={() => setSettings({ paused: !settings.paused })}>
                {settings.paused ? <Play size={13} /> : <Pause size={13} />} {settings.paused ? 'resume' : 'pause'}
              </button>
              <button className="btn" onClick={() => setInfer(true)}>
                <Cpu size={13} /> batch inference
              </button>
              <button className="btn signal" onClick={() => inject(svc === 'all' ? null : svc, 4)}>
                <Bug size={13} /> inject fault
              </button>
            </>
          }
        >
          Every row is scored on arrival. Click one to see why the forest thinks it’s odd.
        </PageHead>

        <div className="strip" style={{ '--n': 5 }}>
          <Readout label="throughput" value={(tput.at(-1) || 0).toFixed(1)} unit="rec/s" data={tput.slice(-40)} sub="60s window" subR={`${fmtNum(live.totals.processed)} total`} />
          <Readout label="anomaly rate" value={(anomRate.slice(-10).reduce((a, b) => a + b, 0) / Math.max(1, Math.min(10, anomRate.length))).toFixed(1)} unit="%" data={anomRate.slice(-40)} color="var(--signal)" sub="10s avg" subR={`${live.totals.anomalies} flagged`} />
          <Readout label="max score / tick" value={(scoreS.at(-1) || 0).toFixed(3)} data={scoreS.slice(-40)} color="var(--amber)" sub={`threshold ${settings.threshold.toFixed(2)}`} />
          <Readout label="latency p95" value={p95.toFixed(0)} unit="ms" sub="last 200 logs" subR={`p50 ${(lat[Math.floor(lat.length / 2)] || 0).toFixed(0)}ms`} />
          <Readout label="open incidents" value={open.length} color={open.length ? 'var(--signal)' : 'var(--ok)'} sub={open.length ? open.map((i) => i.service).slice(0, 2).join(', ') : 'all quiet'} subR={<Link to="/incidents" className="t-amber">view →</Link>} />
        </div>

        <div className="grid g-main mt-12">
          <div className="panel ticks" style={{ overflow: 'hidden' }}>
            <div className="panel-head">
              <h3>
                <span className="idx">A</span> Log terrain
              </h3>
              <span className="label">volume × service × time · red = anomalous</span>
            </div>
            <Scene kind="terrain" height={380} />
          </div>
          <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="panel-head">
              <h3>
                <span className="idx">B</span> Flagged
              </h3>
              <span className="tag signal">
                <span className="dot live" /> {anomalies.length}
              </span>
            </div>
            <div className="scroll" style={{ flex: 1, maxHeight: 380 }}>
              {anomalies.length === 0 && <div className="empty">nothing above threshold yet</div>}
              {anomalies.map((l) => (
                <button key={l.id} className="inc-item" style={{ gridTemplateColumns: '1fr auto' }} onClick={() => setDetail(l)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="ttl mono" style={{ fontSize: 12.5 }}>
                      {l.msg}
                    </div>
                    <div className="meta">
                      {fmtTime(l.ts)} · {l.service} · {l.level}
                    </div>
                  </div>
                  <span className="mono t-signal" style={{ fontSize: 13 }}>
                    {l.score.toFixed(3)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="panel mt-12">
          <div className="panel-head" style={{ flexWrap: 'wrap' }}>
            <h3>
              <span className="idx">C</span> Stream
              <span className="dim mono" style={{ fontSize: 11 }}>
                {filtered.length} / {logs.length}
              </span>
            </h3>
            <div className="row wrap-f">
              <div className="search" style={{ width: 220 }}>
                <Search size={13} />
                <input className="field" placeholder="grep message, trace…" value={q} onChange={(e) => setQ(e.target.value)} />
              </div>
              <select className="field" value={svc} onChange={(e) => setSvc(e.target.value)}>
                <option value="all">all services</option>
                {SERVICE_IDS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="seg">
                {LEVEL_OPTS.map((l) => (
                  <button key={l} className={level === l ? 'on' : ''} onClick={() => setLevel(l)}>
                    {l === 'CRITICAL' ? 'CRIT' : l}
                  </button>
                ))}
              </div>
              <button className={`btn sm ${onlyAnom ? 'on' : ''}`} onClick={() => setOnlyAnom((v) => !v)}>
                anomalies only
              </button>
              <button className="btn sm" onClick={exportNd} title="Export NDJSON">
                <Download size={12} /> ndjson
              </button>
              <button className="btn sm" onClick={exportCsv} title="Export CSV">
                csv
              </button>
              <button className="btn sm ghost" onClick={clearLogs} title="Clear">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="stream scroll" style={{ maxHeight: 440, padding: '8px 0' }}>
            {filtered.slice(0, 200).map((l, i) => (
              <div key={l.id} className={`stream-row ${l.anomaly ? 'anom' : ''} ${i < 4 ? 'fresh' : ''}`} onClick={() => setDetail(l)} style={{ cursor: 'pointer' }}>
                <span className="t">{fmtTime(l.ts)}</span>
                <span className={`lvl lvl-${l.level}`}>{l.level}</span>
                <span className="s">{l.service}</span>
                <span className="m">{l.msg}</span>
                <span className="sc">{l.score.toFixed(3)}</span>
              </div>
            ))}
            {!filtered.length && <div className="empty">no lines match</div>}
          </div>
        </div>

        <div className="panel mt-12">
          <div className="panel-head">
            <h3>
              <span className="idx">D</span> Service matrix
            </h3>
            <span className="label">ewma latency · cumulative counts</span>
          </div>
          <div className="scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>service</th>
                  <th className="hide-sm">stage</th>
                  <th className="num">logs</th>
                  <th className="num">errors</th>
                  <th className="num">anomalies</th>
                  <th className="num">latency</th>
                  <th className="num">score</th>
                  <th className="hide-sm">trend</th>
                </tr>
              </thead>
              <tbody>
                {SERVICES.map((s) => {
                  const st = svcStats[s.id];
                  const hot = open.some((i) => i.service === s.id);
                  return (
                    <tr key={s.id} className={hot ? 'is-anom' : ''}>
                      <td className="mono">
                        {hot && <span className="dot live t-signal" style={{ marginRight: 8 }} />}
                        {s.id}
                      </td>
                      <td className="hide-sm">
                        <span className="tag">{s.stage}</span>
                      </td>
                      <td className="num">{fmtNum(st.count)}</td>
                      <td className="num">{st.errors}</td>
                      <td className="num" style={{ color: st.anomalies ? 'var(--signal)' : undefined }}>
                        {st.anomalies}
                      </td>
                      <td className="num">{st.latency.toFixed(0)}ms</td>
                      <td className="num" style={{ color: scoreColor(st.score, settings.threshold) }}>
                        {st.score.toFixed(3)}
                      </td>
                      <td className="hide-sm" style={{ width: 140 }}>
                        <svg viewBox="0 0 120 24" style={{ width: 120, height: 24, display: 'block' }}>
                          {st.history.map((v, i) => (
                            <rect key={i} x={i * 3} width={2} y={24 - Math.max(1, (v - 0.3) * 48)} height={Math.max(1, (v - 0.3) * 48)} fill={v >= settings.threshold ? 'var(--signal)' : 'var(--line-3)'} />
                          ))}
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {detail && <LogDetail key="d" log={detail} onClose={() => setDetail(null)} />}
        {infer && <Inference key="i" onClose={() => setInfer(false)} />}
      </AnimatePresence>
    </section>
  );
}
