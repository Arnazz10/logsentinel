import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  Terminal,
  TrendingDown,
  TrendingUp,
  Workflow,
  Zap,
} from "lucide-react";

const genSpark = (base, amplitude = 20, points = 28) => {
  const arr = [];
  let v = base;
  for (let i = 0; i < points; i++) {
    v = Math.max(
      base * 0.4,
      Math.min(base * 1.6, v + (Math.random() - 0.5) * amplitude),
    );
    arr.push(v);
  }
  return arr;
};

const statCards = [
  {
    label: "Logs Processed",
    value: 8835,
    goal: 8000,
    avg: 9450,
    color: "#4fa9ff",
    data: genSpark(400, 90, 28),
    icon: Activity,
  },
  {
    label: "Alert Latency",
    value: "1h 48m",
    valueNum: 108,
    goal: "1h 30m",
    avg: "1h 17m",
    color: "#3fd2ff",
    data: genSpark(110, 35, 28),
    icon: Zap,
    inverse: true,
  },
  {
    label: "Anomalies Detected",
    value: 850,
    goal: 600,
    avg: 748,
    color: "#a78bfa",
    data: genSpark(350, 120, 28),
    icon: ShieldCheck,
  },
];

const topPipelines = [
  ["auth-api", 12450, 846, 32, 5, 99.98],
  ["gateway", 16300, 598, 26, 8, 99.95],
  ["payment-svc", 12980, 389, 13, 3, 99.99],
  ["data-services", 10984, 265, -11, 12, 99.9],
  ["ml-engine", 5578, 836, -8, 14, 99.93],
];

const toPath = (pts, w, h, pad = 6) => {
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = (w - pad * 2) / (pts.length - 1);
  return pts
    .map((v, i) => {
      const x = pad + i * step;
      const y = h - pad - ((v - min) / span) * (h - pad * 2);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const toArea = (pts, w, h, pad = 6) => {
  const line = toPath(pts, w, h, pad);
  const step = (w - pad * 2) / (pts.length - 1);
  const endX = pad + (pts.length - 1) * step;
  return `${line} L${endX.toFixed(2)},${h - pad} L${pad},${h - pad} Z`;
};

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay },
});

