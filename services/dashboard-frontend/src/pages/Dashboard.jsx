import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Shield, Terminal, Search, Filter, Download, Trash2, RefreshCcw, Bell, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const Dashboard = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    total: 124502,
    anomalies: 42,
    throughput: "850/s",
    health: "99.9%"
  });

  // Simulation for live logs
  useEffect(() => {
    const mockLogs = [
      { id: 1, time: '19:23:01', service: 'auth-api', level: 'INFO', msg: 'User login successful: user_842', anomaly: false },
      { id: 2, time: '19:23:04', service: 'payment-svc', level: 'ERROR', msg: 'Stripe API timeout after 10s', anomaly: true },
      { id: 3, time: '19:23:05', service: 'gateway', level: 'WARN', msg: 'High latency detected on /v1/ingest', anomaly: false },
      { id: 4, time: '19:23:10', service: 'db-master', level: 'INFO', msg: 'Replica lag synchronized', anomaly: false },
      { id: 5, time: '19:23:12', service: 'ml-engine', level: 'INFO', msg: 'Inference batch complete (200 records)', anomaly: false },
      { id: 6, time: '19:23:15', service: 'alert-mgr', level: 'ERROR', msg: 'Slack webhook failed: 403 Forbidden', anomaly: true },
    ];
    setLogs(mockLogs);

    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        service: ['auth-api', 'gateway', 'payment-svc', 'db-master'][Math.floor(Math.random() * 4)],
        level: ['INFO', 'INFO', 'INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 5)],
        msg: 'Live stream telemetry data point ' + Math.floor(Math.random() * 1000),
        anomaly: Math.random() > 0.9
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pt-32 pb-20 container">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Operations Center</h1>
            <p className="text-text-secondary">Real-time log analysis and anomaly detection</p>
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary flex items-center gap-2 py-2 px-4">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="btn-primary py-2 px-6">
              Connect New Source
            </button>
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard icon={<Activity />} label="Ingestion Rate" value={stats.throughput} color="text-blue-500" />
          <StatCard icon={<Shield />} label="Security Health" value={stats.health} color="text-green-500" />
          <StatCard icon={<AlertTriangle />} label="Active Anomalies" value={stats.anomalies} color="text-red-500" />
          <StatCard icon={<Database />} label="Total Records" value={stats.total.toLocaleString()} color="text-purple-500" />
        </div>

        {/* Main Console Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logs Stream */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 flex flex-col h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5 text-accent-red" />
                <h2 className="text-lg font-semibold text-white">System Logs</h2>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent-red transition-all w-64"
                  />
                </div>
                <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <Filter className="w-4 h-4 text-text-secondary" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 font-mono text-xs">
              {logs.map(log => (
                <div 
                  key={log.id} 
                  className={`grid grid-cols-[100px_120px_80px_1fr] gap-4 p-3 rounded-lg border transition-colors ${
                    log.anomaly ? 'bg-red-500/10 border-red-500/20' : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]'
                  }`}
                >
                  <span className="text-text-muted">{log.time}</span>
                  <span className="font-bold text-text-secondary">[{log.service}]</span>
                  <span className={`font-bold ${log.level === 'ERROR' ? 'text-red-500' : log.level === 'WARN' ? 'text-yellow-500' : 'text-green-500'}`}>
                    {log.level}
                  </span>
                  <span className="text-text-primary flex items-center justify-between">
                    {log.msg}
                    {log.anomaly && <span className="bg-red-500 text-white text-[0.6rem] px-2 py-0.5 rounded-full animate-pulse">ANOMALY</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Side Panel: Active Alerts */}
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-5 h-5 text-accent-orange" />
              <h2 className="text-lg font-semibold text-white">Active Alerts</h2>
            </div>

            <div className="space-y-4">
              <AlertItem 
                type="CRITICAL" 
                title="Potential Brute Force" 
                msg="Multiple failed logins from 192.168.1.45" 
                time="2m ago" 
              />
              <AlertItem 
                type="WARNING" 
                title="High Consumer Lag" 
                msg="Log Processor lag exceeded 50,000 records" 
                time="15m ago" 
              />
              <AlertItem 
                type="INFO" 
                title="Model Retrained" 
                msg="Isolation Forest model updated with latest dataset" 
                time="1h ago" 
              />
            </div>

            <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-white/10 text-text-muted hover:text-white hover:border-white/20 transition-all text-sm">
              View Alert History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="glass rounded-2xl p-6 border-white/5">
    <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${color}`}>
      {React.cloneElement(icon, { size: 20 })}
    </div>
    <span className="text-sm font-medium text-text-muted uppercase tracking-wider">{label}</span>
    <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
  </div>
);

const AlertItem = ({ type, title, msg, time }) => {
  const colors = type === 'CRITICAL' ? 'bg-red-500' : type === 'WARNING' ? 'bg-orange-500' : 'bg-blue-500';
  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors}`} />
          <span className="text-xs font-bold text-white">{title}</span>
        </div>
        <span className="text-[0.7rem] text-text-muted">{time}</span>
      </div>
      <p className="text-[0.8rem] text-text-secondary leading-relaxed">{msg}</p>
    </div>
  );
};

export default Dashboard;
