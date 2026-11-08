import { useEffect, useRef, useState } from 'react';
import { PageHead } from '../components/ui';
import { SERVICE_IDS, fmtNum, fmtTime, toFeatures } from '../lib/engine';
import { useLive } from '../lib/store';

const HELP = `commands
  help                      this text
  status                    pipeline + model summary
  tail [service] [n]        last n log lines (default 10)
  anomalies [n]             last n flagged records
  incidents                 list active incidents
  ack <INC-id>              acknowledge an incident
  resolve <INC-id>          resolve an incident
  inject [service] [n]      inject n faulty records (chaos)
  score <ms> <err%> <kb>    score an ad-hoc vector with the live forest
  threshold [value]         read or set the anomaly threshold
  pause | resume            control the stream
  services                  list known services
  clear                     clear the screen`;

const pad = (s, n) => String(s).padEnd(n, ' ');

export default function OpenConsole() {
  const live = useLive();
  const [lines, setLines] = useState([
    { k: 'hi', t: 'logsentinel console — connected to local stream' },
    { k: 'out', t: 'type `help` for commands. ↑/↓ for history. tab completes.' },
  ]);
  const [cmd, setCmd] = useState('');
  const [hist, setHist] = useState([]);
  const [hi, setHi] = useState(-1);
  const [follow, setFollow] = useState(false);
  const out = useRef(null);
  const input = useRef(null);
  const lastSeen = useRef(null);

  const print = (arr) => setLines((l) => [...l, ...arr].slice(-600));

  useEffect(() => {
    out.current?.scrollTo(0, out.current.scrollHeight);
  }, [lines]);

  // `tail -f` mode
  useEffect(() => {
    if (!follow) return;
    const fresh = [];
    for (const l of live.logs) {
      if (l.id === lastSeen.current) break;
      fresh.push(l);
      if (fresh.length > 12) break;
    }
    if (live.logs[0]) lastSeen.current = live.logs[0].id;
    if (fresh.length) print(fresh.reverse().map((l) => ({ k: l.anomaly ? 'err' : 'out', t: `${fmtTime(l.ts)}  ${pad(l.level, 8)} ${pad(l.service, 14)} ${l.msg}  [${l.score.toFixed(3)}]` })));
  }, [live.logs, follow]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = (raw) => {
    const [head, ...args] = raw.trim().split(/\s+/);
    const h = (head || '').toLowerCase();
    const o = (t, k = 'out') => ({ k, t });
    switch (h) {
      case '':
        return [];
      case 'help':
        return [o(HELP)];
      case 'clear':
        setLines([]);
        return [];
      case 'status': {
        const { totals, settings, model, connection, incidents } = live;
        return [
          o(`source       ${connection.mode} · ${connection.detail}`),
          o(`stream       ${settings.paused ? 'PAUSED' : 'running'} · tick ${settings.tickMs}ms`),
          o(`model        iforest · ${model.nTrees} trees · ψ ${model.sampleSize} · threshold ${settings.threshold}`),
          o(`scored       ${fmtNum(totals.processed)} · flagged ${totals.anomalies} · tp ${totals.tp} fp ${totals.fp} fn ${totals.fn}`),
          o(`incidents    ${incidents.filter((i) => i.status !== 'resolved').length} active / ${incidents.length} stored`, 'hi'),
        ];
      }
      case 'services':
        return SERVICE_IDS.map((s) => {
          const st = live.svcStats[s];
          return o(`${pad(s, 15)} logs ${pad(st.count, 6)} anomalies ${pad(st.anomalies, 4)} latency ${st.latency.toFixed(0)}ms`);
        });
      case 'tail': {
        if (args[0] === '-f') {
          setFollow(true);
          lastSeen.current = live.logs[0]?.id;
          return [o('following stream — run `tail stop` to end', 'hi')];
        }
        if (args[0] === 'stop') {
          setFollow(false);
          return [o('stopped following')];
        }
        const svc = SERVICE_IDS.includes(args[0]) ? args[0] : null;
        const n = Number(args[svc ? 1 : 0]) || 10;
        return live.logs
          .filter((l) => !svc || l.service === svc)
          .slice(0, n)
          .reverse()
          .map((l) => o(`${fmtTime(l.ts)}  ${pad(l.level, 8)} ${pad(l.service, 14)} ${l.msg}  [${l.score.toFixed(3)}]`, l.anomaly ? 'err' : 'out'));
      }
      case 'anomalies': {
        const n = Number(args[0]) || 10;
        const a = live.logs.filter((l) => l.anomaly).slice(0, n);
        if (!a.length) return [o('no anomalies in buffer')];
        return a.map((l) => o(`${fmtTime(l.ts)}  ${l.score.toFixed(4)}  ${pad(l.service, 14)} ${l.msg}`, 'err'));
      }
      case 'incidents': {
        const a = live.incidents.filter((i) => i.status !== 'resolved');
        if (!a.length) return [o('no active incidents')];
        return a.map((i) => o(`${i.id}  ${pad(i.severity, 5)} ${pad(i.status, 9)} ${pad(i.service, 14)} ${i.count} signals  ${i.title}`, i.status === 'open' ? 'err' : 'hi'));
      }
      case 'ack':
      case 'resolve': {
        const id = (args[0] || '').toUpperCase();
        const inc = live.incidents.find((i) => i.id === id);
        if (!inc) return [o(`no such incident: ${args[0] || '(missing id)'}`, 'err')];
        (h === 'ack' ? live.ack : live.resolve)(id);
        return [o(`${id} ${h === 'ack' ? 'acknowledged' : 'resolved'}`, 'hi')];
      }
      case 'inject': {
        const svc = SERVICE_IDS.includes(args[0]) ? args[0] : null;
        const n = Math.min(20, Number(args[svc ? 1 : 0]) || 4);
        const s = live.inject(svc, n);
        return [o(`queued ${n} faulty records → ${s}`, 'hi')];
      }
      case 'score': {
        const [lat, err, kb] = args.map(Number);
        if ([lat, err, kb].some((v) => Number.isNaN(v))) return [o('usage: score <latency_ms> <error_rate_%> <payload_kb>', 'err')];
        const s = live.model.score(toFeatures({ latency: lat, errorRate: err, payload: kb }));
        return [o(`score ${s.toFixed(4)} → ${s >= live.settings.threshold ? 'ANOMALY' : 'normal'}`, s >= live.settings.threshold ? 'err' : 'hi')];
      }
      case 'threshold': {
        if (!args[0]) return [o(`threshold = ${live.settings.threshold}`)];
        const v = Number(args[0]);
        if (!(v > 0.3 && v < 0.95)) return [o('threshold must be between 0.3 and 0.95', 'err')];
        live.setSettings({ threshold: v });
        return [o(`threshold set to ${v}`, 'hi')];
      }
      case 'pause':
      case 'resume':
        live.setSettings({ paused: h === 'pause' });
        return [o(`stream ${h}d`, 'hi')];
      default:
        return [o(`${h}: command not found — try \`help\``, 'err')];
    }
  };

  const submit = (e) => {
    e.preventDefault();
    print([{ k: 'cmd', t: cmd }, ...run(cmd)]);
    if (cmd.trim()) setHist((h) => [cmd, ...h].slice(0, 50));
    setHi(-1);
    setCmd('');
  };

  const onKey = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const n = Math.min(hist.length - 1, hi + 1);
      if (hist[n] !== undefined) {
        setHi(n);
        setCmd(hist[n]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const n = hi - 1;
      setHi(Math.max(-1, n));
      setCmd(n >= 0 ? hist[n] : '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const words = ['help', 'status', 'tail', 'anomalies', 'incidents', 'ack', 'resolve', 'inject', 'score', 'threshold', 'pause', 'resume', 'services', 'clear', ...SERVICE_IDS, ...live.incidents.map((i) => i.id)];
      const parts = cmd.split(' ');
      const last = parts.at(-1);
      const m = words.filter((w) => w.toLowerCase().startsWith(last.toLowerCase()));
      if (m.length === 1) setCmd([...parts.slice(0, -1), m[0]].join(' ') + ' ');
      else if (m.length > 1) print([{ k: 'out', t: m.join('  ') }]);
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const quick = ['status', 'tail 15', 'tail -f', 'anomalies', 'incidents', 'inject payment-svc 5', 'score 2400 12 6'];

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="08"
          kicker="console"
          title={
            <>
              Operator <em>console</em>
            </>
          }
        >
          A real shell over the live store — every command reads or mutates the same state the dashboards render.
        </PageHead>
        <div className="row wrap-f" style={{ gap: 6, marginBottom: 12 }}>
          {quick.map((q) => (
            <button
              key={q}
              className="btn sm"
              onClick={() => {
                print([{ k: 'cmd', t: q }, ...run(q)]);
                input.current?.focus();
              }}
            >
              {q}
            </button>
          ))}
          {follow && (
            <button className="btn sm on" onClick={() => setFollow(false)}>
              following · stop
            </button>
          )}
        </div>
        <div className="panel ticks term" onClick={() => input.current?.focus()}>
          <div className="panel-head">
            <h3>
              <span className="dot live t-ok" /> sentinel@prod — zsh
            </h3>
            <span className="label">{live.connection.mode}</span>
          </div>
          <div className="term-out" ref={out}>
            {lines.map((l, i) => (
              <div key={i} className={`term-line ${l.k}`}>
                {l.t}
              </div>
            ))}
          </div>
          <form className="term-in" onSubmit={submit}>
            <span>sentinel@prod:~$</span>
            <input ref={input} value={cmd} onChange={(e) => setCmd(e.target.value)} onKeyDown={onKey} autoFocus spellCheck={false} autoComplete="off" aria-label="Console command" />
          </form>
        </div>
      </div>
    </section>
  );
}
