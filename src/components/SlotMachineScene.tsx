import React, { useState, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, PerspectiveCamera, Shadow, Cylinder, Sphere } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';

// --- Types & Constants ---
const REEL_RADIUS = 1.2;
const REEL_WIDTH = 1.0;
const REEL_SEGMENTS = 8; // Octagon as requested
const REEL_GAP = 0.2;
const SPIN_DURATION = 2000; // ms

interface LeverProps {
  onPull: () => void;
  isPulling: boolean;
}

interface ReelProps {
  index: number;
  spinning: boolean;
  stopDelay: number;
}

// --- Components ---

/**
 * The Lever mechanism on the right side.
 * Consists of a base, a shaft, and a handle (sphere).
 */
const Lever: React.FC<LeverProps> = ({ onPull, isPulling }) => {
  const [hovered, setHover] = useState(false);

  // Spring animation for the lever arm rotation
  const { rotation } = useSpring({
    rotation: isPulling ? [Math.PI / 4, 0, 0] : [-Math.PI / 6, 0, 0],
    config: { mass: 1, tension: 200, friction: 15 },
    onRest: () => {
      // If needed to reset something after animation
    }
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    if (!isPulling) {
      onPull();
    }
  };

  const materialColor = hovered ? "#9ca3af" : "#d1d5db"; // Zinc-400 vs Zinc-300

  return (
    <group position={[3.5, -1, 0]}>
      {/* Base of the lever (Fixed) */}
      <Cylinder args={[0.5, 0.6, 0.5, 32]} position={[0, 0.25, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e5e7eb" roughness={0.5} metalness={0.8} />
      </Cylinder>

      {/* Pivot Point Group */}
      <animated.group rotation={rotation as any}>
        {/* The Shaft (Cylinder) */}
        <Cylinder 
          args={[0.1, 0.1, 3.5, 16]} 
          position={[0, 1.75, 0]} 
          castShadow 
          receiveShadow
        >
           <meshStandardMaterial color="#9ca3af" roughness={0.3} metalness={0.6} />
        </Cylinder>

        {/* The Handle (Sphere) - The interactive part */}
        <Sphere 
          args={[0.5, 32, 32]} 
          position={[0, 3.5, 0]} 
          onClick={handleClick}
          onPointerOver={() => setHover(true)}
          onPointerOut={() => setHover(false)}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color={materialColor} 
            roughness={0.2} 
            metalness={0.1} 
            emissive={hovered ? "#e5e7eb" : "#000000"}
            emissiveIntensity={0.2}
          />
        </Sphere>
      </animated.group>
    </group>
  );
};

/**
 * Individual Reel Component.
 * It's a Cylinder with 8 radial segments (octagonal prism), rotated to roll on X-axis.
 */
const Reel: React.FC<ReelProps> = ({ index, spinning, stopDelay }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Calculate position based on index (-1, 0, 1) to center them
  const xPos = (index - 1) * (REEL_WIDTH + REEL_GAP);

  // We use a spring to handle the target rotation
  // When spinning, we add a large amount to rotation
  // When stopped, we snap to the nearest face
  const [targetRotation, setTargetRotation] = useState(0);

  useEffect(() => {
    if (spinning) {
      // Start spinning: add lots of rotation
      // Randomize slightly so they don't look identical while spinning
      setTargetRotation(prev => prev + Math.PI * 20 + Math.random() * Math.PI);
    } else {
      // Stop spinning: Snap to nearest 45 degrees (PI/4 for 8 segments)
      // Add a delay based on index for the "clunk-clunk-clunk" effect
      const timeout = setTimeout(() => {
        setTargetRotation(prev => {
          const segmentAngle = (Math.PI * 2) / REEL_SEGMENTS;
          // Round to nearest segment
          const snapped = Math.ceil(prev / segmentAngle) * segmentAngle;
          // Add a full extra rotation or two for the "landing" effect
          return snapped + (Math.PI * 2); 
        });
      }, stopDelay);
      return () => clearTimeout(timeout);
    }
  }, [spinning, stopDelay]);

  // Spring for smooth physics-based rotation
  const { rotationX } = useSpring({
    rotationX: targetRotation,
    config: spinning 
      ? { mass: 5, tension: 100, friction: 100 } // Constant-ish velocity feel
      : { mass: 2, tension: 180, friction: 20 }  // Bouncy snap on stop
  });

  return (
    <group position={[xPos, 0, 0]}>
        {/* 
            Cylinder Args: [radiusTop, radiusBottom, height, radialSegments] 
            Rotation: Z=90deg to lay it flat horizontally
        */}
      <animated.mesh 
        ref={meshRef} 
        rotation-z={Math.PI / 2} 
        rotation-x={rotationX}
        castShadow 
        receiveShadow
      >
        <cylinderGeometry args={[REEL_RADIUS, REEL_RADIUS, REEL_WIDTH, REEL_SEGMENTS]} />
        {/* 
           Material: Very light grey, almost white. 
           Flat shading helps emphasize the 8 faces.
        */}
        <meshStandardMaterial 
          color="#f8fafc" 
          roughness={0.3} 
          metalness={0.1} 
          flatShading={true} 
        />
      </animated.mesh>
    </group>
  );
};

/**
 * The Floor that catches shadows
 */
const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      {/* ShadowMaterial is transparent but receives shadows, perfect for white backgrounds */}
      <shadowMaterial opacity={0.15} color="#1e293b" />
    </mesh>
  );
};

/**
 * Main Scene Composition
 */
const SlotMachineScene: React.FC = () => {
  const [spinning, setSpinning] = useState(false);
  const [leverPulling, setLeverPulling] = useState(false);

  const handleLeverPull = () => {
    if (spinning) return; // Prevent double pull

    setLeverPulling(true);

    // Start spinning slightly after lever starts moving
    setTimeout(() => setSpinning(true), 200);

    // Reset lever position after a short time
    setTimeout(() => setLeverPulling(false), 500);

    // Stop spinning after duration
    setTimeout(() => {
      setSpinning(false);
    }, SPIN_DURATION);
  };

  return (
     <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 2, 8], fov: 45 }}>
      {/* Environment Configuration */}
      <color attach="background" args={['#ffffff']} />
      
      {/* Lighting: Spotlight from top, cool white */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[0, 15, 5]}
        angle={0.35}
        penumbra={0.8} // Soft edges
        intensity={1.5}
        color="#f0f9ff" // Cool white
        castShadow
        shadow-bias={-0.0001}
       
      />
      {/* Fill light for the front to avoid pitch black shadows */}
      <pointLight position={[0, 2, 10]} intensity={0.3} color="#ffffff" />

      {/* Scene Content */}
      <group position={[0, 0.5, 0]}>
        <Reel index={0} spinning={spinning} stopDelay={0} />
        <Reel index={1} spinning={spinning} stopDelay={200} />
        <Reel index={2} spinning={spinning} stopDelay={400} />
        
        <Lever onPull={handleLeverPull} isPulling={leverPulling} />
      </group>

      <Floor />
      

      {/* Camera Controls (Optional, for debugging or adjusting view) */}
      {/* <OrbitControls makeDefault enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2} /> */}
      
      {/* Effects */}
      <Environment preset="city" /> {/* Just for reflections */}
    </Canvas>
  );
};

export default SlotMachineScene;
