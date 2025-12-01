// Rileva se l'app gira in ambiente Capacitor (mobile native) o web

export function isNativeApp() {
  // Capacitor inietta window.Capacitor su mobile
  return typeof window !== 'undefined' && !!(window as any).Capacitor;
}

export function getPlatformLabel() {
  if (isNativeApp()) {
    // Possibile estensione: return Platform.getPlatform() per info dettagliate
    return "App Mobile";
  }
  return "Web";
}
