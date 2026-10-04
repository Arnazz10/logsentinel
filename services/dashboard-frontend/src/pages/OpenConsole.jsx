import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, ChevronRight, Play, Search, Settings, Square, Terminal, TrendingDown, TrendingUp, Zap } from 'lucide-react';

const clusters = [
  ['prod-cluster-01', 'us-east-1'],
  ['staging-cluster', 'us-west-2'],
  ['dev-sandbox', 'ap-south-1'],
];

const initialLines = [
  { time: '19:35:01', level: 'INFO', service: 'auth', msg: 'User authenticated with session token', anomaly: false },
  { time: '19:35:04', level: 'DEBUG', service: 'ingest', msg: 'Buffer flush complete for 1,250 records', anomaly: false },
  { time: '19:35:08', level: 'ERROR', service: 'db', msg: 'Query execution timeout after 5000ms', anomaly: true },
  { time: '19:35:10', level: 'INFO', service: 'gateway', msg: 'GET /api/v1/health returned 200 OK', anomaly: false },
  { time: '19:35:12', level: 'INFO', service: 'ml', msg: 'Inference latency 12ms with score -0.021', anomaly: false },
  { time: '19:35:15', level: 'WARN', service: 'billing', msg: 'Retry storm detected against upstream provider', anomaly: true },
];

const tabs = ['Raw Stream', 'Anomalies', 'Live Metrics'];

const linePool = [
  ['INFO', 'auth', 'User authenticated successfully', false],
  ['INFO', 'gateway', 'Request /v1/ingest handled in 42ms', false],
  ['DEBUG', 'ingest', 'Kafka partition 4 committed offset 28174', false],
  ['WARN', 'db', 'Read replica p99 latency 820ms', true],
  ['ERROR', 'billing', 'Stripe charge attempt returned RATE_LIMITED', true],
  ['INFO', 'ml', 'Anomaly batch of 24 scored in 14ms', false],
  ['INFO', 'alert', 'Slack webhook delivered successfully', false],
  ['WARN', 'cache', 'Redis eviction rate exceeded warning threshold', true],
  ['INFO', 'edge', 'Cache hit ratio now at 94.7% for static assets', false],
  ['ERROR', 'auth', 'JWT signature verification failed for issuer external', true],
  ['INFO', 'scheduler', 'Cron job nightly-reports completed successfully', false],
  ['WARN', 'ingest', 'Ingest backlog building, 8,400 records pending', true],
];

