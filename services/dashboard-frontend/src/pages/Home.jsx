import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Bug, Command } from 'lucide-react';
import { Scene } from '../components/ui';
import { fmtNum, fmtTime } from '../lib/engine';
import { useLive } from '../lib/store';

const rise = (d = 0) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay: d, ease: [0.2, 0.7, 0.2, 1] } });

const STAGES = [
  ['01', 'Collect', 'Agents and SDKs ship structured JSON to the ingestion API over HTTP. Batches up to 500 records.', 'log-collector'],
  ['02', 'Ingest', 'FastAPI validates, stamps and publishes every record to the raw-logs Kafka topic.', 'log-ingestion-api'],
  ['03', 'Process', 'A consumer group normalises fields, extracts features and indexes into Elasticsearch.', 'log-processor'],
  ['04', 'Score', 'Isolation Forest isolates outliers by how few random splits it takes to separate them.', 'ml-engine'],
  ['05', 'Alert', 'Deduplicated, rate-limited alerts fan out to Slack and email; state lands in Postgres.', 'alert-service'],
];

const STACK = [
  ['Transport', 'Apache Kafka 3.6', '3 topics · 12 partitions'],
  ['API', 'FastAPI + Pydantic', 'ingest :8000 · ml :8001'],
  ['Model', 'scikit-learn IsolationForest', '100 trees · ψ 256'],
  ['Storage', 'Elasticsearch 8 · PostgreSQL 15 · Redis 7', 'logs · alerts · cache'],
  ['Observability', 'Prometheus + Grafana', '/metrics on every service'],
  ['Delivery', 'Docker · Kubernetes · Terraform · Jenkins', 'EKS on AWS'],
];

