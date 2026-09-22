import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

type Props = { viewerUrl: string; durationMs?: number }

export default function FillSimulationViewer({ viewerUrl, durationMs = 3000 }: Props) {
  const host = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(0)
  const runningRef = useRef(false)
  const startRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)

  useEffect(() => { progressRef.current = progress }, [progress])
  useEffect(() => { runningRef.current = running }, [running])

  useEffect(() => {
    if (!host.current) return
    const width = host.current.clientWidth || 640
    const height = 360
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf5f5f5)
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))
    host.current.innerHTML = ''
    host.current.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 1.4))
    const light = new THREE.DirectionalLight(0xffffff, 1.2)
    light.position.set(50, 50, 100); scene.add(light)

    let controls: any
    let frame = 0
    let model: THREE.Object3D | null = null
    let fillPlane: THREE.Plane | null = null
    let minX = -40, maxX = 40

    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader'),
      import('three/examples/jsm/controls/OrbitControls'),
    ]).then(([lm, cm]) => {
      controls = new cm.OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      new lm.GLTFLoader().load(viewerUrl, gltf => {
        model = gltf.scene
        const box = new THREE.Box3().setFromObject(model)
        const size = box.getSize(new THREE.Vector3())
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)
        const scale = 80 / (Math.max(size.x, size.y, size.z) || 1)
        model.scale.setScalar(scale)
        scene.add(model)
        const fitted = new THREE.Box3().setFromObject(model)
        minX = fitted.min.x; maxX = fitted.max.x
        fillPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), minX)
        model.traverse((o: any) => {
          if (!o.isMesh) return
          o.frustumCulled = false
          o.material = new THREE.MeshStandardMaterial({
            color: 0x1597e5, roughness: 0.6, metalness: 0.02,
            side: THREE.DoubleSide, clippingPlanes: [fillPlane!],
          })
        })
        renderer.localClippingEnabled = true
        const d = 120
        camera.position.set(d * .75, d * .55, d * 1.15)
        camera.lookAt(0, 0, 0)
        controls.target.set(0, 0, 0)
      })
    })

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (runningRef.current) {
        if (!startRef.current) startRef.current = now - progressRef.current * durationMs
        const p = Math.min(1, (now - startRef.current) / durationMs)
        progressRef.current = p
        setProgress(p)
        if (p >= 1) { runningRef.current = false; setRunning(false) }
      }
      if (fillPlane) fillPlane.constant = minX + (maxX - minX) * progressRef.current
      controls?.update?.()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frame); controls?.dispose?.(); renderer.dispose(); renderer.forceContextLoss?.(); if (host.current) host.current.innerHTML = '' }
  }, [viewerUrl, durationMs])

  const reset = () => { setRunning(false); runningRef.current = false; setProgress(0); progressRef.current = 0; startRef.current = 0 }
  const toggle = () => {
    if (progressRef.current >= 1) { progressRef.current = 0; setProgress(0); startRef.current = 0 }
    if (!runningRef.current) startRef.current = performance.now() - progressRef.current * durationMs
    runningRef.current = !runningRef.current; setRunning(runningRef.current)
  }

  return <div className="rounded-lg border bg-white p-3">
    <div className="mb-2 flex items-center justify-between">
      <div><div className="font-semibold text-blue-900">Simulazione riempimento 3D</div><div className="text-xs text-gray-500">Anteprima geometrica, non solver Moldflow.</div></div>
      <div className="font-mono text-sm">{Math.round(progress * 100)}% · {(progress * durationMs / 1000).toFixed(2)} s</div>
    </div>
    <div ref={host} className="w-full overflow-hidden rounded" style={{ height: 360 }} />
    <input aria-label="Avanzamento riempimento" className="mt-3 w-full" type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={e => { setRunning(false); runningRef.current=false; const p=Number(e.target.value)/100; setProgress(p); progressRef.current=p; startRef.current=0 }} />
    <div className="mt-2 flex gap-2"><button className="rounded bg-blue-800 px-4 py-2 text-white" onClick={toggle}>{running ? 'Pausa' : 'Avvia'}</button><button className="rounded border px-4 py-2" onClick={reset}>Reset</button></div>
  </div>
}
