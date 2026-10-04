import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  Check,
  ChevronRight,
  Copy,
  KeyRound,
  ShieldCheck,
  Terminal,
  Zap,
  ArrowRight,
} from 'lucide-react';

const endpoints = [
  {
    id: 'ingest',
    method: 'POST',
    path: '/ingest',
    title: 'Single log ingestion',
    body: 'Send one structured log event into the LogSentinel ingestion pipeline.',
    request: `{
  "service": "auth-service",
  "level": "ERROR",
  "message": "Database connection timeout after 5000ms",
  "response_time_ms": 4500,
  "error_code": 503,
  "host": "pod-auth-7f9d"
}`,
    response: `{
  "accepted": true,
  "topic": "raw-logs",
  "event_id": "evt_01HVK8ZQ3A9"
}`,
  },
  {
    id: 'batch',
    method: 'POST',
    path: '/ingest/batch',
    title: 'Batch ingestion',
    body: 'Submit multiple log records in one request for high-throughput services.',
    request: `{
  "records": [
    { "service": "gateway", "level": "INFO", "message": "GET /health 200" },
    { "service": "payment", "level": "WARN", "message": "Retry storm detected" }
  ]
}`,
    response: `{
  "accepted": 2,
  "rejected": 0,
  "topic": "raw-logs"
}`,
  },
  {
    id: 'health',
    method: 'GET',
    path: '/health',
    title: 'Service health',
    body: 'Check API, Kafka, model, and storage readiness before sending traffic.',
    request: `curl -H "X-API-KEY: ls_prod_..." https://api.logsentinel.local/health`,
    response: `{
  "status": "ok",
  "kafka": "connected",
  "model": "loaded",
  "latency_ms": 18
}`,
  },
  {
    id: 'predict',
    method: 'POST',
    path: '/predict',
    title: 'Anomaly prediction',
    body: 'Score a log-like payload against the current Isolation Forest model without storing it.',
    request: `{
  "service": "checkout",
  "level": "WARN",
  "message": "p95 latency crossed 1200ms",
  "response_time_ms": 1200
}`,
    response: `{
  "anomaly": true,
  "score": -0.083,
  "severity": "warning"
}`,
  },
];

const ApiDocs = () => {
  const [active, setActive] = useState(endpoints[0].id);
  const [copied, setCopied] = useState('');
  const activeEndpoint = endpoints.find((endpoint) => endpoint.id === active) ?? endpoints[0];

  const copy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 1200);
  };

  return (
    <section className="page">
      <div className="container doc-layout">
        <aside className="doc-sidebar">
          <h3>Endpoints</h3>
          {endpoints.map((endpoint) => (
            <button
              className={`doc-link ${active === endpoint.id ? 'active' : ''}`}
              key={endpoint.id}
              type="button"
              onClick={() => setActive(endpoint.id)}
            >
              <span><span className={`method-pill ${endpoint.method.toLowerCase()}`}>{endpoint.method}</span> {endpoint.path}</span>
              <ChevronRight size={15} />
            </button>
          ))}
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            <h3 style={{ marginBottom: 10 }}>Platform</h3>
            {[
              ['/dashboard', 'Live dashboard', Activity],
              ['/console', 'Open CLI console', Terminal],
              ['/features', 'Feature list', Zap],
              ['/workflow', 'Workflow guide', ArrowRight],
              ['/security', 'Security posture', ShieldCheck],
              ['/settings', 'Keys & webhooks', KeyRound],
            ].map(([to, label, Icon]) => (
              <Link
                key={to}
                to={to}
                className="doc-link"
                style={{ textDecoration: 'none' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={13} /> {label}
                </span>
                <ChevronRight size={15} />
              </Link>
            ))}
          </div>
        </aside>

        <div className="doc-content">
          <motion.header
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="page-header"
            style={{ textAlign: 'left', marginInline: 0 }}
          >
            <p className="eyebrow">API Docs</p>
            <h1>Integrate LogSentinel with your services.</h1>
            <p>
              These endpoints cover ingestion, batch submission, health checks,
              metrics, log retrieval, and anomaly scoring for the local platform.
            </p>
          </motion.header>

          <motion.article
            key={active + '-req'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="doc-card panel"
          >
            <div className="endpoint-line">
              <div>
                <span className={`method-pill ${activeEndpoint.method.toLowerCase()}`}>{activeEndpoint.method}</span>
                <code> {activeEndpoint.path}</code>
              </div>
              <button className="icon-button" type="button" onClick={() => copy(activeEndpoint.request, `${active}-request`)}>
                {copied === `${active}-request` ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <h3>{activeEndpoint.title}</h3>
            <p>{activeEndpoint.body}</p>
            <pre className="code-block">{activeEndpoint.request}</pre>
          </motion.article>

          <motion.article
            key={active + '-resp'}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="doc-card panel"
          >
            <div className="endpoint-line">
              <h3>Example response</h3>
              <button className="icon-button" type="button" onClick={() => copy(activeEndpoint.response, `${active}-response`)}>
                {copied === `${active}-response` ? <Check size={17} /> : <Copy size={17} />}
              </button>
            </div>
            <pre className="code-block">{activeEndpoint.response}</pre>
          </motion.article>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="icon-box"><KeyRound size={23} /></span>
              <h3>Authentication</h3>
              <p>Send `X-API-KEY` with every request. Use separate keys per service so ingestion can be audited and revoked safely.</p>
              <Link to="/settings" className="learn-more">Create API keys <ArrowRight size={14} /></Link>
            </article>
            <article className="feature-card">
              <span className="icon-box"><Zap size={23} /></span>
              <h3>Throughput</h3>
              <p>Use `/ingest/batch` for workers that emit many logs per second. Keep batches small enough to retry safely.</p>
              <Link to="/workflow" className="learn-more">See ingestion flow <ArrowRight size={14} /></Link>
            </article>
            <article className="feature-card">
              <span className="icon-box"><ShieldCheck size={23} /></span>
              <h3>Validation</h3>
              <p>Unknown fields are preserved as metadata, while service, level, message, host, and timestamp stay normalized.</p>
              <Link to="/security" className="learn-more">Security controls <ArrowRight size={14} /></Link>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ApiDocs;
