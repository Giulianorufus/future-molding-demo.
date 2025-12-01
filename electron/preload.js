// Minimal preload for future secure API exposure
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // add secure APIs here
});
