import { Link } from 'react-router-dom';
import { Activity, Code2, ShieldCheck, Terminal, TrendingUp, Workflow } from 'lucide-react';

const groups = [
  {
    title: 'Product',
    links: [
      ['Home', '/'],
      ['Pipelines', '/pipelines'],
      ['Dashboard', '/dashboard'],
      ['Analytics', '/analytics'],
      ['Rankings', '/rank'],
    ],
  },
  {
    title: 'Platform',
    links: [
      ['Features', '/features'],
      ['Workflow', '/workflow'],
      ['Security', '/security'],
      ['API Docs', '/api-docs'],
      ['Open Console', '/console'],
    ],
  },
  {
    title: 'Operations',
    links: [
      ['Kafka Ingest', '/workflow'],
      ['Anomaly Model', '/features'],
      ['Alert Routing', '/settings'],
      ['Health Checks', '/api-docs'],
      ['Workspace Settings', '/settings'],
    ],
  },
];

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div>
          <Link to="/" className="brand">
            <span className="brand-badge">LS</span>
            <span>LogSentinel</span>
          </Link>
          <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.6 }}>
            Cloud-native log ingestion, AI anomaly scoring, alert routing, and
            operator workflows in one real-time dashboard.
          </p>
          <div className="row-actions" style={{ marginTop: 16, gap: 8 }}>
            <Link className="icon-ghost" to="/dashboard" aria-label="Live dashboard" title="Live dashboard">
              <Activity size={17} />
            </Link>
            <Link className="icon-ghost" to="/security" aria-label="Security" title="Security">
              <ShieldCheck size={17} />
            </Link>
            <Link className="icon-ghost" to="/console" aria-label="Console" title="Open Console">
              <Terminal size={17} />
            </Link>
            <Link className="icon-ghost" to="/pipelines" aria-label="Pipelines" title="Pipelines">
              <Workflow size={17} />
            </Link>
            <Link className="icon-ghost" to="/rank" aria-label="Rank" title="Rankings">
              <TrendingUp size={17} />
            </Link>
            <a className="icon-ghost" href="https://github.com/Arnazz10/logsentinel" aria-label="Source repository" title="GitHub" target="_blank" rel="noopener noreferrer">
              <Code2 size={17} />
            </a>
          </div>
        </div>

        {groups.map((group) => (
          <div key={group.title}>
            <h4>{group.title}</h4>
            <div className="footer-links">
              {group.links.map(([label, to]) => (
                <Link key={label} to={to}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>© 2026 LogSentinel Platform. Built for live service operations.</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--green)', boxShadow: '0 0 10px var(--green)' }} />
          All systems operational
        </span>
      </div>
    </div>
  </footer>
);

export default Footer;
