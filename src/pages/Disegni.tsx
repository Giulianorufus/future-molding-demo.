import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

// ⚠️ Se il path è diverso nel tuo progetto, cambia SOLO questa riga:
import { useDrawingLibraryStore } from "../stores/useDrawingLibraryStore";

// Canonico
import { useDrawingStore } from "../stores/drawingStore";

type AnyDrawing = Record<string, any>;

function pushToDrawingStore(d: AnyDrawing | null | undefined) {
  if (!d) return;

  const ds: any = useDrawingStore.getState?.() ?? null;
  if (!ds) return;

  const viewerUrl = d.viewerUrl ?? d.glbUrl ?? d.modelUrl ?? null;
  const previewUrl = d.previewUrl ?? null;
  const glbUrl = d.glbUrl ?? null;

  const volumeCm3 =
    typeof d.volumeCm3 === "number"
      ? d.volumeCm3
      : typeof d.volume === "number"
      ? d.volume
      : null;

  const areaCm2 =
    typeof d.areaCm2 === "number"
      ? d.areaCm2
      : typeof d.area === "number"
      ? d.area
      : null;

  const boundingBox = d.boundingBox ?? d.bbox ?? null;

  if (typeof ds.setResult === "function") {
    ds.setResult({
      ...d,
      viewerUrl,
      glbUrl,
      previewUrl,
      volumeCm3,
      areaCm2,
      boundingBox,
    });
  } else {
    if (typeof ds.setViewerUrl === "function") ds.setViewerUrl(viewerUrl);
    if (typeof ds.setGlbUrl === "function") ds.setGlbUrl(glbUrl);
    if (typeof ds.setModelUrl === "function") ds.setModelUrl(viewerUrl);
    if (typeof ds.setPreviewUrl === "function") ds.setPreviewUrl(previewUrl);
    if (typeof ds.setVolumeCm3 === "function" && typeof volumeCm3 === "number") ds.setVolumeCm3(volumeCm3);
    if (typeof ds.setAreaCm2 === "function" && typeof areaCm2 === "number") ds.setAreaCm2(areaCm2);
    if (typeof ds.setBoundingBox === "function" && boundingBox) ds.setBoundingBox(boundingBox);
  }
}

export default function DisegniPage() {
  const nav = useNavigate();

  const drawings = useDrawingLibraryStore((s: any) => s.items ?? s.drawings ?? []);
  const selectedId = useDrawingLibraryStore((s: any) => s.selectedId ?? s.currentId ?? s.activeId ?? null);

  const selectDrawing =
    useDrawingLibraryStore((s: any) => s.selectDrawing ?? s.setSelectedId ?? s.setCurrentId ?? s.setActiveId) as
      | ((id: string) => void)
      | undefined;

  const removeDrawing =
    useDrawingLibraryStore((s: any) => s.removeDrawing ?? s.deleteDrawing ?? s.remove) as
      | ((id: string) => void)
      | undefined;

  const addFromFile =
    useDrawingLibraryStore((s: any) => s.addFromFile ?? s.importFile ?? s.addFile) as
      | ((file: File) => Promise<any> | any)
      | undefined;

  const canUpload = typeof addFromFile === "function";

  const list: AnyDrawing[] = useMemo(() => (Array.isArray(drawings) ? drawings : []), [drawings]);

  const onSelect = (d: AnyDrawing) => {
    const id = String(d.id ?? d.key ?? d.name ?? "");
    if (id && typeof selectDrawing === "function") selectDrawing(id);
    pushToDrawingStore(d);
  };

  const onOpenWizard = () => {
    nav("/wizard");
  };

  const onUpload = async (file: File) => {
    if (!canUpload || !addFromFile) return;

    const res = await addFromFile(file);
    if (res && typeof res === "object") {
      onSelect(res);
    } else {
      const last = list[list.length - 1];
      if (last) onSelect(last);
    }
  };

  return (
    <main className="p-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Disegni</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 rounded bg-yellow-400 text-black font-medium"
            onClick={onOpenWizard}
          >
            Apri Wizard
          </button>

          <label className="px-3 py-2 rounded bg-blue-700 text-white font-medium cursor-pointer">
            <input
              data-testid="drawings-upload"
              type="file"
              className="hidden"
              disabled={!canUpload}
              accept=".stp,.step,.iges,.igs,.stl,.glb,.gltf"
              onChange={(e) => {
                const f = e.currentTarget.files?.[0];
                if (f) void onUpload(f);
                e.currentTarget.value = "";
              }}
            />
            Carica file
          </label>
        </div>
      </div>

      {!canUpload && (
        <div className="mt-3 text-sm text-gray-600">
          Caricamento da questa pagina non disponibile (manca azione store). Usa “Apri Wizard”.
        </div>
      )}

      <section className="mt-6">
        <div className="text-sm text-gray-600 mb-2">Libreria</div>

        <div data-testid="drawings-list" className="grid gap-2">
          {list.length === 0 ? (
            <div className="p-3 rounded border border-gray-200 text-sm text-gray-600">
              Nessun disegno salvato. Carica un file (o apri il Wizard) per iniziare.
            </div>
          ) : (
            list.map((d) => {
              const id = String(d.id ?? d.key ?? d.name ?? "");
              const name = String(d.name ?? d.fileName ?? d.title ?? id);
              const isSelected = selectedId != null && String(selectedId) === id;

              return (
                <div
                  key={id || name}
                  data-testid={`drawing-item-${id}`}
                  className={`p-3 rounded border flex items-center justify-between gap-3 ${
                    isSelected ? "border-yellow-400 bg-yellow-50" : "border-gray-200"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{name}</div>
                    <div className="text-xs text-gray-600">
                      {d.materialId ? `Materiale: ${d.materialId}` : ""}
                      {typeof d.volumeCm3 === "number" ? ` • Volume: ${d.volumeCm3} cm³` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="px-3 py-2 rounded bg-blue-700 text-white"
                      onClick={() => onSelect(d)}
                    >
                      Seleziona
                    </button>

                    {typeof removeDrawing === "function" && id ? (
                      <button
                        type="button"
                        className="px-3 py-2 rounded border border-gray-300"
                        onClick={() => removeDrawing(id)}
                      >
                        Rimuovi
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
