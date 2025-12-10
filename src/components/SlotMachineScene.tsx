import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import { useSpring, animated, config } from '@react-spring/three';
import * as THREE from 'three';

// --- Types & Constants ---
const REEL_SEGMENTS = 8; // Octagon as requested
const SPIN_DURATION = 2000; // ms

interface LeverProps {
  isPulling: boolean;
  // 我们将把加载的模型节点传递给拉杆
  nodes: { [name: string]: THREE.Object3D };
}

interface ReelProps {
  index: number;
  spinning: boolean;
  stopDelay: number;
  // 我们将把所有加载的节点传递过来
  nodes: { [name: string]: THREE.Object3D };
}

// --- Components ---

/**
 * The Lever mechanism on the right side.
 * Consists of a base, a shaft, and a handle (sphere).
 */
const Lever: React.FC<LeverProps> = ({ isPulling, nodes }) => {
  // const [hovered, setHover] = useState(false); // 如果需要，可以重新添加悬停效果

  // Spring animation for the lever arm rotation
  const { rotation } = useSpring({
    //rotation: isPulling ? [Math.PI / 4, 0, 0] : [-Math.PI / 6, 0, 0],
    // 例如，如果想让它向相反方向拉动，可以改为：
    rotation: isPulling ? [-Math.PI / 4, 0, 0] : [Math.PI / 16, 0, 0],
    config: { mass: 1, tension: 200, friction: 15 },
    onRest: () => {
      // If needed to reset something after animation
    }
  });

  // 获取拉杆臂的 THREE.Object3D 实例
  const leverArmMesh = nodes.lever_arm as THREE.Mesh;

  // 使用 useFrame 直接操作 THREE.Object3D 的旋转
  useFrame(() => {
    if (leverArmMesh) {
      // 将 useSpring 的值应用到拉杆臂的 X 轴旋转
      // rotation.get() 返回一个数组 [x, y, z]，我们只取 x
      leverArmMesh.rotation.x = (rotation.get() as number[])[0];
    }
  });

  return (
    // Lever 组件现在不渲染任何内容，它直接操作场景中的 THREE.Object3D
    // 如果需要点击事件，需要通过 Canvas 上的 Raycasting 来实现
    null
  );
};

/**
 * Individual Reel Component.
 * It's a Cylinder with 8 radial segments (octagonal prism), rotated to roll on X-axis.
 */
const Reel: React.FC<ReelProps> = ({ index, spinning, stopDelay, nodes }) => {
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

  // 获取对应滚轮的 THREE.Object3D 实例
  // 假设滚轮在 GLTF 中命名为 reel_1, reel_2, reel_3
  const reelMesh = nodes[`reel_${index + 1}`] as THREE.Mesh;

  // 使用 useFrame 直接操作 THREE.Object3D 的旋转
  useFrame(() => {
    if (reelMesh) {
      // 将 useSpring 的值应用到滚轮的 X 轴旋转
      reelMesh.rotation.x = rotationX.get();
    }
  });

  return (
    null // Reel 组件现在不渲染任何内容，它直接操作场景中的 THREE.Object3D
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
 * 此组件用于加载GLB模型并分发其部件。
 * 您需要在这里链接您的模型文件和对象名称。
 */
const Model: React.FC<any> = ({ spinning, leverPulling, handleLeverPull }) => {
  // 将您的 .glb 文件放置在项目的 /public 文件夹下。
  const { nodes, scene } = useGLTF('/models/slot-machine.glb');

  // 重要提示: 这里的名称 ('body', 'reel_1', 'reel_2' 等) 必须
  // 与您在3D建模软件 (如 Blender) 中为对象设置的名称完全匹配。
  // 为了让拉杆正常工作，最好将其分为一个静态的 'lever_base' 和一个可动的 'lever_arm'。

  return (
    //model rotation 整体旋转调整
    <group position={[0, -0.5 , 0]} scale={1.0} rotation={[0, Math.PI * 2, 0]}> {/* 使用 position 调整模型位置 */}
      {/* 直接渲染原始的 GLTF 场景，确保动画和交互能正确应用 */}
      <primitive
        object={scene}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          // 阻止事件冒泡，这是一个好习惯
          e.stopPropagation();
          // 检查被点击的网格(mesh)的名称是否为 'lever_arm'
          // 这个名称是在您的3D建模软件中设置的
          if (e.object.name === 'lever_arm') {
            handleLeverPull();
          }
        }}
      />

      {/* Reel 和 Lever 组件现在通过直接操作 `nodes` 中的 THREE.Object3D 来实现动画 */}
      <Reel index={0} spinning={spinning} stopDelay={0} nodes={nodes} />
      <Reel index={1} spinning={spinning} stopDelay={200} nodes={nodes} />
      <Reel index={2} spinning={spinning} stopDelay={400} nodes={nodes} />
      <Lever isPulling={leverPulling} nodes={nodes} />
    </group>
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
     <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1, 5], fov: 20 }}>
      {/* Environment Configuration */}
      <color attach="background" args={['#ffffff']} />
      
      {/* Lighting: Spotlight from top, cool white */}
      <ambientLight intensity={0.4} />
      <spotLight
        position={[10,10, 15]}
        angle={0.35}
        penumbra={0.8} // Soft edges
        intensity={100} // 示例：将顶光强度从 1.5 增加到 2.5，使其更亮
        color="#ff0099ff" // Cool white
        castShadow
        shadow-bias={-0.0001}
       
      />
      {/* Fill light for the front to avoid pitch black shadows */}
      <pointLight position={[0, 2, 10]} intensity={0.3} color="#ffffff" />

      {/* Scene Content */}
      {/* 使用 React Suspense 在模型加载时显示后备内容 (这里是null) */}
      <Suspense fallback={null}>
        <Model 
          spinning={spinning}
          leverPulling={leverPulling}
          handleLeverPull={handleLeverPull}
        />
      </Suspense>

      <Floor />
      

      {/* Camera Controls (Optional, for debugging or adjusting view) */}
      {/* <OrbitControls makeDefault enablePan={false} minPolarAngle={0} maxPolarAngle={Math.PI / 2} /> */}
      
      {/* Effects */}
      <Environment preset="studio"   /> {/* 使用 intensity 调整环境光的强度 */}
    </Canvas>
  );
};

export default SlotMachineScene;
