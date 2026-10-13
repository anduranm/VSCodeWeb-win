# Operación — VSCodeWeb (vs-code-web-win-setup)

## 1. Variables de entorno
La aplicación de escritorio no lee variables de entorno propias (no hay `process.env` en `src/`). Lo que se configura vive en archivos de usuario:

| Elemento | Tipo | Dónde |
|---|---|---|
| `PASSWORD` del contenedor | SECRETO | `docker-compose.yml` en userData (dentro de `environment`) |
| `PUID`, `PGID`, `TZ` | CONFIGURACIÓN | mismo archivo; valores fijos 1000, 1000, `America/New_York` |
| `port`, `domain` | CONFIGURACIÓN | `config.json` en userData |

userData en Windows: `%APPDATA%\<nombre de la app>` (`app.getPath('userData')`). Nombre exacto según el empaquetado; sin verificar.

## 2. Instalación y despliegue
- Requisitos: Windows, Docker Desktop instalado.
- Desarrollo: `npm install` y `npm start` (Electron).
- Instalador: `npm run build` (electron-builder, NSIS) deja el resultado en `dist/`. El repo ya trae `VSCodeWeb Setup 1.0.0.exe`.
- Primer uso, en orden: abrir la app → cambiar la contraseña y agregar carpetas → Save Configuration (Docker) → Mount Docker Container → Start en la bandeja.
- No hay CI ni publicación automática.

## 3. Operación diaria
| Acción | Cómo |
|---|---|
| Abrir el editor | `http://localhost:<puerto>` (por defecto 8888) |
| Compartir fuera | Start en la bandeja; la URL del túnel aparece en la ventana |
| Detener | Stop en la bandeja (cierra el túnel y el contenedor) |
| Cambiar puerto o carpetas | Editar, guardar y luego Update Docker Container |
| Que arranque con Windows | Auto-Launch en la bandeja |

## 4. Respaldos
Lo único con estado del usuario es `config.json` y `docker-compose.yml` en userData, más las carpetas montadas, que son del usuario. Respaldar los dos archivos es copiarlos. Las extensiones y ajustes de VS Code viven dentro del contenedor (no hay volumen para ellos): `Delete Docker Container` o `down` los pierde. Sin verificar en ejecución.

## 5. Monitoreo
No hay registro a archivo ni métricas. Solo `console.log` del proceso principal (visible al lanzar con `npm start`) y diálogos de error. Estado del contenedor: `docker ps`.

## 6. Runbook
| Síntoma | Causa probable | Acción |
|---|---|---|
| Al abrir: «Docker No Instalado» | `docker --version` falla | Instalar Docker Desktop y reiniciar la app (B-15) |
| Start: «Docker Error» | El contenedor no existe | Mount Docker Container primero (B-12d) |
| Start: error de LocalTunnel | `localtunnel.me` caído o subdominio ocupado | Dejar `domain` vacío; usar `localhost` (B-16) |
| Mount: «Failed:» con texto vacío o raro | Mensaje muestra stdout (B-11) | Ejecutar a mano `docker-compose -f <ruta> up -d` y leer el error |
| Mount: conflicto de nombre | Otro contenedor llamado `code-server` | `docker rm -f code-server` |
| El túnel no abre el editor | Puerto del túnel distinto al del compose (B-07) | Guardar ambos formularios con el mismo puerto |
| Interfaz sin estilo | Sin Internet para los CDN (B-18) | Conectarse; el uso local funciona |
| config.json «perdido» | Estaba corrupto y se recreó (B-10c) | Reponer port/domain desde la ventana |
| Contenedor sigue corriendo tras Quit | Quit no detiene servicios (B-13) | Stop antes de Quit, o `docker stop code-server` |
| Contraseña por defecto aún activa | Nunca se cambió (B-01) | Cambiarla, Save y Update antes de usar Start |

## 7. Seguridad operativa
Antes de usar el túnel: contraseña propia y larga, solo las carpetas necesarias, y detener el túnel cuando no se use. Las carpetas montadas son editables desde internet mientras el túnel está abierto.
