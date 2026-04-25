import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Terminal, ArrowRight } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 w-full z-50 py-6">
      <div className="container">
        <div className="glass rounded-[2rem] px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-accent-red" />
            <span className="text-xl font-bold tracking-tight text-white">LogSentinel</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink to="/features" active={isActive('/features')}>Features</NavLink>
            <NavLink to="/workflow" active={isActive('/workflow')}>Workflow</NavLink>
            <NavLink to="/security" active={isActive('/security')}>Security</NavLink>
            <NavLink to="/dashboard" active={isActive('/dashboard')}>Dashboard</NavLink>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4">
            <Link 
              to="/api-docs" 
              className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-white transition-colors"
            >
              API Docs
            </Link>
            <Link to="/console" className="btn-primary py-2 px-6 text-sm">
              Open Console
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavLink = ({ to, children, active }) => (
  <Link 
    to={to} 
    className={`nav-link ${active ? 'active' : ''}`}
  >
    {children}
  </Link>
);

export default Navbar;
