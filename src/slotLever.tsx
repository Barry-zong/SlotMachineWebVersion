import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { animated, useSpring } from '@react-spring/three';

const LeverArm: React.FC<{ pulling: boolean }> = ({ pulling }) => {
  // Drive the lever arm rotation with a spring for a tactile feel.
  const { rotation } = useSpring({
    rotation: pulling ? [-Math.PI / 2.6, 0, 0] : [Math.PI / 12, 0, 0],
    config: { mass: 1.2, tension: 220, friction: 14 }
  });

  return (
    <animated.group rotation={rotation as any}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 1.1, 18]} />
        <meshStandardMaterial color="#9fb7ff" metalness={0.45} roughness={0.25} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <sphereGeometry args={[0.18, 32, 32]} />
        <meshStandardMaterial color="#ff4d8c" metalness={0.35} roughness={0.35} />
      </mesh>
    </animated.group>
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
      camera={{ position: [0.8, 1.15, 2.8], fov: 32 }}
      onPointerDown={triggerSpin}
    >
      <color attach="background" args={['#0f172a']} />
      <ambientLight intensity={0.5} />
      <spotLight
        position={[3, 4, 3]}
        angle={0.4}
        penumbra={0.6}
        intensity={5}
        color="#9fb7ff"
        castShadow
      />
      <group position={[0, -0.25, 0]}>
        <mesh position={[0, -0.45, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.25, 24]} />
          <meshStandardMaterial color="#192138" metalness={0.25} roughness={0.6} />
        </mesh>
        <LeverArm pulling={pulling} />
      </group>
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
