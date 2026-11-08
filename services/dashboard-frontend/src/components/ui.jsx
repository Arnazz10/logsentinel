/* eslint-disable react-refresh/only-export-components */
import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';

export const BrandMark = ({ size = 22 }) => (
  <svg className="brand-mark" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="0.5" y="0.5" width="23" height="23" stroke="currentColor" strokeOpacity="0.35" />
    <path d="M3 15h4l2-6 3 10 2.5-7H16" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="19" cy="12" r="2.2" fill="var(--signal)" />
  </svg>
);

export const sparkPath = (pts, w, h, pad = 2) => {
  if (pts.length < 2) return '';
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const step = (w - pad * 2) / (pts.length - 1);
  return pts
    .map((v, i) => `${i ? 'L' : 'M'}${(pad + i * step).toFixed(1)},${(h - pad - ((v - min) / span) * (h - pad * 2)).toFixed(1)}`)
    .join('');
};

export const Spark = ({ data, color = 'var(--text)', w = 200, h = 38, fill = true }) => {
  const d = sparkPath(data, w, h);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {fill && d && <path d={`${d}L${w - 2},${h}L2,${h}Z`} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
    </svg>
  );
};

export const Readout = ({ label, value, unit, sub, subR, data, color }) => (
  <div className="readout">
    <div className="top">
      <span className="label">{label}</span>
    </div>
    <div className="val" style={{ color }}>
      {value}
      {unit && <small>{unit}</small>}
    </div>
    {data && <Spark data={data} color={color || 'var(--text)'} />}
    {(sub || subR) && (
      <div className="sub">
        <span>{sub}</span>
        <span>{subR}</span>
      </div>
    )}
  </div>
);

export const PageHead = ({ index, kicker, title, children, actions }) => (
  <header className="page-head">
    <div>
      <div className="label">
        <span className="t-signal">{index}</span>
        <span>/</span>
        <span>{kicker}</span>
      </div>
      <h1 className="h-page">{title}</h1>
      {children && <p>{children}</p>}
    </div>
    {actions && <div className="actions">{actions}</div>}
  </header>
);

export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
};

// Renders children only once scrolled near the viewport — keeps WebGL contexts cheap.
export const InView = ({ children, style, className, margin = '200px' }) => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return (
    <div ref={ref} style={style} className={className}>
      {seen ? children : null}
    </div>
  );
};

const scenes = {
  topology: lazy(() => import('../three/Topology')),
  terrain: lazy(() => import('../three/Terrain')),
  cloud: lazy(() => import('../three/AnomalyCloud')),
  towers: lazy(() => import('../three/Towers')),
  ring: lazy(() => import('../three/KafkaRing')),
  lattice: lazy(() => import('../three/Lattice')),
};

let webgl;
export const hasWebGL = () => {
  if (webgl !== undefined) return webgl;
  try {
    const c = document.createElement('canvas');
    webgl = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    webgl = false;
  }
  return webgl;
};

const NoGL = () => (
  <div className="scene-fallback">
    <svg viewBox="0 0 200 120" width="220" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden="true">
      <path d="M100 10l60 30v40l-60 30-60-30V40z" />
      <path d="M40 40l60 30 60-30M100 70v40" />
      <path d="M70 25l60 30M130 25L70 55" strokeDasharray="2 3" />
      <circle cx="100" cy="70" r="3" fill="var(--signal)" stroke="none" />
    </svg>
    <span style={{ marginTop: 14 }}>3D view needs WebGL — enable hardware acceleration</span>
  </div>
);

class SceneBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <NoGL /> : this.props.children;
  }
}

export const Scene = ({ kind, height = 360, hud, hudB, className = '', style, ...props }) => {
  const Comp = scenes[kind];
  const gl = hasWebGL();
  return (
    <div className={`scene ${className}`} style={{ height, ...style }}>
      {gl ? (
        <InView style={{ position: 'absolute', inset: 0 }}>
          <SceneBoundary>
            <Suspense fallback={<div className="scene-fallback">loading scene…</div>}>
              <Comp {...props} />
            </Suspense>
          </SceneBoundary>
        </InView>
      ) : (
        <NoGL />
      )}
      {hud && <div className="scene-hud">{hud}</div>}
      {hudB && <div className="scene-hud-b">{hudB}</div>}
    </div>
  );
};

export const AreaChart = ({ series, keys, colors, height = 180, labels }) => {
  const w = 600;
  const h = height;
  const pad = { l: 34, r: 8, t: 10, b: 20 };
  const max = Math.max(1, ...series.flatMap((p) => keys.map((k) => p[k])));
  const n = Math.max(series.length, 2);
  const x = (i) => pad.l + (i / (n - 1)) * (w - pad.l - pad.r);
  const y = (v) => h - pad.b - (v / max) * (h - pad.t - pad.b);
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  return (
    <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height }}>
      {ticks.map((t) => (
        <g key={t}>
          <line className="grid-l" x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} strokeDasharray="2 4" />
          <text className="axis-t" x={pad.l - 6} y={y(t) + 3} textAnchor="end">
            {t}
          </text>
        </g>
      ))}
      {keys.map((k, ki) => {
        const line = series.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[k]).toFixed(1)}`).join('');
        if (!line) return null;
        return (
          <g key={k}>
            <path d={`${line}L${x(series.length - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={colors[ki]} opacity="0.09" />
            <path d={line} fill="none" stroke={colors[ki]} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />
          </g>
        );
      })}
      {labels &&
        labels.map((l, i) => (
          <text key={l} className="axis-t" x={pad.l + (i / (labels.length - 1)) * (w - pad.l - pad.r)} y={h - 4} textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>
            {l}
          </text>
        ))}
    </svg>
  );
};

export const Switch = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />
);

export const scoreColor = (s, th = 0.58) => (s >= th ? 'var(--signal)' : s >= th - 0.07 ? 'var(--amber)' : 'var(--ok)');
