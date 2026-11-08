import { useState } from 'react';
import { Bell, Cpu, Database, Download, Monitor, Radio, RotateCcw, Upload } from 'lucide-react';
import { PageHead, Switch } from '../components/ui';
import { useLive } from '../lib/store';

const TABS = [
  ['detection', 'Detection', Cpu],
  ['stream', 'Stream', Radio],
  ['source', 'Data source', Database],
  ['alerts', 'Notifications', Bell],
  ['display', 'Display', Monitor],
  ['data', 'Data', Download],
];

const Row = ({ title, children, desc }) => (
  <div className="set-row">
    <div>
      <h4>{title}</h4>
      {desc && <p>{desc}</p>}
    </div>
    <div className="ctl">{children}</div>
  </div>
);

const Range = ({ value, min, max, step, onChange, fmt = (v) => v }) => (
  <>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ maxWidth: 240 }} />
    <span className="rv">{fmt(value)}</span>
  </>
);

export default function Settings() {
  const live = useLive();
  const { settings: s, setSettings: set } = live;
  const [tab, setTab] = useState('detection');
  const [url, setUrl] = useState(s.apiUrl);
  const [test, setTest] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const testConn = async () => {
    if (!url) return setTest({ err: 'enter a URL' });
    setTest({ loading: true });
    try {
      const t0 = performance.now();
      const r = await fetch(url.replace(/\/$/, '') + '/health', { signal: AbortSignal.timeout(3000) });
      const j = await r.json().catch(() => ({}));
      setTest({ ok: r.ok, ms: performance.now() - t0, status: j.status || r.status });
    } catch (e) {
      setTest({ err: e.message });
    }
  };

  const exportAll = () => {
    const body = JSON.stringify({ exportedAt: new Date().toISOString(), settings: s, incidents: live.incidents, totals: live.totals }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([body], { type: 'application/json' }));
    a.download = 'logsentinel-workspace.json';
    a.click();
  };

  const importAll = (file) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const j = JSON.parse(r.result);
        if (j.settings) set(j.settings);
      } catch {
        /* ignore bad file */
      }
    };
    r.readAsText(file);
  };

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="10"
          kicker="settings"
          title={
            <>
              Tune the <em>sentinel</em>
            </>
          }
        >
          Everything here is persisted to this browser and applied live.
        </PageHead>
        <div className="set-layout">
          <nav className="set-nav">
            {TABS.map(([k, label, Icon]) => (
              <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>
          <div className="panel ticks">
            {tab === 'detection' && (
              <>
                <Row title="Anomaly threshold" desc="Isolation Forest scores at or above this value are flagged. 0.5 ≈ average, 0.7+ ≈ almost certainly an outlier.">
                  <Range value={s.threshold} min={0.45} max={0.8} step={0.005} onChange={(v) => set({ threshold: v })} fmt={(v) => v.toFixed(3)} />
                </Row>
                <Row title="Trees" desc="More trees = more stable scores, slower scoring. The forest regrows immediately.">
                  <Range value={s.trees} min={10} max={300} step={10} onChange={(v) => set({ trees: v })} />
                </Row>
                <Row title="Sub-sample size ψ" desc="Records drawn per tree. 256 is the value from the original paper.">
                  <Range value={s.sampleSize} min={32} max={1024} step={32} onChange={(v) => set({ sampleSize: v })} />
                </Row>
                <Row title="Correlation window" desc="Anomalies on the same service inside this window are grouped into one incident.">
                  <Range value={s.incidentWindow} min={5} max={120} step={5} onChange={(v) => set({ incidentWindow: v })} fmt={(v) => `${v}s`} />
                </Row>
                <Row title="Auto-resolve after" desc="An incident with no new signals for this long is closed automatically.">
                  <Range value={s.autoResolve} min={30} max={900} step={30} onChange={(v) => set({ autoResolve: v })} fmt={(v) => `${v}s`} />
                </Row>
              </>
            )}
            {tab === 'stream' && (
              <>
                <Row title="Stream running" desc="Pause ingestion without losing buffered logs.">
                  <Switch on={!s.paused} onChange={(v) => set({ paused: !v })} label="Stream running" />
                </Row>
                <Row title="Tick interval" desc="How often a batch is pulled (simulator or backend).">
                  <Range value={s.tickMs} min={250} max={5000} step={250} onChange={(v) => set({ tickMs: v })} fmt={(v) => `${v}ms`} />
                </Row>
                <Row title="Clear buffer" desc={`${live.logs.length} logs currently held in memory (max 600).`}>
                  <button className="btn sm" onClick={live.clearLogs}>
                    clear logs
                  </button>
                </Row>
              </>
            )}
            {tab === 'source' && (
              <>
                <Row title="Backend URL" desc="Point at a running dashboard-backend (e.g. http://localhost:8080). Leave empty to use the in-browser simulator.">
                  <input className="field" style={{ width: 260 }} placeholder="http://localhost:8080" value={url} onChange={(e) => setUrl(e.target.value)} />
                </Row>
                <Row title="Connection" desc={live.connection.detail}>
                  <button className="btn sm" onClick={testConn}>
                    test
                  </button>
                  <button className="btn sm primary" onClick={() => set({ apiUrl: url.trim() })}>
                    apply
                  </button>
                  {s.apiUrl && (
                    <button
                      className="btn sm ghost"
                      onClick={() => {
                        setUrl('');
                        set({ apiUrl: '' });
                      }}
                    >
                      use simulator
                    </button>
                  )}
                </Row>
                {test && (
                  <div className="set-row">
                    <div className="mono" style={{ fontSize: 12, color: test.err ? 'var(--signal)' : test.ok ? 'var(--ok)' : 'var(--amber)' }}>
                      {test.loading ? 'checking /health…' : test.err ? `failed: ${test.err}` : `${test.status} · ${test.ms.toFixed(0)}ms`}
                    </div>
                  </div>
                )}
                <Row title="Mode" desc="Current data path for every dashboard.">
                  <span className={`tag ${live.connection.mode === 'live' ? 'ok' : live.connection.mode === 'error' ? 'signal' : 'amber'}`}>{live.connection.mode}</span>
                </Row>
              </>
            )}
            {tab === 'alerts' && (
              <>
                <Row title="Desktop notifications" desc="Browser notification when an incident opens.">
                  <Switch
                    on={s.notify}
                    label="Desktop notifications"
                    onChange={async (v) => {
                      if (v && 'Notification' in window && Notification.permission !== 'granted') {
                        const p = await Notification.requestPermission();
                        if (p !== 'granted') return;
                      }
                      set({ notify: v });
                    }}
                  />
                </Row>
                <Row title="Audible alert" desc="Short beep when an incident opens.">
                  <Switch on={s.sound} onChange={(v) => set({ sound: v })} label="Audible alert" />
                </Row>
                <Row title="Routing (server-side)" desc="Slack and email delivery are configured on alert-service via SLACK_WEBHOOK_URL and SMTP_* environment variables.">
                  <span className="tag">env</span>
                </Row>
              </>
            )}
            {tab === 'display' && (
              <>
                <Row title="3D quality" desc="Low disables antialiasing and caps pixel ratio — use on older laptops.">
                  <div className="seg">
                    {['high', 'low'].map((q) => (
                      <button key={q} className={s.quality === q ? 'on' : ''} onClick={() => set({ quality: q })}>
                        {q}
                      </button>
                    ))}
                  </div>
                </Row>
                <Row title="Reduce motion" desc="Stops continuous 3D animation and auto-rotation.">
                  <Switch on={s.reduceMotion} onChange={(v) => set({ reduceMotion: v })} label="Reduce motion" />
                </Row>
                <Row title="Replay boot sequence" desc="Shown once per browser session.">
                  <button
                    className="btn sm"
                    onClick={() => {
                      try {
                        sessionStorage.removeItem('ls.booted');
                      } catch {
                        /* ignore */
                      }
                      window.location.reload();
                    }}
                  >
                    replay
                  </button>
                </Row>
              </>
            )}
            {tab === 'data' && (
              <>
                <Row title="Export workspace" desc="Settings, incidents and session totals as JSON.">
                  <button className="btn sm" onClick={exportAll}>
                    <Download size={12} /> export
                  </button>
                </Row>
                <Row title="Import settings" desc="Load settings from a previously exported workspace file.">
                  <label className="btn sm" style={{ cursor: 'pointer' }}>
                    <Upload size={12} /> import
                    <input type="file" accept="application/json" hidden onChange={(e) => e.target.files[0] && importAll(e.target.files[0])} />
                  </label>
                </Row>
                <Row title="Reset everything" desc="Clears logs, metrics and all stored incidents. Cannot be undone.">
                  {confirmReset ? (
                    <>
                      <button className="btn sm ghost" onClick={() => setConfirmReset(false)}>
                        cancel
                      </button>
                      <button
                        className="btn sm signal"
                        onClick={() => {
                          live.reset();
                          setConfirmReset(false);
                        }}
                      >
                        confirm reset
                      </button>
                    </>
                  ) : (
                    <button className="btn sm" onClick={() => setConfirmReset(true)}>
                      <RotateCcw size={12} /> reset
                    </button>
                  )}
                </Row>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
