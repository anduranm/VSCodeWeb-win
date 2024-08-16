const { exec } = require("child_process");
const { dialog, app, Tray, Menu, BrowserWindow } = require("electron");
const localtunnel = require("localtunnel");
const path = require("path");
const fs = require("fs");
const AutoLaunch = require('auto-launch');

let tray = null;
let dockerRunning = false;
const iconPath = path.resolve(__dirname, '../icon.ico');
const configPath = path.join(app.getPath("userData"), "config.json");
let mainWindow = null;
let tunnel;



function loadConfig() {
  if (!fs.existsSync(configPath)) {
    console.log(
      "Config file not found, creating a new one with default values."
    );
    const defaultConfig = { domain: "", port: 8888};
    saveConfigInit(defaultConfig);
    return defaultConfig;
  }

  try {
    const config = JSON.parse(fs.readFileSync(configPath));
    console.log("Config loaded successfully.");
    return config;
  } catch (error) {
    console.error(
      "Error parsing config file, creating a new one with default values:",
      error
    );
    const defaultConfig = { domain: "", port: 8888, volumePath: "" };
    saveConfigInit(defaultConfig);
    return defaultConfig;
  }
}

function saveConfigInit(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Config saved successfully.");
    
  } catch (error) {
    console.error("Error saving config:", error);
  }
}

function saveConfig(config) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("Config saved successfully.");
    dialog.showMessageBox({
      type: "info",
      title: "Config Saved",
      message: `LocalTunnel saved`,
      buttons: ["OK"],
    });
  } catch (error) {
    console.error("Error saving config:", error);
  }
}

function updateConfig(newConfigValues) {
  let config = loadConfig();
  config = { ...config, ...newConfigValues };
  saveConfig(config);
  console.log("Config updated successfully.");
}

const appAutoLauncher = new AutoLaunch({
  name: 'vs-code-on-web', // Nombre de tu aplicación
  path: process.execPath, // Ruta al ejecutable
});

function updateAutoLaunchMenuItem(menu) {
  appAutoLauncher.isEnabled().then((isEnabled) => {
    menu.getMenuItemById('auto-launch').checked = isEnabled;
  }).catch((err) => {
    console.error('Error checking auto-launch status:', err);
  });
}

function toggleAutoLaunch() {
  appAutoLauncher.isEnabled().then((isEnabled) => {
    if (isEnabled) {
      appAutoLauncher.disable().then(() => {
        console.log('Auto-launch disabled');
        createTray(); // Recreate tray to reflect changes
      }).catch((err) => {
        console.error('Error disabling auto-launch:', err);
      });
    } else {
      appAutoLauncher.enable().then(() => {
        console.log('Auto-launch enabled');
        createTray(); // Recreate tray to reflect changes
      }).catch((err) => {
        console.error('Error enabling auto-launch:', err);
      });
    }
  }).catch((err) => {
    console.error('Error checking auto-launch status:', err);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 750,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
  });

  mainWindow.loadFile("src/index.html");

  mainWindow.on("close", (event) => {
    if (app.isQuitting) {
      mainWindow = null;
    } else {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  const config = loadConfig();
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.send("loadConfig", config);
  });
}

function setMainWindow(window) {
  mainWindow = window;
}

function getMainWindow() {
  return mainWindow;
}

function createTray() {
  if (tray) {
    return; // Si ya existe una instancia, no crear una nueva.
  }
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Config",
      click: () => (mainWindow ? mainWindow.show() : createWindow()),
    },
    { label: "Start", click: startServices },
    { label: "Stop", click: stopServices },
    { label: "Restart", click: restartServices },
    {
      label: "Auto-Launch",
      id: 'auto-launch',
      type: 'checkbox',
      click: toggleAutoLaunch,
    },
    {
      label: "Quit",
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);
  
  updateAutoLaunchMenuItem(contextMenu); // Update menu item to reflect current auto-launch status
  
  tray.setToolTip("VS Code Web");
  tray.setContextMenu(contextMenu);

  // Manejador de doble clic
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show(); // Mostrar la ventana principal si ya está creada
    } else {
      createWindow(); // Crear y mostrar la ventana principal si no existe
    }
  });
}

