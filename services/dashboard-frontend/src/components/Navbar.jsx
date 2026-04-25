import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, BookOpen, Menu, Terminal, X } from 'lucide-react';

const links = [
  { to: '/features', label: 'Features' },
  { to: '/workflow', label: 'Workflow' },
  { to: '/security', label: 'Security' },
  { to: '/dashboard', label: 'Dashboard' },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const close = () => setOpen(false);

  return (
    <nav className="nav" aria-label="Primary navigation">
      <div className="container">
        <div className={`nav-inner ${open ? 'open' : ''}`}>
          <Link to="/" className="brand" onClick={close}>
            <span className="brand-dot" aria-hidden="true" />
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

          <div className="nav-links">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={close}
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="nav-actions">
            <Link to="/api-docs" className="nav-action" onClick={close}>
              <BookOpen size={16} />
              API Docs
            </Link>
            <Link to="/console" className="nav-action primary" onClick={close}>
              <Terminal size={16} />
              Open Console
            </Link>
            <Link to="/dashboard" className="nav-action" onClick={close}>
              <Activity size={16} />
              Live
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
