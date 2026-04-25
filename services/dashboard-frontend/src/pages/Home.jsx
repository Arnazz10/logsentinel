import React from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Activity, Terminal, Shield, Zap, BarChart3, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="pt-32 pb-20">
      <div className="container">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* Hero Content */}
          <div className="flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-[0.7rem] font-bold tracking-[0.25em] text-text-secondary uppercase mb-6 block">
                Cloud-Native AI Observability
              </span>
              <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] tracking-tight text-white mb-8">
                Detect the log patterns that break systems <span className="text-muted-foreground">before users feel them.</span>
              </h1>
              <p className="text-xl text-text-secondary leading-relaxed mb-10 max-w-lg">
                LogSentinel ingests logs in real time, streams them through Kafka, scores anomalies with Isolation Forest, and surfaces live service health in a single operations dashboard.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-16">
                <Link to="/dashboard" className="btn-primary">
                  Launch Dashboard
                  <Activity className="w-4 h-4 ml-1" />
                </Link>
                <button className="btn-secondary">
                  Explore Platform
                </button>
              </div>

              {/* Bottom Stats Grid */}
              <div className="grid grid-cols-3 gap-8">
                <StatItem label="Target Ingest throughput" value="10k/s" />
                <StatItem label="Anomaly alert latency goal" value="< 30s" />
                <StatItem label="Isolation Forest contamination" value="5%" />
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Live Platform Pulse */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex-1 w-full lg:max-w-md"
          >
            <div className="glass rounded-[2.5rem] p-8 border-white/10 relative overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-white">Live platform pulse</h3>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[0.7rem] font-bold text-green-500 uppercase tracking-wider">Operational</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <MetricCard label="Logs / second" value="42.40" />
                <MetricCard label="Anomaly rate" value="1.87%" />
                <MetricCard label="Logs last hour" value="152,640" />
                <MetricCard label="Total anomalies" value="286" />
              </div>

              {/* Mini Log Stream */}
              <div className="space-y-3">
                <LogLine level="ERROR" service="auth-service" msg="Database connection timeout after 5000ms" />
                <LogLine level="WARN" service="payment-service" msg="Retry storm detected against upstream billing provider" />
                <LogLine level="INFO" service="gateway" msg="Steady request flow observed across the last rolling window" />
              </div>

              {/* Background Glow inside card */}
              <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-accent-red opacity-10 blur-[80px] -z-10" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <span className="text-2xl font-bold text-white">{value}</span>
    <span className="text-[0.65rem] font-medium text-text-muted uppercase tracking-wider leading-tight">{label}</span>
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
    <span className="text-[0.7rem] font-medium text-text-muted uppercase tracking-wider mb-1 block">{label}</span>
    <span className="text-2xl font-bold text-white">{value}</span>
  </div>
);

const LogLine = ({ level, service, msg }) => {
  const levelColor = level === 'ERROR' ? 'text-red-500 bg-red-500/10' : level === 'WARN' ? 'text-yellow-500 bg-yellow-500/10' : 'text-green-500 bg-green-500/10';
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
      <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-md ${levelColor}`}>{level}</span>
      <div className="flex flex-col">
        <span className="text-[0.7rem] font-mono text-text-secondary">{service}: {msg}</span>
      </div>
    </div>
  );
};

export default Home;
