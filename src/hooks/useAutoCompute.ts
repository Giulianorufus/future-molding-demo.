import { useEffect } from "react";

type Args = {
  cad: any;                 // analisi CAD (o null finché non c'è)
  pressa: any;              // pressa selezionata
  materiale: any;           // materiale selezionato
  computeParams: () => void;// funzione che calcola e fa setState
};

export function useAutoCompute({ cad, pressa, materiale, computeParams }: Args) {
  useEffect(() => {
    if (cad && pressa && materiale) {
      computeParams(); // nessun await qui; gestiscilo dentro computeParams se serve
    }
  }, [cad, pressa, materiale, computeParams]);
}