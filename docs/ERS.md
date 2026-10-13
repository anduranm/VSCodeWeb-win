# Especificación de Requisitos de Software (ERS) — VSCodeWeb (vs-code-web-win-setup)

Formato basado en IEEE 830 / ISO/IEC/IEEE 29148. Repositorio remoto: `anduranm/VSCodeWeb-win`. Índice codebase-memory: `E-OnWork-PeakCore Solutions-laboratorio-vs-code-web-win-setup`.
Fuente de verdad: el código. Lo que no se pudo comprobar en ejecución se marca «sin verificar».

## 1. Introducción

### 1.1 Propósito
Describir de forma verificable qué hace la aplicación de escritorio que empaqueta `code-server` (VS Code en el navegador) dentro de Docker y lo publica en `localhost`, con túnel público opcional.

### 1.2 Alcance
Aplicación Electron para Windows que: comprueba/arranca Docker, genera y edita un `docker-compose.yml` para un único servicio `code-server`, monta carpetas del usuario como volúmenes, levanta y detiene el contenedor y un túnel `localtunnel`, y vive en la bandeja del sistema con auto-arranque opcional.
Fuera de alcance: instalar Docker, descargar extensiones, multiusuario, macOS/Linux, actualizaciones automáticas de la propia app, autenticación propia (la da `code-server` con su contraseña).

### 1.3 Definiciones
| Término | Significado |
|---|---|
| code-server | VS Code servido por HTTP; imagen `codercom/code-server:latest`. |
| Bandeja | Icono de notificación de Windows (`Tray`) con el menú de la app. |
| userData | Carpeta de datos de Electron (`app.getPath('userData')`), donde viven `config.json` y `docker-compose.yml`. |
| Túnel | URL pública temporal creada con `localtunnel` hacia el puerto local. |

### 1.4 Referencias
`README.md`, `CLAUDE.md`, nota del vault `Projects/vs-code-web-win-setup.md`, `package.json`.

## 2. Descripción general

### 2.1 Perspectiva del producto
App Electron de dos procesos: principal (`src/main.js` + `src/init.js` + `src/docker.js`) y renderer (`src/index.html` + `src/renderer.js`) unidos por `src/preload.js` (`contextIsolation: true`, `nodeIntegration: false`, `src/init.js:115-118`). Habla con Docker mediante `child_process.exec` de la CLI (`docker`, `docker-compose`). Detalle en `docs/ARQUITECTURA.md`.

### 2.2 Funciones (resumen)
Verificación de Docker al arrancar; configuración de puerto, contraseña y carpetas; montar/actualizar/eliminar el contenedor; iniciar/detener/reiniciar servicio y túnel desde la bandeja; auto-arranque con Windows; ocultar a bandeja al cerrar la ventana.

### 2.3 Usuarios y roles
Un solo rol: la persona dueña del equipo Windows. No hay cuentas. Quien alcance la URL local o la del túnel se autentica contra `code-server` con la contraseña configurada.

### 2.4 Restricciones
- Requiere Docker Desktop instalado; la ruta de arranque está fija en `C:\Program Files\Docker\Docker\Docker Desktop.exe` (`src/init.js:213`).
- Usa el binario `docker-compose` (v1/standalone), no `docker compose` (`src/docker.js:195,213`).
- Solo Windows (`nsis`, `package.json`).
- Necesita red para `localtunnel.me` y para los CDN de Bootstrap/jQuery que carga `src/index.html:9,116-118`.

### 2.5 Supuestos
Docker responde a `docker info` en un máximo de ~5 s tras abrirse (`src/init.js:221-233`); el contenedor se llama `code-server` y no hay otro con ese nombre.

## 3. Requisitos funcionales