const processCommand = (raw, { cluster, activeCluster }) => {
  const cmd = raw.trim();
  const tokens = cmd.split(/\s+/);
  const head = tokens[0].toLowerCase();
  const tail = tokens.slice(1).join(' ');

  const k = (label, value) => ({ label, value });

  if (cmd === '' || head === 'help') {
    return {
      kind: 'help',
      title: 'LogSentinel CLI — Available commands',
      rows: [
        ['status', 'Show cluster health, consumer lag, and model readiness'],
        ['kpis', 'Show rolling KPIs for the active cluster'],
        ['tail [service]', 'Stream recent lines for a service (default: all)'],
        ['anomalies', 'List anomalies flagged in the last 15 minutes'],
        ['services', 'List connected services and their ingest rate'],
        ['cluster [name]', 'Switch active cluster (prod/staging/dev)'],
        ['model', 'Show current model status, score, and last training'],
        ['clear', 'Clear the command history buffer'],
        ['help', 'Show this help message'],
      ],
      footer: 'Tip: pipe filters are coming soon. Use the sidebar filter for real-time search.',
    };
  }

  if (head === 'clear') {
    return { kind: 'clear' };
  }

  if (head === 'status') {
    const names = clusters.map(([n, r]) => [n, r]);
    return {
      kind: 'kv',
      title: `Cluster status · ${cluster[0]} (${cluster[1]})`,
      rows: [
        k('Kafka connectivity', '✓ Connected · 3 brokers in-sync'),
        k('Consumer group lag', Math.floor(Math.random() * 1800 + 400) + ' records'),
        k('Model readiness', '✓ IsolationForest-v2.4 loaded · contamination 0.05'),
        k('Elasticsearch index', '✓ logs-2026.04.r1 · 12 shards healthy'),
        k('Alert webhooks', '2 of 2 endpoints reachable'),
        k('Registered services', '9 services publishing heartbeats'),
      ],
      footer: names.map(([n, r]) => `· ${n} (${r}) — ${activeCluster === n ? 'active' : 'idle'}`).join('\n'),
    };
  }

  if (head === 'kpis') {
    return {
      kind: 'kv',
      title: `Rolling KPIs · last 15m · ${cluster[0]}`,
      rows: [
        k('Ingestion throughput', (820 + Math.floor(Math.random() * 240)) + '/s'),
        k('Anomaly rate', ((Math.random() * 2.2 + 0.6)).toFixed(2) + '%'),
        k('p50 ingest latency', (8 + Math.floor(Math.random() * 8)) + 'ms'),
        k('p99 ingest latency', (38 + Math.floor(Math.random() * 22)) + 'ms'),
        k('Cache hit ratio', (92 + Math.random() * 5).toFixed(1) + '%'),
        k('Deduplication ratio', (1 - Math.random() * 0.04).toFixed(3)),
      ],
    };
  }

  if (head === 'tail') {
    const svc = (tail || '').toLowerCase();
    const rows = [];
    const pool = svc ? linePool.filter(([_, s]) => s === svc || s.startsWith(svc.slice(0, 2))) : linePool;
    if (pool.length === 0) {
      return { kind: 'warn', title: `tail: no service matching "${svc}" in this cluster.` };
    }
    for (let i = 0; i < 10; i++) {
      const [lvl, srv, msg, anom] = pool[Math.floor(Math.random() * pool.length)];
      const t = new Date(Date.now() - (9 - i) * 4000).toLocaleTimeString('en-US', { hour12: false });
      rows.push([t, lvl, srv, msg, anom]);
    }
    return { kind: 'tail', title: `==> tailing ${svc || 'all services'} (last 10) <==`, rows, svc: svc || 'all' };
  }

  if (head === 'anomalies') {
    const flagged = linePool.filter((r) => r[3]);
    const rows = flagged.concat(flagged.slice(0, 2)).map(([_, srv, msg], i) => {
      const t = new Date(Date.now() - i * 90000).toLocaleTimeString('en-US', { hour12: false });
      const score = -(0.03 + Math.random() * 0.09).toFixed(3);
      return [t, srv, msg, score];
    });
    return {
      kind: 'anomalies',
      title: `Flagged anomalies · last 15m · ${cluster[0]}`,
      header: ['TIME', 'SERVICE', 'MESSAGE', 'SCORE'],
      rows,
      footer: `Tip: switch to the Anomalies tab to see this stream auto-updating in real time.`,
    };
  }

  if (head === 'services') {
    return {
      kind: 'services',
      title: `Connected services · ${cluster[0]}`,
      rows: [
        ['auth-api', (240 + Math.floor(Math.random() * 80)) + '/s', '0.42%', '✓'],
        ['gateway', (380 + Math.floor(Math.random() * 140)) + '/s', '0.88%', '✓'],
        ['payment-svc', (120 + Math.floor(Math.random() * 60)) + '/s', '2.41%', '✓'],
        ['ingest-api', (760 + Math.floor(Math.random() * 200)) + '/s', '0.12%', '✓'],
        ['ml-engine', (60 + Math.floor(Math.random() * 24)) + '/s', '0.08%', '✓'],
        ['alert-mgr', (30 + Math.floor(Math.random() * 18)) + '/s', '1.12%', '✓'],
        ['db-master', '—', '3.01%', 'warn'],
      ],
      header: ['SERVICE', 'RATE', 'ANOM %', 'STATUS'],
    };
  }

  if (head === 'cluster') {
    const target = tail.toLowerCase();
    const match = clusters.find(([n]) => n.startsWith(target)) || (!target ? null : null);
    if (!target || !match) {
      return {
        kind: 'warn',
        title: `cluster: specify one of ${clusters.map(([n]) => n).join(', ')}`,
      };
    }
    return { kind: 'cluster-switch', target: match[0], region: match[1] };
  }

  if (head === 'model') {
    return {
      kind: 'kv',
      title: 'ML model status',
      rows: [
        k('Active model', 'IsolationForest-v2.4-stable'),
        k('Last training', '2026-04-27 09:12 UTC · 1.2M records'),
        k('Contamination', '0.05 (5% expected anomaly rate)'),
        k('Inference p50 / p95', '12ms / 24ms'),
        k('Accuracy / Recall', '98.2% / 91.8%'),
      ],
    };
  }

  return { kind: 'unknown', raw: cmd };
};

