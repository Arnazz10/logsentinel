/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SERVICES, makeLog, trainForest, toFeatures } from './engine';

const LiveContext = createContext(null);

const DEFAULT_SETTINGS = {
  threshold: 0.58,
  trees: 100,
  sampleSize: 256,
  tickMs: 1000,
  paused: false,
  apiUrl: '',
  notify: false,
  sound: false,
  reduceMotion: false,
  quality: 'high',
  incidentWindow: 20,
  autoResolve: 120,
};

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
};
const loadList = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
};

const emptyServiceStats = () =>
  Object.fromEntries(
    SERVICES.map((s) => [s.id, { count: 0, anomalies: 0, errors: 0, latency: s.base, score: 0.4, history: [] }]),
  );

const beep = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.26);
  } catch {
    /* no audio */
  }
};

const mapRemote = (item, model, threshold) => {
  const src = item._source || item;
  const latency = Number(src.response_time_ms ?? src.latency_ms ?? 50);
  const m = { latency, errorRate: src.level === 'ERROR' ? 12 : 0.5, payload: Number(src.payload_kb ?? 4) };
  const score = model.score(toFeatures(m));
  return {
    id: src.log_id || item._id || `${Date.now()}-${Math.random()}`,
    ts: Date.parse(src['@timestamp'] || src.timestamp) || Date.now(),
    service: src.service || 'unknown',
    level: (src.level || 'INFO').toUpperCase(),
    msg: src.message || '',
    ...m,
    score,
    anomaly: score >= threshold,
    injected: false,
    traceId: src.trace_id || '—',
  };
};

