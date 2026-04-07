"use client";

import React, { useState, useMemo, useRef, Suspense, useEffect } from "react";
import * as THREE from 'three';
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line, Html } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";

interface TopicScore {
  topic: string;
  score: number;
  maxScore: number;
}

interface RadarChart3DProps {
  topics: TopicScore[];
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(80 * 3);
    for(let i = 0; i < 80; i++) {
        // random position in sphere of radius 4
        const r = 4 * Math.cbrt(Math.random());
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3] = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame(() => {
    if(pointsRef.current) pointsRef.current.rotation.y += 0.001;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={80} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#C9A84C" transparent opacity={0.6} />
    </points>
  )
}

function DataSurface({ points }: { points: {x: number, z: number, y: number}[] }) {
  const n = points.length;

  const topGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const verts = new Float32Array((n + 1) * 3);
    verts[0] = 0; verts[1] = 0; verts[2] = 0;
    for(let i=0; i<n; i++) {
      verts[(i+1)*3] = points[i].x;
      verts[(i+1)*3+1] = 0; 
      verts[(i+1)*3+2] = points[i].z;
    }
    const inds = [];
    for(let i=1; i<=n; i++) {
      const next = i === n ? 1 : i+1;
      inds.push(0, i, next);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    geo.setIndex(inds);
    geo.computeVertexNormals();
    return geo;
  }, [points, n]);

  const bottomGeo = useMemo(() => {
    const geo = topGeo.clone();
    const pos = geo.attributes.position.array as Float32Array;
    for(let i=0; i<pos.length; i+=3) {
      pos[i+1] = -0.15;
    }
    // Reverse indices to face outwards
    const oldInds = geo.getIndex()?.array || [];
    const newInds = [];
    for(let i=0; i<oldInds.length; i+=3) {
      newInds.push(oldInds[i], oldInds[i+2], oldInds[i+1]);
    }
    geo.setIndex(newInds);
    geo.computeVertexNormals();
    return geo;
  }, [topGeo]);

  const sidesGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const sideVerts = new Float32Array(n * 4 * 3);
    const sideInds = [];
    for (let i = 0; i < n; i++) {
      const p1 = points[i];
      const p2 = points[(i+1)%n];
      const offset = i * 4;
      
      sideVerts[offset*3 + 0] = p1.x; sideVerts[offset*3 + 1] = 0; sideVerts[offset*3 + 2] = p1.z;
      sideVerts[(offset+1)*3 + 0] = p2.x; sideVerts[(offset+1)*3 + 1] = 0; sideVerts[(offset+1)*3 + 2] = p2.z;
      sideVerts[(offset+2)*3 + 0] = p1.x; sideVerts[(offset+2)*3 + 1] = -0.15; sideVerts[(offset+2)*3 + 2] = p1.z;
      sideVerts[(offset+3)*3 + 0] = p2.x; sideVerts[(offset+3)*3 + 1] = -0.15; sideVerts[(offset+3)*3 + 2] = p2.z;

      sideInds.push(offset, offset+2, offset+1);
      sideInds.push(offset+1, offset+2, offset+3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(sideVerts, 3));
    geo.setIndex(sideInds);
    geo.computeVertexNormals();
    return geo;
  }, [points, n]);

  return (
    <>
      <mesh geometry={topGeo}>
        <meshBasicMaterial color="#2D6A4F" transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bottomGeo}>
        <meshBasicMaterial color="#1B4332" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={sidesGeo}>
        <meshBasicMaterial color="#2D6A4F" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      {/* Outer Glow Surface */}
      <mesh geometry={topGeo} scale={[1.02, 1, 1.02]}>
        <meshBasicMaterial color="#2D6A4F" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function DataPointMarker({
  x, z, pct, topic, score, maxScore, isHovered, onHover, onUnhover
}: {
  x: number; z: number; pct: number; topic: string; score: number; maxScore: number;
  isHovered: boolean; onHover: () => void; onUnhover: () => void;
}) {
  const color = score >= maxScore * 0.7 ? "#2D6A4F" : score >= maxScore * 0.4 ? "#C9A84C" : "#9B2335";
  const { scale, intensity } = useSpring({
    scale: isHovered ? 1.8 : 1,
    intensity: isHovered ? 1.5 : 0.5,
    config: { mass: 1, tension: 280, friction: 20 }
  });

  return (
    <group position={[x, 0.05, z]}>
      {/* Outer Glow Halo */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.2} />
      </mesh>
      
      {/* Inner Emissive Sphere */}
      <animated.mesh 
        scale={scale}
        onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
        onPointerOut={() => onUnhover()}
      >
        <sphereGeometry args={[0.08, 16, 16]} />
        <animated.meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={intensity}
          roughness={0.2}
          metalness={0.8}
        />
      </animated.mesh>

      {/* Label and Tooltip */}
      <Html position={[x < 0 ? -0.2 : 0.2, isHovered ? 0.5 : 0.1, z < 0 ? -0.2 : 0.2]} center style={{ pointerEvents: "none" }}>
        {isHovered ? (
          <div style={{
            background: "#ffffff",
            border: `1px solid ${color}`,
            borderRadius: "12px",
            padding: "8px 12px",
            whiteSpace: "nowrap",
            boxShadow: "0 8px 32px rgba(0,0,0,0.15)"
          }}>
            <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "12px", color: "#52514E" }}>{topic}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "18px", color }}>
              {Math.round(pct * 100)}%
            </div>
          </div>
        ) : (
          <div style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(13,13,13,0.15)",
            borderRadius: "999px",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            fontSize: "13px",
            color,
            transition: "opacity 0.2s",
            opacity: 0.95,
            boxShadow: "0 2px 6px rgba(0,0,0,0.08)"
          }}>
            {topic} · {Math.round(pct * 100)}%
          </div>
        )}
      </Html>
    </group>
  );
}

