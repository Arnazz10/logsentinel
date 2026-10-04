import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BellRing,
  CheckCircle2,
  Copy,
  Database,
  KeyRound,
  Mail,
  Plus,
  Save,
  ShieldCheck,
  Sliders,
  Trash2,
  User,
  Webhook,
  Zap,
  Moon,
  LayoutGrid,
  RefreshCw,
  Radio,
  Globe,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", Icon: User },
  { id: "security", label: "Security", Icon: ShieldCheck },
  { id: "alerts", label: "Alerts", Icon: BellRing },
  { id: "pipelines", label: "Pipelines", Icon: Database },
  { id: "appearance", label: "Appearance", Icon: Sliders },
];

const TIMEZONES = [
  "Asia/Kolkata (UTC+5:30)",
  "UTC (UTC+0:00)",
  "America/New_York (UTC−5:00)",
  "America/Los_Angeles (UTC−8:00)",
  "Europe/London (UTC+1:00)",
  "Europe/Berlin (UTC+2:00)",
  "Asia/Tokyo (UTC+9:00)",
  "Australia/Sydney (UTC+11:00)",
];

const INITIAL = {
  name: "Arnab Mal",
  email: "arnabmal665@gmail.com",
  role: "Platform Admin",
  timezone: "Asia/Kolkata (UTC+5:30)",
  darkMode: true,
  compactDensity: false,
  alertEmail: true,
  alertSlack: true,
  alertPager: false,
  anomalyNotify: true,
  lagNotify: true,
  deployNotify: false,
  autoRetrain: true,
  liveStream: true,
  anomalySensitivity: 0.15,
  retentionDays: 90,
  kafkaPartitions: 3,
  batchSize: 500,
};

const API_KEYS = [
  {
    label: "Production Ingest Key",
    key: "ls_prod_f4a91c2e4b7d8a0f3219",
    last: "2m ago",
    scopes: ["ingest", "batch"],
  },
  {
    label: "Staging Ingest Key",
    key: "ls_stage_7c1b9d4e2a8f5c3e1102",
    last: "3h ago",
    scopes: ["ingest"],
  },
  {
    label: "Analytics Read Key",
    key: "ls_read_0e8d7c6b5a4f3e2d9988",
    last: "1d ago",
    scopes: ["read", "metrics"],
  },
];

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -6 },
  transition: { duration: 0.22 },
};

/* ─── small reusable pieces ────────────────────────────────────────────────── */

function SectionCard({ children, style }) {
  return (
    <div
      className="form-card panel"
      style={{ display: "flex", flexDirection: "column", gap: 0, ...style }}
    >
      {children}
    </div>
  );
}

function SectionHead({ title, Icon, action }) {
  return (
    <div
      className="panel-head"
      style={{
        paddingBottom: 14,
        marginBottom: 0,
        borderBottom: "1px solid var(--line)",
      }}
    >
      <h2
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: "0.98rem",
        }}
      >
        <Icon size={17} style={{ color: "var(--blue-2)" }} />
        {title}
      </h2>
      {action}
    </div>
  );
}

function FormGrid({ children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "20px 24px",
        padding: "20px 0 4px",
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="form-row">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span />
    </label>
  );
}

