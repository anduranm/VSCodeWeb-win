# Bordes y casos límite — VSCodeWeb (vs-code-web-win-setup)

Hallazgos de seguridad marcados «⚠️ Seguridad». Todo lo anotado se leyó en el código; lo que requiere ejecutar la app dice «sin verificar en ejecución».

## Seguridad y privacidad
- **B-01 ⚠️ Seguridad — Contraseña por defecto y túnel público.** El compose nace con `PASSWORD=default` (`src/docker.js:18`) y el volumen `C:/vscodeweb` (`:20`). Al pulsar Start se abre un túnel público hacia ese puerto (`src/init.js:261`). Sin cambiar la contraseña, cualquiera con la URL puede abrir un editor con terminal sobre las carpetas montadas. No hay aviso ni bloqueo.
- **B-02 ⚠️ Seguridad — Contraseña en texto plano.** Se guarda tal cual en `docker-compose.yml` (`src/docker.js:130`) y se muestra en un `input type="text"` (`src/index.html:71`).
- **B-03 ⚠️ Seguridad — Subdominio del túnel predecible.** El campo `domain` es el subdominio pedido a `localtunnel.me` (`src/init.js:261-263`); un valor fijo es adivinable y el servicio es un tercero sin SLA. Vacío = aleatorio.
- **B-04 ⚠️ Seguridad — Imagen sin versión fija.** `codercom/code-server:latest` (`src/docker.js:11`) cambia sin aviso; cada `up` puede traer otra versión.
- **B-05 ⚠️ Seguridad — IPC sin validación.** `save-config` y `save-docker-config` aceptan cualquier objeto (`src/main.js:12-26`). `window.api.on` expone un listener genérico para cualquier canal (`src/preload.js:21`). El riesgo se limita porque el renderer no tiene Node y el HTML es local, pero carga scripts de CDN (B-18): un CDN comprometido ejecutaría código con acceso a `window.api`.
- **B-06 Puerto sin validar.** El puerto se concatena como `${port}:8080` (`src/docker.js:125`) sin comprobar que sea numérico o esté en rango; `yaml.dump` escapa el texto, pero un valor no válido rompe el `up`. Vacío produce `":8080"`.
- **B-06b ⚠️ Seguridad — Montaje de carpetas completas.** Se pueden montar discos o carpetas del sistema con escritura (`src/docker.js:152-155`) y `PUID=1000`; no hay lista de rutas prohibidas ni modo de solo lectura.

## Configuración y estado
- **B-07 Un solo input, dos destinos.** Hay un único input `port` (`src/index.html:67`); «Save» de Docker lo escribe en el compose y «Save» de red lo escribe en `config.json`. Se llena desde `config.json` (`src/index.html:127`), nunca desde el compose. Pulsar solo uno de los dos botones deja el otro destino con otro puerto, y entonces el túnel apunta a un puerto donde no hay servicio.
- **B-08 Compose sin cargar.** `updateDockerConfig` y funciones afines salen con un `console.error` si `dockerConfig` es `null` (`src/docker.js:116-119`); la interfaz igual muestra «saved successfully» (`src/main.js:25`).
- **B-09 Contraseña con «=».** El renderer lee la contraseña con `split('=')[1]` (`src/renderer.js:13`): una contraseña que contenga «=» se muestra truncada, y al guardar se escribe truncada.
- **B-10 Canal IPC inexistente.** `preload.js` expone `selectVolumeDirectories` sobre el canal `select-volume-directories` (`src/preload.js:14`) que no tiene manejador (`src/main.js` solo registra `select-folder`). Llamarlo se rechaza; la interfaz usa `selectFolder`, por lo que hoy no se activa.
- **B-10b Código muerto con error.** `selectFolder` de `docker.js` usa una variable `config` no definida (`src/docker.js:159`); lanzaría `ReferenceError`. No está conectada a ningún canal.
- **B-10c `config.json` corrupto.** Se recrea con valores por defecto, perdiendo el contenido anterior sin copia (`src/init.js:31-39`).
- **B-10d Dos rutas de valores por defecto distintas.** El archivo faltante crea `{domain, port}` y el corrupto agrega `volumePath` (`src/init.js:22,36`).

