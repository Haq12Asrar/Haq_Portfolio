'use client';

import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { OrbitControls, PerspectiveCamera, Stars, Float, ContactShadows, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function Model({ url }) {
    const obj = useLoader(OBJLoader, url);
    const meshRef = useRef();

    // Load textures (Assuming they are in the same models folder)
    // We handle them gracefully if they aren't loaded yet
    const textures = {
        map: '/models/texture_diffuse.png',
        normalMap: '/models/texture_normal.png',
        roughnessMap: '/models/texture_roughness.png',
        metalnessMap: '/models/texture_metallic.png'
    };

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });

    // Apply a hybrid material: base texture + neon wireframe glow
    useMemo(() => {
        obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.material = new THREE.MeshStandardMaterial({
                    color: '#00f5ff',
                    emissive: '#001a20',
                    wireframe: true, // Keep it cyberpunk for now
                    transparent: true,
                    opacity: 0.8
                });
            }
        });
    }, [obj]);

    return (
        <primitive
            ref={meshRef}
            object={obj}
            scale={2.2}
            position={[0, -0.5, 0]}
        />
    );
}

export default function ModelViewer() {
    return (
        <div style={{ width: '100%', height: '500px', position: 'relative', overflow: 'hidden', cursor: 'grab' }}>
            <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={45} />

                {/* Lights */}
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#00f5ff" castShadow />
                <pointLight position={[-10, -10, -10]} color="#ff0055" intensity={0.5} />

                <Suspense fallback={
                    <group>
                        <mesh rotation={[0, 1, 0]}>
                            <octahedronGeometry args={[1.5, 0]} />
                            <meshStandardMaterial color="#00f5ff" wireframe />
                        </mesh>
                        <mesh position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[1.8, 2, 64]} />
                            <meshBasicMaterial color="#00f5ff" transparent opacity={0.2} />
                        </mesh>
                    </group>
                }>
                    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                        <Model url="/models/base.obj" />
                    </Float>
                </Suspense>

                <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1.2} />
                <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 1.5} minPolarAngle={Math.PI / 3} />
                <ContactShadows opacity={0.6} scale={10} blur={2.5} far={10} color="#000000" />
            </Canvas>

            {/* Decorative Overlays */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', pointerEvents: 'none' }}>
                <div style={{ color: 'var(--cyan)', fontFamily: 'Share Tech Mono', fontSize: '10px', borderLeft: '2px solid var(--cyan)', paddingLeft: '10px', textShadow: '0 0 5px var(--cyan)' }}>
                    CORE_VISUAL_MATRIX: ONLINE<br />
                    OBJECT_CLASS: 3D_MODEL_BASE<br />
                    RENDER_MODE: HYBRID_NEON
                </div>
            </div>
        </div>
    );
}
