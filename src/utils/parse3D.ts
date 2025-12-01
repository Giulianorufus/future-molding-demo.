// Parser 3D: crea un objectURL e restituisce metadata utili al viewer.
// Il viewer userà loader specifici (STL/GLTF/OBJ) per caricare il modello dall'URL.
export async function parseFileToMesh(file: File) {
  const url = URL.createObjectURL(file);
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  return {
    fileName: file.name,
    url,
    ext,
  };
}

