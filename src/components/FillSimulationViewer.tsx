import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useDrawingStore } from '@/stores/drawingStore'
import { useMaterialStore } from '@/stores/materialStore'
import { materialCatalog } from '@/data/materialCatalog'
import { buildSurfaceFillArrival, type FillProcessContext } from '@/simulation/fillArrival'
import type { InjectionGate } from '@/types/injectionGate'

type Props = { viewerUrl: string; durationMs?: number }

export default function FillSimulationViewer({ viewerUrl, durationMs = 3000 }: Props) {
  const host = useRef<HTMLDivElement | null>(null)
  const progressRef = useRef(0)
  const runningRef = useRef(false)
  const startRef = useRef(0)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const gatePoint = useDrawingStore((s) => s.gatePoint)
  const gates = useDrawingStore((s) => s.gates)
  const selectedGateId = useDrawingStore((s) => s.selectedGateId)
  const addGate = useDrawingStore((s) => s.addGate)
  const removeGate = useDrawingStore((s) => s.removeGate)
  const clearGates = useDrawingStore((s) => s.clearGates)
  const selectGate = useDrawingStore((s) => s.selectGate)
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
    const gateMarkers = new Map<string, THREE.Sprite>()
    const effectiveGates = (): InjectionGate[] => {
      const state = useDrawingStore.getState()
      if (state.gates.length) return state.gates
      return state.gatePoint ? [{ id: 'G1', position: state.gatePoint, normal: state.gateNormal ?? undefined }] : []
    }
    const createGateMarker = (gate: InjectionGate) => {
      const canvas = document.createElement('canvas')
      canvas.width = 96; canvas.height = 96
      const context = canvas.getContext('2d')!
      context.fillStyle = '#ffffff'
      context.beginPath(); context.arc(48, 48, 34, 0, Math.PI * 2); context.fill()
      context.fillStyle = '#111827'; context.font = 'bold 28px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(gate.id, 48, 48)
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false }))
      sprite.userData.gateId = gate.id
      sprite.scale.set(7, 7, 1)
      scene.add(sprite); gateMarkers.set(gate.id, sprite)
    }
    const syncGateMarkers = () => {
      const current = effectiveGates()
      for (const [id, marker] of gateMarkers) {
        if (!current.some((gate) => gate.id === id)) {
          marker.removeFromParent(); marker.material.map?.dispose(); marker.material.dispose(); gateMarkers.delete(id)
        }
      }
      for (const gate of current) {
        if (!gateMarkers.has(gate.id)) createGateMarker(gate)
        const marker = gateMarkers.get(gate.id)!
        marker.position.set(gate.position.x, gate.position.y, gate.position.z)
        if (model) model.localToWorld(marker.position)
        marker.material.color.set(gate.id === useDrawingStore.getState().selectedGateId ? '#f4c430' : '#f59e0b')
      }
    }
    const rebuildGateFill = () => {
      if (!model) return
      fillMaterials.splice(0).forEach(m => m.dispose())
      model.traverse((o: any) => {
        if (!o.isMesh || !o.geometry) return
        if (!originalGeometries.has(o)) originalGeometries.set(o, o.geometry)
        else {
          if (o.geometry !== originalGeometries.get(o)) o.geometry.dispose()
          o.geometry = originalGeometries.get(o)!
        }
        const currentGates = effectiveGates()
        if (!currentGates.length) return
        const localGates = currentGates.map((gate) => ({ ...gate, position: o.worldToLocal(model!.localToWorld(new THREE.Vector3(gate.position.x, gate.position.y, gate.position.z))) }))
        const field = buildSurfaceFillArrival(o.geometry, localGates, { processContext: fillProcessContext })
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
        if (original) {
          if (o.geometry !== original) o.geometry.dispose()
          o.geometry = original
        }
        o.material = new THREE.MeshStandardMaterial({
          color: 0x1597e5, roughness: 0.6, metalness: 0.02,
          side: THREE.DoubleSide,
        })
      })
    }
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    syncGateMarkers()
    const unsubscribeGate = useDrawingStore.subscribe((state, previousState) => {
      if (state.gates === previousState.gates && state.gatePoint === previousState.gatePoint && state.selectedGateId === previousState.selectedGateId) return
      syncGateMarkers()
      if (state.gates === previousState.gates) return
      if (!effectiveGates().length) {
        restoreAxisFill()
        return
      }
      if (model) rebuildGateFill()
    })

    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const markerHit = raycaster.intersectObjects(Array.from(gateMarkers.values()), true)[0]
      if (markerHit) {
        const gateId = markerHit.object.userData.gateId
        if (gateId) selectGate(gateId)
        selectingGateRef.current = false
        setSelectingGate(false)
        return
      }
      if (!selectingGateRef.current || !model) return
      const hit = raycaster.intersectObject(model, true)[0]
      if (!hit) return
      const normal = hit.face?.normal?.clone() ?? new THREE.Vector3(0, 0, 1)
      normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld))
      normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(model.matrixWorld.clone().invert())).normalize()
      const localPoint = model.worldToLocal(hit.point.clone())
      const currentIds = new Set(effectiveGates().map((gate) => gate.id))
      let sequence = 1
      while (currentIds.has(`G${sequence}`)) sequence += 1
      addGate({ id: `G${sequence}`, position: { x: localPoint.x, y: localPoint.y, z: localPoint.z }, normal: { x: normal.x, y: normal.y, z: normal.z } })
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
          syncGateMarkers()
          if (effectiveGates().length) rebuildGateFill()
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
      unsubscribeGate(); cancelAnimationFrame(frame); renderer.domElement.removeEventListener('pointerdown', onPointerDown); fillMaterials.forEach(m => m.dispose()); for (const marker of gateMarkers.values()) { marker.removeFromParent(); marker.material.map?.dispose(); marker.material.dispose() }; controls?.dispose?.(); renderer.dispose(); renderer.forceContextLoss?.(); if (host.current) host.current.innerHTML = ''
    }
  }, [viewerUrl, durationMs, selectedMaterialId])

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
      <button className={`rounded px-3 py-2 text-sm ${selectingGate ? 'bg-yellow-400 text-blue-950' : 'border'}`} onClick={() => setSelectingGate(v => !v)}>{selectingGate ? 'Clicca sul pezzo…' : 'Aggiungi punto iniezione'}</button>
      {selectedGateId && <button className="rounded border px-3 py-2 text-sm" onClick={() => { removeGate(selectedGateId); reset(); }}>Rimuovi gate</button>}
      {gates.length > 0 && <button className="rounded border px-3 py-2 text-sm" onClick={() => { clearGates(); reset(); }}>Rimuovi tutti</button>}
      {selectedGateId && <span className="text-xs text-gray-500">{selectedGateId} selezionato</span>}
    </div>
    <div ref={host} className={`w-full overflow-hidden rounded ${selectingGate ? 'cursor-crosshair' : ''}`} style={{ height: 360 }} />
    <input aria-label="Avanzamento riempimento" className="mt-3 w-full" type="range" min="0" max="100" value={Math.round(progress * 100)} onChange={e => { setRunning(false); runningRef.current=false; const p=Number(e.target.value)/100; setProgress(p); progressRef.current=p; startRef.current=0 }} />
    <div className="mt-2 flex gap-2"><button className="rounded bg-blue-800 px-4 py-2 text-white" onClick={toggle}>{running ? 'Pausa' : 'Avvia'}</button><button className="rounded border px-4 py-2" onClick={reset}>Reset</button></div>
  </div>
}
