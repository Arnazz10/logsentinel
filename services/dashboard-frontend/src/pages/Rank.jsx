import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Cpu,
  Gauge,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from "lucide-react";

const ranks = [
  {
    service: "gateway",
    score: 98.6,
    anomalies: 8,
    throughput: 598,
    latency: 12,
    tier: "Leader",
  },
  {
    service: "auth-api",
    score: 97.2,
    anomalies: 5,
    throughput: 846,
    latency: 18,
    tier: "Leader",
  },
  {
    service: "payment-svc",
    score: 96.1,
    anomalies: 3,
    throughput: 389,
    latency: 55,
    tier: "Elite",
  },
  {
    service: "alert-mgr",
    score: 94.3,
    anomalies: 6,
    throughput: 412,
    latency: 28,
    tier: "Elite",
  },
  {
    service: "edge-proxy",
    score: 92.7,
    anomalies: 10,
    throughput: 510,
    latency: 8,
    tier: "Solid",
  },
  {
    service: "db-master",
    score: 90.4,
    anomalies: 15,
    throughput: 320,
    latency: 42,
    tier: "Solid",
  },
  {
    service: "ml-engine",
    score: 87.2,
    anomalies: 14,
    throughput: 836,
    latency: 65,
    tier: "At Risk",
  },
  {
    service: "data-services",
    score: 83.5,
    anomalies: 12,
    throughput: 265,
    latency: 78,
    tier: "At Risk",
  },
];

const tierClass = {
  Leader: "leader",
  Elite: "elite",
  Solid: "solid",
  "At Risk": "risk",
};