function Scene({ topics }: { topics: TopicScore[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  
  // Ensure enough points strictly for the visual
  const defaultTopics = [
    { topic: "A", score: 0, maxScore: 100 },
    { topic: "B", score: 0, maxScore: 100 },
    { topic: "C", score: 0, maxScore: 100 }
  ];
  const displayTopics = topics.length >= 3 ? topics : [...topics, ...defaultTopics.slice(0, 3 - topics.length)];

  const { pointsInfo } = useMemo(() => {
    const n = displayTopics.length;
    const pts = displayTopics.map((t, i) => {
      const angle = (i / n) * Math.PI * 2;
      const pct = t.maxScore > 0 ? (t.score / t.maxScore) : 0;
      const radius = 2.5;
      const x = Math.sin(angle) * radius * pct;
      const z = Math.cos(angle) * radius * pct;
      const maxRadiusX = Math.sin(angle) * radius;
      const maxRadiusZ = Math.cos(angle) * radius;

      return {
        x, z, y: 0, 
        maxX: maxRadiusX, maxZ: maxRadiusZ,
        pct, topic: t.topic, score: t.score, maxScore: t.maxScore 
      };
    });

    return { pointsInfo: pts };
  }, [displayTopics]);

  // Entrance Animation
  const groupRef = useRef<THREE.Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    if (progress < 1) {
      const nextProg = Math.min(1, progress + delta / 1.5);
      setProgress(nextProg);
      const ease = 1 - Math.pow(1 - nextProg, 3);
      if (groupRef.current) {
        groupRef.current.position.y = -2 + (2 * ease);
      }
    }
  });

  return (
    <>
      <fog attach="fog" args={["#ffffff", 5, 25]} />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 5, 0]} color="#ffffff" intensity={1} />
      <pointLight position={[3, 2, 3]} color="#C9A84C" intensity={0.5} />

      {/* Grid Rings */}
      {[0.2, 0.4, 0.6, 0.8, 1.0].map((ringPct, ringIndex) => (
        <mesh key={`ring-${ringIndex}`} rotation={[-Math.PI/2, 0, 0]}>
          <torusGeometry args={[2.5 * ringPct, 0.015, 4, 64]} />
          <meshBasicMaterial color="#0D0D0D" transparent opacity={0.1 + ringIndex * 0.03} />
        </mesh>
      ))}

      {/* Spoke Lines */}
      {pointsInfo.map((p, i) => (
        <Line 
          key={`spoke-${i}`} 
          points={[[0, 0, 0], [p.maxX, 0, p.maxZ]]} 
          color="#0D0D0D" 
          lineWidth={2} 
          transparent 
          opacity={0.15} 
        />
      ))}

      {/* Animated Data Group */}
      <group ref={groupRef} position={[0, -2, 0]}>
        <DataSurface points={pointsInfo} />
        
        {pointsInfo.map((p, i) => {
          const isDimmed = hoveredIdx !== null && hoveredIdx !== i;
          return (
            <group key={`point-${i}`} scale={isDimmed ? 0.95 : 1} rotation={[0,0,0]}>
              <DataPointMarker
                x={p.x} z={p.z} pct={p.pct} topic={p.topic} score={p.score} maxScore={p.maxScore}
                isHovered={hoveredIdx === i}
                onHover={() => setHoveredIdx(i)}
                onUnhover={() => setHoveredIdx(null)}
              />
            </group>
          );
        })}
      </group>

      {/* Floor Reflection */}
      <mesh position={[0, -0.3, 0]} rotation={[-Math.PI/2, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.1} transparent opacity={0.8} />
      </mesh>

      <ParticleField />
    </>
  );
}