function SettingRow({ Icon, title, desc, checked, onChange }) {
  return (
    <div className="setting-row">
      <div className="setting-row-text">
        {Icon && <Icon size={17} />}
        <div>
          <strong>{title}</strong>
          <span>{desc}</span>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function Divider() {
  return (
    <div style={{ height: 1, background: "var(--line)", margin: "4px 0" }} />
  );
}

/* ─── tab panels ────────────────────────────────────────────────────────────── */

function ProfileTab({ form, set }) {
  return (
    <SectionCard>
      <SectionHead title="Profile details" Icon={User} />
      <FormGrid>
        <Field label="Full name">
          <input
            className="form-input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your full name"
          />
        </Field>
        <Field label="Email address">
          <input
            className="form-input"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Role">
          <input className="form-input" value={form.role} readOnly />
        </Field>
        <Field label="Timezone">
          <select
            className="form-input"
            value={form.timezone}
            onChange={(e) => set("timezone", e.target.value)}
          >
            {TIMEZONES.map((tz) => (
              <option key={tz}>{tz}</option>
            ))}
          </select>
        </Field>
      </FormGrid>

      <Divider />

      {/* Avatar section */}
      <div
        style={{
          padding: "20px 0 8px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          className="avatar"
          style={{
            width: 64,
            height: 64,
            fontSize: "1.4rem",
            fontWeight: 800,
            border: "2px solid var(--line-strong)",
          }}
        >
          {form.name
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div>
          <div
            style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 4 }}
          >
            {form.name}
          </div>
          <div
            style={{
              fontSize: "0.8rem",
              color: "var(--muted)",
              marginBottom: 10,
            }}
          >
            {form.email}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="pill-button"
              type="button"
              style={{ minHeight: 34, fontSize: "0.82rem" }}
            >
              Upload photo
            </button>
            <button
              className="pill-button ghost"
              type="button"
              style={{ minHeight: 34, fontSize: "0.82rem" }}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SecurityTab({ copied, onCopy, webhooks, setWebhooks }) {
  const [showKey, setShowKey] = useState({});

  const toggle = (i) => setShowKey((s) => ({ ...s, [i]: !s[i] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* API Keys */}
      <SectionCard>
        <SectionHead
          title="API keys"
          Icon={KeyRound}
          action={
            <button
              className="pill-button primary"
              type="button"
              style={{ minHeight: 34, fontSize: "0.82rem" }}
            >
              <Plus size={14} /> New key
            </button>
          }
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 16,
          }}
        >
          {API_KEYS.map((k, i) => (
            <div key={i} className="key-card">
              <div className="key-head">
                <div>
                  <strong>{k.label}</strong>
                  <div className="scopes" style={{ marginTop: 6 }}>
                    {k.scopes.map((s) => (
                      <span
                        key={s}
                        className="mini-chip"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="icon-button"
                    type="button"
                    title={showKey[i] ? "Hide key" : "Reveal key"}
                    onClick={() => toggle(i)}
                  >
                    {showKey[i] ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="pill-button ghost"
                    type="button"
                    onClick={() => onCopy(k.label, k.key)}
                    style={{ minHeight: 34, fontSize: "0.82rem", gap: 6 }}
                  >
                    {copied === k.label ? (
                      <>
                        <CheckCircle2
                          size={13}
                          style={{ color: "var(--green)" }}
                        />{" "}
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={13} /> Copy
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="key-value">
                <code>
                  {showKey[i]
                    ? k.key
                    : `${k.key.slice(0, 12)}${"•".repeat(16)}${k.key.slice(-4)}`}
                </code>
                <span>Last used: {k.last}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Webhooks */}
      <SectionCard>
        <SectionHead
          title="Webhook endpoints"
          Icon={Webhook}
          action={
            <button
              className="pill-button primary"
              type="button"
              style={{ minHeight: 34, fontSize: "0.82rem" }}
              onClick={() =>
                setWebhooks((w) => [
                  ...w,
                  {
                    url: "https://your-endpoint.local/events",
                    events: ["anomaly"],
                    active: false,
                  },
                ])
              }
            >
              <Plus size={14} /> Add
            </button>
          }
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            paddingTop: 16,
          }}
        >
          {webhooks.map((w, i) => (
            <div key={i} className="key-card">
              <div className="key-head">
                <div style={{ minWidth: 0, flex: 1 }}>
                  <code
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--muted)",
                      wordBreak: "break-all",
                    }}
                  >
                    {w.url}
                  </code>
                  <div className="scopes" style={{ marginTop: 7 }}>
                    {w.events.map((ev) => (
                      <span
                        key={ev}
                        className="mini-chip"
                        style={{ fontSize: "0.68rem", padding: "2px 8px" }}
                      >
                        {ev}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    flexShrink: 0,
                  }}
                >
                  <Toggle
                    checked={w.active}
                    onChange={(e) =>
                      setWebhooks((cur) =>
                        cur.map((x, idx) =>
                          idx === i ? { ...x, active: e.target.checked } : x,
                        ),
                      )
                    }
                  />
                  <button
                    className="icon-button"
                    type="button"
                    title="Remove"
                    onClick={() =>
                      setWebhooks((cur) => cur.filter((_, idx) => idx !== i))
                    }
                    style={{ color: "var(--red)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {webhooks.length === 0 && (
            <p
              style={{
                color: "var(--dim)",
                fontSize: "0.86rem",
                padding: "8px 0",
              }}
            >
              No webhooks configured. Add one to forward anomaly events.
            </p>
          )}
        </div>
      </SectionCard>

      {/* Password */}
      <SectionCard>
        <SectionHead title="Password" Icon={Lock} />
        <FormGrid>
          <Field label="Current password">
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
            />
          </Field>
          <Field label="New password">
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
            />
          </Field>
        </FormGrid>
        <div style={{ paddingTop: 4 }}>
          <button
            className="pill-button primary"
            type="button"
            style={{ minHeight: 36, fontSize: "0.85rem" }}
          >
            Update password
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

function AlertsTab({ form, set }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard>
        <SectionHead title="Notification channels" Icon={BellRing} />
        <div style={{ paddingTop: 4 }}>
          <SettingRow
            Icon={Mail}
            title="Email alerts"
            desc="Send critical and warning anomalies to your work email address."
            checked={form.alertEmail}
            onChange={(e) => set("alertEmail", e.target.checked)}
          />
          <SettingRow
            Icon={Radio}
            title="Slack webhook"
            desc="Route incidents to the #incidents channel via webhook URL."
            checked={form.alertSlack}
            onChange={(e) => set("alertSlack", e.target.checked)}
          />
          <SettingRow
            Icon={BellRing}
            title="PagerDuty on-call"
            desc="Escalate anomaly-critical incidents to the on-call rotation."
            checked={form.alertPager}
            onChange={(e) => set("alertPager", e.target.checked)}
          />
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHead title="Trigger events" Icon={Zap} />
        <div style={{ paddingTop: 4 }}>
          <SettingRow
            title="Anomaly detected"
            desc="Notify when Isolation Forest scores a record above the configured threshold."
            checked={form.anomalyNotify}
            onChange={(e) => set("anomalyNotify", e.target.checked)}
          />
          <SettingRow
            title="High consumer lag"
            desc="Notify when Kafka lag exceeds 50 000 records on the raw-logs topic."
            checked={form.lagNotify}
            onChange={(e) => set("lagNotify", e.target.checked)}
          />
          <SettingRow
            title="Deployment status"
            desc="Notify when a service deployment completes or fails."
            checked={form.deployNotify}
            onChange={(e) => set("deployNotify", e.target.checked)}
          />
          <SettingRow
            title="Auto retrain baselines"
            desc="Retrain the anomaly detector every Sunday using the previous 4 weeks of data."
            checked={form.autoRetrain}
            onChange={(e) => set("autoRetrain", e.target.checked)}
          />
          <SettingRow
            title="Auto start live streams"
            desc="Begin streaming data immediately when entering Console or Dashboard."
            checked={form.liveStream}
            onChange={(e) => set("liveStream", e.target.checked)}
          />
        </div>
      </SectionCard>
    </div>
  );
}

function PipelinesTab({ form, set }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard>
        <SectionHead title="Pipeline defaults" Icon={Database} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
            padding: "20px 0 8px",
          }}
        >
          {/* Sensitivity slider */}
          <label className="form-row">
            <span>Anomaly sensitivity</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="range"
                className="range-slider"
                min={0.02}
                max={0.3}
                step={0.01}
                value={form.anomalySensitivity}
                onChange={(e) =>
                  set("anomalySensitivity", parseFloat(e.target.value))
                }
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--blue-2)",
                  minWidth: 40,
                  textAlign: "right",
                }}
              >
                {(form.anomalySensitivity * 100).toFixed(0)}%
              </span>
            </div>
            <small className="range-value">
              Isolation Forest contamination —{" "}
              {(form.anomalySensitivity * 100).toFixed(0)}% of records expected
              to be anomalous.
            </small>
          </label>

          <Divider />

          <FormGrid>
            <Field label="Log retention (days)">
              <input
                type="number"
                className="form-input"
                min={7}
                max={730}
                value={form.retentionDays}
                onChange={(e) =>
                  set("retentionDays", parseInt(e.target.value || "90", 10))
                }
              />
            </Field>
            <Field label="Kafka partitions">
              <input
                type="number"
                className="form-input"
                min={1}
                max={32}
                value={form.kafkaPartitions}
                onChange={(e) =>
                  set("kafkaPartitions", parseInt(e.target.value || "3", 10))
                }
              />
            </Field>
            <Field label="Consumer batch size">
              <input
                type="number"
                className="form-input"
                min={50}
                max={5000}
                step={50}
                value={form.batchSize}
                onChange={(e) =>
                  set("batchSize", parseInt(e.target.value || "500", 10))
                }
              />
            </Field>
          </FormGrid>
        </div>
      </SectionCard>

      {/* Pipeline status overview */}
      <SectionCard>
        <SectionHead title="Pipeline status" Icon={RefreshCw} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 0,
            paddingTop: 4,
          }}
        >
          {[
            {
              name: "log-ingestion-api",
              status: "healthy",
              latency: "12ms",
              port: 8000,
            },
            {
              name: "log-processor",
              status: "healthy",
              latency: "—",
              port: null,
            },
            {
              name: "ml-engine",
              status: "healthy",
              latency: "38ms",
              port: 8001,
            },
            {
              name: "alert-service",
              status: "healthy",
              latency: "—",
              port: null,
            },
            {
              name: "dashboard-backend",
              status: "healthy",
              latency: "18ms",
              port: 8002,
            },
          ].map((svc) => (
            <div
              key={svc.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "13px 0",
                borderBottom: "1px solid var(--line)",
                gap: 14,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--green)",
                    boxShadow: "0 0 8px var(--green)",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    color: "var(--text)",
                  }}
                >
                  {svc.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                {svc.latency !== "—" && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {svc.latency}
                  </span>
                )}
                {svc.port && (
                  <span
                    className="mini-chip"
                    style={{
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      color: "var(--blue-2)",
                      background: "rgba(79,169,255,0.1)",
                      borderColor: "rgba(79,169,255,0.2)",
                    }}
                  >
                    :{svc.port}
                  </span>
                )}
                <span className="mini-chip ok" style={{ fontSize: "0.68rem" }}>
                  {svc.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function AppearanceTab({ form, set }) {
  const themes = [
    {
      id: "dark",
      label: "Dark",
      desc: "Deep-blue glass theme",
      preview: "#04060e",
    },
    {
      id: "darker",
      label: "Darker",
      desc: "Near-black deep theme",
      preview: "#010205",
    },
    {
      id: "dim",
      label: "Dim",
      desc: "Softer contrast for nights",
      preview: "#0a0f1e",
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SectionCard>
        <SectionHead title="Theme" Icon={Moon} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            paddingTop: 18,
          }}
        >
          {themes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => set("theme", t.id)}
              style={{
                padding: "16px",
                borderRadius: 14,
                border: `1px solid ${form.theme === t.id || (!form.theme && t.id === "dark") ? "var(--line-strong)" : "var(--line)"}`,
                background:
                  form.theme === t.id || (!form.theme && t.id === "dark")
                    ? "rgba(79,169,255,0.07)"
                    : "rgba(255,255,255,0.02)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.18s",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: 52,
                  borderRadius: 10,
                  background: t.preview,
                  border: "1px solid rgba(255,255,255,0.06)",
                  marginBottom: 12,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(63,140,255,0.2), transparent 60%)",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 3,
                }}
              >
                {t.label}
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--dim)" }}>
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard>
        <SectionHead title="Display preferences" Icon={LayoutGrid} />
        <div style={{ paddingTop: 4 }}>
          <SettingRow
            Icon={Moon}
            title="Dark mode"
            desc="Use the deep-blue glass theme across all dashboards and panels."
            checked={form.darkMode}
            onChange={(e) => set("darkMode", e.target.checked)}
          />
          <SettingRow
            Icon={LayoutGrid}
            title="Compact density"
            desc="Reduce padding across table and list views for denser data layouts."
            checked={form.compactDensity}
            onChange={(e) => set("compactDensity", e.target.checked)}
          />
          <SettingRow
            Icon={Globe}
            title="Animate transitions"
            desc="Enable page and panel enter / exit animations throughout the UI."
            checked={true}
            onChange={() => {}}
          />
        </div>
      </SectionCard>

      {/* Accent colour */}
      <SectionCard>
        <SectionHead title="Accent colour" Icon={Sliders} />
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", paddingTop: 18 }}
        >
          {[
            { label: "Blue", color: "#4fa9ff" },
            { label: "Cyan", color: "#3fd2ff" },
            { label: "Purple", color: "#a78bfa" },
            { label: "Green", color: "#3ddc97" },
            { label: "Orange", color: "#ff9a52" },
          ].map(({ label, color }) => (
            <button
              key={label}
              type="button"
              title={label}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: color,
                border:
                  label === "Blue" ? "3px solid #fff" : "3px solid transparent",
                cursor: "pointer",
                boxShadow: `0 0 14px ${color}88`,
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────────── */

export default function Settings() {
  const [form, setForm] = useState(INITIAL);
  const [tab, setTab] = useState("profile");
  const [copied, setCopied] = useState("");
  const [saved, setSaved] = useState(false);
  const [webhooks, setWebhooks] = useState([
    {
      url: "https://hooks.slack.com/.../T00/B00/abc",
      events: ["anomaly", "incident"],
      active: true,
    },
    {
      url: "https://api.pagerduty.com/v2/enqueue",
      events: ["critical"],
      active: true,
    },
  ]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const copyKey = async (label, value) => {
    await navigator.clipboard.writeText(value).catch(() => {});
    setCopied(label);
    setTimeout(() => setCopied(""), 1400);
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2600);
  };

  return (
    <section className="page">
      <div className="container">
        {/* ── Page header ─────────────────────────────────────────────── */}
        <header
          className="dashboard-header"
          style={{ alignItems: "flex-start", marginBottom: 28 }}
        >
          <div>
            <p className="eyebrow">Settings</p>
            <h1>Workspace Settings</h1>
            <p style={{ marginTop: 4 }}>
              Manage your profile, API keys, alert routing, and ML preferences.
            </p>
          </div>
          <div className="row-actions" style={{ paddingTop: 8 }}>
            <AnimatePresence>
              {saved && (
                <motion.span
                  key="saved"
                  initial={{ opacity: 0, x: 10, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10 }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    borderRadius: 999,
                    background: "rgba(61,220,151,0.12)",
                    border: "1px solid rgba(61,220,151,0.28)",
                    color: "var(--green)",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={13} /> Saved
                </motion.span>
              )}
            </AnimatePresence>
            <button
              className="pill-button primary"
              onClick={save}
              type="button"
            >
              <Save size={15} /> Save changes
            </button>
          </div>
        </header>

        {/* ── Body grid ───────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 20,
            alignItems: "start",
          }}
        >
          {/* Sidebar */}
          <nav
            style={{
              position: "sticky",
              top: 110,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              padding: "10px",
              border: "1px solid var(--line)",
              borderRadius: 18,
              background:
                "linear-gradient(180deg, rgba(10,17,38,0.92), rgba(5,9,20,0.97))",
              backdropFilter: "blur(20px)",
            }}
          >
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 11,
                  border:
                    tab === id
                      ? "1px solid rgba(79,169,255,0.3)"
                      : "1px solid transparent",
                  background:
                    tab === id ? "rgba(79,169,255,0.1)" : "transparent",
                  color: tab === id ? "#fff" : "var(--muted)",
                  fontWeight: tab === id ? 700 : 500,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.18s",
                }}
              >
                <Icon
                  size={15}
                  style={{ opacity: tab === id ? 1 : 0.65, flexShrink: 0 }}
                />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={tab} {...fade}>
              {tab === "profile" && <ProfileTab form={form} set={set} />}
              {tab === "security" && (
                <SecurityTab
                  copied={copied}
                  onCopy={copyKey}
                  webhooks={webhooks}
                  setWebhooks={setWebhooks}
                />
              )}
              {tab === "alerts" && <AlertsTab form={form} set={set} />}
              {tab === "pipelines" && <PipelinesTab form={form} set={set} />}
              {tab === "appearance" && <AppearanceTab form={form} set={set} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
