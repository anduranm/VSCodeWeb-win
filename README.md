# VSCodeWeb (vs-code-web-win-setup)

Aplicación de escritorio para Windows, hecha con Electron, que ejecuta **VS Code en el navegador** (`code-server`) dentro de un contenedor Docker y lo publica en `http://localhost:8888`. Se maneja desde la bandeja del sistema y, de forma opcional, se expone a Internet con un túnel `localtunnel`.

> El repositorio remoto es `anduranm/VSCodeWeb-win`; la carpeta local se llama `vs-code-web-win-setup`.

## Requisitos
- Windows con **Docker Desktop** instalado (no se empaqueta).
- Node.js para desarrollo.
- Internet para el túnel y para los estilos de la interfaz (se cargan de un CDN).

## Uso
```bash
npm install
npm start          # modo desarrollo
npm run build      # instalador NSIS en dist/
```
También hay un instalador compilado en la raíz: `VSCodeWeb Setup 1.0.0.exe`.

Primer uso: cambiar la contraseña, agregar carpetas, **Save Configuration**, **Mount Docker Container** y luego **Start** en el icono de la bandeja.

## Seguridad
- La contraseña por defecto es `default`. **Cámbiala antes de usar el túnel**: con el túnel abierto, cualquiera con la URL ve un editor con terminal sobre las carpetas montadas.
- El `docker-compose.yml` lo genera la app en su carpeta de datos de usuario, no está en el repo.

## Documentación (`docs/`)
| Archivo | Contenido |
|---|---|
| [`docs/ERS.md`](docs/ERS.md) | Requisitos funcionales y no funcionales, modelo de datos y trazabilidad |
| [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md) | Módulos, IPC, despliegue y dependencias |
| [`docs/FLUJOS.md`](docs/FLUJOS.md) | 9 flujos con diagramas SVG en [`docs/flujos/`](docs/flujos/) |
| [`docs/BORDES.md`](docs/BORDES.md) | Casos límite, errores y hallazgos de seguridad |
| [`docs/OPERACION.md`](docs/OPERACION.md) | Configuración, respaldos y runbook |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Mejoras previstas por prioridad |

Más contexto para quien mantiene el código: [`CLAUDE.md`](CLAUDE.md).

## Licencia
MIT, ver [LICENSE](LICENSE).