export default function RadarChart3D({ topics }: RadarChart3DProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 400);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const numTopics = topics.length;
  const displayTopics = numTopics < 3
    ? [...topics, ...Array.from({ length: 3 - numTopics }).map((_, i) => ({ topic: `N/A ${i}`, score: 0, maxScore: 100 }))]
    : topics;
  const numDisplayTopics = displayTopics.length;

  let sum = 0;
  let max = -1;
  let min = 101;
  let strongestTopic = "";
  let weakestTopic = "";

  displayTopics.forEach((t) => {
    const pct = t.maxScore > 0 ? (t.score / t.maxScore) * 100 : 0;
    sum += pct;
    if (pct > max) { max = pct; strongestTopic = t.topic; }
    if (pct < min) { min = pct; weakestTopic = t.topic; }
  });

  const avgScore = Math.round(sum / numDisplayTopics);

  return (
    <div style={{
      width: "100%",
      borderRadius: "16px",
      overflow: "hidden",
      background: "#ffffff",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column"
    }}>
      <div style={{ 
        width: "100%", 
        height: "clamp(350px, 50vw, 500px)",
        position: "relative"
      }}>
        <Suspense fallback={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#C9A84C", fontFamily: "'Outfit', sans-serif" }}>
            Initializing 3D Core...
          </div>
        }>
          <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
            <OrbitControls 
              enableZoom={false} 
              enablePan={false} 
              autoRotate={false} 
              minPolarAngle={Math.PI / 4} 
              maxPolarAngle={Math.PI / 2.2} 
            />
            <Scene topics={displayTopics} />
          </Canvas>
        </Suspense>
      </div>

      {/* ── BOTTOM STATS BAR ── */}
      <div style={{
        padding: "20px 32px",
        borderTop: "1px solid rgba(13,13,13,0.06)",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        justifyContent: "space-between",
        gap: isMobile ? 16 : 0,
        background: "#F9F8F6"
      }}>
        <div style={{ flex: 1, textAlign: isMobile ? "left" : "center", borderRight: isMobile ? "none" : "1px solid rgba(13,13,13,0.06)" }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", color: "#9E9B95", marginBottom: 4 }}>
            Strongest
          </div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: "#2D6A4F" }}>
            {strongestTopic || "N/A"}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: isMobile ? "left" : "center", borderRight: isMobile ? "none" : "1px solid rgba(13,13,13,0.06)" }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", color: "#9E9B95", marginBottom: 4 }}>
            Needs Work
          </div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: 14, color: "#9B2335" }}>
            {weakestTopic || "N/A"}
          </div>
        </div>
        <div style={{ flex: 1, textAlign: isMobile ? "left" : "center" }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: 12, textTransform: "uppercase", color: "#9E9B95", marginBottom: 4 }}>
            Avg Score
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: "#C9A84C", lineHeight: 1 }}>
            {avgScore}%
          </div>
        </div>
      </div>
    </div>
  );
}
