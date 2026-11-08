// Three Kafka topics as concentric partition rings. Segment height = consumer lag,
// orbiting particles = messages in flight (speed tracks live throughput).
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useLive } from '../lib/store';
import { C, Label, Rig, Stage } from './common';

const TOPICS = [
  { name: 'raw-logs', r: 2.6, parts: 12, color: C.amber, la: 0.35 },
  { name: 'processed-logs', r: 1.8, parts: 8, color: C.steel, la: 2.5 },
  { name: 'anomaly-alerts', r: 1.0, parts: 4, color: C.signal, la: 4.6 },
];

function Ring({ topic, lags, speed }) {
  const group = useRef();
  const parts = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const N = 70;
  const seeds = useMemo(() => Array.from({ length: N }, () => [Math.random() * Math.PI * 2, 0.6 + Math.random() * 0.8, (Math.random() - 0.5) * 0.18]), []);

  useFrame((st, dt) => {
    if (group.current) {
      group.current.children.forEach((m, i) => {
        const target = 0.05 + (lags[i] || 0) * 0.9;
        m.scale.y += (target - m.scale.y) * Math.min(1, dt * 4);
        m.position.y = m.scale.y / 2;
      });
    }
    const p = parts.current;
    if (!p) return;
    const t = st.clock.elapsedTime;
    seeds.forEach(([a0, v, dz], i) => {
      const a = a0 + t * v * speed * (topic.r < 1.5 ? 1.6 : 1);
      dummy.position.set(Math.cos(a) * (topic.r + dz), 0.12 + Math.sin(t * 2 + i) * 0.03, Math.sin(a) * (topic.r + dz));
      dummy.scale.setScalar(0.035);
      dummy.updateMatrix();
      p.setMatrixAt(i, dummy.matrix);
    });
    p.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[topic.r - 0.16, topic.r + 0.16, 96]} />
        <meshBasicMaterial color={topic.color} transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>
      <group ref={group}>
        {Array.from({ length: topic.parts }, (_, i) => {
          const a = (i / topic.parts) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * topic.r, 0, Math.sin(a) * topic.r]} rotation={[0, -a, 0]} scale={[1, 0.05, 1]}>
              <boxGeometry args={[0.12, 1, ((Math.PI * 2 * topic.r) / topic.parts) * 0.7]} />
              <meshStandardMaterial color={(lags[i] || 0) > 0.7 ? C.signal : '#2a2924'} roughness={0.6} />
            </mesh>
          );
        })}
      </group>
      <instancedMesh ref={parts} args={[null, null, N]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={topic.color} toneMapped={false} />
      </instancedMesh>
      <Html position={[Math.cos(topic.la) * (topic.r + 0.35), 0.9, Math.sin(topic.la) * (topic.r + 0.35)]} center distanceFactor={9} zIndexRange={[1, 0]}>
        <Label color={topic.color}>{topic.name}</Label>
      </Html>
    </group>
  );
}

export default function KafkaRing() {
  const { series, logs } = useLive();
  const last = series.slice(-10);
  const tput = last.reduce((a, b) => a + b.total, 0) / Math.max(1, last.length);
  const anomRate = last.reduce((a, b) => a + b.anomalies, 0) / Math.max(1, last.reduce((a, b) => a + b.total, 0));
  const lags = useMemo(() => {
    // Deterministic-ish lag per partition, nudged by recent volume per hash bucket.
    return TOPICS.map((t) => {
      const buckets = Array(t.parts).fill(0);
      logs.slice(0, 120).forEach((l) => {
        const h = [...l.traceId].reduce((a, ch) => a + ch.charCodeAt(0), 0);
        buckets[h % t.parts] += t.name === 'anomaly-alerts' ? (l.anomaly ? 1 : 0) : 1;
      });
      const max = Math.max(1, ...buckets);
      return buckets.map((b) => (t.name === 'anomaly-alerts' ? Math.min(1, b / 3) : (b / max) * 0.75));
    });
  }, [logs]);

  return (
    <Stage camera={{ position: [0, 4.6, 6.8], fov: 38 }}>
      <Rig strength={0.25} spin={0.08}>
        <group position={[0, -0.6, 0]}>
          {TOPICS.map((t, i) => (
            <Ring key={t.name} topic={t} lags={lags[i]} speed={0.4 + tput / 10 + (i === 2 ? anomRate * 8 : 0)} />
          ))}
          <mesh position={[0, 0.3, 0]}>
            <icosahedronGeometry args={[0.32, 1]} />
            <meshBasicMaterial color={C.text} wireframe transparent opacity={0.5} />
          </mesh>
        </group>
      </Rig>
    </Stage>
  );
}
