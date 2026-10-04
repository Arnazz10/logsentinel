import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowRight,
  BellRing,
  Cpu,
  Database,
  GitBranch,
  KeyRound,
  Layers,
  LockKeyhole,
  Radio,
  ServerCog,
  ShieldCheck,
  Workflow as WorkflowIcon,
  Zap,
  Terminal,
  PieChart,
} from 'lucide-react';

const PageHeader = ({ title, subtitle }) => (
  <motion.header
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className="page-header"
  >
    <p className="eyebrow">LogSentinel platform</p>
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </motion.header>
);

const FeatureCard = ({ icon, title, desc, to }) => (
  <motion.article
    className="feature-card"
    initial={{ opacity: 0, y: 18 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.45 }}
  >
    <span className="icon-box">{icon}</span>
    <h3>{title}</h3>
    <p>{desc}</p>
    {to && (
      <Link className="learn-more" to={to}>
        Learn more <ArrowRight size={14} />
      </Link>
    )}
  </motion.article>
);

const features = [
  [<Radio size={24} />, 'Live log ingestion', 'Stream single logs or batches into Kafka-backed ingestion with schema validation and service tagging.', '/workflow'],
  [<Cpu size={24} />, 'AI anomaly detection', 'Isolation Forest scoring flags unusual latency, error bursts, retry storms, and suspicious request shapes.', '/workflow'],
  [<BellRing size={24} />, 'Alert routing', 'Deduplicate anomalies and route critical events to Slack, email, PagerDuty, or your internal webhook.', '/settings'],
  [<Activity size={24} />, 'Service health timeline', 'Track throughput, anomaly rate, error budget burn, and rolling service status from one console.', '/rank'],
  [<Database size={24} />, 'Searchable retention', 'Persist structured logs for root cause analysis, audit review, and trend comparisons.', '/analytics'],
  [<Layers size={24} />, 'Operator dashboard', 'Correlate raw logs, scored anomalies, source clusters, and remediation actions without switching tools.', '/dashboard'],
];

const workflow = [
  ['01', 'Collect', 'Agents, Fluent Bit, or the REST API submit structured service logs.'],
  ['02', 'Validate', 'The API normalizes severity, timestamps, host metadata, response time, and error codes.'],
  ['03', 'Stream', 'Kafka buffers validated events so processors can scale without dropping traffic.'],
  ['04', 'Score', 'The ML worker enriches records and scores anomalies against Isolation Forest baselines.'],
  ['05', 'Alert', 'Rules combine model output, severity, and service context before notifying responders.'],
  ['06', 'Investigate', 'Operators jump from anomalies to raw logs, related services, and API traces.'],
];

const security = [
  [<ShieldCheck size={24} />, 'Defense by default', 'TLS for transport, scoped API keys, service identity checks, and least-privilege deployment boundaries.'],
  [<LockKeyhole size={24} />, 'Sensitive data control', 'PII redaction hooks and retention policies keep logs useful without exposing secrets.'],
  [<KeyRound size={24} />, 'Keyed API access', 'Every ingestion endpoint is designed for API-key authentication and audit-friendly ownership.'],
  [<ServerCog size={24} />, 'Operational hardening', 'Health checks, rate limits, and alert deduplication reduce noisy failures during incidents.'],
];

export const Features = () => (
  <section className="page">
    <div className="container">
      <PageHeader
        title="Everything needed to see, score, and resolve log anomalies."
        subtitle="A complete operations surface for ingestion, machine-learning detection, live dashboards, and response workflows."
      />

      <div className="kpi-grid" style={{ marginBottom: 32 }}>
        {[
          [<Terminal size={22} />, 'Live console', 'Browse /console with a working CLI and multi-cluster switching'],
          [<PieChart size={22} />, 'Full analytics', 'Hourly throughput, anomaly heatmaps, service distribution charts'],
          [<WorkflowIcon size={22} />, 'Pipeline view', 'Per-service uptime, anomaly trend deltas, throughput leaderboard'],
          [<ShieldCheck size={22} />, 'Security ready', 'Scoped API keys, PII redaction, webhook signing'],
        ].map(([icon, label, desc], i) => (
          <div key={label} className="kpi">
            <div className="kpi-icon">{icon}</div>
            <span className="kpi-label">{label}</span>
            <span className="kpi-value" style={{ fontSize: '0.92rem', fontWeight: 600, letterSpacing: 0 }}>{desc}</span>
          </div>
        ))}
      </div>

      <div className="feature-grid">
        {features.map(([icon, title, desc, to]) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} to={to} />
        ))}
      </div>
    </div>
  </section>
);

export const Workflow = () => (
  <section className="page">
    <div className="container">
      <PageHeader
        title="From raw service log to actionable incident."
        subtitle="LogSentinel keeps the pipeline clear: collect, validate, stream, score, alert, investigate."
      />
      <div className="workflow-list">
        {workflow.map(([num, title, desc], i) => (
          <motion.article
            key={title}
            className="workflow-step"
            initial={{ opacity: 0, x: -12 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: i * 0.06 }}
          >
            <span className="step-num">{num}</span>
            <div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
            <ArrowRight size={22} />
          </motion.article>
        ))}
      </div>
      <div style={{ marginTop: 42, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Link to="/console" className="pill-button primary">
          <Terminal size={16} /> Try the CLI console
        </Link>
        <Link to="/api-docs" className="pill-button">
          Read the API <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  </section>
);

export const Security = () => (
  <section className="page">
    <div className="container">
      <PageHeader
        title="Security controls for high-volume operational data."
        subtitle="LogSentinel is designed around protected ingestion, scoped access, safer retention, and reliable incident handling."
      />
      <div className="feature-grid">
        {security.map(([icon, title, desc]) => (
          <FeatureCard key={title} icon={icon} title={title} desc={desc} />
        ))}
      </div>
      <div className="workflow-list" style={{ marginTop: 24 }}>
        <motion.article
          className="workflow-step"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="icon-box">
            <GitBranch size={24} />
          </span>
          <div>
            <h3>Recommended deployment path</h3>
            <p>
              Put ingestion behind your API gateway, issue per-service API keys,
              keep Kafka private, and expose the dashboard through your existing
              SSO boundary.
            </p>
          </div>
          <WorkflowIcon size={24} />
        </motion.article>
        <motion.article
          className="workflow-step"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.08 }}
        >
          <span className="icon-box">
            <Zap size={24} />
          </span>
          <div>
            <h3>Incident response posture</h3>
            <p>
              Critical anomalies stay visible in the dashboard and console while
              alert webhooks carry the service, score, timestamp, and related log context.
            </p>
          </div>
          <ShieldCheck size={24} />
        </motion.article>
      </div>
      <div style={{ marginTop: 38 }}>
        <Link to="/settings" className="pill-button primary">
          <KeyRound size={16} /> Configure security settings
        </Link>
      </div>
    </div>
  </section>
);
