
import React, { useRef } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, ContactShadows, Environment, MeshDistortMaterial } from "@react-three/drei";

function FloatingObject(props) {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
        meshRef.current.rotation.x = Math.cos(t / 4) / 2;
        meshRef.current.rotation.y = Math.sin(t / 4) / 2;
        meshRef.current.rotation.z = Math.sin(t / 1.5) / 2;
    }
  });

  return (
    <mesh ref={meshRef} {...props}>
      <icosahedronGeometry args={[1, 15]} />
      <MeshDistortMaterial
        color={props.color || "#0ea5e9"}
        envMapIntensity={0.4}
        clearcoat={1}
        clearcoatRoughness={0}
        metalness={0.1}
        distort={0.4}
        speed={2}
      />
    </mesh>
  );
}

const PHASE_COLORS = {
  morning: "#f97316", // orange-500
  day: "#0ea5e9",     // sky-500
  evening: "#8b5cf6", // violet-500
  night: "#4f46e5",   // indigo-600
};

export default function Hero3D({ className }) {
  const { phase } = useTheme();
  const color = PHASE_COLORS[phase] || "#0ea5e9";

  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={1} />
        
        <Float
            speed={4} // Animation speed
            rotationIntensity={1} // XYZ rotation intensity
            floatIntensity={2} // Up/down float intensity
        >
            <FloatingObject scale={1.8} color={color} />
        </Float>
        
        <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.5}
            scale={10}
            blur={2.5}
            far={4}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
