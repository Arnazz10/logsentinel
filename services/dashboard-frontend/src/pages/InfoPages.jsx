import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageHead, Scene } from '../components/ui';

/* Hand-drawn line glyphs — one per feature, no icon-library look. */
const G = {
  stream: <path d="M4 14h8M4 22h14M4 30h10M22 14h18M26 22h14M22 30h18" />,
  forest: <path d="M22 6v32M22 14l-8 8M22 14l8 8M14 22l-5 6M14 22l4 7M30 22l-4 7M30 22l5 6" />,
  incident: <path d="M6 32h32M10 32V18M18 32V10M26 32V22M34 32V14M30 8l4 6 4-6" />,
  cube: <path d="M22 5l15 8v18l-15 8-15-8V13zM7 13l15 8 15-8M22 21v18" />,
  key: <path d="M14 22a6 6 0 1 0 0 .1M20 22h18M32 22v6M36 22v4" />,
  term: <path d="M6 8h32v28H6zM11 16l5 5-5 5M19 27h10" />,
};
const Glyph = ({ k }) => (
  <svg className="glyph" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="1.2">
    {G[k]}
  </svg>
);

const FEATURES = [
  ['stream', 'Streaming ingest', 'FastAPI → Kafka with batching, schema validation and back-pressure. Producers never wait on Elasticsearch.', '/pipelines'],
  ['forest', 'Unsupervised detection', 'Isolation Forest needs no labelled incidents. It learns “normal” from the stream itself and flags what isolates quickly.', '/lab'],
  ['incident', 'Incident correlation', 'Bursts of anomalies on one service collapse into a single incident with a timeline, MTTA/MTTR and a post-mortem stub.', '/incidents'],
  ['cube', '3D observability', 'Pipeline topology, log terrain and feature-space views rendered with three.js — same data as the tables, different angle.', '/live'],
  ['key', 'Secure by default', 'API-key auth, non-root containers, network policies and secrets kept out of images.', '/security'],
  ['term', 'Operator console', 'A shell over the live store: tail, score ad-hoc vectors, inject faults, ack and resolve without leaving the keyboard.', '/console'],
];

export const Features = () => (
  <section className="page">
    <div className="wrap">
      <PageHead
        index="—"
        kicker="features"
        title={
          <>
            What’s in the <em>box</em>
          </>
        }
      >
        Six things LogSentinel does, each linked to the page where you can watch it happen.
      </PageHead>
      <div className="feature-grid">
        {FEATURES.map(([k, t, d, to], i) => (
          <Link key={t} to={to} className="feature">
            <div className="n">
              <span>{String(i + 1).padStart(2, '0')}</span>
              <ArrowRight size={13} />
            </div>
            <div style={{ marginTop: 28 }}>
              <Glyph k={k} />
            </div>
            <h4 style={{ marginTop: 18 }}>{t}</h4>
            <p>{d}</p>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const STEPS = [
  ['log-collector', 'Tails files / receives syslog, batches and POSTs JSON to the ingestion API.'],
  ['log-ingestion-api', 'Validates with Pydantic, stamps log_id + ingested_at, publishes to raw-logs.'],
  ['log-processor', 'Consumer group: normalises, encodes features, bulk-indexes into Elasticsearch, republishes to processed-logs.'],
  ['ml-engine', 'Scores each record with Isolation Forest; anomalies go to anomaly-alerts.'],
  ['alert-service', 'Dedupes via Redis, persists to PostgreSQL, routes to Slack / email.'],
  ['dashboard-backend', 'Read API over Elasticsearch + Postgres for this UI and Grafana.'],
];

export const Workflow = () => (
  <section className="page">
    <div className="wrap">
      <PageHead
        index="—"
        kicker="how it works"
        title={
          <>
            One log’s <em>journey</em>
          </>
        }
      >
        Follow the amber packets: that’s each record moving through the real service graph. Red ones are scored anomalous and diverted to
        alerting.
      </PageHead>
      <div className="panel ticks" style={{ overflow: 'hidden' }}>
        <Scene kind="topology" height={520} hud={<><span>live topology</span><span>move pointer to tilt</span></>} />
      </div>
      <div className="stages stages-3 mt-24">
        {STEPS.map(([svc, d], i) => (
          <div key={svc} className="stage" style={{ minHeight: 180 }}>
            <div className="n">step {String(i + 1).padStart(2, '0')}</div>
            <h4 className="mono" style={{ marginTop: 24, fontSize: 16 }}>
              {svc}
            </h4>
            <p>{d}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const CONTROLS = [
  ['Transport', 'TLS 1.3 at the ingress; mTLS between pods via the service mesh.'],
  ['Authentication', 'X-API-Key on ingestion and ML APIs; keys rotated through Kubernetes secrets.'],
  ['Isolation', 'Non-root containers, read-only root FS, NetworkPolicies deny pod-to-pod by default.'],
  ['Data', 'PII fields can be hashed at ingestion; Elasticsearch indices are encrypted at rest (EBS KMS).'],
  ['Supply chain', 'Pinned base images, Trivy scan in the Jenkins pipeline, Terraform plans reviewed before apply.'],
  ['Audit', 'Every acknowledge / resolve is written to the incident timeline and alert_history table.'],
];

export const Security = () => (
  <section className="page">
    <div className="wrap">
      <PageHead
        index="—"
        kicker="security"
        title={
          <>
            Defence in <em>layers</em>
          </>
        }
      />
      <div className="grid g-main" style={{ alignItems: 'start' }}>
        <div className="panel ticks" style={{ overflow: 'hidden' }}>
          <Scene kind="lattice" height={520} />
        </div>
        <table className="spec">
          <tbody>
            {CONTROLS.map(([k, v]) => (
              <tr key={k}>
                <td style={{ width: 140 }}>{k}</td>
                <td style={{ fontSize: 15, textAlign: 'left', fontFamily: 'var(--sans)', color: 'var(--text)', display: 'table-cell' }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

export const NotFound = () => (
  <section className="page">
    <div className="wrap" style={{ paddingTop: 80 }}>
      <div className="label">
        <span className="t-signal">404</span> / route not found
      </div>
      <h1 className="display" style={{ marginTop: 20 }}>
        This path scored <em>1.000</em>.
      </h1>
      <p className="lede" style={{ marginTop: 20 }}>
        Nothing here looks like normal traffic. Probably a mistyped URL.
      </p>
      <Link to="/" className="btn primary mt-24">
        Back to overview <ArrowRight size={14} />
      </Link>
    </div>
  </section>
);
