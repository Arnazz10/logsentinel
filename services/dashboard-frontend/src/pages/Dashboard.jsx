import { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Database,
  Download,
  RefreshCcw,
  Search,
  ShieldCheck,
  Terminal,
  Trash2,
} from 'lucide-react';

const seedLogs = [
  { id: 1, time: '19:23:01', service: 'auth-api', level: 'INFO', msg: 'User login successful for user_842', anomaly: false },
  { id: 2, time: '19:23:04', service: 'payment-svc', level: 'ERROR', msg: 'Stripe API timeout after 10s', anomaly: true },
  { id: 3, time: '19:23:05', service: 'gateway', level: 'WARN', msg: 'High latency detected on /v1/ingest', anomaly: false },
  { id: 4, time: '19:23:10', service: 'db-master', level: 'INFO', msg: 'Replica lag synchronized', anomaly: false },
  { id: 5, time: '19:23:12', service: 'ml-engine', level: 'INFO', msg: 'Inference batch complete for 2,000 records', anomaly: false },
  { id: 6, time: '19:23:15', service: 'alert-mgr', level: 'ERROR', msg: 'Slack webhook failed with 403 Forbidden', anomaly: true },
  { id: 7, time: '19:23:18', service: 'checkout', level: 'WARN', msg: 'Retry storm detected against billing provider', anomaly: true },
  { id: 8, time: '19:23:22', service: 'edge-proxy', level: 'INFO', msg: 'GET /api/v1/health returned 200', anomaly: false },
];

const services = ['all', 'auth-api', 'payment-svc', 'gateway', 'db-master', 'ml-engine', 'alert-mgr', 'checkout', 'edge-proxy'];

const Kpi = ({ icon, label, value }) => (
  <div className="kpi">
    <div className="kpi-icon">{icon}</div>
    <span className="kpi-label">{label}</span>
    <span className="kpi-value">{value}</span>
  </div>
);

const AlertCard = ({ title, body, time, severity }) => (
  <article className="alert-card">
    <h3>
      <span>{title}</span>
      <span className={`level-${severity}`}>{severity.toUpperCase()}</span>
    </h3>
    <p>{body}</p>
    <div className="alert-meta">{time}</div>
  </article>
);

const Dashboard = () => {
  const [logs, setLogs] = useState(seedLogs);
  const [query, setQuery] = useState('');
  const [service, setService] = useState('all');
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  const filteredLogs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return logs.filter((log) => {
      const matchesQuery = !normalized || `${log.service} ${log.level} ${log.msg}`.toLowerCase().includes(normalized);
      const matchesService = service === 'all' || log.service === service;
      const matchesAnomaly = !onlyAnomalies || log.anomaly;
      return matchesQuery && matchesService && matchesAnomaly;
    });
  }, [logs, onlyAnomalies, query, service]);

  const addLiveLog = () => {
    const pool = [
      ['gateway', 'INFO', 'Steady request flow observed across rolling window', false],
      ['auth-api', 'ERROR', 'Session validator rejected expired signing key', true],
      ['ml-engine', 'INFO', 'Anomaly batch scored in 18ms', false],
      ['payment-svc', 'WARN', 'Upstream billing p95 latency crossed 800ms', true],
    ];
    const [nextService, level, msg, anomaly] = pool[Math.floor(Math.random() * pool.length)];
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((current) => [{ id: Date.now(), time: now, service: nextService, level, msg, anomaly }, ...current].slice(0, 40));
  };

  const clearLogs = () => setLogs([]);
  const exportLogs = () => {
    const payload = filteredLogs.map((log) => JSON.stringify(log)).join('\n');
    const blob = new Blob([payload], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'logsentinel-logs.ndjson';
    link.click();
    URL.revokeObjectURL(url);
  };

  const anomalyCount = logs.filter((log) => log.anomaly).length;

  return (
    <section className="page">
      <div className="container dashboard-grid">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Operations Center</h1>
            <p>Real-time logs, anomaly scoring, service health, and alert context.</p>
          </div>
          <div className="row-actions">
            <button className="pill-button" type="button" onClick={exportLogs}>
              <Download size={18} />
              Export logs
            </button>
            <button className="pill-button primary" type="button" onClick={addLiveLog}>
              <RefreshCcw size={18} />
              Pull live event
            </button>
          </div>
        </header>

        <div className="kpi-grid">
          <Kpi icon={<Activity size={24} />} label="Ingestion rate" value="850/s" />
          <Kpi icon={<ShieldCheck size={24} />} label="Service health" value="99.9%" />
          <Kpi icon={<AlertTriangle size={24} />} label="Active anomalies" value={anomalyCount} />
          <Kpi icon={<Database size={24} />} label="Total records" value="152,640" />
        </div>

        <div className="ops-grid">
          <section className="panel">
            <div className="panel-head">
              <h2>
                <Terminal size={20} /> System logs
              </h2>
              <div className="toolbar">
                <label className="search-box">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search logs"
                    aria-label="Search logs"
                  />
                </label>
                <select className="select-input" value={service} onChange={(event) => setService(event.target.value)}>
                  {services.map((name) => (
                    <option key={name} value={name}>
                      {name === 'all' ? 'All services' : name}
                    </option>
                  ))}
                </select>
                <button className="icon-button" type="button" onClick={() => setOnlyAnomalies((value) => !value)} aria-label="Toggle anomalies">
                  <AlertTriangle size={17} color={onlyAnomalies ? 'var(--orange)' : 'currentColor'} />
                </button>
                <button className="icon-button" type="button" onClick={clearLogs} aria-label="Clear logs">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>

            <div className="log-table" aria-live="polite">
              {filteredLogs.length === 0 ? (
                <div className="log-row">
                  <span>No logs match the current filters.</span>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div className={`log-row ${log.anomaly ? 'anomaly' : ''}`} key={log.id}>
                    <span className="log-time">{log.time}</span>
                    <span className="log-service">[{log.service}]</span>
                    <strong className={`level-${log.level.toLowerCase()}`}>{log.level}</strong>
                    <span>{log.msg}</span>
                    {log.anomaly ? <span className="mini-chip">ANOMALY</span> : <span />}
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="panel">
            <div className="panel-head">
              <h2>
                <Bell size={20} /> Active alerts
              </h2>
              <span className="status-pill">Live</span>
            </div>
            <div className="alert-list">
              <AlertCard severity="error" title="Potential brute force" body="Multiple failed logins from the same network block." time="2m ago" />
              <AlertCard severity="warn" title="High consumer lag" body="Kafka consumer lag exceeded 50,000 records on raw-logs." time="15m ago" />
              <AlertCard severity="info" title="Model refreshed" body="Isolation Forest baseline updated with the latest rolling dataset." time="1h ago" />
            </div>
            <button className="pill-button" type="button" style={{ width: '100%', marginTop: 18 }}>
              View alert history
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
