import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Command, Menu, Pause, Play, Settings, X } from 'lucide-react';
import { BrandMark } from './ui';
import { useLive } from '../lib/store';

const PRIMARY = [
  { to: '/', label: 'Overview', end: true },
  { to: '/live', label: 'Live' },
  { to: '/pipelines', label: 'Pipelines' },
  { to: '/incidents', label: 'Incidents', badge: true },
  { to: '/analytics', label: 'Analytics' },
  { to: '/lab', label: 'Detector Lab' },
  { to: '/rank', label: 'Rank', secondary: true },
  { to: '/console', label: 'Console', secondary: true },
];

const MORE = [
  { to: '/api-docs', label: 'API reference' },
  { to: '/features', label: 'Features' },
  { to: '/workflow', label: 'How it works' },
  { to: '/security', label: 'Security' },
  { to: '/settings', label: 'Settings' },
];

export default function Navbar({ onPalette }) {
  const { incidents, series, connection, settings, setSettings } = useLive();
  const [more, setMore] = useState(false);
  const [mobile, setMobile] = useState(false);
  const loc = useLocation();
  const moreRef = useRef(null);
  const open = incidents.filter((i) => i.status !== 'resolved').length;
  const last = series.slice(-5);
  const rate = last.reduce((a, b) => a + b.total, 0) / Math.max(1, last.length) / (settings.tickMs / 1000);

  useEffect(() => {
    setMore(false);
    setMobile(false);
  }, [loc.pathname]);

  useEffect(() => {
    const onDoc = (e) => moreRef.current && !moreRef.current.contains(e.target) && setMore(false);
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const statusColor = settings.paused ? 'var(--dim)' : connection.mode === 'live' ? 'var(--ok)' : connection.mode === 'error' ? 'var(--signal)' : 'var(--amber)';

  return (
    <nav className="nav" aria-label="Primary">
      <div className="wrap nav-inner">
        <Link to="/" className="brand">
          <BrandMark />
          <span>LogSentinel</span>
        </Link>

        <div className="nav-links">
          {PRIMARY.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''} ${l.secondary ? 'secondary' : ''}`}>
              {l.label}
              {l.badge && open > 0 && <span className="count">{open}</span>}
            </NavLink>
          ))}
          <div className="nav-more" ref={moreRef}>
            <button type="button" className="nav-link" style={{ background: 'none', border: 0 }} onClick={() => setMore((v) => !v)} aria-expanded={more}>
              More <ChevronDown size={13} style={{ marginLeft: 4 }} />
            </button>
            {more && (
              <div className="menu">
                {MORE.map((m) => (
                  <Link key={m.to} to={m.to}>
                    {m.label}
                  </Link>
                ))}
                <div className="sep" />
                <a href="https://github.com/Arnazz10/logsentinel" target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="nav-status"
            title={connection.detail}
            onClick={() => setSettings({ paused: !settings.paused })}
            style={{ background: 'transparent', cursor: 'pointer' }}
          >
            <span className={`dot ${settings.paused ? '' : 'live'}`} style={{ color: statusColor }} />
            <span className="txt">{settings.paused ? 'paused' : connection.mode === 'live' ? 'live api' : 'simulated'}</span>
            <span>{settings.paused ? <Play size={11} /> : `${rate.toFixed(1)}/s`}</span>
            {!settings.paused && <Pause size={11} className="txt" />}
          </button>
          <button type="button" className="icon-btn" onClick={onPalette} aria-label="Command palette" title="Command palette (Ctrl+K)">
            <Command size={15} />
          </button>
          <Link to="/settings" className="icon-btn" aria-label="Settings" title="Settings">
            <Settings size={15} />
          </Link>
          <button type="button" className="icon-btn mobile-only" onClick={() => setMobile((v) => !v)} aria-label="Menu">
            {mobile ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>
      {mobile && (
        <div className="wrap" style={{ paddingBottom: 12, display: 'grid', gap: 2 }}>
          {[...PRIMARY, ...MORE].map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} style={{ height: 40 }}>
              {l.label}
              {l.badge && open > 0 && <span className="count">{open}</span>}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
