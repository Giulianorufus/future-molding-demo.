
export async function analyzeServerFile(file: Blob | File, filename?: string) {
    const fd = new FormData();
    const name = filename ?? ((file as File).name ?? 'upload.bin');
    const payload = file instanceof File ? file : new File([file], name);
    fd.append('file', payload, name);

    const resp = await fetch('/api/calc/analyze', { method: 'POST', body: fd });
    if (!resp.ok) {
        throw new Error(`Server analyze failed: ${resp.status} ${resp.statusText}`);
    }
    const body = await resp.json();
    return {
        volume_cm3: body.volume ?? body.volume_cm3,
        thickness_mm: body.thickness_min ?? body.thickness_mm,
        surface_area: body.surface_area ?? body.area,
        projectedArea_cm2: body.projectedArea_cm2 ?? body.area_cm2,
        warnings: body.warnings || []
    } as any;
}

export async function convertServerFile(file: Blob | File, filename?: string) {
    const fd = new FormData();
    const name = filename ?? ((file as File).name ?? 'upload.step');
    const payload = file instanceof File ? file : new File([file], name);
    fd.append('file', payload, name);

    const resp = await fetch('/api/calc/convert', { method: 'POST', body: fd });
    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Convert failed: ${resp.status} ${resp.statusText} ${txt}`);
    }

    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('model/gltf-binary') || contentType.includes('application/octet-stream')) {
        const ab = await resp.arrayBuffer();
        const blob = new Blob([ab], { type: 'model/gltf-binary' });
        const url = URL.createObjectURL(blob);
        return url;
    }

    if (contentType.includes('application/json') || contentType.includes('application/ld+json')) {
        const body = await resp.json();
        if (body && body.gltf) {
            const blob = new Blob([JSON.stringify(body.gltf)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            return url;
        }
        const txt = JSON.stringify(body);
        const blob = new Blob([txt], { type: 'application/json' });
        return URL.createObjectURL(blob);
    }

    const ab2 = await resp.arrayBuffer();
    const blob2 = new Blob([ab2]);
    return URL.createObjectURL(blob2);
}
