import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Home, Home as HomeIcon, Menu, PieChart, Settings as SettingsIcon, Terminal, TrendingUp, Workflow, X } from 'lucide-react';

const mainTabs = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/pipelines', label: 'Pipelines', icon: Workflow },
  { to: '/rank', label: 'Rank', icon: TrendingUp },
  { to: '/analytics', label: 'Analytics', icon: PieChart },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

const quickLinks = [
  { to: '/dashboard', label: 'Live Dashboard', icon: PieChart },
  { to: '/console', label: 'Open Console', icon: Terminal },
  { to: 'https://github.com/Arnazz10/logsentinel', label: 'GitHub', external: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = () => setOpen(false);

  const isTabActive = (to) => {
    if (to === '/') return location.pathname === '/';
    return location.pathname.startsWith(to);
  };

  return (
    <nav className="nav" aria-label="Primary navigation">
      <div className="container">
        <div className={`nav-inner ${open ? 'open' : ''}`}>
          <Link to="/" className="brand" onClick={close}>
            <span className="brand-badge">LS</span>
            <span>LogSentinel</span>
          </Link>

          <button
            className="mobile-toggle"
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="nav-tabs">
            {mainTabs.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={close}
                className={`nav-tab ${isTabActive(to) ? 'active' : ''}`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            {quickLinks.map(({ to, label, icon: Icon, external }) => (
              external ? (
                <a
                  key={to}
                  href={to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="icon-ghost"
                  aria-label={label}
                  title={label}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
              ) : (
                <Link
                  key={to}
                  to={to}
                  onClick={close}
                  className="icon-ghost"
                  aria-label={label}
                  title={label}
                >
                  <Icon size={17} />
                </Link>
              )
            ))}
            <button className="icon-ghost" aria-label="Notifications" title="Notifications">
              <Bell size={17} />
              <span className="notif-dot" />
            </button>
            <div className="avatar" title="Arnab Mal">
              <span>AM</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
