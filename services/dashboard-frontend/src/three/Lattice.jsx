// Layered defence lattice: nested shells (TLS → auth → RBAC → audit) with a scan plane.
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { C, Label, Rig, Stage } from './common';

const LAYERS = [
  { r: 2.1, detail: 1, label: 'tls 1.3 edge', color: C.dim },
  { r: 1.55, detail: 1, label: 'api-key + jwt', color: C.steel },
  { r: 1.05, detail: 0, label: 'rbac / tenancy', color: C.amber },
  { r: 0.55, detail: 0, label: 'audit log', color: C.signal },
];

function Shells({ labels }) {
  const shells = useRef();
  const scan = useRef();
  useFrame((st, dt) => {
    if (shells.current) shells.current.children.forEach((m, i) => {
      m.rotation.y += dt * (0.08 + i * 0.07) * (i % 2 ? -1 : 1);
      m.rotation.x += dt * 0.03;
    });
    if (scan.current) scan.current.position.y = Math.sin(st.clock.elapsedTime * 0.8) * 2;
  });
  return (
    <>
        <group ref={shells}>
          {LAYERS.map((l) => (
            <mesh key={l.r}>
              <icosahedronGeometry args={[l.r, l.detail]} />
              <meshBasicMaterial color={l.color} wireframe transparent opacity={0.55} />
            </mesh>
          ))}
        </group>
        <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 2.5, 64]} />
          <meshBasicMaterial color={C.signal} transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
        {labels &&
          LAYERS.map((l, i) => (
            <Html key={l.label} position={[2.5, 1.0 - i * 0.62, 0]} distanceFactor={6} zIndexRange={[1, 0]}>
              <Label color={l.color}>— {l.label}</Label>
            </Html>
          ))}
    </>
  );
}

export default function Lattice({ labels = true }) {
  return (
    <Stage camera={{ position: [0, 0.8, 7.2], fov: 38 }}>
      <Rig strength={0.4}>
        <Shells labels={labels} />
      </Rig>
    </Stage>
  );
}
