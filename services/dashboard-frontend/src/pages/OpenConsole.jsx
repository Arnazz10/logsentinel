import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Cpu, Shield, Zap, Search, ChevronRight, Play, Square, Settings } from 'lucide-react';

const OpenConsole = () => {
  const [activeTab, setActiveTab] = useState('raw');

  return (
    <div className="pt-24 min-h-screen bg-black">
      <div className="border-b border-white/5 bg-white/[0.02] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-accent-red" />
            <span className="text-sm font-bold text-white">LogSentinel Console</span>
          </div>
          <div className="flex items-center gap-1">
            <TabButton active={activeTab === 'raw'} onClick={() => setActiveTab('raw')}>Raw Stream</TabButton>
            <TabButton active={activeTab === 'anomalies'} onClick={() => setActiveTab('anomalies')}>Anomalies</TabButton>
            <TabButton active={activeTab === 'metrics'} onClick={() => setActiveTab('metrics')}>Live Metrics</TabButton>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 rounded-md">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[0.7rem] font-bold text-green-500 uppercase">Connected</span>
          </div>
          <Settings size={18} className="text-text-muted cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-white/[0.01] p-4">
          <h3 className="text-[0.65rem] font-bold text-text-muted uppercase tracking-widest mb-4">Clusters</h3>
          <div className="space-y-1">
            <ClusterItem active name="prod-cluster-01" region="us-east-1" />
            <ClusterItem name="staging-cluster" region="us-west-2" />
            <ClusterItem name="dev-sandbox" region="eu-central-1" />
          </div>
        </div>

        {/* Main Terminal View */}
        <div className="flex-1 bg-black p-6 font-mono text-[0.8rem] overflow-y-auto">
          <div className="text-text-muted mb-4">
            [SYS] LogSentinel Core v1.0.0 initialized.<br />
            [SYS] Connected to Kafka bootstrap servers at kafka:9092<br />
            [SYS] Isolation Forest model loaded. Contamination: 0.05<br />
            [SYS] Listening for raw-logs topic events...
          </div>
          <div className="space-y-1">
            <ConsoleLine time="19:35:01" level="INFO" service="auth" msg="User authenticated" />
            <ConsoleLine time="19:35:04" level="DEBUG" service="ingest" msg="Buffer flush complete" />
            <ConsoleLine time="19:35:08" level="ERROR" service="db" msg="Query execution timeout" anomaly />
            <ConsoleLine time="19:35:10" level="INFO" service="gateway" msg="GET /api/v1/health 200 OK" />
            <ConsoleLine time="19:35:12" level="INFO" service="ml" msg="Inference latency: 12ms" />
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ children, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white'
    }`}
  >
    {children}
  </button>
);

const ClusterItem = ({ name, region, active }) => (
  <div className={`p-3 rounded-xl cursor-pointer transition-all ${
    active ? 'bg-accent-red/10 border border-accent-red/20' : 'hover:bg-white/5 border border-transparent'
  }`}>
    <div className="text-xs font-bold text-white mb-1">{name}</div>
    <div className="text-[0.6rem] text-text-muted uppercase tracking-tighter">{region}</div>
  </div>
);

const ConsoleLine = ({ time, level, service, msg, anomaly }) => (
  <div className={`flex gap-4 p-1 hover:bg-white/5 rounded ${anomaly ? 'text-red-400 font-bold' : 'text-text-secondary'}`}>
    <span className="text-text-muted">[{time}]</span>
    <span className={`w-12 ${level === 'ERROR' ? 'text-red-500' : 'text-green-500'}`}>{level}</span>
    <span className="text-blue-400 w-16">{service}</span>
    <span>{msg}</span>
    {anomaly && <span className="ml-auto text-[0.6rem] bg-red-500 text-white px-2 py-0.5 rounded uppercase">Detected Anomaly</span>}
  </div>
);

export default OpenConsole;
