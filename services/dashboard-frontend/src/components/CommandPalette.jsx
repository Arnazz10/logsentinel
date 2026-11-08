import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bug, CornerDownLeft, Pause, Play, RotateCcw, Zap } from 'lucide-react';
import { SERVICE_IDS } from '../lib/engine';
import { useLive } from '../lib/store';

export default function CommandPalette({ onClose }) {
  const nav = useNavigate();
  const live = useLive();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);

  const items = useMemo(() => {
    const go = (to, label) => ({ label, grp: 'go to', icon: ArrowRight, run: () => nav(to) });
    const list = [
      go('/', 'Overview'),
      go('/live', 'Live operations'),
      go('/pipelines', 'Pipelines & Kafka'),
      go('/incidents', 'Incidents'),
      go('/analytics', 'Analytics'),
      go('/lab', 'Detector lab'),
      go('/rank', 'Service ranking'),
      go('/console', 'Console'),
      go('/api-docs', 'API reference'),
      go('/settings', 'Settings'),
      {
        label: live.settings.paused ? 'Resume stream' : 'Pause stream',
        grp: 'stream',
        icon: live.settings.paused ? Play : Pause,
        run: () => live.setSettings({ paused: !live.settings.paused }),
      },
      { label: 'Inject anomaly burst (random service)', grp: 'chaos', icon: Bug, run: () => live.inject(null, 4) },
      ...SERVICE_IDS.map((s) => ({ label: `Inject anomaly burst → ${s}`, grp: 'chaos', icon: Bug, run: () => live.inject(s, 4) })),
      ...live.incidents
        .filter((i) => i.status === 'open')
        .map((i) => ({ label: `Acknowledge ${i.id} · ${i.service}`, grp: 'incident', icon: Zap, run: () => live.ack(i.id) })),
      { label: 'Reset all live data', grp: 'system', icon: RotateCcw, run: () => live.reset() },
    ];
    const n = q.trim().toLowerCase();
    return n ? list.filter((i) => `${i.label} ${i.grp}`.toLowerCase().includes(n)) : list;
  }, [q, live, nav]);

  const run = (item) => {
    if (!item) return;
    item.run();
    onClose();
  };

  return (
    <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={onClose}>
      <motion.div className="palette" initial={{ y: -8 }} animate={{ y: 0 }} onMouseDown={(e) => e.stopPropagation()}>
        <input
          autoFocus
          placeholder="Type a command or page…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSel((s) => Math.min(items.length - 1, s + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSel((s) => Math.max(0, s - 1));
            } else if (e.key === 'Enter') run(items[sel]);
          }}
        />
        <ul>
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.label} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => run(it)}>
                <Icon size={14} />
                {it.label}
                <span className="grp">{it.grp}</span>
              </li>
            );
          })}
          {!items.length && <li>No matches</li>}
        </ul>
        <div className="foot">
          <span>↑↓ navigate</span>
          <span>
            <CornerDownLeft size={10} /> run
          </span>
          <span>esc close</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
