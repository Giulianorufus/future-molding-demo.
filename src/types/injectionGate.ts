export type InjectionGate = {
  id: string
  /** Coordinates in the rendered model's local space, before viewer fitting. */
  position: { x: number; y: number; z: number }
  normal?: { x: number; y: number; z: number }
  cavityId?: string
}
