// Log terrain: X = last N seconds, Z = service, height = log volume, colour = worst anomaly score.
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SERVICES } from '../lib/engine';
import { useLive } from '../lib/store';
import { C, Label, Rig, Stage } from './common';

const COLS = 36;
const ROWS = SERVICES.length;
const GAP = 0.26;

function Bars() {
  const { logs, settings } = useLive();
  const mesh = useRef();
  const heights = useRef(new Float32Array(COLS * ROWS));
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const cOk = useMemo(() => new THREE.Color(C.line), []);
  const cWarm = useMemo(() => new THREE.Color(C.amber), []);
  const cHot = useMemo(() => new THREE.Color(C.signal), []);

  const grid = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    const g = Array.from({ length: COLS * ROWS }, () => ({ n: 0, s: 0 }));
    for (const l of logs) {
      const age = now - Math.floor(l.ts / 1000);
      if (age >= COLS) break;
      const r = SERVICES.findIndex((s) => s.id === l.service);
      if (r < 0) continue;
      const cell = g[r * COLS + (COLS - 1 - age)];
      cell.n += 1;
      cell.s = Math.max(cell.s, l.score);
    }
    return g;
  }, [logs]);

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const th = settings.threshold;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const target = 0.04 + grid[i].n * 0.32 + (grid[i].s >= th ? 0.6 : 0);
        heights.current[i] += (target - heights.current[i]) * Math.min(1, dt * 5);
        const h = heights.current[i];
        dummy.position.set((c - COLS / 2) * GAP, h / 2, (r - ROWS / 2) * GAP * 2.5);
        dummy.scale.set(GAP * 0.78, h, GAP * 1.6);
        dummy.updateMatrix();
        m.setMatrixAt(i, dummy.matrix);
        const s = grid[i].s;
        if (s >= th) col.copy(cHot);
        else if (s >= th - 0.07) col.copy(cOk).lerp(cWarm, 0.85);
        else col.copy(cOk).lerp(cWarm, Math.min(0.35, grid[i].n * 0.05));
        m.setColorAt(i, col);
      }
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[null, null, COLS * ROWS]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial roughness={0.7} metalness={0.1} />
    </instancedMesh>
  );
}

export default function Terrain() {
  return (
    <Stage camera={{ position: window.innerWidth < 700 ? [0.4, 12, 11] : [0.6, 7.2, 6.4], fov: 40 }} fog={window.innerWidth < 700 ? [16, 32] : [10, 24]}>
      <Rig strength={0.2}>
        <group position={[0, -0.9, 0]}>
          <gridHelper args={[12, 24, C.line, '#1f1e1b']} position={[0, 0, 0]} />
          <Bars />
          {SERVICES.map((s, r) => (
            <Html key={s.id} position={[(-COLS / 2 - 0.4) * GAP, 0.05, (r - ROWS / 2) * GAP * 2.5]} distanceFactor={8} zIndexRange={[1, 0]} style={{ transform: 'translate(-100%, -50%)' }}>
              <Label>{s.id}</Label>
            </Html>
          ))}
          <Html position={[(COLS / 2) * GAP, 0, (ROWS / 2) * GAP * 2.5 + 0.2]} center distanceFactor={9} zIndexRange={[1, 0]}>
            <Label>now</Label>
          </Html>
          <Html position={[(-COLS / 2) * GAP, 0, (ROWS / 2) * GAP * 2.5 + 0.2]} center distanceFactor={9} zIndexRange={[1, 0]}>
            <Label>−{COLS}s</Label>
          </Html>
        </group>
      </Rig>
    </Stage>
  );
}
