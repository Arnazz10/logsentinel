import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Copy, Terminal, Link2, Code2, ShieldCheck, Zap } from 'lucide-react';

const ApiDocs = () => {
  return (
    <div className="pt-32 pb-20 container">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="sticky top-40 space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 px-4">Endpoints</h3>
            <DocLink active>POST /ingest</DocLink>
            <DocLink>POST /ingest/batch</DocLink>
            <DocLink>GET /health</DocLink>
            <DocLink>GET /metrics</DocLink>
            <DocLink>POST /predict</DocLink>
            <DocLink>GET /logs</DocLink>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-3xl">
          <h1 className="text-5xl font-bold text-white mb-6">API Documentation</h1>
          <p className="text-xl text-text-secondary mb-12">
            Integration instructions for the LogSentinel ingestion and inference engine.
          </p>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Zap className="text-accent-red" /> Single Log Ingestion
            </h2>
            <div className="glass rounded-2xl p-6 mb-8 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-md">POST</span>
                  <code className="text-text-primary text-sm font-mono">/ingest</code>
                </div>
                <button className="text-text-muted hover:text-white transition-colors">
                  <Copy size={16} />
                </button>
              </div>
              <p className="text-text-secondary text-sm mb-6">
                Send a single structured log entry to the ingestion pipeline.
              </p>

              <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-text-secondary border border-white/5">
                <pre>{`{
  "service": "auth-service",
  "level": "ERROR",
  "message": "Connection timeout",
  "response_time_ms": 4500.0,
  "error_code": 503,
  "host": "pod-abc123"
}`}</pre>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <Code2 className="text-accent-orange" /> Authentication
            </h2>
            <p className="text-text-secondary mb-6">
              All requests must include your organization's API key in the header. You can find your key in the <span className="text-white font-medium">Security</span> tab of the console.
            </p>
            <div className="bg-black/50 rounded-xl p-4 font-mono text-xs text-text-primary border border-white/5">
              <code>X-API-KEY: ls_prod_842k_...</code>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

const DocLink = ({ children, active }) => (
  <div className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
    active ? 'bg-accent-red/10 text-accent-red' : 'text-text-secondary hover:text-white hover:bg-white/5'
  }`}>
    {children}
  </div>
);

export default ApiDocs;
