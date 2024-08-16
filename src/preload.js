const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadConfig: () => ipcRenderer.invoke('load-config'),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  updateTunnelUrl: (callback) => ipcRenderer.on('updateTunnelUrl', callback),

  // Docker Functions
  readDockerComposeFile: () => ipcRenderer.invoke('read-docker-compose-file'),
  saveDockerConfig: (config) => ipcRenderer.invoke('save-docker-config', config),
  mountDockerContainer: () => ipcRenderer.invoke('mount-docker-container'),
  updateDockerContainer: () => ipcRenderer.invoke('update-docker-container'),
  deleteDockerContainer: () => ipcRenderer.invoke('delete-docker-container'),
  selectVolumeDirectories: () => ipcRenderer.invoke('select-volume-directories'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),

  // Event Listener for Docker Config Saved
  onDockerConfigSaved: (callback) => ipcRenderer.on('docker-config-saved', callback),

  // General IPC Event Listener
  on: (channel, listener) => ipcRenderer.on(channel, listener),
});