| ID | Requisito | Criterio de aceptación | Módulo |
|---|---|---|---|
| RF-01 | Al iniciar, comprobar que Docker está instalado. | Si `docker --version` falla, se muestra «Docker No Instalado» y la app se cierra. | `src/init.js:191-200` |
| RF-02 | Si Docker no responde, intentar abrir Docker Desktop. | Con `docker info` fallido se lanza Docker Desktop y, tras 5 s, se continúa de todos modos. | `src/init.js:202-242` |
| RF-03 | Crear un `docker-compose.yml` por defecto en userData si no existe. | Tras el arranque existe el archivo con el servicio `code-server` (puerto 8888:8080, `restart: 'no'`). | `src/docker.js:8-24,65-79,237-239` |
| RF-04 | Crear `config.json` por defecto si falta o está corrupto. | Se escribe `{domain:"", port:8888}` sin lanzar excepción. | `src/init.js:17-40` |
| RF-05 | Mostrar y guardar el puerto y el dominio del túnel. | Al pulsar Save Configuration de red, `config.json` contiene port y domain y aparece el diálogo «LocalTunnel saved». | `src/index.html:121-137`, `src/init.js:52-75`, `src/main.js:8-14` |
| RF-06 | Mostrar y guardar puerto, contraseña y volúmenes del contenedor. | Al guardar, el compose queda con `puerto:8080`, `PASSWORD=<valor>` y la lista de volúmenes. | `src/renderer.js:41-48`, `src/docker.js:115-135` |
| RF-07 | Agregar carpetas como volúmenes mediante selector nativo. | Cada carpeta elegida se agrega como `ruta:/home/coder/<carpeta>`. | `src/docker.js:143-156`, `src/renderer.js:80-104` |
| RF-08 | Quitar un volumen de la lista. | La entrada desaparece de la lista; se persiste al guardar. | `src/renderer.js:50-71` |
| RF-09 | Montar el contenedor. | `docker-compose up -d` se ejecuta contra el compose de userData; los errores salen en diálogo. | `src/docker.js:193-207` |
| RF-10 | Actualizar el contenedor (recrearlo). | Se ejecuta `down`, 1 s después `up -d`. | `src/docker.js:230-235` |
| RF-11 | Eliminar el contenedor. | Se ejecuta `docker-compose down`; los errores salen en diálogo. | `src/docker.js:209-226` |
| RF-12 | Iniciar servicios desde la bandeja. | `docker start code-server` y túnel abierto hacia `config.port`; la URL se muestra en la ventana y en un diálogo. | `src/init.js:246-312` |
| RF-13 | Detener servicios desde la bandeja. | Se cierra el túnel (si existe) y se ejecuta `docker stop code-server`. | `src/init.js:315-338` |
| RF-14 | Reiniciar servicios. | Stop, espera fija de 3 s y Start. | `src/init.js:340-343` |
| RF-15 | Alternar el auto-arranque con Windows. | La casilla Auto-Launch refleja el estado y alterna `auto-launch` enable/disable. | `src/init.js:74-107` |
| RF-16 | Cerrar la ventana la oculta; salir solo con Quit. | La X oculta la ventana; Quit marca `isQuitting` y cierra. | `src/init.js:124-131,172-177` |
| RF-17 | Abrir la ventana desde la bandeja (menú Config o doble clic). | La ventana se muestra o se crea si no existe. | `src/init.js:155-157,181-188` |
| RF-18 | Enlazar la contraseña del túnel de localtunnel. | La interfaz ofrece el enlace `https://loca.lt/mytunnelpassword`. | `src/index.html:100` |

## 4. Requisitos no funcionales

| ID | Categoría | Requisito | Estado verificado |
|---|---|---|---|
| RNF-01 | Seguridad | El renderer no tiene Node (`nodeIntegration:false`, `contextIsolation:true`). | Cumple (`src/init.js:115-118`). |
| RNF-02 | Seguridad | La contraseña por defecto no debe quedar expuesta por el túnel. | **No cumple**: el valor por defecto es `PASSWORD=default` (`src/docker.js:18`); ver B-01. |
| RNF-03 | Seguridad | Los canales IPC deben validar su entrada. | **No cumple**: puerto y contraseña pasan sin validar (B-05, B-06). |
| RNF-04 | Fiabilidad | Un `config.json` corrupto no impide arrancar. | Cumple (`src/init.js:31-39`). |
| RNF-05 | Privacidad | La contraseña se guarda en texto plano en `docker-compose.yml` y se muestra en un `input type="text"`. | Hallazgo, ver B-02. |
| RNF-06 | Disponibilidad | Funciona sin Internet para uso local. | **No cumple**: la interfaz depende de CDN para estilos (B-18). |
| RNF-07 | Compatibilidad | Windows 10/11 con Docker Desktop. | Declarado; solo Windows (`package.json`). Sin verificar en ejecución. |
| RNF-08 | Responsive | Interfaz de ventana de escritorio, 1200x750. | Bootstrap 4; sin pruebas de tamaños menores. |
| RNF-09 | Rendimiento | Arranque en menos de ~10 s con Docker ya corriendo. | Sin medir. |

## 5. Interfaces externas
- **Docker CLI**: `docker --version`, `docker info`, `docker start|stop code-server`, `docker-compose -f <ruta> up -d|down`.
- **Docker Desktop**: `start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"`.
- **localtunnel**: `https://localtunnel.me` (tercero); URL pública por sesión.
- **Windows**: bandeja, registro de auto-arranque (paquete `auto-launch`), diálogo de carpetas.
- **CDN**: Bootstrap 4.5.2 (stackpath), jQuery 3.5.1, Popper 2.5.3 (`src/index.html:9,116-118`).

## 6. Modelo de datos
| Archivo | Ubicación | Campos |
|---|---|---|
| `config.json` | userData | `domain` (subdominio del túnel), `port` (puerto local publicado), `volumePath` (solo en la rama de recuperación, sin uso). |
| `docker-compose.yml` | userData | `services.code-server`: `image`, `container_name`, `ports`, `environment` (`PUID`, `PGID`, `TZ`, `PASSWORD`), `volumes`, `restart`. |

Valores por defecto en `src/docker.js:8-24` y `src/init.js:22,36`.

## 7. Trazabilidad RF → módulo → prueba
El repositorio no tiene pruebas automatizadas ni CI. **Ningún RF (RF-01…RF-18) tiene prueba.** La verificación es manual.

| RF | Módulo principal | Prueba |
|---|---|---|
| RF-01, 02 | `src/init.js` | Sin prueba |
| RF-03 | `src/docker.js` | Sin prueba |
| RF-04, 05 | `src/init.js`, `src/index.html` | Sin prueba |
| RF-06 a 08 | `src/docker.js`, `src/renderer.js` | Sin prueba |
| RF-09 a 11 | `src/docker.js` | Sin prueba |
| RF-12 a 14 | `src/init.js` | Sin prueba |
| RF-15 a 18 | `src/init.js`, `src/index.html` | Sin prueba |
