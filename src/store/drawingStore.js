import { create } from "zustand";
export const useDrawingStore = create((set, get) => ({
    file: null,
    objectUrl: null,
    setFile: (f) => {
        // libera l'URL precedente
        const prevUrl = get().objectUrl;
        if (prevUrl)
            URL.revokeObjectURL(prevUrl);
        // se null -> svuota tutto
        if (!f) {
            set({ file: null, objectUrl: null });
            localStorage.removeItem("fm_drawing_name");
            return;
        }
        // crea SEMPRE un nuovo objectURL (anche se lo stesso nome)
        const url = URL.createObjectURL(f);
        set({ file: f, objectUrl: url });
        // opzionale: salva solo il nome per UI
        localStorage.setItem("fm_drawing_name", f.name);
    },
    clear: () => {
        const prevUrl = get().objectUrl;
        if (prevUrl)
            URL.revokeObjectURL(prevUrl);
        set({ file: null, objectUrl: null });
        localStorage.removeItem("fm_drawing_name");
    },
}));
