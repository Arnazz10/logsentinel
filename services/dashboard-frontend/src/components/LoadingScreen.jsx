import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const STEPS = [
  ['mount', 'config /etc/logsentinel/sentinel.yaml'],
  ['kafka', 'connect broker-0:9092 · topics raw-logs, processed-logs, anomaly-alerts'],
  ['es', 'elasticsearch cluster green · 3 nodes'],
  ['model', 'grow isolation forest · 100 trees · ψ=256'],
  ['alert', 'alert-service subscribed · slack, email'],
  ['ui', 'attach live stream'],
];

export default function LoadingScreen({ onDone }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (n > STEPS.length) {
      const t = setTimeout(onDone, 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v + 1), n === 0 ? 220 : 130 + Math.random() * 120);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <motion.div className="boot" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} onClick={onDone}>
      <div className="boot-log">
        <div className="brand-line">logsentinel v3.2.0 — boot</div>
        {STEPS.slice(0, n).map(([k, msg]) => (
          <div key={k}>
            <span className="ok">[ ok ]</span> {k.padEnd(6, ' ')} {msg}
          </div>
        ))}
        {n <= STEPS.length && (
          <div>
            <span className="boot-cursor" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
