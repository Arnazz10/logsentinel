import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="pt-20 pb-10 border-t border-white/5 bg-black/50">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full bg-accent-red" />
              <span className="text-xl font-bold tracking-tight text-white">LogSentinel</span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed mb-6">
              The next-generation observability platform for cloud-native infrastructure and AI-driven anomaly detection.
            </p>
            <div className="flex gap-4">
              <SocialLink icon={<Github size={18} />} />
              <SocialLink icon={<Twitter size={18} />} />
              <SocialLink icon={<Linkedin size={18} />} />
            </div>
          </div>

          <div className="md:ml-auto">
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4">
              <FooterLink to="/features">Features</FooterLink>
              <FooterLink to="/workflow">Workflow</FooterLink>
              <FooterLink to="/security">Security</FooterLink>
              <FooterLink to="/dashboard">Dashboard</FooterLink>
            </ul>
          </div>

          <div className="md:ml-auto">
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4">
              <FooterLink to="/api-docs">API Docs</FooterLink>
              <FooterLink to="/console">Open Console</FooterLink>
              <FooterLink to="/">Pricing</FooterLink>
              <FooterLink to="/">Docs</FooterLink>
            </ul>
          </div>

          <div className="md:ml-auto">
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4">
              <FooterLink to="/">Privacy</FooterLink>
              <FooterLink to="/">Terms</FooterLink>
              <FooterLink to="/">Compliance</FooterLink>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-text-muted text-xs">
            © 2026 LogSentinel Platform. All rights reserved. Built with ❤️ for cloud engineers.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-text-muted flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-text-secondary hover:text-white transition-colors text-sm">
      {children}
    </Link>
  </li>
);

const SocialLink = ({ icon }) => (
  <a href="#" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-muted hover:text-white hover:bg-white/10 transition-all">
    {icon}
  </a>
);

export default Footer;
