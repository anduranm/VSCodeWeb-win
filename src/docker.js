const { app, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const yaml = require('js-yaml');
const { exec } = require('child_process');
const { getMainWindow } = require('./init');

let defaultDockerCompose = {
  services: {
    'code-server': {
      image: 'codercom/code-server:latest',
      container_name: 'code-server',
      ports: ['8888:8080'],
      environment: [
        `PUID=1000`,
        `PGID=1000`,
        `TZ=America/New_York`,
        `PASSWORD=default`,
      ],
      volumes: [`C:/vscodeweb:/home/coder/main`],
      restart: 'no',
    },
  },
};

let dockerConfig = null;

function readDockerComposeFile() {
  const filePath = path.join(getAppDataDirectory(), 'docker-compose.yml');

  if (fs.existsSync(filePath)) {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf-8');
      dockerConfig = yaml.load(fileContents); // Guardar configuración en dockerConfig
      return dockerConfig;
    } catch (error) {
      console.error('Error reading Docker Compose file:', error);
      return null;
    }
  }
  return null;
}

function getDockerConfig() {
  return dockerConfig;
}

function saveDockerConfig(config) {
  dockerConfig = config; // Actualiza dockerConfig con los nuevos valores
  saveDockerComposeFile(); // Guarda la configuración en el archivo
}

function getMainWindowInstance() {
  return getMainWindow();
}

function getAppDataDirectory() {
  const dir = app.getPath('userData');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function createDefaultDockerComposeFile() {
  const filePath = path.join(getAppDataDirectory(), 'docker-compose.yml');

  if (!fs.existsSync(filePath)) {
    const yamlContent = yaml.dump(defaultDockerCompose);
    try {
      fs.writeFileSync(filePath, yamlContent, 'utf-8');
      console.log(`Default Docker Compose file created at: ${filePath}`);
    } catch (error) {
      console.error('Error creating default Docker Compose file:', error);
    }
  } else {
    console.log('Docker Compose file already exists.');
  }
}

function saveDockerComposeFile() {
  const filePath = path.join(getAppDataDirectory(), 'docker-compose.yml');
  const yamlContent = yaml.dump(dockerConfig);
  try {
    fs.writeFileSync(filePath, yamlContent, 'utf-8');
    console.log(`Docker Compose file saved successfully at: ${filePath}`);
  } catch (error) {
    console.error('Error saving Docker Compose file:', error);
  }
}

async function createOrUpdateDockerComposeFile() {
  await readDockerComposeFile();
  saveDockerComposeFile();
}

async function updateDockerPaths() {
  // Verificar si la configuración Docker está cargada
  if (!dockerConfig) {
    console.error('Docker configuration is not loaded.');
    return;
  }

  // Verificar si la configuración actual de volúmenes está vacía
  if (!dockerConfig.services['code-server'].volumes || dockerConfig.services['code-server'].volumes.length === 0) {
    // Obtener nuevos volúmenes si no hay volúmenes configurados
    const newVolumes = await selectVolumeDirectories();
    dockerConfig.services['code-server'].volumes = newVolumes;
  }

  // Guardar la configuración actualizada en el archivo docker-compose.yml
  saveDockerComposeFile();
}

async function updateDockerConfig(config) {
  if (!dockerConfig) {
    console.error('Docker configuration is not loaded.');
    return;
  }

  if (!config.volumes || config.volumes.length === 0) {
    config.volumes = await selectVolumeDirectories();
  }

  dockerConfig.services['code-server'].ports = [`${config.port}:8080`];
  dockerConfig.services['code-server'].environment = [
    `PUID=1000`,
    `PGID=1000`,
    `TZ=America/New_York`,
    `PASSWORD=${config.password}`,
  ];
  dockerConfig.services['code-server'].volumes = config.volumes;
  saveDockerComposeFile();

}

function deleteVolumeDirectories(volumes) {
  dockerConfig.services['code-server'].volumes = volumes;
  saveDockerComposeFile();
}


async function selectVolumeDirectories() {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'multiSelections'],
  });

  if (result.canceled) {
    return [];
  }

  return result.filePaths.map((filePath) => {
    const lastFolder = path.basename(filePath);
    return `${filePath}:/home/coder/${lastFolder}`;
  });
}

async function selectFolder() {
  if (!config.volumes || config.volumes.length === 0) {
    config.volumes = await selectVolumeDirectories();
  }
  const newVolumes = await selectVolumeDirectories();
  if (!dockerConfig || !dockerConfig.services || !dockerConfig.services['code-server']) {
    console.error('Docker configuration is not loaded or is invalid.');
    return;
  }

  dockerConfig.services['code-server'].volumes = [
    ...(dockerConfig.services['code-server'].volumes || []),
    ...newVolumes,
  ];
  saveDockerComposeFile();
}

async function addVolumeDirectory() {
  const newVolumes = await selectVolumeDirectories();
  if (
    !dockerConfig ||
    !dockerConfig.services ||
    !dockerConfig.services['code-server']
  ) {
    console.error('Docker configuration is not loaded or is invalid.');
    return;
  }

  dockerConfig.services['code-server'].volumes = [
    ...(dockerConfig.services['code-server'].volumes || []),
    ...newVolumes,
  ];
  saveDockerComposeFile();
}

function mountDockerContainer() {
  const filePath = path.join(getAppDataDirectory(), 'docker-compose.yml');
  exec(`docker-compose -f "${filePath}" up -d`, (err, stderr) => {
    if (err) {
      dialog.showMessageBox({
        type: "info",
        title: "Mount Docker Container",
        message: `Failed: ${stderr}`,
        buttons: ["OK"],
      });
      console.error(`Error: ${stderr}`); // Imprime el error en la consola para depuración
      return;
    }
  });
}

function deleteDockerContainer() {
  const composeFilePath = path.join(getAppDataDirectory(), 'docker-compose.yml');
  
  // Ejecutar `docker-compose down` para detener y eliminar los contenedores
  exec(`docker-compose -f "${composeFilePath}" down`, (err, stdout, stderr) => {
    if (err) {
      dialog.showMessageBox({
        type: "info",
        title: "Delete Docker Container",
        message: `Failed to stop and remove containers: ${stderr}`,
        buttons: ["OK"],
      });
      console.error(`Error: ${stderr}`); // Imprime el error en la consola para depuración
      return;
    }

  });
}



function updateDockerContainer() {
  deleteDockerContainer();
  setTimeout(() => {
    mountDockerContainer();
  }, 1000);
}

app.whenReady().then(async () => {
  await createDefaultDockerComposeFile();
});

module.exports = {
  getAppDataDirectory,
  createDefaultDockerComposeFile,
  readDockerComposeFile,
  saveDockerComposeFile,
  createOrUpdateDockerComposeFile,
  selectVolumeDirectories,
  addVolumeDirectory,
  updateDockerConfig,
  updateDockerPaths,
  mountDockerContainer,
  deleteDockerContainer,
  updateDockerContainer,
  getDockerConfig,
  saveDockerConfig,
  deleteVolumeDirectories,
  selectFolder
};
