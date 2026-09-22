const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopApi', {
  request: (details) => ipcRenderer.invoke('desktop:request', details),
  readerStatus: (after) => ipcRenderer.invoke('desktop:reader-status', after)
});
