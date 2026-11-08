import { useState } from 'react';
import { Copy, Play } from 'lucide-react';
import { PageHead } from '../components/ui';
import { useLive } from '../lib/store';

const ENDPOINTS = [
  {
    group: 'log-ingestion-api · :8000',
    items: [
      {
        m: 'POST',
        path: '/ingest',
        desc: 'Validate and publish a single log entry to the raw-logs topic.',
        body: `{
  "service": "payment-svc",
  "level": "ERROR",
  "message": "stripe timeout after 4200ms",
  "host": "pay-7f9c",
  "response_time_ms": 4200,
  "error_code": 504
}`,
        res: `{ "log_id": "4b1e…", "status": "accepted", "topic": "raw-logs" }`,
      },
      {
        m: 'POST',
        path: '/ingest/batch',
        desc: 'Publish 1–100 entries in one request. Partial failures are reported per item.',
        body: `{ "logs": [ { "service": "auth-api", "level": "INFO", "message": "login ok" } ] }`,
        res: `{ "accepted": 1, "rejected": 0, "log_ids": ["…"] }`,
      },
      { m: 'GET', path: '/health', desc: 'Liveness + Kafka producer readiness.', res: `{ "status": "healthy", "kafka": "connected" }` },
    ],
  },
  {
    group: 'ml-engine · :8001',
    items: [
      {
        m: 'POST',
        path: '/predict',
        desc: 'Score one feature vector with the loaded Isolation Forest.',
        body: `{
  "hour_of_day": 14,
  "response_time_ms": 2400,
  "error_code": 500,
  "log_level_encoded": 3,
  "service_id_encoded": 4
}`,
        res: `{ "is_anomaly": true, "anomaly_score": -0.142, "model_version": "iforest-v3" }`,
      },
      { m: 'POST', path: '/predict/batch', desc: 'Score up to 1,000 vectors in one call.', body: `{ "vectors": [ … ] }`, res: `{ "results": [ … ], "anomalies": 3 }` },
      { m: 'GET', path: '/model/status', desc: 'Model metadata: estimators, contamination, trained_at.', res: `{ "loaded": true, "n_estimators": 100, "contamination": 0.05 }` },
    ],
  },
  {
    group: 'dashboard-backend · :8080',
    items: [
      { m: 'GET', path: '/logs?size=20&level=ERROR&service=auth-api&q=timeout', desc: 'Paginated Elasticsearch query with filters and full-text search.', res: `{ "page": 1, "size": 20, "total": 812, "items": [ … ] }`, tryable: true },
      { m: 'GET', path: '/anomalies?size=20', desc: 'Alerts persisted by alert-service in PostgreSQL.', res: `{ "page": 1, "total": 37, "items": [ … ] }`, tryable: true },
      { m: 'GET', path: '/stats?window_minutes=60', desc: 'Aggregates: log rate, level and service breakdowns (cached in Redis).', res: `{ "logs_last_minute": 4120, "log_rate_per_second": 68.7, … }`, tryable: true },
      { m: 'GET', path: '/health', desc: 'Elasticsearch, Postgres and Redis connectivity.', res: `{ "status": "healthy", "checks": { … } }`, tryable: true },
    ],
  },
];

const curl = (e, base) => {
  const host = e.path.startsWith('/predict') || e.path.startsWith('/model') ? 'http://localhost:8001' : e.path.startsWith('/ingest') ? 'http://localhost:8000' : base || 'http://localhost:8080';
  return e.body ? `curl -X ${e.m} ${host}${e.path} \\\n  -H 'Content-Type: application/json' \\\n  -d '${e.body.replace(/\n\s*/g, ' ')}'` : `curl ${host}${e.path}`;
};

export default function ApiDocs() {
  const { settings } = useLive();
  const [sel, setSel] = useState(ENDPOINTS[0].items[0]);
  const [copied, setCopied] = useState(false);
  const [tryRes, setTryRes] = useState(null);

  const tryIt = async () => {
    if (!settings.apiUrl) {
      setTryRes({ err: 'Set a backend URL in Settings → Data source first.' });
      return;
    }
    setTryRes({ loading: true });
    try {
      const t0 = performance.now();
      const r = await fetch(settings.apiUrl.replace(/\/$/, '') + sel.path, { signal: AbortSignal.timeout(4000) });
      const txt = await r.text();
      setTryRes({ status: r.status, ms: performance.now() - t0, body: txt.slice(0, 4000) });
    } catch (e) {
      setTryRes({ err: e.message });
    }
  };

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="09"
          kicker="api reference"
          title={
            <>
              Three services, <em>ten endpoints</em>
            </>
          }
        >
          All APIs are FastAPI with OpenAPI at <span className="mono">/docs</span>. Authenticate with <span className="mono">X-API-Key</span> when{' '}
          <span className="mono">API_KEY_ENABLED=true</span>.
        </PageHead>
        <div className="set-layout api-layout">
          <div className="panel">
            {ENDPOINTS.map((g) => (
              <div key={g.group}>
                <div className="label" style={{ padding: '14px 16px 6px' }}>
                  {g.group}
                </div>
                {g.items.map((e) => (
                  <button
                    key={e.m + e.path}
                    className={`inc-item ${sel === e ? 'sel' : ''}`}
                    style={{ gridTemplateColumns: '48px 1fr', padding: '9px 16px' }}
                    onClick={() => {
                      setSel(e);
                      setTryRes(null);
                    }}
                  >
                    <span className={`method ${e.m}`}>{e.m}</span>
                    <span className="mono" style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {e.path.split('?')[0]}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="panel ticks">
            <div className="panel-head">
              <h3>
                <span className={`method ${sel.m}`}>{sel.m}</span>
                <span className="mono">{sel.path}</span>
              </h3>
              <div className="row">
                {sel.tryable && (
                  <button className="btn sm" onClick={tryIt}>
                    <Play size={11} /> try it
                  </button>
                )}
                <button
                  className="btn sm"
                  onClick={() => {
                    navigator.clipboard?.writeText(curl(sel, settings.apiUrl));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  <Copy size={11} /> {copied ? 'copied' : 'curl'}
                </button>
              </div>
            </div>
            <div className="panel-body" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18 }}>
              <p style={{ margin: 0 }}>{sel.desc}</p>
              <div>
                <div className="label" style={{ marginBottom: 8 }}>
                  request
                </div>
                <pre className="code">{curl(sel, settings.apiUrl)}</pre>
              </div>
              {sel.body && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>
                    body
                  </div>
                  <pre className="code">{sel.body}</pre>
                </div>
              )}
              <div>
                <div className="label" style={{ marginBottom: 8 }}>
                  response · 200
                </div>
                <pre className="code">{sel.res}</pre>
              </div>
              {tryRes && (
                <div>
                  <div className="label" style={{ marginBottom: 8 }}>
                    live response {tryRes.status ? `· ${tryRes.status} · ${tryRes.ms.toFixed(0)}ms` : ''}
                  </div>
                  <pre className="code" style={{ color: tryRes.err ? 'var(--signal)' : undefined }}>
                    {tryRes.loading ? 'requesting…' : tryRes.err || tryRes.body}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
