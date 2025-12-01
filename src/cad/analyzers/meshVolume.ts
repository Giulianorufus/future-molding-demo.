import * as THREE from "three";

/**
 * Calcola il volume di una BufferGeometry chiusa usando il metodo
 * tetraedri rispetto all'origine. Risultato in unità del modello;
 * tu lo interpreti come cm³ se la scala del modello è in cm.
 */
export function computeMeshVolume(geometry: THREE.BufferGeometry): number {
  const pos = geometry.attributes.position;
  if (!pos) return 0;

  let volume = 0;

  const vA = new THREE.Vector3();
  const vB = new THREE.Vector3();
  const vC = new THREE.Vector3();

  for (let i = 0; i < pos.count; i += 3) {
    vA.fromBufferAttribute(pos, i);
    vB.fromBufferAttribute(pos, i + 1);
    vC.fromBufferAttribute(pos, i + 2);

    volume += vA.dot(vB.cross(vC)) / 6;
  }

  return Math.abs(volume);
}
