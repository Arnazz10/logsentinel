// Live pipeline topology: services → ingestion → Kafka → processor → {Elasticsearch, ML} → alerts.
// Each packet is a real log from the store; anomalies peel off toward the alert service.
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SERVICES } from '../lib/engine';
import { useLive } from '../lib/store';
import { C, Label, Rig, Stage } from './common';

const NODES = {
  ingest: [-1.6, 0, 0],
  kafka: [0.2, 0, 0],
  proc: [1.9, 0, 0],
  es: [3.3, -1.3, 0.6],
  ml: [3.4, 1.0, -0.4],
  alert: [4.1, 2.5, 0.2],
};

// Producers stacked in a gentle arc on the left, like a rack of hosts.
const svcPos = SERVICES.map((s, i) => {
  const t = i / (SERVICES.length - 1) - 0.5;
  return [-3.6 - Math.cos(t * Math.PI) * 0.6, t * 6.0, 0];
});

const curve = (pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');

const MAX = 420;

function Packets({ offsetX }) {
  const { logs } = useLive();
  const mesh = useRef();
  const packets = useRef([]);
  const lastId = useRef(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  const routes = useMemo(() => {
    const tail = [NODES.ingest, NODES.kafka, NODES.proc];
    return SERVICES.map((_, i) => ({
      normal: [curve([svcPos[i], ...tail, NODES.es]), curve([svcPos[i], ...tail, NODES.ml])],
      anomaly: curve([svcPos[i], ...tail, NODES.ml, NODES.alert]),
    }));
  }, []);

  useEffect(() => {
    if (!logs.length) return;
    const fresh = [];
    for (const l of logs) {
      if (l.id === lastId.current) break;
      fresh.push(l);
      if (fresh.length > 14) break;
    }
    lastId.current = logs[0].id;
    fresh.forEach((l, k) => {
      const si = Math.max(0, SERVICES.findIndex((s) => s.id === l.service));
      const r = routes[si];
      packets.current.push({
        c: l.anomaly ? r.anomaly : r.normal[k % 2],
        t: -k * 0.04,
        v: 0.16 + Math.random() * 0.08,
        anom: l.anomaly,
      });
    });
    if (packets.current.length > MAX) packets.current.splice(0, packets.current.length - MAX);
  }, [logs, routes]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const list = packets.current;
    let n = 0;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.t += p.v * Math.min(dt, 0.05);
      if (p.t >= 1) {
        list.splice(i, 1);
        continue;
      }
      if (p.t < 0) continue;
      const pos = p.c.getPointAt(p.t);
      dummy.position.copy(pos);
      const s = p.anom ? 0.085 : 0.045;
      dummy.scale.setScalar(s);
      dummy.rotation.set(p.t * 8, p.t * 5, 0);
      dummy.updateMatrix();
      m.setMatrixAt(n, dummy.matrix);
      m.setColorAt(n, color.set(p.anom ? C.signal : p.t > 0.55 ? C.steel : C.amber));
      n++;
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, MAX]} position={[offsetX, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

function Node({ position, label, shape = 'box', size = 0.32, color = C.text, hot = false, spin = 0.2, side = 'below' }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * spin;
  });
  return (
    <group position={position}>
      <mesh ref={ref}>
        {shape === 'box' && <boxGeometry args={[size, size, size]} />}
        {shape === 'oct' && <octahedronGeometry args={[size * 0.8]} />}
        {shape === 'ico' && <icosahedronGeometry args={[size * 0.8, 0]} />}
        {shape === 'cyl' && <cylinderGeometry args={[size * 0.9, size * 0.9, size * 1.6, 18, 1, true]} />}
        <meshBasicMaterial color={hot ? C.signal : color} wireframe transparent opacity={0.85} />
      </mesh>
      {label &&
        (side === 'left' ? (
          <Html position={[-size - 0.12, 0, 0]} distanceFactor={9} zIndexRange={[1, 0]} style={{ transform: 'translate(-100%, -50%)' }}>
            <Label color={hot ? C.signal : C.dim}>{label}</Label>
          </Html>
        ) : (
          <Html center position={[0, -size - 0.26, 0]} distanceFactor={9} zIndexRange={[1, 0]}>
            <Label color={hot ? C.signal : C.dim}>{label}</Label>
          </Html>
        ))}
    </group>
  );
}

function KafkaCore({ position }) {
  const rings = useRef();
  useFrame((_, dt) => {
    if (!rings.current) return;
    rings.current.children.forEach((r, i) => (r.rotation.z += dt * (0.3 + i * 0.25) * (i % 2 ? -1 : 1)));
  });
  return (
    <group position={position}>
      <group ref={rings} rotation={[0, Math.PI / 2, 0]}>
        {[0.42, 0.58, 0.74].map((r) => (
          <mesh key={r}>
            <torusGeometry args={[r, 0.006, 6, 64, Math.PI * 1.6]} />
            <meshBasicMaterial color={C.amber} transparent opacity={0.7} />
          </mesh>
        ))}
      </group>
      <Html center position={[0, -1.0, 0]} distanceFactor={9} zIndexRange={[1, 0]}>
        <Label color={C.amber}>kafka · raw-logs</Label>
      </Html>
    </group>
  );
}

export default function Topology({ offsetX = 0, labels = true, compact = false }) {
  const { svcStats, incidents } = useLive();
  const hotSvc = new Set(incidents.filter((i) => i.status !== 'resolved').map((i) => i.service));
  const shift = (p) => [p[0] + offsetX, p[1], p[2]];
  const links = useMemo(
    () => [
      ...svcPos.map((p) => [p, NODES.ingest]),
      [NODES.ingest, NODES.kafka],
      [NODES.kafka, NODES.proc],
      [NODES.proc, NODES.es],
      [NODES.proc, NODES.ml],
      [NODES.ml, NODES.alert],
    ],
    [],
  );
  const hasAlert = hotSvc.size > 0;

  return (
    <Stage camera={{ position: [0.8, 0.4, compact ? 16 : 12.5], fov: 36 }} fog={[12, 30]}>
      <Rig strength={0.3}>
        {links.map(([a, b], i) => (
          <Line key={i} points={[shift(a), shift(b)]} color={C.line} lineWidth={1} transparent opacity={0.9} />
        ))}
        {SERVICES.map((s, i) => (
          <Node
            key={s.id}
            position={shift(svcPos[i])}
            label={labels ? s.id : ''}
            size={0.16 + Math.min(0.12, (svcStats[s.id]?.count || 0) / 4000)}
            hot={hotSvc.has(s.id)}
            spin={0.4}
            side="left"
          />
        ))}
        <Node position={shift(NODES.ingest)} label="ingestion-api" shape="oct" size={0.36} />
        <KafkaCore position={shift(NODES.kafka)} />
        <Node position={shift(NODES.proc)} label="log-processor" shape="box" size={0.32} />
        <Node position={shift(NODES.es)} label="elasticsearch" shape="cyl" size={0.28} color={C.steel} spin={0.1} />
        <Node position={shift(NODES.ml)} label="ml-engine · iforest" shape="ico" size={0.4} color={C.text} spin={0.5} />
        <Node position={shift(NODES.alert)} label="alert-service" shape="oct" size={0.3} hot={hasAlert} spin={hasAlert ? 2 : 0.3} />
        <Packets offsetX={offsetX} />
      </Rig>
    </Stage>
  );
}
