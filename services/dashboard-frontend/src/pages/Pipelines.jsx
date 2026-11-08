import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PageHead, Readout, Scene, Spark } from '../components/ui';
import { SERVICES, fmtNum } from '../lib/engine';
import { useLive } from '../lib/store';

const STAGE_ORDER = ['collect', 'ingest', 'kafka', 'process', 'score', 'index'];

export default function Pipelines() {
  const { svcStats, series, incidents, settings } = useLive();
  const [open, setOpen] = useState(null);
  const perSec = settings.tickMs / 1000;
  const tput = series.slice(-10).reduce((a, b) => a + b.total, 0) / Math.max(1, Math.min(10, series.length)) / perSec;
  const lagTotal = Math.round(80 + Math.max(0, 6 - tput) * 140 + incidents.filter((i) => i.status !== 'resolved').length * 220);

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="03"
          kicker="pipelines"
          title={
            <>
              Per-service <em>pipelines</em>
            </>
          }
        >
          Each service writes to <span className="mono">raw-logs</span>; a consumer group fans records through processing, scoring and indexing.
          The rings below are Kafka partitions — height is consumer lag.
        </PageHead>

        <div className="grid g-main">
          <div className="panel ticks" style={{ overflow: 'hidden' }}>
            <Scene
              kind="ring"
              height={420}
              hud={
                <>
                  <span>kafka · 3 topics · 24 partitions</span>
                  <span>broker-0:9092</span>
                </>
              }
            />
          </div>
          <div className="grid" style={{ alignContent: 'start' }}>
            <div className="strip" style={{ '--n': 2 }}>
              <Readout label="ingest" value={tput.toFixed(1)} unit="rec/s" data={series.slice(-40).map((p) => p.total)} />
              <Readout label="consumer lag" value={fmtNum(lagTotal)} unit="msgs" color={lagTotal > 600 ? 'var(--signal)' : undefined} />
            </div>
            <div className="panel">
              <div className="panel-head">
                <h3>Consumer groups</h3>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>group</th>
                    <th>topic</th>
                    <th className="num">members</th>
                    <th className="num">lag</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['log-processor', 'raw-logs', 3, Math.round(lagTotal * 0.7)],
                    ['ml-engine', 'processed-logs', 2, Math.round(lagTotal * 0.25)],
                    ['alert-service', 'anomaly-alerts', 1, Math.round(lagTotal * 0.05)],
                  ].map(([g, t, m, l]) => (
                    <tr key={g}>
                      <td className="mono">{g}</td>
                      <td className="mono muted">{t}</td>
                      <td className="num">{m}</td>
                      <td className="num" style={{ color: l > 400 ? 'var(--signal)' : undefined }}>
                        {l}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="panel mt-12">
          <div className="panel-head">
            <h3>Service pipelines</h3>
            <span className="label">click a row for stage breakdown</span>
          </div>
          {SERVICES.map((s) => {
            const st = svcStats[s.id];
            const hot = incidents.some((i) => i.service === s.id && i.status !== 'resolved');
            const isOpen = open === s.id;
            const uptime = 100 - (st.count ? (st.errors / st.count) * 2 : 0);
            return (
              <div key={s.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                                    className="pl-row"
                >
                  <ChevronRight size={14} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .15s', color: 'var(--dim)' }} />
                  <span className="mono" style={{ fontSize: 13 }}>
                    {hot && <span className="dot live t-signal" style={{ marginRight: 8 }} />}
                    {s.id}
                  </span>
                  <span className={`tag ${hot ? 'signal' : 'ok'}`}>{hot ? 'degraded' : 'healthy'}</span>
                  <span className="hide-sm" style={{ height: 24 }}>
                    <Spark data={st.history.length > 1 ? st.history : [0, 0]} color={hot ? 'var(--signal)' : 'var(--steel)'} h={24} fill={false} />
                  </span>
                  <span className="mono num hide-sm" style={{ fontSize: 12 }}>
                    {fmtNum(st.count)} logs
                  </span>
                  <span className="mono" style={{ fontSize: 12, textAlign: 'right' }}>
                    {uptime.toFixed(2)}%
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: '4px 16px 20px 54px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGE_ORDER.length}, minmax(0,1fr))`, gap: 0, border: '1px solid var(--line)' }}>
                      {STAGE_ORDER.map((stg, i) => {
                        const ms = [2, 4, 1, 6, 1.5 + (st.score - 0.4) * 10, 9][i] * (s.base / 60);
                        const bad = hot && (stg === 'score' || stg === 'process');
                        return (
                          <div key={stg} style={{ padding: '12px 12px', borderLeft: i ? '1px solid var(--line)' : 0 }}>
                            <div className="label" style={{ fontSize: 10 }}>
                              {String(i + 1).padStart(2, '0')} {stg}
                            </div>
                            <div className="mono" style={{ fontSize: 18, marginTop: 6, color: bad ? 'var(--signal)' : undefined }}>
                              {ms.toFixed(1)}
                              <span className="dim" style={{ fontSize: 11 }}>
                                ms
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <dl className="kv mt-12" style={{ gridTemplateColumns: 'auto 1fr auto 1fr auto 1fr' }}>
                      <dt>errors</dt>
                      <dd>{st.errors}</dd>
                      <dt>anomalies</dt>
                      <dd className={st.anomalies ? 't-signal' : ''}>{st.anomalies}</dd>
                      <dt>ewma latency</dt>
                      <dd>{st.latency.toFixed(0)} ms</dd>
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
