import * as THREE from "three";

/**
 * Computes the signed tetrahedral volume of a closed BufferGeometry.
 * OCCT STEP/IGES meshes are expressed in millimetres, so the returned value
 * is converted from mm³ to cm³.
 *
 * Indexed geometry must be read through its index. Iterating consecutive
 * position vertices is incorrect for OCCT meshes because the position buffer
 * is a vertex pool, not a triangle soup.
 */
export function computeMeshVolume(geometry: THREE.BufferGeometry): number {
  const pos = geometry.getAttribute("position");
  if (!pos) return 0;

  const index = geometry.getIndex();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const cross = new THREE.Vector3();
  let signedVolumeMm3 = 0;

  const addTriangle = (ia: number, ib: number, ic: number) => {
    a.fromBufferAttribute(pos as THREE.BufferAttribute, ia);
    b.fromBufferAttribute(pos as THREE.BufferAttribute, ib);
    c.fromBufferAttribute(pos as THREE.BufferAttribute, ic);
    cross.crossVectors(b, c);
    signedVolumeMm3 += a.dot(cross) / 6;
  };

  if (index) {
    for (let i = 0; i + 2 < index.count; i += 3) {
      addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
  } else {
    for (let i = 0; i + 2 < pos.count; i += 3) {
      addTriangle(i, i + 1, i + 2);
    }
  }

  return Math.abs(signedVolumeMm3) / 1000;
}
