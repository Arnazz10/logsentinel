// Isolation-forest feature space. Every point is a scored log; outliers glow.
import { Html, Line, OrbitControls } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { toSpace } from '../lib/engine';
import { useLive } from '../lib/store';
import { C, Label, Stage } from './common';

const S = 2.2; // world scale

const Axes = () => {
  const box = [
    [-S, -S, -S], [S, -S, -S], [S, S, -S], [-S, S, -S], [-S, -S, -S],
    [-S, -S, S], [S, -S, S], [S, S, S], [-S, S, S], [-S, -S, S],
  ];
  return (
    <group>
      <Line points={box} color={C.line} lineWidth={1} />
      <Line points={[[S, -S, -S], [S, -S, S]]} color={C.line} lineWidth={1} />
      <Line points={[[S, S, -S], [S, S, S]]} color={C.line} lineWidth={1} />
      <Line points={[[-S, S, -S], [-S, S, S]]} color={C.line} lineWidth={1} />
      <Html position={[S + 0.2, -S, S]} distanceFactor={9} zIndexRange={[1, 0]}><Label>latency →</Label></Html>
      <Html position={[-S, S + 0.25, S]} distanceFactor={9} zIndexRange={[1, 0]}><Label>error rate ↑</Label></Html>
      <Html position={[-S - 0.2, -S, -S]} distanceFactor={9} zIndexRange={[1, 0]}><Label>payload</Label></Html>
    </group>
  );
};

function Points({ data, threshold }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(data.length * 3);
    const col = new Float32Array(data.length * 3);
    const c = new THREE.Color();
    const ok = new THREE.Color(C.steel);
    const warm = new THREE.Color(C.amber);
    const hot = new THREE.Color(C.signal);
    data.forEach((l, i) => {
      const [x, y, z] = toSpace(l);
      pos.set([THREE.MathUtils.clamp(x, -1, 1.4) * S, THREE.MathUtils.clamp(y, -1, 1.4) * S, THREE.MathUtils.clamp(z, -1, 1.4) * S], i * 3);
      if (l.score >= threshold) c.copy(hot);
      else if (l.score >= threshold - 0.07) c.copy(warm);
      else c.copy(ok).multiplyScalar(0.75);
      col.set([c.r, c.g, c.b], i * 3);
    });
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return g;
  }, [data, threshold]);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.06} vertexColors sizeAttenuation transparent opacity={0.9} toneMapped={false} />
    </points>
  );
}

function Outliers({ data, threshold }) {
  const hot = data.filter((l) => l.score >= threshold).slice(0, 60);
  return hot.map((l) => {
    const [x, y, z] = toSpace(l);
    return (
      <mesh key={l.id} position={[Math.min(x, 1.4) * S, Math.min(y, 1.4) * S, Math.min(z, 1.4) * S]}>
        <octahedronGeometry args={[0.07]} />
        <meshBasicMaterial color={C.signal} wireframe />
      </mesh>
    );
  });
}

function Probe({ probe, score, threshold }) {
  const ref = useRef();
  useFrame((st) => {
    if (ref.current) ref.current.rotation.y = st.clock.elapsedTime;
  });
  const [x, y, z] = toSpace(probe).map((v) => Math.max(-1, Math.min(1.4, v)) * S);
  const hot = score >= threshold;
  return (
    <group>
      <Line points={[[x, -S, z], [x, y, z]]} color={hot ? C.signal : C.amber} lineWidth={1} dashed dashSize={0.06} gapSize={0.05} />
      <Line points={[[-S, y, z], [x, y, z]]} color={C.dim} lineWidth={1} dashed dashSize={0.06} gapSize={0.05} />
      <group ref={ref} position={[x, y, z]}>
        <mesh>
          <octahedronGeometry args={[0.16]} />
          <meshBasicMaterial color={hot ? C.signal : C.amber} wireframe />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshBasicMaterial color={C.text} />
        </mesh>
      </group>
      <Html position={[x, y + 0.32, z]} center distanceFactor={9} zIndexRange={[1, 0]}>
        <Label color={hot ? C.signal : C.amber}>probe · {score.toFixed(3)}</Label>
      </Html>
    </group>
  );
}

// Rough envelope of "normal" traffic — a wireframe ellipsoid around the dense core.
const Envelope = () => (
  <mesh position={[-0.05 * S, -0.55 * S, -0.05 * S]} scale={[0.55 * S, 0.12 * S, 0.3 * S]}>
    <sphereGeometry args={[1, 24, 12]} />
    <meshBasicMaterial color={C.ok} wireframe transparent opacity={0.08} />
  </mesh>
);

export default function AnomalyCloud({ probe, probeScore, autoRotate = true, extra = [] }) {
  const { logs, settings } = useLive();
  const data = useMemo(() => [...extra, ...logs].slice(0, 600), [logs, extra]);
  return (
    <Stage camera={{ position: [6.5, 4.2, 7.5], fov: 38 }} fog={[12, 26]}>
      <OrbitControls enablePan={false} enableZoom={false} autoRotate={autoRotate && !settings.reduceMotion} autoRotateSpeed={0.6} />
      <Axes />
      <Envelope />
      <Points data={data} threshold={settings.threshold} />
      <Outliers data={data} threshold={settings.threshold} />
      {probe && <Probe probe={probe} score={probeScore} threshold={settings.threshold} />}
    </Stage>
  );
}