function checkDocker(callback) {
  exec("docker --version", (error) => {
    if (error) {
      dialog.showErrorBox("Docker No Instalado", "Docker no está instalado. Por favor, instálalo y reinicia la aplicación.");
      app.quit();
    } else {
      startDocker(callback);
    }
  });
}

function startDocker(callback) {
  exec("docker info", (error) => {
    if (error) {
      dialog.showMessageBox({
        type: "info",
        title: "Starting Docker",
        message: "Running Docker, please wait...",
        buttons: ["OK"],
      });

      exec(
        'start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"',
        (startError) => {
          if (startError) {
            dialog.showErrorBox(
              "No se Puede Iniciar Docker",
              "No se pudo iniciar Docker. Asegúrate de que Docker esté instalado y configurado para iniciar automáticamente."
            );
            // app.quit(); no seguir corriendo de todas maneras 
            dockerRunning = true;
            callback();
          } else {
            setTimeout(() => {
              exec("docker info", (infoError) => {
                if (infoError) {
                  dialog.showErrorBox(
                    "Docker No Está Corriendo",
                    "Docker aún no está en ejecución. Asegúrate de que Docker Desktop esté iniciado."
                  );
                  // app.quit(); no seguir corriendo de todas maneras 

                  dockerRunning = true;
                  callback();
                } else {
                  dockerRunning = true;
                  callback();
                }
              });
            }, 8000); // Espera 8 segundos para que Docker se inicie
          }
        }
      );
    } else {
      dockerRunning = true;
      callback();
    }
  });
}
//no borrar
function startServices() {
  const config = loadConfig();
  const port = config.port;
  const subdomain = config.domain;

  console.log("Starting Docker...");
  exec("docker start code-server", (error, stdout, stderr) => {
    if (error) {
      console.error("Error starting Docker:", error);
      dialog.showErrorBox("Docker Error", `Error starting Docker: ${stderr}`);
      return;
    }
    console.log("Docker started:", stdout);

    console.log("Starting LocalTunnel...");
    localtunnel(
      port,
      { subdomain, host: "https://localtunnel.me" },
      (err, tunnelInstance) => {
        if (err) {
          console.error("Error starting LocalTunnel:", err);
          dialog.showErrorBox(
            "LocalTunnel Error",
            `Error starting LocalTunnel: ${err.message}`
          );
          return;
        }

        tunnel = tunnelInstance;
        console.log("Tunnel URL:", tunnel.url);

        // Enviar la URL del túnel a la ventana principal
        if (mainWindow) {
          mainWindow.webContents.send("updateTunnelUrl", tunnel.url);
          
        }

        if (tunnel.url) {
          dialog.showMessageBox({
            type: "info",
            title: "LocalTunnel Started",
            message: `LocalTunnel is running at: ${tunnel.url}`,
            buttons: ["OK"],
          });
        } else {
          console.error("LocalTunnel URL is not available.");
          dialog.showErrorBox(
            "LocalTunnel Error",
            "LocalTunnel URL is not available."
          );
        }

        tunnel.on("close", () => {
          console.log("LocalTunnel closed");
        });

        tunnel.on("error", (err) => {
          console.error("LocalTunnel error:", err);
          dialog.showErrorBox(
            "LocalTunnel Error",
            `LocalTunnel encountered an error: ${err.message}`
          );
        });
      }
    );
  });
}

//no borrar
function stopServices() {
  if (tunnel) {
    tunnel.close((err) => {
      if (err) {
        console.error("Error closing LocalTunnel:", err);
        dialog.showErrorBox(
          "LocalTunnel Error",
          `Error closing LocalTunnel: ${err.message}`
        );
      } else {
        console.log("LocalTunnel closed successfully.");
      }
    });
  }

  exec("docker stop code-server", (error, stdout, stderr) => {
    if (error) {
      console.error("Error stopping Docker:", error);
      dialog.showErrorBox("Docker Error", `Error stopping Docker: ${stderr}`);
      return;
    }
    console.log("Docker stopped:", stdout);
  });
}

function restartServices() {
  stopServices();
  setTimeout(startServices, 3000);
}

app.on("ready", () => {
  checkDocker(() => {
    createWindow();
    createTray();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

module.exports = {
  createWindow,
  createTray,
  checkDocker,
  startServices,
  stopServices,
  restartServices,
  loadConfig,
  saveConfig,
  updateConfig,
  dockerRunning,
  setMainWindow,
  getMainWindow 
};