export function LiveProvider({ children }) {
  const [settings, setSettingsState] = useState(() => load('ls.settings', DEFAULT_SETTINGS));
  const [logs, setLogs] = useState([]);
  const [series, setSeries] = useState([]);
  const [svcStats, setSvcStats] = useState(emptyServiceStats);
  const [totals, setTotals] = useState({ processed: 0, anomalies: 0, tp: 0, fp: 0, fn: 0, tn: 0 });
  const [incidents, setIncidents] = useState(() => loadList('ls.incidents'));
  const [connection, setConnection] = useState({ mode: 'sim', detail: 'Local simulator' });
  const [modelVersion, setModelVersion] = useState(0);

  const modelRef = useRef(null);
  const randRef = useRef(Math.random);
  const pendingInject = useRef([]);
  const recentAnoms = useRef({});
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const incidentsRef = useRef(incidents);
  incidentsRef.current = incidents;

  if (!modelRef.current) modelRef.current = trainForest({ trees: settings.trees, sampleSize: settings.sampleSize });

  // Retrain when forest hyper-parameters change.
  useEffect(() => {
    const m = modelRef.current;
    if (m.nTrees === settings.trees && m.sampleSize === settings.sampleSize) return;
    modelRef.current = trainForest({ trees: settings.trees, sampleSize: settings.sampleSize });
    setModelVersion((v) => v + 1);
  }, [settings.trees, settings.sampleSize]);

  useEffect(() => {
    save('ls.settings', settings);
  }, [settings]);
  useEffect(() => {
    save('ls.incidents', incidents.slice(0, 60));
  }, [incidents]);

  const setSettings = useCallback((patch) => setSettingsState((s) => ({ ...s, ...patch })), []);

  const raiseIncidents = useCallback((batch) => {
    const now = Date.now();
    const st = settingsRef.current;
    const opened = new Map();
    const windowCounts = batch.map((log) => {
      if (!log.anomaly) return 0;
      const arr = (recentAnoms.current[log.service] = (recentAnoms.current[log.service] || []).filter(
        (t) => now - t < st.incidentWindow * 1000,
      ));
      arr.push(now);
      return arr.length;
    });
    setIncidents((list) => {
      let next = list;
      let seqNo = list.reduce((m, i) => Math.max(m, Number(i.id.slice(4)) || 1000), 1000);
      batch.forEach((log, bi) => {
        if (!log.anomaly) return;
        const arr = { length: windowCounts[bi] };
        const activeIdx = next.findIndex((i) => i.service === log.service && i.status !== 'resolved');
        if (activeIdx >= 0) {
          const inc = next[activeIdx];
          const updated = {
            ...inc,
            count: inc.count + 1,
            peak: Math.max(inc.peak, log.score),
            lastSeen: now,
            events: [{ ts: now, kind: 'signal', text: `${log.level} ${log.msg} (score ${log.score.toFixed(3)})` }, ...inc.events].slice(0, 40),
          };
          next = next.map((x, i) => (i === activeIdx ? updated : x));
        } else if (arr.length >= 2) {
          seqNo += 1;
          const num = seqNo;
          const sev = log.score > 0.75 ? 'SEV1' : log.score > 0.68 ? 'SEV2' : 'SEV3';
          const inc = {
            id: `INC-${num}`,
            service: log.service,
            title: log.msg,
            severity: sev,
            status: 'open',
            openedAt: now,
            lastSeen: now,
            ackAt: null,
            resolvedAt: null,
            count: arr.length,
            peak: log.score,
            notes: [],
            events: [
              { ts: now, kind: 'open', text: `Opened — ${arr.length} anomalies on ${log.service} within ${st.incidentWindow}s` },
            ],
          };
          next = [inc, ...next];
          opened.set(inc.id, inc);
        }
      });
      // Auto-resolve quiet incidents.
      next = next.map((inc) =>
        inc.status !== 'resolved' && now - inc.lastSeen > st.autoResolve * 1000
          ? {
              ...inc,
              status: 'resolved',
              resolvedAt: now,
              events: [{ ts: now, kind: 'resolve', text: `Auto-resolved after ${st.autoResolve}s without anomalies` }, ...inc.events],
            }
          : inc,
      );
      return next.slice(0, 80);
    });
    // Updater may run twice in StrictMode; defer side effects until it has settled.
    setTimeout(() => {
      if (!opened.size) return;
      if (st.sound) beep();
      if (st.notify && 'Notification' in window && Notification.permission === 'granted') {
        opened.forEach((i) => new Notification(`${i.severity} ${i.id} · ${i.service}`, { body: i.title }));
      }
    }, 0);
  }, []);

  const ingest = useCallback(
    (batch) => {
      if (!batch.length) return;
      setLogs((prev) => [...batch.reverse(), ...prev].slice(0, 600));
      const anomalies = batch.filter((l) => l.anomaly).length;
      setSeries((prev) =>
        [...prev, { t: Date.now(), total: batch.length, anomalies, score: Math.max(...batch.map((l) => l.score)) }].slice(-120),
      );
      setSvcStats((prev) => {
        const next = { ...prev };
        for (const l of batch) {
          const s = next[l.service] || { count: 0, anomalies: 0, errors: 0, latency: l.latency, score: 0.4, history: [] };
          next[l.service] = {
            count: s.count + 1,
            anomalies: s.anomalies + (l.anomaly ? 1 : 0),
            errors: s.errors + (l.level === 'ERROR' || l.level === 'CRITICAL' ? 1 : 0),
            latency: s.latency * 0.85 + l.latency * 0.15,
            score: s.score * 0.8 + l.score * 0.2,
            history: [...s.history, l.score].slice(-40),
          };
        }
        return next;
      });
      setTotals((t) => {
        const n = { ...t, processed: t.processed + batch.length, anomalies: t.anomalies + anomalies };
        for (const l of batch) {
          if (l.injected && l.anomaly) n.tp += 1;
          else if (!l.injected && l.anomaly) n.fp += 1;
          else if (l.injected && !l.anomaly) n.fn += 1;
          else n.tn += 1;
        }
        return n;
      });
      raiseIncidents(batch);
    },
    [raiseIncidents],
  );

  // Main loop.
  useEffect(() => {
    if (settings.paused) return undefined;
    let cancelled = false;
    const tick = async () => {
      const st = settingsRef.current;
      const model = modelRef.current;
      const rand = randRef.current;
      const batch = [];
      if (st.apiUrl) {
        try {
          const res = await fetch(`${st.apiUrl.replace(/\/$/, '')}/logs?size=25`, { signal: AbortSignal.timeout(2500) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const body = await res.json();
          (body.items || []).slice(0, 25).forEach((it) => batch.push(mapRemote(it, model, st.threshold)));
          setConnection({ mode: 'live', detail: st.apiUrl });
        } catch (e) {
          setConnection({ mode: 'error', detail: `${st.apiUrl} unreachable (${e.message}) — simulating` });
        }
      } else {
        setConnection((c) => (c.mode === 'sim' ? c : { mode: 'sim', detail: 'Local simulator' }));
      }
      if (!batch.length) {
        const n = 3 + Math.floor(rand() * 5);
        for (let i = 0; i < n; i++) batch.push(makeLog(rand, model, st.threshold));
      }
      while (pendingInject.current.length) {
        const job = pendingInject.current.shift();
        if (typeof job === 'string') batch.push(makeLog(rand, model, st.threshold, { forceAnomaly: true, service: job }));
        else batch.push(makeLog(rand, model, st.threshold, { forceAnomaly: job.injected, service: job.service, metrics: job.metrics }));
      }
      if (!cancelled) ingest(batch);
    };
    tick();
    const id = setInterval(tick, settings.tickMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [settings.paused, settings.tickMs, ingest]);

  const inject = useCallback((service, count = 3) => {
    const svc = service || SERVICES[Math.floor(Math.random() * SERVICES.length)].id;
    for (let i = 0; i < count; i++) pendingInject.current.push(svc);
    return svc;
  }, []);

  const injectCustom = useCallback((service, metrics, injected = true) => {
    pendingInject.current.push({ service, metrics, injected });
  }, []);

  const updateIncident = useCallback((id, fn) => setIncidents((l) => l.map((i) => (i.id === id ? fn(i) : i))), []);

  const ack = useCallback(
    (id) =>
      updateIncident(id, (i) =>
        i.status === 'open'
          ? { ...i, status: 'ack', ackAt: Date.now(), events: [{ ts: Date.now(), kind: 'ack', text: 'Acknowledged by Arnab Mal' }, ...i.events] }
          : i,
      ),
    [updateIncident],
  );
  const resolve = useCallback(
    (id) =>
      updateIncident(id, (i) =>
        i.status === 'resolved'
          ? i
          : {
              ...i,
              status: 'resolved',
              ackAt: i.ackAt || Date.now(),
              resolvedAt: Date.now(),
              events: [{ ts: Date.now(), kind: 'resolve', text: 'Resolved by Arnab Mal' }, ...i.events],
            },
      ),
    [updateIncident],
  );
  const addNote = useCallback(
    (id, text) =>
      updateIncident(id, (i) => ({ ...i, events: [{ ts: Date.now(), kind: 'note', text }, ...i.events] })),
    [updateIncident],
  );

  const reset = useCallback(() => {
    setLogs([]);
    setSeries([]);
    setSvcStats(emptyServiceStats());
    setTotals({ processed: 0, anomalies: 0, tp: 0, fp: 0, fn: 0, tn: 0 });
    setIncidents([]);
    recentAnoms.current = {};
  }, []);

  const health = useMemo(() => {
    const recent = series.slice(-30);
    const tot = recent.reduce((a, b) => a + b.total, 0) || 1;
    const an = recent.reduce((a, b) => a + b.anomalies, 0);
    const open = incidents.filter((i) => i.status !== 'resolved').length;
    return Math.max(0, Math.min(10, 10 - (an / tot) * 60 - open * 0.6));
  }, [series, incidents]);

  const value = {
    settings,
    setSettings,
    logs,
    series,
    svcStats,
    totals,
    incidents,
    connection,
    health,
    model: modelRef.current,
    modelVersion,
    inject,
    injectCustom,
    ack,
    resolve,
    addNote,
    reset,
    clearLogs: () => setLogs([]),
  };

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export const useLive = () => useContext(LiveContext);
