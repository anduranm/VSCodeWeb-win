const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const { getAppDataDirectory, createDefaultDockerComposeFile, readDockerComposeFile, saveDockerComposeFile, createOrUpdateDockerComposeFile, selectVolumeDirectories, addVolumeDirectory, updateDockerConfig, mountDockerContainer, deleteDockerContainer, updateDockerContainer, getDockerConfig, saveDockerConfig, deleteVolumeDirectories, selectFolder } = require('./docker');
const { checkDocker, createWindow, createTray, dockerRunning, loadConfig, saveConfig, updateConfig } = require('./init');

ipcMain.handle('load-config', () => {
    return loadConfig();
});

ipcMain.on('save-config', (event, newConfig) => {
    updateConfig(newConfig);
});

// docker

// Maneja las llamadas IPC
ipcMain.handle('read-docker-compose-file', async () => {
  return await readDockerComposeFile();
});

ipcMain.handle('save-docker-config', async (event, newConfig) => {
  await updateDockerConfig(newConfig); // Guarda la configuración
  event.sender.send('docker-config-saved', 'Docker-compose saved successfully');
});

ipcMain.handle('mount-docker-container', async () => {
  return await mountDockerContainer();
});

ipcMain.handle('update-docker-container', async () => {
  return await updateDockerContainer();
});

ipcMain.handle('delete-docker-container', async () => {
  return await deleteDockerContainer();
});

ipcMain.handle('select-folder', async () => {
  return await selectVolumeDirectories();
});