// Small SVG ring — score is displayed NEXT to it, not inside
function ScoreRing({ score }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4fa9ff" />
          <stop offset="100%" stopColor="#3fd2ff" />
        </linearGradient>
      </defs>
      <circle
        cx="18"
        cy="18"
        r={r}
        stroke="rgba(110,160,255,0.12)"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="18"
        cy="18"
        r={r}
        stroke="url(#rg)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 18 18)"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default function Rank() {
  const [live, setLive] = useState(ranks);
  const [tab, setTab] = useState("Reliability");

  useEffect(() => {
    const id = setInterval(() => {
      setLive((curr) =>
        curr.map((row) => ({
          ...row,
          score: Math.max(
            70,
            Math.min(99.9, row.score + (Math.random() - 0.5) * 0.8),
          ),
          latency: Math.max(
            2,
            row.latency + Math.floor((Math.random() - 0.5) * 6),
          ),
          throughput: Math.max(
            40,
            row.throughput + Math.floor((Math.random() - 0.5) * 20),
          ),
        })),
      );
    }, 2500);
    return () => clearInterval(id);
  }, []);

  const sorted = [...live].sort((a, b) => b.score - a.score);
  const avgScore = sorted.reduce((s, x) => s + x.score, 0) / sorted.length;
  const avgLatency = Math.round(
    sorted.reduce((s, x) => s + x.latency, 0) / sorted.length,
  );

  return (
    <section className="page">
      <div className="container">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Rankings</p>
            <h1>Service Reliability Rankings</h1>
            <p>
              Leaderboard powered by anomaly rate, latency, and throughput
              trends.
            </p>
          </div>
          <div className="row-actions">
            <div className="tab-list" style={{ gap: 4 }}>
              {["Reliability", "Throughput", "Anomaly Rate"].map((t) => (
                <button
                  key={t}
                  className={`tab-button ${tab === t ? "active" : ""}`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* KPI strip */}
        <div className="kpi-grid" style={{ marginBottom: 20 }}>
          <div className="kpi">
            <div className="kpi-icon">
              <Sparkles size={20} />
            </div>
            <span className="kpi-label">Top performer</span>
            <span className="kpi-value">{sorted[0].service}</span>
            <span className="kpi-delta up">
              <TrendingUp size={11} /> {sorted[0].score.toFixed(1)}
            </span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <ShieldCheck size={20} />
            </div>
            <span className="kpi-label">Avg reliability</span>
            <span className="kpi-value">{avgScore.toFixed(1)}</span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <AlertTriangle size={20} />
            </div>
            <span className="kpi-label">Services at risk</span>
            <span className="kpi-value">
              {sorted.filter((x) => x.tier === "At Risk").length}
            </span>
            <span className="kpi-delta down">
              <TrendingDown size={11} /> needs attention
            </span>
          </div>
          <div className="kpi">
            <div className="kpi-icon">
              <Zap size={20} />
            </div>
            <span className="kpi-label">Avg latency</span>
            <span className="kpi-value">{avgLatency}ms</span>
          </div>
        </div>

        {/* Leaderboard */}
        <section className="panel">
          <div className="panel-head">
            <h2>
              <Gauge size={18} /> Service Leaderboard
            </h2>
            <span className="status-pill">Live</span>
          </div>
          <table className="pipelines-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Service</th>
                <th>Score</th>
                <th>Tier</th>
                <th>Throughput</th>
                <th>Anomalies</th>
                <th>Latency</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <motion.tr
                  key={row.service}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Rank number */}
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <strong
                        style={{
                          fontSize: "1rem",
                          fontWeight: 800,
                          color: i < 3 ? "var(--cyan)" : "var(--dim)",
                          minWidth: 24,
                        }}
                      >
                        #{i + 1}
                      </strong>
                      {i === 0 && (
                        <Sparkles
                          size={14}
                          style={{ color: "var(--yellow)" }}
                        />
                      )}
                    </div>
                  </td>

                  {/* Service name */}
                  <td>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        className="avatar"
                        style={{ width: 34, height: 34, fontSize: "0.74rem" }}
                      >
                        {row.service.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong
                          style={{ display: "block", fontSize: "0.9rem" }}
                        >
                          {row.service}
                        </strong>
                        <span
                          style={{ fontSize: "0.74rem", color: "var(--dim)" }}
                        >
                          pipeline · live
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Score — ring beside number, no overlap */}
                  <td>
                    <div className="mini-ring">
                      <ScoreRing score={row.score} />
                      <strong>{row.score.toFixed(1)}</strong>
                    </div>
                  </td>

                  {/* Tier badge */}
                  <td>
                    <span className={`tier-badge ${tierClass[row.tier]}`}>
                      {row.tier}
                    </span>
                  </td>

                  {/* Throughput */}
                  <td>
                    <span
                      className={`level-trend ${row.throughput > 500 ? "up" : "down"}`}
                    >
                      {row.throughput > 500 ? (
                        <TrendingUp size={12} />
                      ) : (
                        <TrendingDown size={12} />
                      )}
                      {row.throughput}/s
                    </span>
                  </td>

                  {/* Anomalies */}
                  <td>
                    <span
                      className={`mini-chip ${row.anomalies > 10 ? "warn" : "ok"}`}
                    >
                      {row.anomalies}
                    </span>
                  </td>

                  {/* Latency */}
                  <td
                    style={{
                      color: row.latency > 50 ? "var(--orange)" : "var(--text)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.88rem",
                    }}
                  >
                    {row.latency}ms
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Info cards */}
        <div className="feature-grid" style={{ marginTop: 18 }}>
          <article className="feature-card">
            <span className="icon-box">
              <Activity size={20} />
            </span>
            <h3>Scoring formula</h3>
            <p>
              Reliability = 0.55 × (100 − anomaly_rate) + 0.25 ×
              throughput_zscore + 0.20 × (100 − latency_zscore).
            </p>
          </article>
          <article className="feature-card">
            <span className="icon-box">
              <Cpu size={20} />
            </span>
            <h3>Per-service baselines</h3>
            <p>
              Throughput and latency are compared against 28-day rolling
              baselines, not absolute numbers, to be fair across services.
            </p>
          </article>
          <article className="feature-card">
            <span className="icon-box">
              <Gauge size={20} />
            </span>
            <h3>Tier progression</h3>
            <p>
              At Risk → Solid → Elite → Leader. Tiers auto-update every 5
              minutes based on the live reliability score.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
