import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useDrawingStore } from '@/stores/drawingStore'
import { useMaterialStore } from '@/stores/materialStore'
import { materialCatalog } from '@/data/materialCatalog'
import { buildSurfaceFillArrival, type FillProcessContext } from '@/simulation/fillArrival'

type Props = { viewerUrl: string; durationMs?: number }

export default function FillSimulationViewer({ viewerUrl, durationMs = 3000 }: Props) {
  const host = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(0)
  const runningRef = useRef(false)
  const startRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const gatePoint = useDrawingStore((s) => s.gatePoint)
  const setDrawingResult = useDrawingStore((s) => s.setResult)
  const selectedMaterialId = useMaterialStore((s) => s.selectedMaterialId)
  const selectedMaterial = materialCatalog.find((material) => material.id === selectedMaterialId)
  const fillProcessContext: FillProcessContext | undefined = selectedMaterial
    ? { materialId: selectedMaterial.id, materialFlowFactor: selectedMaterial.flowFactor }
    : undefined
  const [selectingGate, setSelectingGate] = useState(false)
  const selectingGateRef = useRef(false)
  useEffect(() => { selectingGateRef.current = selectingGate }, [selectingGate])

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
    let disposed = false
    let model: THREE.Object3D | null = null
    let fillPlane: THREE.Plane | null = null
    let minX = -40, maxX = 40
    const fillMaterials: THREE.ShaderMaterial[] = []
    const originalGeometries = new Map<THREE.Mesh, THREE.BufferGeometry>()
    const rebuildGateFill = () => {
      if (!model) return
      fillMaterials.splice(0).forEach(m => m.dispose())
      model.traverse((o: any) => {
        if (!o.isMesh || !o.geometry) return
        if (!originalGeometries.has(o)) originalGeometries.set(o, o.geometry)
        else o.geometry = originalGeometries.get(o)!
        const gp = useDrawingStore.getState().gatePoint
        if (!gp) return
        const worldGate = new THREE.Vector3(gp.x, gp.y, gp.z)
        const localGate = o.worldToLocal(worldGate.clone())
        const field = buildSurfaceFillArrival(o.geometry, localGate, { processContext: fillProcessContext })
        if (!field) return
        o.geometry = field.geometry
        const material = new THREE.ShaderMaterial({
          uniforms: { uProgress: { value: progressRef.current } },
          vertexShader: `
            attribute float fillArrival;
            varying float vArrival;
            void main() {
              vArrival = fillArrival;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `,
          fragmentShader: `
            uniform float uProgress;
            varying float vArrival;
            void main() {
              if (vArrival > uProgress) discard;
              gl_FragColor = vec4(0.082, 0.592, 0.898, 1.0);
            }
          `,
          side: THREE.DoubleSide,
        })
        o.material = material
        fillMaterials.push(material)
      })
      fillPlane = null
    }

    const restoreAxisFill = () => {
      if (!model) return
      fillMaterials.splice(0).forEach(m => m.dispose())
      fillPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), minX)
      model.traverse((o: any) => {
        if (!o.isMesh) return
        const original = originalGeometries.get(o)
        if (original) o.geometry = original
        o.material = new THREE.MeshStandardMaterial({
          color: 0x1597e5, roughness: 0.6, metalness: 0.02,
          side: THREE.DoubleSide,
        })
      })
    }
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const gateMarker = new THREE.Mesh(
      new THREE.SphereGeometry(2.2, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xf4c430, emissive: 0x5a4300 })
    )
    gateMarker.visible = false
    scene.add(gateMarker)

    const placeMarkerFromStore = () => {
      const gp = useDrawingStore.getState().gatePoint
      gateMarker.visible = !!gp
      if (gp) gateMarker.position.set(gp.x, gp.y, gp.z)
    }
    placeMarkerFromStore()
    const unsubscribeGate = useDrawingStore.subscribe((state, previousState) => {
      if (state.gatePoint === previousState.gatePoint) return

      const gp = state.gatePoint

      if (!gp) {
        gateMarker.visible = false
        restoreAxisFill()
        return
      }

      gateMarker.position.set(gp.x, gp.y, gp.z)
      gateMarker.visible = true

      if (model) rebuildGateFill()
    })

    const onPointerDown = (event: PointerEvent) => {
      if (!selectingGateRef.current || !model) return
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObject(model, true)[0]
      if (!hit) return
      const normal = hit.face?.normal?.clone() ?? new THREE.Vector3(0, 0, 1)
      normal.transformDirection(hit.object.matrixWorld)
      setDrawingResult({
        gatePoint: { x: hit.point.x, y: hit.point.y, z: hit.point.z },
        gateNormal: { x: normal.x, y: normal.y, z: normal.z },
      })
      selectingGateRef.current = false
      setSelectingGate(false)
    }
    renderer.domElement.addEventListener('pointerdown', onPointerDown)

    Promise.all([
      import('three/examples/jsm/loaders/GLTFLoader'),
      import('three/examples/jsm/controls/OrbitControls'),
    ]).then(async ([lm, cm]) => {
      controls = new cm.OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      try {
        const response = await fetch(viewerUrl)
        if (!response.ok) throw new Error(`Caricamento GLB fallito: HTTP ${response.status}`)
        const arrayBuffer = await response.arrayBuffer()
        if (disposed) return
        new lm.GLTFLoader().parse(arrayBuffer, viewerUrl, gltf => {
          if (disposed) return
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
            originalGeometries.set(o, o.geometry)
            o.frustumCulled = false
            o.material = new THREE.MeshStandardMaterial({
              color: 0x1597e5, roughness: 0.6, metalness: 0.02,
              side: THREE.DoubleSide,
            })
          })
          renderer.localClippingEnabled = true
          if (useDrawingStore.getState().gatePoint) rebuildGateFill()
          const d = 120
          camera.position.set(d * .75, d * .55, d * 1.15)
          camera.lookAt(0, 0, 0)
          controls.target.set(0, 0, 0)
        }, error => {
          if (!disposed) console.error('Parsing GLB fallito:', error)
        })
      } catch (error) {
        if (!disposed) console.error('Caricamento GLB fallito:', error)
      }
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
      if (fillMaterials.length) fillMaterials.forEach(m => { m.uniforms.uProgress.value = progressRef.current })
      else if (fillPlane) fillPlane.constant = minX + (maxX - minX) * progressRef.current
      controls?.update?.()
      renderer.render(scene, camera)
    }
    frame = requestAnimationFrame(loop)
    return () => {
      disposed = true
      unsubscribeGate(); cancelAnimationFrame(frame); renderer.domElement.removeEventListener('pointerdown', onPointerDown); fillMaterials.forEach(m => m.dispose()); controls?.dispose?.(); renderer.dispose(); renderer.forceContextLoss?.(); if (host.current) host.current.innerHTML = ''
    }
  }, [viewerUrl, durationMs, setDrawingResult, selectedMaterialId])

  useEffect(() => {
    // Gate removal is handled by remount-safe state; selecting a new gate rebuilds the field.
    if (!gatePoint) setSelectingGate(false)
  }, [gatePoint])

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
    <div className="mb-2 flex items-center gap-2">
      <button className={`rounded px-3 py-2 text-sm ${selectingGate ? 'bg-yellow-400 text-blue-950' : 'border'}`} onClick={() => setSelectingGate(v => !v)}>{selectingGate ? 'Clicca sul pezzo…' : gatePoint ? 'Cambia punto iniezione' : 'Seleziona punto iniezione'}</button>
      {gatePoint && <button className="rounded border px-3 py-2 text-sm" onClick={() => { setDrawingResult({ gatePoint: null, gateNormal: null }); reset(); }}>Rimuovi gate</button>}
      {gatePoint && <span className="text-xs text-gray-500">Gate selezionato</span>}
    </div>
    <div ref={host} className={`w-full overflow-hidden rounded ${selectingGate ? 'cursor-crosshair' : ''}`} style={{ height: 360 }} />
    <input aria-label="Avanzamento riempimento" className="mt-3 w-full" type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={e => { setRunning(false); runningRef.current=false; const p=Number(e.target.value)/100; setProgress(p); progressRef.current=p; startRef.current=0 }} />
    <div className="mt-2 flex gap-2"><button className="rounded bg-blue-800 px-4 py-2 text-white" onClick={toggle}>{running ? 'Pausa' : 'Avvia'}</button><button className="rounded border px-4 py-2" onClick={reset}>Reset</button></div>
  </div>
}
