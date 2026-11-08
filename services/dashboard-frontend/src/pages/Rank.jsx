import { useMemo, useState } from 'react';
import { PageHead, Scene } from '../components/ui';
import { SERVICES, fmtNum } from '../lib/engine';
import { useLive } from '../lib/store';

const SORTS = {
  reliability: (a, b) => b.reliability - a.reliability,
  latency: (a, b) => a.latency - b.latency,
  anomalies: (a, b) => a.anomalies - b.anomalies,
  volume: (a, b) => b.count - a.count,
};

export default function Rank() {
  const { svcStats, incidents } = useLive();
  const [sort, setSort] = useState('reliability');

  const rows = useMemo(() => {
    const list = SERVICES.map((s) => {
      const st = svcStats[s.id];
      const errRate = st.count ? st.errors / st.count : 0;
      const anRate = st.count ? st.anomalies / st.count : 0;
      const latPenalty = Math.max(0, st.latency / s.base - 1) * 0.4;
      const incs = incidents.filter((i) => i.service === s.id);
      const reliability = Math.max(90, 100 - errRate * 20 - anRate * 60 - latPenalty - incs.length * 0.15);
      return { id: s.id, stage: s.stage, ...st, errRate, anRate, reliability, incidents: incs.length, hot: incs.some((i) => i.status !== 'resolved') };
    });
    return list.sort(SORTS[sort]);
  }, [svcStats, incidents, sort]);

  const byRel = [...rows].sort(SORTS.reliability);

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="07"
          kicker="ranking"
          title={
            <>
              Who’s holding <em>steady</em>
            </>
          }
          actions={
            <div className="seg">
              {Object.keys(SORTS).map((k) => (
                <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k)}>
                  {k}
                </button>
              ))}
            </div>
          }
        >
          Reliability blends error rate, anomaly rate, latency drift against each service’s baseline and incident history.
        </PageHead>

        <div className="panel ticks" style={{ overflow: 'hidden' }}>
          <Scene
            kind="towers"
            rows={byRel}
            height={420}
            hud={
              <>
                <span>reliability towers · height ∝ score⁶</span>
                <span>
                  <span className="t-amber">■</span> leader &nbsp; <span className="t-signal">■</span> active incident
                </span>
              </>
            }
          />
        </div>

        <div className="grid g-3 mt-12">
          {byRel.slice(0, 3).map((r, i) => (
            <div key={r.id} className="panel" style={{ padding: 20 }}>
              <div className="row between">
                <span className="label">
                  <span className={i === 0 ? 't-amber' : ''}>#{i + 1}</span> {r.stage}
                </span>
                {r.hot && <span className="tag signal">incident</span>}
              </div>
              <div className="mono" style={{ fontSize: 22, marginTop: 18 }}>
                {r.id}
              </div>
              <div className="row between mt-12">
                <span className="mono" style={{ fontSize: 34, letterSpacing: '-0.04em', color: i === 0 ? 'var(--amber)' : undefined }}>
                  {r.reliability.toFixed(2)}
                </span>
                <span className="label">reliability</span>
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-12">
          <div className="scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>service</th>
                  <th className="num">reliability</th>
                  <th className="num">logs</th>
                  <th className="num">error rate</th>
                  <th className="num">anomaly rate</th>
                  <th className="num">latency</th>
                  <th className="num">incidents</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} className={r.hot ? 'is-anom' : ''}>
                    <td className="mono dim">{String(i + 1).padStart(2, '0')}</td>
                    <td className="mono">{r.id}</td>
                    <td className="num">
                      <span style={{ display: 'inline-block', width: 60, height: 4, background: 'var(--line)', marginRight: 10, verticalAlign: 'middle', position: 'relative' }}>
                        <i style={{ position: 'absolute', inset: 0, width: `${(r.reliability - 90) * 10}%`, background: r.hot ? 'var(--signal)' : 'var(--ok)' }} />
                      </span>
                      {r.reliability.toFixed(2)}
                    </td>
                    <td className="num">{fmtNum(r.count)}</td>
                    <td className="num">{(r.errRate * 100).toFixed(2)}%</td>
                    <td className="num" style={{ color: r.anRate > 0.03 ? 'var(--signal)' : undefined }}>
                      {(r.anRate * 100).toFixed(2)}%
                    </td>
                    <td className="num">{r.latency.toFixed(0)}ms</td>
                    <td className="num">{r.incidents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
