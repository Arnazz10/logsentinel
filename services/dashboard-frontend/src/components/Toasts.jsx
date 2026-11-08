import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLive } from '../lib/store';

export default function Toasts() {
  const { incidents } = useLive();
  const seen = useRef(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(incidents.map((i) => i.id));
      return;
    }
    const fresh = incidents.filter((i) => !seen.current.has(i.id));
    if (!fresh.length) return;
    fresh.forEach((i) => seen.current.add(i.id));
    setToasts((t) => [...fresh.map((i) => ({ ...i, at: Date.now() })), ...t].slice(0, 3));
  }, [incidents]);

  useEffect(() => {
    if (!toasts.length) return undefined;
    const id = setTimeout(() => setToasts((t) => t.filter((x) => Date.now() - x.at < 6000)), 1000);
    return () => clearTimeout(id);
  }, [toasts]);

  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} className="toast" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
            <div className="label">
              <span className="t-signal">{t.severity}</span> · {t.id} opened · <b>{t.service}</b>
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>
              {t.title}
            </div>
            <Link to="/incidents" className="label t-amber" style={{ display: 'inline-block', marginTop: 8 }}>
              open incident →
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
