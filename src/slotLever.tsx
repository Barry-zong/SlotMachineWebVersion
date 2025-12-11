import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { animated, useSpring } from '@react-spring/three';
import * as THREE from 'three';

const LeverModel: React.FC<{ pulling: boolean }> = ({ pulling }) => {
  const { nodes, scene } = useGLTF('/models/slot-lever.glb');
  const leverArm = nodes.lever_arm as THREE.Object3D;

  // Spring the arm around its pivot for a physical pull/release.
  const { rotation } = useSpring({
    rotation: pulling ? [-Math.PI / 2.6, 0, 0] : [Math.PI / 12, 0, 0],
    config: { mass: 1.2, tension: 220, friction: 14 }
  });

  // Apply the spring value directly to the imported arm.
  useFrame(() => {
    if (leverArm) {
      leverArm.rotation.x = (rotation.get() as number[])[0];
    }
  });

  return (
    <primitive
      object={scene}
      // Slightly lift and scale to fit the allotted column.
      position={[-0.3, -0.4, 0]}
      scale={2}
    />
  );
};

const SlotLever: React.FC = () => {
  const [pulling, setPulling] = useState(false);

  const triggerSpin = () => {
    if (pulling) return;
    setPulling(true);
    // Notify the vanilla slot logic to start spinning.
    window.dispatchEvent(new CustomEvent('lever-pulled'));
    setTimeout(() => setPulling(false), 650);
  };

  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [-0.2, 0, 3], fov: 32 }}
      onPointerDown={triggerSpin}
    >
      <ambientLight intensity={0.2} />
      {/* Overhead fill to give the handle highlights */}
      <directionalLight
        position={[0, 3.2, 0]}
        intensity={2.4}
        color="#ffffff"
        castShadow
      />
      <spotLight
        position={[3, 4, 3]}
        angle={0.4}
        penumbra={0.6}
        intensity={5}
        color="#9fb7ff"
        castShadow
      />
      <Environment preset="studio" />
      <LeverModel pulling={pulling} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]} receiveShadow>
        <planeGeometry args={[4, 4]} />
        <shadowMaterial opacity={0.2} />
      </mesh>
    </Canvas>
  );
};

const container = document.getElementById('lever-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <SlotLever />
    </React.StrictMode>
  );
}

export default SlotLever;

useGLTF.preload('/models/slot-lever.glb');