export default function Home() {
  const { logs, series, totals, svcStats, health, incidents, inject } = useLive();
  const last = series.slice(-10);
  const rate = last.reduce((a, b) => a + b.total, 0) / Math.max(1, last.length);
  const open = incidents.filter((i) => i.status !== 'resolved').length;
  const tickerLogs = logs.slice(0, 14);
  const precision = totals.tp + totals.fp ? (totals.tp / (totals.tp + totals.fp)) * 100 : 0;
  const recall = totals.tp + totals.fn ? (totals.tp / (totals.tp + totals.fn)) * 100 : 0;

  const stageLoad = [
    rate * 60,
    rate * 60,
    rate * 59.6,
    Object.values(svcStats).reduce((a, s) => a + s.score, 0) / 9,
    open,
  ];

  return (
    <>
      <section className="hero">
        <div className="hero-canvas">
          <Scene kind="topology" height="100%" style={{ background: 'transparent', position: 'absolute', inset: 0 }} offsetX={0.4} compact />
        </div>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <motion.div className="label" {...rise(0)}>
              <span className="dot live t-signal" /> anomaly detection for log streams
            </motion.div>
            <motion.h1 className="display" {...rise(0.05)}>
              Logs are noisy.
              <br />
              <em>Failures</em> aren’t.
            </motion.h1>
            <motion.p className="lede" {...rise(0.12)}>
              LogSentinel pulls every log line through Kafka, scores it with an Isolation Forest and opens an incident the moment a
              service starts behaving unlike itself. The graph behind this text is the pipeline — running, right now, in your browser.
            </motion.p>
            <motion.div className="hero-cta" {...rise(0.18)}>
              <Link to="/live" className="btn primary">
                Open live ops <ArrowRight size={14} />
              </Link>
              <button type="button" className="btn signal" onClick={() => inject(null, 4)}>
                <Bug size={14} /> Break something
              </button>
              <button type="button" className="btn ghost" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
                <Command size={13} /> <span className="kbd">K</span>
              </button>
            </motion.div>
            <motion.div className="hero-meta" {...rise(0.26)}>
              <div>
                <div className="label">scored</div>
                <div className="v">{fmtNum(totals.processed)}</div>
              </div>
              <div>
                <div className="label">health</div>
                <div className="v" style={{ color: health > 7 ? 'var(--ok)' : health > 4 ? 'var(--amber)' : 'var(--signal)' }}>
                  {health.toFixed(1)}
                  <span className="dim" style={{ fontSize: 13 }}>
                    /10
                  </span>
                </div>
              </div>
              <div>
                <div className="label">open incidents</div>
                <div className={`v ${open ? 't-signal' : ''}`}>{open}</div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="hero-legend">
          <div>
            normal record <span className="dot" style={{ color: 'var(--amber)', borderRadius: 0 }} />
          </div>
          <div>
            indexed <span className="dot" style={{ color: 'var(--steel)', borderRadius: 0 }} />
          </div>
          <div>
            anomaly → alert-service <span className="dot" style={{ color: 'var(--signal)', borderRadius: 0 }} />
          </div>
        </div>
        <div className="ticker">
          <div className="ticker-track">
            {[...tickerLogs, ...tickerLogs].map((l, i) => (
              <span key={`${l.id}-${i}`}>
                <span className="dim">{fmtTime(l.ts)}</span>
                <span className={`lvl lvl-${l.level}`}>{l.level}</span>
                <span className="muted">{l.service}</span>
                <span>{l.msg}</span>
                <span className={l.anomaly ? 't-signal' : 'dim'}>{l.score.toFixed(3)}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="label">
              <span className="t-signal">§1</span> pipeline
            </div>
            <div>
              <h2>
                Five services, one direction of travel. <em>Nothing</em> is polled.
              </h2>
              <p>Each stage below is a container in this repo. The meters are live counts from the stream feeding this page.</p>
            </div>
          </div>
          <div className="stages">
            {STAGES.map(([n, t, d, svc], i) => {
              const v = stageLoad[i];
              const pct = i === 3 ? v * 100 : i === 4 ? Math.min(100, v * 25) : Math.min(100, (v / 600) * 100);
              return (
                <div key={n} className={`stage ${i === 4 && open ? 'hot' : ''}`}>
                  <div className="n">
                    {n} — {svc}
                  </div>
                  <h4>{t}</h4>
                  <p>{d}</p>
                  <div className="meter">
                    <span className="dim">{i === 3 ? 'mean score' : i === 4 ? 'open' : 'rec/min'}</span>
                    <span>{i === 3 ? v.toFixed(3) : i === 4 ? v : fmtNum(v)}</span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid g-main" style={{ alignItems: 'center', gap: 56 }}>
          <div>
            <div className="label" style={{ marginBottom: 24 }}>
              <span className="t-signal">§2</span> detection
            </div>
            <h2 style={{ fontSize: 'clamp(30px,3.6vw,48px)', lineHeight: 1.02, letterSpacing: '-0.035em' }}>
              Outliers are <em className="serif t-amber">easy to isolate.</em> That’s the whole trick.
            </h2>
            <p className="muted" style={{ maxWidth: 520, marginTop: 18 }}>
              Pick a random feature, split at a random value, repeat. Normal logs sit in a dense cluster and need many cuts; a 4-second
              Stripe timeout gets cut off in two or three. Average that path length over 100 trees and you have a score.
            </p>
            <div className="matrix mt-24" style={{ maxWidth: 460 }}>
              <div className="h">session</div>
              <div className="h">precision</div>
              <div className="h">recall</div>
              <div className="h">value</div>
              <div className="big">{precision.toFixed(1)}%</div>
              <div className="big">{recall.toFixed(1)}%</div>
            </div>
            <p className="label mt-12">
              measured against injected faults · {totals.tp} caught · {totals.fn} missed · {totals.fp} false alarms
            </p>
            <Link to="/lab" className="btn mt-24">
              Try the detector <ArrowRight size={14} />
            </Link>
          </div>
          <div className="panel ticks" style={{ overflow: 'hidden' }}>
            <Scene
              kind="cloud"
              height={480}
              hud={
                <>
                  <span>feature space · last 600 logs</span>
                  <span>drag to orbit</span>
                </>
              }
              hudB={
                <>
                  <span>
                    <span className="t-signal">■</span> score ≥ threshold
                  </span>
                  <span>
                    <span className="t-steel">■</span> normal
                  </span>
                </>
              }
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="section-head">
            <div className="label">
              <span className="t-signal">§3</span> stack
            </div>
            <div>
              <h2>
                Boring, well-understood infrastructure. <em>On purpose.</em>
              </h2>
            </div>
          </div>
          <table className="spec">
            <tbody>
              {STACK.map(([k, v, n]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                  <td>{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="row wrap-f mt-24" style={{ gap: 10 }}>
            <Link to="/workflow" className="btn">
              How it fits together
            </Link>
            <Link to="/api-docs" className="btn ghost">
              API reference
            </Link>
            <a href="https://github.com/Arnazz10/logsentinel" target="_blank" rel="noreferrer" className="btn ghost">
              Source on GitHub ↗
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
