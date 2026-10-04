import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ChevronDown, Cpu, Database, ShieldCheck, Terminal, TrendingDown, TrendingUp, Workflow } from 'lucide-react';

const services = [
  { name: 'auth-api', logs: 12450, throughput: 846, trend: 32, anomalies: 5, uptime: 99.98 },
  { name: 'gateway', logs: 16300, throughput: 598, trend: 26, anomalies: 8, uptime: 99.95 },
  { name: 'payment-svc', logs: 12980, throughput: 389, trend: 13, anomalies: 3, uptime: 99.99 },
  { name: 'data-services', logs: 10984, throughput: 265, trend: -11, anomalies: 12, uptime: 99.90 },
  { name: 'ml-engine', logs: 5578, throughput: 836, trend: -8, anomalies: 14, uptime: 99.93 },
  { name: 'alert-mgr', logs: 7210, throughput: 412, trend: 19, anomalies: 6, uptime: 99.97 },
];

const Pipelines = () => {
  const [sortBy, setSortBy] = useState('logs');
  const [live, setLive] = useState(services);

  useEffect(() => {
    const id = setInterval(() => {
      setLive((curr) =>
        curr.map((svc) => ({
          ...svc,
          throughput: Math.max(50, svc.throughput + Math.floor((Math.random() - 0.5) * 20)),
          trend: Math.max(-25, Math.min(60, svc.trend + Math.floor((Math.random() - 0.5) * 4))),
          uptime: Math.max(99.5, Math.min(99.999, svc.uptime + (Math.random() - 0.5) * 0.02)),
        }))
      );
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const sorted = [...live].sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));

  return (
    <section className="page">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Pipelines</p>
            <h1>Log Delivery Pipelines</h1>
            <p>Throughput, anomaly trends, and uptime across every service pipeline.</p>
          </div>
          <div className="row-actions">
            <div className="select-wrap">
              <select className="select-input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="logs">Sort by Logs</option>
                <option value="throughput">Sort by Throughput</option>
                <option value="anomalies">Sort by Anomalies</option>
                <option value="uptime">Sort by Uptime</option>
              </select>
              <ChevronDown size={14} />
            </div>
            <button className="pill-button primary">
              <Workflow size={16} /> New Pipeline
            </button>
          </div>
        </header>

        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <div className="kpi">
            <div className="kpi-icon"><Activity size={22} /></div>
            <span className="kpi-label">Active pipelines</span>
            <span className="kpi-value">{live.length}</span>
          </div>
          <div className="kpi">
            <div className="kpi-icon"><Database size={22} /></div>
            <span className="kpi-label">Logs ingested (24h)</span>
            <span className="kpi-value">{(live.reduce((s, x) => s + x.logs, 0) * 5.4).toLocaleString()}</span>
          </div>
          <div className="kpi">
            <div className="kpi-icon"><AlertTriangle size={22} /></div>
            <span className="kpi-label">Total anomalies</span>
            <span className="kpi-value">{live.reduce((s, x) => s + x.anomalies, 0)}</span>
          </div>
          <div className="kpi">
            <div className="kpi-icon"><ShieldCheck size={22} /></div>
            <span className="kpi-label">Avg uptime</span>
            <span className="kpi-value">{(live.reduce((s, x) => s + x.uptime, 0) / live.length).toFixed(3)}%</span>
          </div>
        </div>

        <section className="panel">
          <div className="panel-head">
            <h2><Workflow size={20} /> All Service Pipelines</h2>
            <span className="status-pill">Live</span>
          </div>
          <table className="pipelines-table">
            <thead>
              <tr>
                <th>Pipeline</th>
                <th>Logs (24h)</th>
                <th>Throughput</th>
                <th>Trend</th>
                <th>Anomalies</th>
                <th>Uptime</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((svc, i) => (
                <motion.tr
                  key={svc.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div className="avatar" style={{ width: 36, height: 36 }}>
                        <span style={{ fontSize: '0.78rem' }}>{svc.name.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <div>
                        <strong style={{ display: 'block' }}>{svc.name}</strong>
                        <span style={{ fontSize: '0.78rem', color: 'var(--dim)' }}>logsentinel/ pipeline · live</span>
                      </div>
                    </div>
                  </td>
                  <td>{(svc.logs * 5.4).toLocaleString()}</td>
                  <td>{svc.throughput}/s</td>
                  <td>
                    <span className={`level-trend ${svc.trend >= 0 ? 'up' : 'down'}`}>
                      {svc.trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      {svc.trend >= 0 ? '+' : ''}{svc.trend}%
                    </span>
                  </td>
                  <td>
                    <span className={`mini-chip ${svc.anomalies > 8 ? 'warn' : 'ok'}`}>
                      {svc.anomalies}
                    </span>
                  </td>
                  <td>{svc.uptime.toFixed(3)}%</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </section>

        <div className="feature-grid" style={{ marginTop: 24 }}>
          <article className="feature-card">
            <span className="icon-box"><Terminal size={22} /></span>
            <h3>Kafka-backed buffers</h3>
            <p>Every pipeline writes to a dedicated Kafka topic before scoring. Consumer groups scale independently without drops.</p>
          </article>
          <article className="feature-card">
            <span className="icon-box"><Cpu size={22} /></span>
            <h3>Per-pipeline ML scoring</h3>
            <p>Baselines are computed per service so noisy pipelines don't skew quiet ones. Retrain on any rolling window.</p>
          </article>
          <article className="feature-card">
            <span className="icon-box"><AlertTriangle size={22} /></span>
            <h3>Anomaly deduplication</h3>
            <p>Similar signatures inside a 5m window collapse into a single incident with a running count and first/last timestamps.</p>
          </article>
        </div>
      </div>
    </section>
  );
};

export default Pipelines;
