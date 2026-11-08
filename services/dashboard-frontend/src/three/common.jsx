/* eslint-disable react-refresh/only-export-components */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import { useLive } from '../lib/store';

export const C = {
  bg: '#111110',
  text: '#ece6d6',
  line: '#3a3832',
  dim: '#66635a',
  signal: '#ff5b2e',
  amber: '#f2b33d',
  ok: '#8fd16a',
  steel: '#8fb3c4',
};

// Gentle pointer parallax on whatever group it wraps.
export const Rig = ({ children, strength = 0.25, spin = 0 }) => {
  const g = useRef();
  const { pointer } = useThree();
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.rotation.y += (pointer.x * strength - g.current.rotation.y + g.current.userData.spin) * Math.min(1, dt * 2);
    g.current.rotation.x += (-pointer.y * strength * 0.4 - g.current.rotation.x) * Math.min(1, dt * 2);
    g.current.userData.spin = (g.current.userData.spin || 0) + spin * dt;
  });
  return (
    <group ref={g} userData={{ spin: 0 }}>
      {children}
    </group>
  );
};

export const Stage = ({ children, camera = { position: [0, 2, 9], fov: 35 }, fog = [10, 26], style }) => {
  const { settings } = useLive();
  const high = settings.quality === 'high';
  return (
    <Canvas
      dpr={high ? [1, 2] : 1}
      camera={camera}
      gl={{ antialias: high, alpha: true, powerPreference: 'high-performance' }}
      frameloop={settings.reduceMotion ? 'demand' : 'always'}
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      <fog attach="fog" args={[C.bg, fog[0], fog[1]]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 8, 6]} intensity={1.1} />
      <directionalLight position={[-6, 2, -4]} intensity={0.35} color={C.amber} />
      {children}
    </Canvas>
  );
};

export const Label = ({ children, color = C.dim }) => (
  <div
    style={{
      fontFamily: 'IBM Plex Mono, monospace',
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none',
    }}
  >
    {children}
  </div>
);
