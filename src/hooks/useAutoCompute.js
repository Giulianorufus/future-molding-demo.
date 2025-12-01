import { useEffect } from "react";
export function useAutoCompute({ cad, pressa, materiale, computeParams }) {
    useEffect(() => {
        if (cad && pressa && materiale) {
            computeParams(); // nessun await qui; gestiscilo dentro computeParams se serve
        }
    }, [cad, pressa, materiale, computeParams]);
}