const OpenConsole = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activeCluster, setActiveCluster] = useState(clusters[0][0]);
  const [running, setRunning] = useState(true);
  const [query, setQuery] = useState('');
  const [command, setCommand] = useState('');
  const [lines, setLines] = useState(initialLines);
  const [metricCards, setMetricCards] = useState({ lag: 1204, p95: 22, error: 0.42, queue: 7 });
  const [entries, setEntries] = useState([
    {
      id: 'welcome',
      type: 'output',
      title: 'Welcome to LogSentinel Core v1.0.0',
      kind: 'help',
      footer: `Active cluster: ${activeCluster} · connected to kafka:9092 · type 'help' to see commands.`,
      rows: [
        ['help', 'List all commands'],
        ['status', 'Show cluster health'],
        ['kpis', 'Show rolling KPIs'],
        ['tail gateway', 'Stream gateway logs'],
      ],
    },
  ]);

  const streamRef = useRef(null);

  const cluster = clusters.find(([n]) => n === activeCluster) ?? clusters[0];

  const visibleLines = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return lines.filter((line) => {
      const matchesTab = activeTab !== 'Anomalies' || line.anomaly;
      const matchesQuery = !normalized || `${line.level} ${line.service} ${line.msg}`.toLowerCase().includes(normalized);
      return matchesTab && matchesQuery;
    });
  }, [activeTab, lines, query]);

  useEffect(() => {
    if (!running || activeTab === 'Live Metrics') return;
    const id = setInterval(() => {
      const [level, svc, msg, anomaly] = linePool[Math.floor(Math.random() * linePool.length)];
      const time = new Date().toLocaleTimeString('en-US', { hour12: false });
      setLines((curr) => [{ id: Date.now() + Math.random(), time, level, service: svc, msg, anomaly }, ...curr].slice(0, 100));
      setMetricCards((m) => ({
        lag: Math.max(120, m.lag + Math.floor((Math.random() - 0.5) * 240)),
        p95: Math.max(4, m.p95 + Math.floor((Math.random() - 0.5) * 8)),
        error: Math.max(0.05, Math.min(6, m.error + (Math.random() - 0.5) * 0.4)),
        queue: Math.max(0, m.queue + Math.floor((Math.random() - 0.4) * 3)),
      }));
    }, 1800);
    return () => clearInterval(id);
  }, [running, activeTab]);

  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = 0;
    }
  }, [lines.length]);

  const runCommand = (event) => {
    event.preventDefault();
    if (!command.trim()) return;
    const result = processCommand(command, { cluster, activeCluster });
    const id = Date.now() + Math.random();

    if (result.kind === 'clear') {
      setEntries([]);
    } else if (result.kind === 'cluster-switch') {
      setActiveCluster(result.target);
      setEntries((curr) => [
        { id, type: 'prompt', cmd: command.trim() },
        { id: id + 1, type: 'output', kind: 'kv', title: `Switched cluster → ${result.target}`, rows: [
          ['Region', result.region],
          ['Bootstrap', 'kafka-' + result.target.slice(0, 5) + ':9092'],
          ['Model', 'IsolationForest-v2.4-stable'],
          ['Status', 'Ready'],
        ] },
        ...curr,
      ]);
    } else {
      setEntries((curr) => [{ id, type: 'prompt', cmd: command.trim() }, { id: id + 1, type: 'output', ...result }, ...curr].slice(0, 80));
    }
    setCommand('');
  };

  return (
    <section className="console-page">
      <div className="console-shell">
        <aside className="console-sidebar">
          <div className="panel-head">
            <h2>
              <Terminal size={20} /> Console
            </h2>
            <button className="icon-button" type="button" aria-label="Console settings">
              <Settings size={17} />
            </button>
          </div>

          <div className="search-box" style={{ marginBottom: 16 }}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter stream" />
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--dim)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Clusters</div>
          <div className="cluster-list">
            {clusters.map(([name, region]) => (
              <button
                className={`cluster-button ${activeCluster === name ? 'active' : ''}`}
                key={name}
                type="button"
                onClick={() => setActiveCluster(name)}
              >
                <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`cluster-dot ${name.startsWith('prod') ? 'prod' : name.startsWith('stag') ? 'stag' : 'dev'}`} />
                  {name}
                </strong>
                <span>{region}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: 14, border: '1px solid var(--line)', borderRadius: 14, background: 'rgba(79,169,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Zap size={15} style={{ color: 'var(--blue)' }} />
              <strong style={{ fontSize: '0.82rem' }}>Quick commands</strong>
            </div>
            {['status', 'kpis', 'anomalies', 'tail gateway', 'services', 'help'].map((c) => (
              <button
                key={c}
                className="quick-cmd"
                type="button"
                onClick={() => setCommand(c)}
              >
                <ChevronRight size={13} /> {c}
              </button>
            ))}
          </div>
        </aside>

        <main className="console-main">
          <div className="console-topbar">
            <div className="tab-list">
              {tabs.map((tab) => (
                <button
                  className={`tab-button ${activeTab === tab ? 'active' : ''}`}
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'Anomalies' && <AlertTriangle size={13} style={{ marginRight: 6 }} />}
                  {tab === 'Live Metrics' && <Activity size={13} style={{ marginRight: 6 }} />}
                  {tab}
                </button>
              ))}
            </div>
            <div className="row-actions">
              <span className="status-pill">{running ? 'Connected · ' + cluster[1] : 'Paused'}</span>
              <button className="pill-button" type="button" onClick={() => setRunning((value) => !value)}>
                {running ? <Square size={16} /> : <Play size={16} />}
                {running ? 'Pause stream' : 'Resume stream'}
              </button>
            </div>
          </div>

          <div className="terminal-window" ref={streamRef}>
            <div className="console-banner">
              <span className="console-banner-dot" />
              <span>
                LogSentinel Core <strong>v1.0.0</strong> · cluster <strong>{cluster[0]}</strong> · view <strong>{activeTab}</strong>
              </span>
            </div>

            {activeTab === 'Live Metrics' ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="metric-grid"
                style={{ padding: '4px 0 12px' }}
              >
                {[
                  ['Consumer lag', metricCards.lag.toLocaleString(), Math.floor(Math.random() * 4) % 2 === 0 ? 'up' : 'down', 'Lag below 5k healthy'],
                  ['Inference p95', metricCards.p95 + 'ms', metricCards.p95 > 30 ? 'down' : 'up', 'p95 < 40ms healthy'],
                  ['Error rate', metricCards.error.toFixed(2) + '%', metricCards.error > 1.5 ? 'down' : 'up', 'Target < 1%'],
                  ['Alert queue', String(metricCards.queue), metricCards.queue > 10 ? 'down' : 'up', 'Backlog if > 15'],
                ].map(([label, value, dir, hint], i) => (
                  <motion.div
                    key={label}
                    className="metric-card"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.04 * i }}
                  >
                    <span className="metric-label">{label}</span>
                    <span className="metric-value">{value}</span>
                    <span className={`kpi-delta ${dir}`} style={{ marginTop: 6 }}>
                      {dir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {hint}
                    </span>
                  </motion.div>
                ))}
                <div className="metric-card" style={{ gridColumn: '1 / -1' }}>
                  <span className="metric-label">Throughput (last 40 intervals)</span>
                  <div className="inline-spark">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const h = 20 + Math.abs(Math.sin(i / 3 + metricCards.lag * 0.01) * 60) + Math.random() * 18;
                      return <div key={i} className="inline-bar" style={{ height: `${h}%` }} />;
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {visibleLines.length === 0 ? (
                  <div style={{ padding: 20, color: 'var(--dim)' }}>No lines match the current filters.</div>
                ) : (
                  visibleLines.map((line, i) => (
                    <motion.div
                      className="console-line-item"
                      key={line.id}
                      initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(79,169,255,0.12)' }}
                      animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                      transition={{ duration: 0.35 }}
                    >
                      <span className="term-time">[{line.time}]</span>
                      <strong className={`level-${line.level.toLowerCase()}`}>{line.level.padEnd(5, ' ')}</strong>
                      <span className="svc-tag">{line.service}</span>
                      <span className="line-msg">{line.msg}</span>
                      {line.anomaly ? <span className="mini-chip warn">DETECTED</span> : <span className="mini-chip ok faint">—</span>}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            )}

            <div style={{ height: 1, background: 'var(--line)', margin: '20px 0 16px' }} />

            <div className="cmd-history-wrap">
              <AnimatePresence initial={false}>
                {entries.slice(0, 40).map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="cmd-row"
                  >
                    {e.type === 'prompt' ? (
                      <div className="cmd-prompt-line">
                        <span className="cmd-shell">logsentinel@{activeCluster.slice(0, 8)}</span>
                        <span className="cmd-sep">:</span>
                        <span className="cmd-path">~</span>
                        <span className="cmd-dollar">$</span>
                        <code>{e.cmd}</code>
                      </div>
                    ) : (
                      <div className="cmd-output-block">
                        <div className="cmd-output-title">{e.title}</div>

                        {e.kind === 'help' && e.rows && (
                          <div className="cmd-help-grid">
                            {e.rows.map(([c, d]) => (
                              <div key={c} className="cmd-help-row">
                                <code>{c}</code>
                                <span>{d}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {e.kind === 'kv' && e.rows && (
                          <div className="cmd-kv-grid">
                            {e.rows.map(([lbl, val]) => (
                              <div key={lbl} className="cmd-kv-row">
                                <span>{lbl}</span>
                                <strong>{val}</strong>
                              </div>
                            ))}
                          </div>
                        )}

                        {e.kind === 'tail' && e.rows && (
                          <div className="cmd-table">
                            {e.rows.map(([t, lvl, srv, msg], idx) => (
                              <div className="console-line-item" key={`tail-${idx}`}>
                                <span className="term-time">[{t}]</span>
                                <strong className={`level-${lvl.toLowerCase()}`}>{lvl.padEnd(5, ' ')}</strong>
                                <span className="svc-tag">{srv}</span>
                                <span className="line-msg">{msg}</span>
                                <span className="mini-chip ok faint">—</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {e.kind === 'anomalies' && (
                          <>
                            <div className="cmd-table-header">
                              {e.header.map((h) => <span key={h}>{h}</span>)}
                            </div>
                            <div className="cmd-table">
                              {e.rows.map(([t, srv, msg, score], idx) => (
                                <div className="cmd-table-row anomaly" key={`an-${idx}`}>
                                  <span>[{t}]</span>
                                  <strong>{srv}</strong>
                                  <span>{msg}</span>
                                  <strong style={{ color: 'var(--red)' }}>{score}</strong>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {e.kind === 'services' && (
                          <>
                            <div className="cmd-table-header">
                              {e.header.map((h) => <span key={h}>{h}</span>)}
                            </div>
                            <div className="cmd-table">
                              {e.rows.map(([s, r, a, st], idx) => (
                                <div className="cmd-table-row" key={`svc-${idx}`}>
                                  <strong style={{ color: 'var(--blue)' }}>{s}</strong>
                                  <span>{r}</span>
                                  <span>{a}</span>
                                  <span style={{ color: st === 'warn' ? 'var(--orange)' : 'var(--green)' }}>{st === '✓' ? 'HEALTHY' : 'DEGRADED'}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {e.kind === 'warn' && (
                          <div style={{ padding: '10px 14px', color: 'var(--orange)', borderLeft: '2px solid var(--orange)', borderRadius: 6 }}>
                            ⚠ {e.title}
                          </div>
                        )}

                        {e.kind === 'unknown' && (
                          <div style={{ padding: '10px 14px', color: 'var(--red)', borderLeft: '2px solid var(--red)', borderRadius: 6 }}>
                            ✗ command not found: <code>{e.raw}</code> · type <code>help</code> to see available commands.
                          </div>
                        )}

                        {e.footer && <div className="cmd-footer">{e.footer}</div>}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <form className="console-command" onSubmit={runCommand}>
            <span className="prompt">
              logsentinel@{cluster[0].slice(0, 8)}:~$
            </span>
            <input
              className="console-input"
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              placeholder="e.g. status · tail gateway · anomalies · kpis · services · help"
            />
            <button className="pill-button primary" type="submit">Run</button>
          </form>
        </main>
      </div>
    </section>
  );
};

export default OpenConsole;
