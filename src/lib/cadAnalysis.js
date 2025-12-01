// Browser-compatible CAD analysis system for STEP, IGES, STL files
import * as THREE from 'three';
import { error as logError } from '@/lib/log';
const MM3_TO_CM3 = 1 / 1000;
const MM2_TO_CM2 = 1 / 100;
export async function analyzeCADFile(file) {
    const ext = getFileExtension(file.name).toLowerCase();
    if (ext === '.stl') {
        return await analyzeSTLFile(file);
    }
    else if (ext === '.step' || ext === '.stp' || ext === '.iges' || ext === '.igs') {
        // For STEP/IGES files, we'll use a simplified approach with mesh conversion
        return await analyzeCADFile_Simplified(file);
    }
    throw new Error(`Formato ${ext} non supportato. Usa STL, STEP o IGES.`);
}
function getFileExtension(filename) {
    return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}
async function analyzeSTLFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const geometry = parseSTL(arrayBuffer);
    if (!geometry) {
        throw new Error('File STL non valido o corrotto.');
    }
    const analysis = analyzeGeometry(geometry);
    return { ...analysis, geometry };
}
async function analyzeCADFile_Simplified(file) {
    // For STEP/IGES files, we create a simplified mesh based on file size and type
    // This is a fallback approach until full CAD parsing is available
    const fileSizeMB = file.size / (1024 * 1024);
    // Estimate parameters based on file characteristics
    const estimatedVolume = Math.max(5, Math.min(500, fileSizeMB * 20)); // cm³
    const estimatedThickness = fileSizeMB > 2 ? 2.5 : 1.8; // mm
    return {
        volume: round(estimatedVolume, 2),
        thickness_min: round(estimatedThickness * 0.8, 2),
        thickness_max: round(estimatedThickness * 1.5, 2),
        thin_zones: estimatedThickness < 1.2,
        long_runner: estimatedVolume < 20 && fileSizeMB > 1,
        surface_area: round(estimatedVolume * 8, 2), // rough estimate
        injection_points: 0,
        projectedArea_cm2: round(Math.sqrt(estimatedVolume) * 4, 2),
        cavities: 1
    };
}
function parseSTL(buffer) {
    try {
        // Check if it's binary or ASCII STL
        const view = new DataView(buffer);
        const headerBytes = new Uint8Array(buffer, 0, 5);
        const headerText = String.fromCharCode(...headerBytes);
        if (headerText.toLowerCase().startsWith('solid')) {
            // ASCII STL
            const text = new TextDecoder().decode(buffer);
            return parseSTLAscii(text);
        }
        else {
            // Binary STL
            return parseSTLBinary(buffer);
        }
    }
    catch (error) {
        logError('STL parsing error:', error);
        return null;
    }
}
function parseSTLAscii(text) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const lines = text.split('\n');
    let currentNormal = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('facet normal')) {
            const parts = trimmed.split(/\s+/);
            currentNormal = [
                parseFloat(parts[2]) || 0,
                parseFloat(parts[3]) || 0,
                parseFloat(parts[4]) || 0
            ];
        }
        else if (trimmed.startsWith('vertex')) {
            const parts = trimmed.split(/\s+/);
            vertices.push(parseFloat(parts[1]) || 0, parseFloat(parts[2]) || 0, parseFloat(parts[3]) || 0);
            normals.push(...currentNormal);
        }
    }
    if (vertices.length === 0)
        return null;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.computeBoundingBox();
    return geometry;
}
function parseSTLBinary(buffer) {
    const view = new DataView(buffer);
    // Skip 80 byte header
    let offset = 80;
    // Read number of triangles
    const numTriangles = view.getUint32(offset, true);
    offset += 4;
    const vertices = [];
    const normals = [];
    for (let i = 0; i < numTriangles; i++) {
        // Read normal (3 floats)
        const nx = view.getFloat32(offset, true);
        offset += 4;
        const ny = view.getFloat32(offset, true);
        offset += 4;
        const nz = view.getFloat32(offset, true);
        offset += 4;
        // Read 3 vertices (3 floats each)
        for (let j = 0; j < 3; j++) {
            const x = view.getFloat32(offset, true);
            offset += 4;
            const y = view.getFloat32(offset, true);
            offset += 4;
            const z = view.getFloat32(offset, true);
            offset += 4;
            vertices.push(x, y, z);
            normals.push(nx, ny, nz);
        }
        // Skip attribute byte count (2 bytes)
        offset += 2;
    }
    if (vertices.length === 0)
        return null;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geometry.computeBoundingBox();
    return geometry;
}
function analyzeGeometry(geometry) {
    const positions = geometry.attributes.position.array;
    const vertexCount = positions.length / 3;
    if (vertexCount === 0) {
        throw new Error('Geometria vuota.');
    }
    // Calculate bounding box
    const positionAttribute = geometry.attributes.position;
    const bbox = new THREE.Box3();
    if (positionAttribute instanceof THREE.BufferAttribute) {
        bbox.setFromBufferAttribute(positionAttribute);
    }
    else {
        // Handle InterleavedBufferAttribute by extracting positions
        for (let i = 0; i < positionAttribute.count; i++) {
            const x = positionAttribute.getX(i);
            const y = positionAttribute.getY(i);
            const z = positionAttribute.getZ(i);
            bbox.expandByPoint(new THREE.Vector3(x, y, z));
        }
    }
    const size = bbox.getSize(new THREE.Vector3());
    // Estimate volume and surface area
    const volume_mm3 = size.x * size.y * size.z * 0.3; // rough solid estimate
    const volume = volume_mm3 * MM3_TO_CM3;
    // Surface area estimation
    let surface_area_mm2 = 0;
    for (let i = 0; i < positions.length; i += 9) {
        const v1 = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
        const v2 = new THREE.Vector3(positions[i + 3], positions[i + 4], positions[i + 5]);
        const v3 = new THREE.Vector3(positions[i + 6], positions[i + 7], positions[i + 8]);
        const a = v2.clone().sub(v1);
        const b = v3.clone().sub(v1);
        const cross = a.cross(b);
        surface_area_mm2 += cross.length() * 0.5;
    }
    const surface_area = surface_area_mm2 * MM2_TO_CM2;
    // Thickness estimation
    const minSide = Math.min(size.x, size.y, size.z);
    const maxSide = Math.max(size.x, size.y, size.z);
    const thickness_min = Math.max(0.5, minSide * 0.1);
    const thickness_max = Math.max(thickness_min + 0.5, maxSide * 0.3);
    // Projected area (approximate as largest face)
    const projectedArea_cm2 = Math.max(size.x * size.y, size.y * size.z, size.x * size.z) * MM2_TO_CM2;
    // Analysis flags
    const thin_zones = thickness_min < 1.2;
    const aspectRatio = maxSide / minSide;
    const long_runner = aspectRatio > 8 && thickness_min < 2.0;
    return {
        volume: round(volume, 2),
        thickness_min: round(thickness_min, 2),
        thickness_max: round(thickness_max, 2),
        thin_zones,
        long_runner,
        surface_area: round(surface_area, 2),
        injection_points: 0,
        projectedArea_cm2: round(projectedArea_cm2, 2),
        cavities: 1
    };
}
function round(x, d = 2) {
    return Math.round(x * Math.pow(10, d)) / Math.pow(10, d);
}
// Generate 3D preview thumbnail
export function generatePreviewThumbnail(geometry) {
    try {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        // Create mesh with nice material
        const material = new THREE.MeshPhongMaterial({
            color: 0x0057b7, // Future Molding blue
            wireframe: false,
            shininess: 30
        });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        // Position camera to fit the object
        const bbox = new THREE.Box3().setFromObject(mesh);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        // Position camera at an angle for better visualization
        camera.position.set(center.x + maxDim * 1.2, center.y + maxDim * 0.8, center.z + maxDim * 1.5);
        camera.lookAt(center);
        // Create renderer
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
        });
        renderer.setSize(200, 200);
        renderer.setClearColor(0x000000, 0);
        // Render the scene
        renderer.render(scene, camera);
        const dataURL = canvas.toDataURL('image/png');
        // Cleanup
        renderer.dispose();
        material.dispose();
        geometry.dispose();
        return dataURL;
    }
    catch (error) {
        logError('Error generating preview thumbnail:', error);
        // Return a simple colored rectangle as fallback
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#0057b7';
            ctx.fillRect(0, 0, 200, 200);
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D', 100, 110);
        }
        return canvas.toDataURL('image/png');
    }
}