## Errores y concurrencia
- **B-11 Mensaje de error equivocado.** `exec(cmd, (err, stderr) =>` recibe la salida estándar en el segundo parámetro (`src/docker.js:195`); el diálogo «Failed:» muestra stdout, no stderr.
- **B-12 Update sin esperar.** `updateDockerContainer` espera 1 s fijos entre `down` y `up` (`src/docker.js:230-235`); en equipos lentos `up` corre antes de que `down` termine. Restart espera 3 s fijos (`src/init.js:340-343`).
- **B-12b Éxito falso.** Mount, Update y Delete no devuelven promesa; el renderer muestra «successfully» siempre (`src/renderer.js:107-123`).
- **B-12c Doble clic.** No hay bloqueo de botones: dos clics lanzan dos `docker-compose` simultáneos. Dos Start seguidos abren dos túneles y solo el último queda referenciado (`src/init.js:252-262`).
- **B-12d Start sin Mount.** `docker start code-server` falla si el contenedor no existe (primer uso) con un diálogo técnico (`src/init.js:252-257`); no se sugiere montar.
- **B-12e Contenedor con nombre fijo.** `container_name: code-server` (`src/docker.js:12`); otro contenedor homónimo impide el `up`.
- **B-13 Salir no detiene nada.** Quit solo cierra la app (`src/init.js:167-173`); el túnel muere con el proceso pero el contenedor sigue corriendo (restart `no`, pero ya en marcha).
- **B-14 Casilla Auto-Launch.** `toggleAutoLaunch` llama a `createTray()` “para reflejar el cambio” (`src/init.js:87-106`) pero esa función retorna si el icono existe (`:148-150`); el estado visible puede quedar desfasado. Sin verificar en ejecución.
- **B-14b Tareas en 2.º plano.** `startDocker` marca `dockerRunning = true` aunque Docker no haya arrancado (`src/init.js:221,228,231,240`); la exportación `dockerRunning` es un valor copiado y nunca cambia para otros módulos.

## Sin red / terceros caídos
- **B-15 Sin Docker Desktop en la ruta fija.** Otra ubicación de instalación hace fallar el arranque automático (`src/init.js:213`); el flujo continúa de todos modos.
- **B-16 `localtunnel.me` caído.** El túnel falla con diálogo; el contenedor queda corriendo y accesible en `localhost` (`src/init.js:265-272`).
- **B-17 Docker Desktop lento.** Más de 5 s para iniciar: la app sigue sin Docker y los comandos posteriores fallan (`src/init.js:221-233`).
- **B-18 Sin Internet, interfaz sin estilo.** Bootstrap, jQuery y Popper salen de CDN (`src/index.html:9,116-118`); sin red la ventana pierde estilos. Las funciones propias siguen disponibles.
- **B-19 `docker-compose` ausente.** Docker Desktop reciente incluye `docker compose` (v2); si falta el binario `docker-compose` (v1), Mount/Update/Delete fallan (`src/docker.js:195,213`).

## Datos, tiempo y empaquetado
- **B-20 Zona horaria fija.** `TZ=America/New_York` en el contenedor, también al guardar (`src/docker.js:17,129`), sin importar la del equipo.
- **B-21 Volúmenes duplicados o vacíos.** Se puede agregar la misma carpeta varias veces (`src/renderer.js:84`); al guardar con la lista vacía se abre el selector y, si se cancela, queda sin volúmenes (`src/docker.js:121-123`).
- **B-22 Rutas con espacios o `:`.** Se arma `ruta:/home/coder/<carpeta>` por concatenación (`src/docker.js:154`); una letra de unidad ya contiene `:` (`C:\…:/home/…`). Su efecto en Docker Desktop no se probó (sin verificar en ejecución).
- **B-23 Empaquetado.** `package.json` lista `main.js` y `preload.js` en la raíz (no existen; están en `src/`) y el icono `assets/icon.ico` (no existe `assets/`; el icono está en la raíz). Si `electron-builder` no resuelve el icono, el instalador usa el predeterminado; sin verificar en ejecución.
- **B-24 Binario versionado.** `VSCodeWeb Setup 1.0.0.exe` (~78 MB) está en git: cada clon lo descarga; no se verificó firma ni procedencia.
- **B-25 Sin pruebas ni CI.** Ningún flujo está cubierto.
- **B-26 README desactualizado.** Afirma «All necessary dependencies are bundled», lo cual no es cierto para Docker (corregido en esta tanda).
- **B-27 Migraciones.** No existen; un cambio de formato de `config.json` o del compose depende de la recreación manual.
