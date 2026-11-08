import { Link } from 'react-router-dom';
import { BrandMark } from './ui';
import { useLive } from '../lib/store';
import { fmtNum } from '../lib/engine';

export default function Footer() {
  const { totals } = useLive();
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-grid">
          <div>
            <div className="brand" style={{ marginBottom: 14 }}>
              <BrandMark /> LogSentinel
            </div>
            <p className="muted" style={{ fontSize: 13.5, maxWidth: 320, margin: 0 }}>
              Kafka-backed log ingestion, Isolation Forest anomaly scoring and alert routing — built to run on Kubernetes.
            </p>
            <p className="label" style={{ marginTop: 20 }}>
              this session · <b>{fmtNum(totals.processed)}</b> logs scored · <b className="t-signal">{totals.anomalies}</b> flagged
            </p>
          </div>
          <div>
            <h5>Operate</h5>
            <ul>
              <li><Link to="/live">Live</Link></li>
              <li><Link to="/incidents">Incidents</Link></li>
              <li><Link to="/pipelines">Pipelines</Link></li>
              <li><Link to="/console">Console</Link></li>
            </ul>
          </div>
          <div>
            <h5>Understand</h5>
            <ul>
              <li><Link to="/analytics">Analytics</Link></li>
              <li><Link to="/lab">Detector lab</Link></li>
              <li><Link to="/workflow">How it works</Link></li>
              <li><Link to="/features">Features</Link></li>
            </ul>
          </div>
          <div>
            <h5>Build</h5>
            <ul>
              <li><Link to="/api-docs">API reference</Link></li>
              <li><Link to="/security">Security</Link></li>
              <li><Link to="/settings">Settings</Link></li>
              <li><a href="https://github.com/Arnazz10/logsentinel" target="_blank" rel="noreferrer">GitHub ↗</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-word" aria-hidden="true">logsentinel</div>
        <div className="footer-bottom">
          <span>© 2026 Arnab Mal · MIT licensed</span>
          <span>FastAPI · Kafka · Elasticsearch · scikit-learn · Kubernetes · Terraform</span>
        </div>
      </div>
    </footer>
  );
}
