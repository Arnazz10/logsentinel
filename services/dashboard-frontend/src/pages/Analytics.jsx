import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BellRing,
  Database,
  Eye,
  Layers,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const hourlyLogs = [
  320, 480, 290, 620, 410, 870, 530, 680, 370, 210, 580, 470, 710, 540, 820,
  610, 430, 290, 760, 520, 640, 490, 810, 370,
];
const hourlyAnom = [
  8, 12, 5, 22, 14, 38, 24, 28, 11, 6, 30, 19, 41, 22, 35, 18, 13, 7, 34, 21,
  29, 16, 39, 12,
];

const levels = [
  ["INFO", 68, "rgba(79,169,255,0.85)"],
  ["WARN", 18, "rgba(247,185,85,0.85)"],
  ["ERROR", 10, "rgba(255,90,106,0.85)"],
  ["DEBUG", 4, "rgba(108,139,255,0.85)"],
];

const serviceDist = [
  ["gateway", 24, "#4fa9ff"],
  ["auth-api", 18, "#6ab7ff"],
  ["ml-engine", 15, "#a78bfa"],
  ["payment-svc", 14, "#3fd2ff"],
  ["data-services", 11, "#3ddc97"],
  ["db-master", 9, "#f7b955"],
  ["alert-mgr", 6, "#ff9a52"],
  ["edge-proxy", 3, "#ff5a6a"],
];

