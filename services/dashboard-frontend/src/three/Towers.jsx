// Reliability towers: one monolith per service, height = reliability, ranked on an arc.
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { C, Label, Rig, Stage } from './common';

function Tower({ x, z, h, rank, name, hot, stagger }) {
  const ref = useRef();
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    m.scale.y += (h - m.scale.y) * Math.min(1, dt * 3);
    m.position.y = m.scale.y / 2;
  });
  const color = hot ? C.signal : rank === 1 ? C.amber : rank <= 3 ? C.text : C.dim;
  return (
    <group position={[x, -1.3, z]}>
      <mesh ref={ref} scale={[1, 0.1, 1]}>
        <boxGeometry args={[0.42, 1, 0.42]} />
        <meshStandardMaterial color={rank <= 3 ? '#4a473f' : '#2e2c27'} roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, h + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.42, 0.42]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <Html position={[0, h + 0.35, 0]} center distanceFactor={9} zIndexRange={[1, 0]}>
        <Label color={color}>#{rank}</Label>
      </Html>
      <Html position={[0, stagger ? -0.62 : -0.24, 0.45]} center distanceFactor={9} zIndexRange={[1, 0]}>
        <Label>{name}</Label>
      </Html>
    </group>
  );
}

export default function Towers({ rows }) {
  const n = rows.length;
  return (
    <Stage camera={{ position: [0, 2.8, 10.5], fov: 38 }}>
      <Rig strength={0.35}>
        <gridHelper args={[14, 28, C.line, '#1c1b18']} position={[0, -1.3, 0]} />
        {rows.map((r, i) => {
          const t = n > 1 ? i / (n - 1) - 0.5 : 0;
          return (
            <Tower
              key={r.id}
              x={t * 10.4}
              z={-Math.abs(t) * 1.2}
              stagger={i % 2 === 1}
              h={0.3 + (r.reliability / 100) ** 6 * 3.2}
              rank={i + 1}
              name={r.id}
              hot={r.hot}
            />
          );
        })}
      </Rig>
    </Stage>
  );
}
