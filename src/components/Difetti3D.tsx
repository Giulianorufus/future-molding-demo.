import { Canvas } from "@react-three/fiber"
import { OrbitControls, Html, useGLTF } from "@react-three/drei"
import { Suspense } from "react"

type Hotspot = {
  position: [number, number, number]
  label: string
  onClick: () => void
}

function Model() {
  // Placeholder 3D geometry since no GLB model is available
  return (
    <mesh>
      <boxGeometry args={[1, 0.5, 0.3]} />
      <meshStandardMaterial color="hsl(var(--primary))" />
    </mesh>
  )
}

function HotspotMarker({ position, label, onClick }: Hotspot) {
  return (
    <Html position={position}>
      <div
        onClick={onClick}
        className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded cursor-pointer shadow-md hover:bg-destructive/90 transition-colors"
      >
        {label}
      </div>
    </Html>
  )
}

export default function Difetti3D() {
  const hotspots: Hotspot[] = [
    {
      position: [0.5, 0.5, 0],
      label: "Vuoto interno",
      onClick: () => alert("Correzione automatica: aumenta pressione di mantenimento"),
    },
    {
      position: [-0.5, 0.3, 0],
      label: "Bruciatura",
      onClick: () => alert("Correzione automatica: riduci velocità iniezione + aumenta sfiati"),
    },
  ]

  return (
    <div className="w-full h-[500px] bg-muted rounded-lg shadow-md border">
      <Canvas camera={{ position: [2, 2, 2], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          {/* Modello 3D placeholder - sostituire con file GLB reale */}
          <Model />
          {hotspots.map((h, i) => (
            <HotspotMarker key={i} {...h} />
          ))}
        </Suspense>
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  )
}