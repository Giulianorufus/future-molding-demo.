import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit3, ChevronDown, ChevronRight } from "lucide-react";
// Local DefectPin type (defects are handled by core/defectRules and parametriStore)
type DefectPin = {
  id: string
  defect: string
  severity: number
  notes?: string
  x?: number
  y?: number
  rotation_deg?: number
}

const DEFECT_TYPES = [
  "Linee di flusso",
  "Jetting", 
  "Striature argentate",
  "Incompletezza",
  "Imbarcamento centrale",
  "Adesione da sottovuoto",
  "Colature di materiale",
  "Formazione di filamenti nella materozza",
  "Piegature"
];

const SEVERITY_COLORS = {
  1: "bg-green-500",
  2: "bg-green-400", 
  3: "bg-secondary",
  4: "bg-orange-500",
  5: "bg-red-500"
};

interface DefectsListProps {
  pins: DefectPin[];
  selectedPin: string | null;
  onSelectPin: (pinId: string | null) => void;
  onUpdatePin: (pinId: string, updates: Partial<DefectPin>) => void;
  onDeletePin: (pinId: string) => void;
}

export const DefectsList = ({ 
  pins, 
  selectedPin, 
  onSelectPin, 
  onUpdatePin, 
  onDeletePin 
}: DefectsListProps) => {
  const [editingPin, setEditingPin] = useState<string | null>(null);
  const [expandedPins, setExpandedPins] = useState<Set<string>>(new Set());

  const toggleExpanded = (pinId: string) => {
    const newExpanded = new Set(expandedPins);
    if (newExpanded.has(pinId)) {
      newExpanded.delete(pinId);
    } else {
      newExpanded.add(pinId);
    }
    setExpandedPins(newExpanded);
  };

  const handleEdit = (pinId: string) => {
    setEditingPin(pinId);
    onSelectPin(pinId);
    setExpandedPins(prev => new Set([...prev, pinId]));
  };

  const handleSave = () => {
    setEditingPin(null);
  };

  const handleUpdateDefect = (pinId: string, field: keyof DefectPin, value: any) => {
    onUpdatePin(pinId, { [field]: value });
  };

  const getSeverityLabel = (severity: number) => {
    const labels = {
      1: "Molto basso",
      2: "Basso", 
      3: "Medio",
      4: "Alto",
      5: "Critico"
    };
    return labels[severity as keyof typeof labels];
  };

  if (pins.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Difetti Rilevati</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-2">
              Nessun difetto rilevato
            </div>
            <p className="text-sm text-muted-foreground">
              Clicca sull'immagine per aggiungere un difetto
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Difetti Rilevati ({pins.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pins.map((pin, index) => {
          const isExpanded = expandedPins.has(pin.id);
          const isEditing = editingPin === pin.id;
          const isSelected = selectedPin === pin.id;

          return (
            <div 
              key={pin.id}
              className={`border rounded-lg p-3 transition-colors ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              {/* Header del difetto */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 hover:bg-transparent"
                  onClick={() => toggleExpanded(pin.id)}
                >
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium">Difetto #{index + 1}</span>
                  </div>
                </Button>
                
                <div className="flex items-center space-x-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      SEVERITY_COLORS[pin.severity as keyof typeof SEVERITY_COLORS]
                    }`}
                    title={getSeverityLabel(pin.severity)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(pin.id)}
                  >
                    <Edit3 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeletePin(pin.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Anteprima rapida */}
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="font-medium">{pin.defect}</div>
                {pin.notes && (
                  <div className="truncate mt-1">{pin.notes}</div>
                )}
              </div>

              {/* Dettagli espansi */}
              {isExpanded && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  {/* Tipo difetto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tipo difetto</label>
                    {isEditing ? (
                      <Select
                        value={pin.defect}
                        onValueChange={(value) => handleUpdateDefect(pin.id, 'defect', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DEFECT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-sm">{pin.defect}</div>
                    )}
                  </div>

                  {/* Gravità */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Gravità</label>
                    {isEditing ? (
                      <Select
                        value={pin.severity.toString()}
                        onValueChange={(value) => handleUpdateDefect(pin.id, 'severity', parseInt(value))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((level) => (
                            <SelectItem key={level} value={level.toString()}>
                              <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${
                                  SEVERITY_COLORS[level as keyof typeof SEVERITY_COLORS]
                                }`} />
                                <span>{level} - {getSeverityLabel(level)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center space-x-2 text-sm">
                        <div className={`w-3 h-3 rounded-full ${
                          SEVERITY_COLORS[pin.severity as keyof typeof SEVERITY_COLORS]
                        }`} />
                        <span>{pin.severity} - {getSeverityLabel(pin.severity)}</span>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Note</label>
                    {isEditing ? (
                      <Textarea
                        value={pin.notes}
                        onChange={(e) => handleUpdateDefect(pin.id, 'notes', e.target.value)}
                        placeholder="Aggiungi note sul difetto..."
                        rows={2}
                      />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {pin.notes || "Nessuna nota"}
                      </div>
                    )}
                  </div>

                  {/* Posizione */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Posizione</label>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>X: {(pin.x * 100).toFixed(1)}%, Y: {(pin.y * 100).toFixed(1)}%</div>
                      <div>Rotazione: {pin.rotation_deg}°</div>
                    </div>
                  </div>

                  {/* Pulsanti azione */}
                  {isEditing && (
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={handleSave}>
                        Salva
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEditingPin(null)}
                      >
                        Annulla
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};