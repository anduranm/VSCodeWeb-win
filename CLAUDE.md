# CLAUDE.md — VSCodeWeb-win

> App de **Electron** para Windows que empaqueta **`code-server` en Docker** como si fuera un
> programa de escritorio: levanta el contenedor, lo publica en `localhost:8888`, opcionalmente lo
> expone afuera con **localtunnel**, y todo se maneja desde la bandeja del sistema.

**Resumen en el vault:** `Projects/vs-code-web-win-setup.md` en
`E:/OnWork/Obsidian Voult/Software Engineer enterprise-voult-obsidian`.

⚠️ **La carpeta se llama `vs-code-web-win-setup`, el repo es `anduranm/VSCodeWeb-win`.** Buscar por
el nombre de la carpeta en GitHub no lo encuentra.

---

## 🧱 Stack

Electron · `js-yaml` · `auto-launch` · `localtunnel` · `electron-builder`.
Necesita **Docker instalado y corriendo** en la máquina destino: eso no se puede empaquetar.

## 🚀 Arranque

```bash
npm install
npm start
npm run build     # genera el instalador en dist/
```

Ya existe un `VSCodeWeb Setup 1.0.0.exe` compilado en la raíz.

## 🧩 Cómo está armado (`src/`)

| Archivo | Qué hace |
|---|---|
| `init.js` | Bandeja, `config.json` en `userData`, auto-arranque, el túnel, la ventana |
| `docker.js` | **Genera** el `docker-compose.yml` y llama a docker por `child_process.exec` |
| `main.js` · `preload.js` · `renderer.js` | Proceso principal, puente y UI |

## ⚠️ Trampas

- **El `docker-compose.yml` NO está en el repo: lo escribe la app** en el directorio de datos de
  usuario, a partir del objeto `defaultDockerCompose` de `docker.js`. Buscarlo en el árbol no lo
  encuentra. Es a propósito: así el usuario cambia puerto, contraseña y volumen desde la interfaz y
  una reinstalación no le pisa la configuración.
- **Los valores por defecto son inseguros a propósito de fábrica**: `PASSWORD=default` y el volumen
  en `C:/vscodeweb`. Cambiarlos es el primer paso de cualquier instalación real.
- **`localtunnel` publica el servicio en una URL pública.** Con `PASSWORD=default` sin cambiar, eso
  es un editor de código abierto a internet sobre el disco del usuario. No encender sin pensar.
- `loadConfig()` **re-crea `config.json` si está corrupto** en vez de reventar. Mantené ese try/catch.
- `dist/` y el `.exe` están **excluidos del grafo** (`.cbmignore`): son binarios.
- El compose por defecto lleva `restart: 'no'`, que coincide con la regla de la casa: no lo pases a
  `always` o el contenedor revive cada vez que abra Docker Desktop.

## 📌 Estado

**Activo.** Último trabajo: 2026-08-24.