export default function Home() {
  const [stats, setStats] = useState(statCards);
  const [weekly, setWeekly] = useState(56);
  const [total, setTotal] = useState(236);
  const [score, setScore] = useState(7.4);
  const [release, setRelease] = useState(80);
  const [live, setLive] = useState(topPipelines);

  useEffect(() => {
    const id = setInterval(() => {
      setStats((curr) =>
        curr.map((s) => ({
          ...s,
          data: [
            ...s.data.slice(1),
            s.data[s.data.length - 1] + (Math.random() - 0.5) * 60,
          ],
          value:
            typeof s.value === "number"
              ? Math.max(100, s.value + Math.floor((Math.random() - 0.4) * 40))
              : s.value,
        })),
      );
      setWeekly((w) => Math.min(92, w + (Math.random() > 0.5 ? 1 : 0)));
      setTotal((t) => t + (Math.random() > 0.7 ? 1 : 0));
      setScore((s) =>
        Math.max(6.5, Math.min(8.6, s + (Math.random() - 0.5) * 0.15)),
      );
      setRelease((r) => Math.min(94, r + (Math.random() > 0.88 ? 1 : 0)));
      setLive((arr) =>
        arr.map((row) => [
          row[0],
          row[1] + Math.floor(Math.random() * 20),
          Math.max(40, row[2] + Math.floor((Math.random() - 0.5) * 18)),
          Math.max(
            -25,
            Math.min(60, row[3] + Math.floor((Math.random() - 0.5) * 4)),
          ),
          row[4],
          Math.max(
            99.5,
            Math.min(99.999, row[5] + (Math.random() - 0.5) * 0.02),
          ),
        ]),
      );
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const circumference = 2 * Math.PI * 52;
  const scoreOffset = circumference - (score / 10) * circumference;

  return (
    <section className="page" style={{ paddingTop: 120 }}>
      <div className="container home-grid">
        {/* ── Left: Hero ─────────────────────────────────────────────── */}
        <div className="home-hero">
          <motion.div {...fade(0)}>
            <p className="eyebrow">AI-Powered Log Intelligence</p>
            <h1
              style={{
                maxWidth: 520,
                margin: 0,
                fontSize: "clamp(2.4rem, 3.2vw, 3.5rem)",
                lineHeight: 1.07,
                letterSpacing: "-0.038em",
                fontWeight: 800,
                background:
                  "linear-gradient(160deg, #ffffff 0%, #c0d8ff 45%, #8aaeff 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Detect the log patterns that break systems.
            </h1>
          </motion.div>

          <motion.p className="home-sub" {...fade(0.08)}>
            LogSentinel ingests, scores, and surfaces real-time anomalies from
            every service pipeline — before users feel the impact.
          </motion.p>

          <motion.div className="cta-row" {...fade(0.14)}>
            <Link to="/dashboard" className="cta-button">
              Open Dashboard <ArrowRight size={18} />
            </Link>
            <Link to="/console" className="cta-button ghost">
              <Terminal size={17} /> Live Console
            </Link>
          </motion.div>

          {/* KPI strip */}
          <motion.div
            {...fade(0.2)}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              marginTop: 36,
            }}
          >
            {[
              { label: "Services monitored", value: "12", color: "#4fa9ff" },
              { label: "Anomalies today", value: "47", color: "#a78bfa" },
              { label: "Pipeline uptime", value: "99.97%", color: "#3ddc97" },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  padding: "16px 18px",
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "rgba(10,17,36,0.7)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 800,
                    color,
                    letterSpacing: "-0.03em",
                  }}
                >
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "0.76rem",
                    color: "var(--dim)",
                    fontWeight: 600,
                    marginTop: 4,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Stat cards */}
          <div className="stats-row" style={{ marginTop: 18 }}>
            {stats.map((card, i) => {
              const Icon = card.icon;
              const w = 240,
                h = 56;
              const id = `sp-${i}`;
              return (
                <motion.div
                  key={card.label}
                  className="stat-card"
                  {...fade(0.1 + i * 0.06)}
                  style={{ "--card-color": card.color }}
                >
                  <div className="stat-card-label">
                    <span>{card.label}</span>
                    <Icon size={15} style={{ color: card.color }} />
                  </div>
                  <div className="sparkline">
                    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
                      <defs>
                        <linearGradient
                          id={`${id}-fill`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor={card.color}
                            stopOpacity="0.5"
                          />
                          <stop
                            offset="100%"
                            stopColor={card.color}
                            stopOpacity="0"
                          />
                        </linearGradient>
                        <linearGradient
                          id={`${id}-stroke`}
                          x1="0"
                          y1="0"
                          x2="1"
                          y2="0"
                        >
                          <stop
                            offset="0%"
                            stopColor={card.color}
                            stopOpacity="0.4"
                          />
                          <stop offset="100%" stopColor={card.color} />
                        </linearGradient>
                      </defs>
                      <path
                        className="spark-area"
                        d={toArea(card.data, w, h)}
                        fill={`url(#${id}-fill)`}
                      />
                      <path
                        className="spark-line"
                        d={toPath(card.data, w, h)}
                        stroke={`url(#${id}-stroke)`}
                      />
                    </svg>
                  </div>
                  <div className="stat-card-value">
                    {typeof card.value === "number"
                      ? card.value.toLocaleString()
                      : card.value}
                  </div>
                  <div className="dashed-sep" />
                  <div className="stat-meta">
                    <div className="stat-meta-row">
                      <span className="meta-label">Goal</span>
                      <span className="meta-value">
                        {typeof card.goal === "number"
                          ? card.goal.toLocaleString()
                          : card.goal}
                      </span>
                    </div>
                    <div className="stat-meta-row">
                      <span className="meta-label">Avg</span>
                      <span className="meta-value">
                        {typeof card.avg === "number"
                          ? card.avg.toLocaleString()
                          : card.avg}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Progress cards */}
          <div className="progress-row">
            <motion.div className="progress-card" {...fade(0.3)}>
              <div className="p-icon blue">
                <Workflow size={22} />
              </div>
              <div className="p-info">
                <h3>Weekly pipelines</h3>
                <strong>{weekly}</strong>
                <div className="track-wrap" style={{ marginTop: 8 }}>
                  <div
                    className="track-bar blue"
                    style={{ width: `${(weekly / 92) * 100}%` }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--dim)",
                    fontWeight: 600,
                  }}
                >
                  of 92
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--blue-2)",
                    marginTop: 4,
                  }}
                >
                  {((weekly / 92) * 100).toFixed(0)}%
                </div>
              </div>
            </motion.div>

            <motion.div className="progress-card" {...fade(0.34)}>
              <div className="p-icon orange">
                <Activity size={22} />
              </div>
              <div className="p-info">
                <h3>Release readiness</h3>
                <strong>{release}%</strong>
                <div className="track-wrap" style={{ marginTop: 8 }}>
                  <div
                    className="track-bar orange"
                    style={{ width: `${release}%` }}
                  />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--dim)",
                    fontWeight: 600,
                  }}
                >
                  target
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "var(--orange)",
                    marginTop: 4,
                  }}
                >
                  95%
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Right: Live dashboard panel ─────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* AI score ring */}
          <motion.div className="panel" {...fade(0.12)}>
            <div className="panel-head">
              <h2>
                <ShieldCheck size={18} /> AI health score
              </h2>
              <span className="status-pill">Live</span>
            </div>
            <div className="ai-score">
              <div className="ring-wrap">
                <svg viewBox="0 0 120 120">
                  <defs>
                    <linearGradient
                      id="ringGradient"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#4fa9ff" />
                      <stop offset="100%" stopColor="#3fd2ff" />
                    </linearGradient>
                  </defs>
                  <circle cx="60" cy="60" r="52" className="ring-bg" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    className="ring-fg"
                    strokeDasharray={circumference}
                    strokeDashoffset={scoreOffset}
                  />
                </svg>
                <div className="ring-center">
                  <strong>{score.toFixed(1)}</strong>
                  <span>/ 10.0</span>
                </div>
              </div>
            </div>
            <p className="ai-sub">
              <strong>{total}</strong> anomalies resolved ·{" "}
              <strong style={{ color: "var(--green)" }}>Healthy</strong>
            </p>

            {/* Release readiness bar */}
            <div className="release-readiness">
              <div className="release-head">
                <h3>Release readiness</h3>
                <span className="release-percent">{release}%</span>
              </div>
              <div className="release-track">
                <div
                  className="release-fill"
                  style={{ width: `${release}%` }}
                />
              </div>
              <div className="release-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </motion.div>

          {/* Live pipelines table */}
          <motion.div className="panel" {...fade(0.18)}>
            <div className="panel-head">
              <h2>
                <Workflow size={18} /> Top pipelines
              </h2>
              <Link
                to="/pipelines"
                style={{
                  color: "var(--blue-2)",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <table className="pipelines-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Throughput</th>
                  <th>Trend</th>
                  <th>Uptime</th>
                </tr>
              </thead>
              <tbody>
                {live.map((row, i) => (
                  <motion.tr
                    key={row[0]}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          className="avatar"
                          style={{ width: 30, height: 30, fontSize: "0.68rem" }}
                        >
                          {row[0].slice(0, 2).toUpperCase()}
                        </div>
                        <strong style={{ fontSize: "0.88rem" }}>
                          {row[0]}
                        </strong>
                      </div>
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.86rem",
                      }}
                    >
                      {row[2]}/s
                    </td>
                    <td>
                      <span
                        className={`level-trend ${row[3] >= 0 ? "up" : "down"}`}
                      >
                        {row[3] >= 0 ? (
                          <TrendingUp size={13} />
                        ) : (
                          <TrendingDown size={13} />
                        )}
                        {row[3] >= 0 ? "+" : ""}
                        {row[3]}%
                      </span>
                    </td>
                    <td
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.86rem",
                        color: "var(--muted)",
                      }}
                    >
                      {row[5].toFixed(2)}%
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Quick nav cards */}
          <motion.div
            {...fade(0.24)}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}
          >
            {[
              {
                to: "/analytics",
                icon: Activity,
                label: "Analytics",
                desc: "Throughput & anomaly charts",
              },
              {
                to: "/rank",
                icon: ShieldCheck,
                label: "Rankings",
                desc: "Service reliability leaderboard",
              },
              {
                to: "/console",
                icon: Terminal,
                label: "CLI Console",
                desc: "Live log stream + commands",
              },
              {
                to: "/api-docs",
                icon: Zap,
                label: "API Docs",
                desc: "Ingest, predict, query",
              },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "16px 16px",
                  borderRadius: 14,
                  border: "1px solid var(--line)",
                  background: "rgba(10,17,36,0.7)",
                  transition: "border-color 0.18s, transform 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--line-strong)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--line)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    display: "grid",
                    placeItems: "center",
                    flexShrink: 0,
                    background: "rgba(79,169,255,0.1)",
                    border: "1px solid rgba(79,169,255,0.2)",
                    color: "var(--blue-2)",
                  }}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.76rem",
                      color: "var(--muted)",
                      marginTop: 2,
                    }}
                  >
                    {desc}
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
