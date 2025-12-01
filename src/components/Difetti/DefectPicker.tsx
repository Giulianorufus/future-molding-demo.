import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

const DEFECTS = [
  "Riempimento incompleto","Bruciature","Bave","Segni di ritiro","Imbarcamento",
  "Linea di giunzione","Striature (umidità)","Vuoti/Bolle","Jetting","Graffi in estrazione"
] as const;
export type DefectType = typeof DEFECTS[number];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (defect: DefectType) => void;
  x: number; y: number; // coordinate click canvas (0..1 normalized)
};

export function DefectPicker({ open, onOpenChange, onConfirm, x, y }: Props) {
  const [defect, setDefect] = React.useState<DefectType | undefined>(undefined);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Seleziona difetto</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            Posizione selezionata: x={x.toFixed(2)}, y={y.toFixed(2)}
          </div>
          <Select onValueChange={(v) => setDefect(v as DefectType)}>
            <SelectTrigger><SelectValue placeholder="— Scegli difetto —" /></SelectTrigger>
            <SelectContent>
              {DEFECTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={() => defect && onConfirm(defect)} disabled={!defect}>Conferma</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}