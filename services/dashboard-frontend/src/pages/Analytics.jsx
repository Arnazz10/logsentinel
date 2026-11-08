import { useMemo, useState } from 'react';
import { AreaChart, PageHead, Readout, Scene } from '../components/ui';
import { LEVELS, SERVICES, fmtNum } from '../lib/engine';
import { useLive } from '../lib/store';

const levelColor = { DEBUG: 'var(--dim)', INFO: 'var(--steel)', WARN: 'var(--amber)', ERROR: 'var(--signal)', CRITICAL: '#ff2a1a' };

export default function Analytics() {
  const { logs, series, svcStats, totals, settings } = useLive();
  const [win, setWin] = useState(60);

  const s = series.slice(-win);
  const perSec = settings.tickMs / 1000;
  const chartSeries = s.map((p) => ({ total: p.total / perSec, anomalies: p.anomalies / perSec }));

  const levels = useMemo(() => {
    const c = Object.fromEntries(LEVELS.map((l) => [l, 0]));
    logs.forEach((l) => (c[l.level] = (c[l.level] || 0) + 1));
    return c;
  }, [logs]);
  const lvTotal = Object.values(levels).reduce((a, b) => a + b, 0) || 1;

  // service × 10s bucket heatmap of anomaly score.
  const heat = useMemo(() => {
    const now = Date.now();
    const COLS = 18;
    const grid = SERVICES.map(() => Array(COLS).fill(0));
    logs.forEach((l) => {
      const b = COLS - 1 - Math.floor((now - l.ts) / 10000);
      if (b < 0) return;
      const r = SERVICES.findIndex((x) => x.id === l.service);
      if (r >= 0) grid[r][b] = Math.max(grid[r][b], l.score);
    });
    return grid;
  }, [logs]);

  const lat = useMemo(() => {
    const bins = Array(24).fill(0);
    logs.forEach((l) => (bins[Math.min(23, Math.max(0, Math.floor(Math.log10(Math.max(1, l.latency)) * 6)))] += 1));
    return bins;
  }, [logs]);
  const latMax = Math.max(1, ...lat);

  const ranked = SERVICES.map((x) => ({ id: x.id, ...svcStats[x.id], rate: svcStats[x.id].count ? (svcStats[x.id].anomalies / svcStats[x.id].count) * 100 : 0 })).sort((a, b) => b.rate - a.rate);
  const maxRate = Math.max(1, ...ranked.map((r) => r.rate));

  // Donut
  const R = 54;
  const offsets = LEVELS.map((_, i) => LEVELS.slice(0, i).reduce((a, l) => a + levels[l] / lvTotal, 0));
  const circ = 2 * Math.PI * R;

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="05"
          kicker="analytics"
          title={
            <>
              What the stream <em>looks like</em>
            </>
          }
          actions={
            <div className="seg">
              {[30, 60, 120].map((w) => (
                <button key={w} className={win === w ? 'on' : ''} onClick={() => setWin(w)}>
                  {w}s
                </button>
              ))}
            </div>
          }
        />

        <div className="strip" style={{ '--n': 4 }}>
          <Readout label="logs scored" value={fmtNum(totals.processed)} />
          <Readout label="anomalies" value={totals.anomalies} color="var(--signal)" sub={`${totals.processed ? ((totals.anomalies / totals.processed) * 100).toFixed(2) : 0}% of traffic`} />
          <Readout label="false alarms" value={totals.fp} color="var(--amber)" sub="flagged organic logs" />
          <Readout label="missed faults" value={totals.fn} sub="injected, scored below threshold" />
        </div>

        <div className="grid g-main mt-12">
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">A</span> Throughput vs anomalies
              </h3>
              <span className="label">
                <span className="t-steel">■</span> rec/s &nbsp; <span className="t-signal">■</span> anomalies/s
              </span>
            </div>
            <div className="panel-body">
              <AreaChart series={chartSeries} keys={['total', 'anomalies']} colors={['var(--steel)', 'var(--signal)']} height={260} labels={[`-${win}s`, `-${Math.round(win / 2)}s`, 'now']} />
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">B</span> Level mix
              </h3>
              <span className="label">last {logs.length} logs</span>
            </div>
            <div className="panel-body row" style={{ gap: 24, alignItems: 'center' }}>
              <svg viewBox="0 0 140 140" style={{ width: 160, flexShrink: 0 }}>
                <circle cx="70" cy="70" r={R} fill="none" stroke="var(--line)" strokeWidth="14" />
                {LEVELS.map((l, i) => (
                  <circle key={l} cx="70" cy="70" r={R} fill="none" stroke={levelColor[l]} strokeWidth="14" strokeDasharray={`${(levels[l] / lvTotal) * circ} ${circ}`} strokeDashoffset={-offsets[i] * circ} transform="rotate(-90 70 70)" />
                ))}
                <text x="70" y="68" textAnchor="middle" className="axis-t" style={{ fontSize: 18, fill: 'var(--text)' }}>
                  {(((levels.ERROR + levels.CRITICAL) / lvTotal) * 100).toFixed(1)}%
                </text>
                <text x="70" y="84" textAnchor="middle" className="axis-t" style={{ fontSize: 8 }}>
                  err+crit
                </text>
              </svg>
              <div style={{ display: 'grid', gap: 8, flex: 1 }}>
                {LEVELS.map((l) => (
                  <div key={l} className="row between mono" style={{ fontSize: 12 }}>
                    <span className="row" style={{ gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: levelColor[l] }} />
                      {l}
                    </span>
                    <span className="muted">{levels[l]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid g-2 mt-12">
          <div className="panel ticks" style={{ overflow: 'hidden' }}>
            <div className="panel-head">
              <h3>
                <span className="idx">C</span> Feature space
              </h3>
              <span className="label">latency × error rate × payload</span>
            </div>
            <Scene kind="cloud" height={400} />
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">D</span> Anomaly heatmap
              </h3>
              <span className="label">max score · 10s buckets · 3 min</span>
            </div>
            <div className="panel-body">
              {heat.map((row, r) => (
                <div key={SERVICES[r].id} style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, alignItems: 'center', marginBottom: 3 }}>
                  <span className="mono dim" style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {SERVICES[r].id}
                  </span>
                  <div className="heat" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
                    {row.map((v, c) => (
                      <div
                        key={c}
                        className="cell"
                        title={v ? v.toFixed(3) : 'no data'}
                        style={{
                          background: !v ? 'var(--bg-2)' : v >= settings.threshold ? 'var(--signal)' : `rgba(242,179,61,${Math.max(0.06, (v - 0.35) * 2.4)})`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
              <div className="row between label mt-12" style={{ paddingLeft: 110 }}>
                <span>-3m</span>
                <span>now</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid g-2 mt-12">
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">E</span> Anomaly rate by service
              </h3>
            </div>
            <div className="panel-body bars-h">
              {ranked.map((r) => (
                <div key={r.id} className="row">
                  <span className="n">{r.id}</span>
                  <span className="track">
                    <i className={r.rate > 5 ? 'hot' : ''} style={{ width: `${(r.rate / maxRate) * 100}%` }} />
                  </span>
                  <span className="v">{r.rate.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-head">
              <h3>
                <span className="idx">F</span> Latency distribution
              </h3>
              <span className="label">log scale</span>
            </div>
            <div className="panel-body">
              <svg viewBox="0 0 480 160" className="chart" style={{ height: 200 }}>
                {lat.map((b, i) => (
                  <rect key={i} x={i * 20 + 1} width={18} y={140 - (b / latMax) * 130} height={(b / latMax) * 130} fill={i >= 16 ? 'var(--signal)' : 'var(--steel)'} opacity="0.85" />
                ))}
                <line x1="0" x2="480" y1="140.5" y2="140.5" className="grid-l" />
                {[1, 10, 100, 1000].map((v) => (
                  <text key={v} className="axis-t" x={Math.log10(v) * 6 * 20} y="156">
                    {v}ms
                  </text>
                ))}
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
