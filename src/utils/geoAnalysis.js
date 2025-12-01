import * as THREE from "three";
/** Somma tetraedri per volume (geom chiusa, triangolata) */
export function computeVolume_cm3(geom) {
    const pos = geom.getAttribute("position");
    const index = geom.getIndex();
    let volume = 0;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const getV = (i, v) => v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    const triCount = index ? index.count / 3 : pos.count / 3;
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
            getV(a, vA);
            getV(b, vB);
            getV(c, vC);
            volume += vA.dot(vB.cross(vC));
        }
    }
    else {
        for (let i = 0; i < pos.count; i += 3) {
            getV(i, vA);
            getV(i + 1, vB);
            getV(i + 2, vC);
            volume += vA.dot(vB.cross(vC));
        }
    }
    // volume in mm^3 -> cm^3
    return Math.abs(volume / 6) / 1000;
}
/** Area superficiale (mm^2 -> cm^2) */
export function computeArea_cm2(geom) {
    const pos = geom.getAttribute("position");
    const index = geom.getIndex();
    let area = 0;
    const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();
    const getV = (i, v) => v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    if (index) {
        for (let i = 0; i < index.count; i += 3) {
            const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
            getV(a, vA);
            getV(b, vB);
            getV(c, vC);
            area += triangleArea(vA, vB, vC);
        }
    }
    else {
        for (let i = 0; i < pos.count; i += 3) {
            getV(i, vA);
            getV(i + 1, vB);
            getV(i + 2, vC);
            area += triangleArea(vA, vB, vC);
        }
    }
    return area / 100; // mm^2 -> cm^2
}
function triangleArea(a, b, c) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    return new THREE.Vector3().crossVectors(ab, ac).length() * 0.5;
}
/** Bounding box (mm) */
export function computeBBox_mm(geom) {
    geom.computeBoundingBox();
    const box = geom.boundingBox;
    return {
        x: box.max.x - box.min.x,
        y: box.max.y - box.min.y,
        z: box.max.z - box.min.z,
    };
}
/** Stima spessore: proietto dai vertici lungo la normale verso la faccia opposta (raycast).
 * Restituisco min/mean/max. È una stima, non un calcolo CAD esatto.
 */
export function estimateThickness_mm(mesh, sampleEvery = 200 // più alto = più preciso ma più lento
) {
    const geom = mesh.geometry;
    const pos = geom.getAttribute("position");
    if (!geom.getAttribute("normal"))
        geom.computeVertexNormals();
    const nor = geom.getAttribute("normal");
    const ray = new THREE.Raycaster();
    ray.firstHitOnly = true; // compat three-mesh-bvh se presente
    const dir = new THREE.Vector3();
    const origin = new THREE.Vector3();
    const worldMatrix = mesh.matrixWorld;
    const vals = [];
    for (let i = 0; i < pos.count; i += sampleEvery) {
        origin.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(worldMatrix);
        dir.set(nor.getX(i), nor.getY(i), nor.getZ(i)).normalize();
        // tiro in entrambe le direzioni
        const d1 = intersectDist(mesh, origin, dir);
        const d2 = intersectDist(mesh, origin, dir.clone().multiplyScalar(-1));
        if (d1 !== null && d2 !== null) {
            vals.push(d1 + d2);
        }
    }
    if (vals.length === 0)
        return { min: NaN, mean: NaN, max: NaN };
    vals.sort((a, b) => a - b);
    const sum = vals.reduce((a, b) => a + b, 0);
    return { min: round(vals[0]), mean: round(sum / vals.length), max: round(vals[vals.length - 1]) };
    function round(n) {
        return Math.round(n * 100) / 100;
    }
    function intersectDist(target, o, d) {
        ray.set(o, d);
        const hits = ray.intersectObject(target, true);
        if (!hits.length)
            return null;
        return hits[0].distance;
    }
}
/** Conta componenti connessi (grezzo ma utile): proxy #pezzi/#cavità nel file */
export function countConnectedComponents(geom) {
    const index = geom.getIndex();
    const pos = geom.getAttribute("position");
    if (!index)
        return 1;
    // costruiamo adjacency per facce, poi DFS
    const triCount = index.count / 3;
    const triAdj = Array.from({ length: triCount }, () => []);
    const edgeMap = new Map();
    const getEdgeKey = (a, b) => (a < b ? `${a}_${b}` : `${b}_${a}`);
    for (let t = 0; t < triCount; t++) {
        const a = index.getX(t * 3), b = index.getX(t * 3 + 1), c = index.getX(t * 3 + 2);
        const edges = [
            [a, b],
            [b, c],
            [c, a],
        ];
        for (const [u, v] of edges) {
            const k = getEdgeKey(u, v);
            if (!edgeMap.has(k))
                edgeMap.set(k, []);
            edgeMap.get(k).push(t);
        }
    }
    for (const ids of edgeMap.values()) {
        if (ids.length === 2) {
            triAdj[ids[0]].push(ids[1]);
            triAdj[ids[1]].push(ids[0]);
        }
    }
    const seen = new Uint8Array(triCount);
    let comp = 0;
    const stack = [];
    for (let i = 0; i < triCount; i++) {
        if (seen[i])
            continue;
        comp++;
        stack.push(i);
        seen[i] = 1;
        while (stack.length) {
            const cur = stack.pop();
            for (const nb of triAdj[cur]) {
                if (!seen[nb]) {
                    seen[nb] = 1;
                    stack.push(nb);
                }
            }
        }
    }
    return comp;
}