export default function Analytics() {
  const [logs, setLogs] = useState(hourlyLogs);
  const [anoms, setAnoms] = useState(hourlyAnom);
  const [range, setRange] = useState("24h");
  const [kpi, setKpi] = useState({
    ingest: 148520,
    anomaly: 2847,
    latency: 18,
    uptime: 99.94,
  });

  useEffect(() => {
    const id = setInterval(() => {
      setLogs((curr) => {
        const next = [...curr.slice(1)];
        next.push(
          Math.max(
            80,
            curr[curr.length - 1] + Math.floor((Math.random() - 0.4) * 120),
          ),
        );
        return next;
      });
      setAnoms((curr) => {
        const next = [...curr.slice(1)];
        next.push(
          Math.max(
            2,
            curr[curr.length - 1] + Math.floor((Math.random() - 0.5) * 8),
          ),
        );
        return next;
      });
      setKpi((k) => ({
        ingest: k.ingest + Math.floor(Math.random() * 120),
        anomaly: k.anomaly + (Math.random() > 0.7 ? 1 : 0),
        latency: Math.max(4, k.latency + Math.floor((Math.random() - 0.5) * 4)),
        uptime: Math.max(
          99.7,
          Math.min(99.999, k.uptime + (Math.random() - 0.5) * 0.01),
        ),
      }));
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const maxLog = Math.max(...logs);
  const totalAnom = anoms.reduce((s, x) => s + x, 0);
  const totalLogs = logs.reduce((s, x) => s + x, 0);

  // Build pie segments
  let cumPct = 0;
  const pctPie = levels.map(([label, pct, color]) => {
    const start = cumPct;
    cumPct += pct;
    return { label, pct, color, start };
  });

  return (
    <section className="page">
      <div className="container">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Analytics</p>
            <h1>Log Analytics Overview</h1>
            <p>
              Hourly throughput, anomaly patterns, level distribution and
              service breakdown.
            </p>
          </div>
          <div className="row-actions">
            <div className="tab-list" style={{ gap: 4 }}>
              {["1h", "6h", "24h", "7d"].map((r) => (
                <button
                  key={r}
                  className={`tab-button ${range === r ? "active" : ""}`}
                  onClick={() => setRange(r)}
                  type="button"
                >
                  {r}
                </button>
              ))}
            </div>
            <button className="pill-button primary">
              <BarChart3 size={15} /> Export
            </button>
          </div>
        </header>

        {/* KPI row */}
        <div className="kpi-grid" style={{ marginBottom: 18 }}>
          <div className="kpi">
            <div className="kpi-icon">
              <Database size={20} />
            </div>
            <span className="kpi-label">Logs ingested ({range})</span>
            <span className="kpi-value">{kpi.ingest.toLocaleString()}</span>
            <span className="kpi-delta up">
              <TrendingUp size={11} /> +12.4% vs last
            </span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <AlertTriangle size={20} />
            </div>
            <span className="kpi-label">Anomalies ({range})</span>
            <span className="kpi-value">{kpi.anomaly.toLocaleString()}</span>
            <span className="kpi-delta down">
              <TrendingDown size={11} /> −3.2% vs last
            </span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <Zap size={20} />
            </div>
            <span className="kpi-label">Avg ingest latency</span>
            <span className="kpi-value">{kpi.latency}ms</span>
            <span className="kpi-delta up">
              <TrendingUp size={11} /> p95 42ms
            </span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <ShieldCheck size={20} />
            </div>
            <span className="kpi-label">Pipeline uptime</span>
            <span className="kpi-value">{kpi.uptime.toFixed(3)}%</span>
            <span className="kpi-delta up">
              <Eye size={11} /> 1 incident
            </span>
          </div>
        </div>

        {/* Charts row 1 */}
        <div className="ops-grid" style={{ marginBottom: 16 }}>
          {/* Bar chart */}
          <section className="panel">
            <div className="panel-head">
              <h2>
                <Activity size={18} /> Log throughput · anomalies ({range})
              </h2>
              <span className="status-pill">Live</span>
            </div>
            <div
              style={{
                position: "relative",
                height: 240,
                padding: "18px 6px 28px",
              }}
            >
              <div className="big-chart">
                {logs.map((v, i) => (
                  <motion.div
                    key={`l-${i}`}
                    className="big-bar log"
                    style={{ height: `${(v / maxLog) * 100}%` }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    title={`${logs[i]} logs · ${anoms[i]} anomalies`}
                  />
                ))}
              </div>
              <div className="big-chart overlay">
                {anoms.map((v, i) => (
                  <motion.div
                    key={`a-${i}`}
                    className="big-bar anomaly"
                    style={{ height: `${(v / 45) * 100}%` }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.015 + 0.08 }}
                  />
                ))}
              </div>
              <div className="chart-labels">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>23:59</span>
              </div>
            </div>
            <div className="legend-row" style={{ paddingLeft: 6 }}>
              <span className="legend">
                <i
                  style={{
                    background: "linear-gradient(180deg,#4fa9ff,#2a7aff)",
                  }}
                />
                Log throughput
              </span>
              <span className="legend">
                <i
                  style={{
                    background: "linear-gradient(180deg,#ff9a52,#ff5a6a)",
                  }}
                />
                Anomalies
              </span>
            </div>
          </section>

          {/* Pie chart */}
          <section className="panel">
            <div className="panel-head">
              <h2>
                <PieChartIcon size={18} /> Level distribution
              </h2>
              <span className="status-pill">
                {totalLogs.toLocaleString()} events
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr",
                gap: 24,
                alignItems: "center",
                padding: "8px 0",
              }}
            >
              {/* Donut */}
              <div style={{ position: "relative", width: 160, height: 160 }}>
                <svg viewBox="0 0 42 42" width="160" height="160">
                  <circle
                    cx="21"
                    cy="21"
                    r="15.9"
                    fill="none"
                    stroke="rgba(110,160,255,0.08)"
                    strokeWidth="6"
                  />
                  {pctPie.map(({ label, pct, color, start }) => {
                    const dashArray = `${pct * 0.995} ${100 - pct}`;
                    const dashOffset = 25 - start * 0.995;
                    return (
                      <circle
                        key={label}
                        cx="21"
                        cy="21"
                        r="15.9"
                        fill="transparent"
                        strokeWidth="6"
                        stroke={color}
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        transform="rotate(-90 21 21)"
                        strokeLinecap="butt"
                      />
                    );
                  })}
                </svg>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "1.45rem",
                        fontWeight: 800,
                        letterSpacing: "-0.03em",
                        color: "#fff",
                      }}
                    >
                      {((totalAnom / totalLogs) * 100).toFixed(2)}%
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--dim)",
                        fontWeight: 600,
                      }}
                    >
                      anomaly rate
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="pie-legend">
                {levels.map(([label, pct, color]) => (
                  <div key={label} className="pie-legend-row">
                    <span>
                      <i style={{ background: color, borderRadius: "50%" }} />
                      {label}
                    </span>
                    <strong>{pct}%</strong>
                    <div className="mini-bar">
                      <div style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Charts row 2 */}
        <div className="ops-grid">
          {/* Service distribution — FIXED: horizontal rows with bar */}
          <section className="panel">
            <div className="panel-head">
              <h2>
                <Layers size={18} /> Service log share
              </h2>
              <span className="status-pill">Top 8</span>
            </div>
            <div className="service-dist-list">
              {serviceDist.map(([svc, pct, color], i) => (
                <motion.div
                  key={svc}
                  className="svc-row"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <div className="svc-row-head">
                    {/* Colored dot instead of large avatar */}
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: color,
                        boxShadow: `0 0 8px ${color}`,
                        flexShrink: 0,
                      }}
                    />
                    <strong>{svc}</strong>
                    <span
                      className="mini-chip"
                      style={{
                        marginLeft: "auto",
                        color,
                        background: `${color}18`,
                        borderColor: `${color}35`,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="dist-bar">
                    <div
                      style={{
                        width: `${pct * 4}%`,
                        background: `linear-gradient(90deg, ${color}cc, ${color})`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Heatmap */}
          <section className="panel">
            <div className="panel-head">
              <h2>
                <BellRing size={18} /> Anomaly heatmap
              </h2>
              <span className="status-pill">Day × Hour</span>
            </div>
            <div className="heatmap">
              {Array.from({ length: 7 * 24 }).map((_, i) => {
                const intensity = Math.random();
                const color =
                  intensity > 0.7
                    ? "255,90,106"
                    : intensity > 0.4
                      ? "247,185,85"
                      : "79,169,255";
                return (
                  <div
                    key={i}
                    className="heat-cell"
                    style={{
                      opacity: 0.12 + intensity * 0.88,
                      background: `rgba(${color},0.9)`,
                    }}
                    title={`Intensity: ${Math.round(intensity * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="heatmap-legend">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            {/* Intensity legend */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 14,
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--dim)",
                  fontWeight: 600,
                }}
              >
                Low
              </span>
              <div
                style={{
                  flex: 1,
                  height: 5,
                  borderRadius: 999,
                  background:
                    "linear-gradient(90deg, rgba(79,169,255,0.6), rgba(247,185,85,0.8), rgba(255,90,106,0.95))",
                }}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--dim)",
                  fontWeight: 600,
                }}
              >
                High
              </span>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
