# Roadmap — VSCodeWeb (vs-code-web-win-setup)

Fuentes: sección Roadmap del `README.md` original (ampliar la gestión de Docker, rendimiento y compatibilidad multiplataforma, más herramientas de desarrollo), la nota «Trampas» de `CLAUDE.md` y los hallazgos de `docs/BORDES.md`. El código no contiene `TODO` ni `FIXME`. Sin tareas abiertas en Forja asociadas (sin verificar).

## Prioridad alta (seguridad y corrección)
1. **Contraseña obligatoria y segura** — no arrancar el túnel si `PASSWORD` es `default`; generar una aleatoria en la primera instalación (B-01, B-02).
2. **Validar entradas** — puerto numérico en rango, contraseña no vacía, rutas de volumen permitidas (B-05, B-06, B-06b).
3. **Un solo origen del puerto** — derivarlo del compose o mostrar los dos y mantenerlos iguales (B-07).
4. **Operaciones con resultado real** — que Mount/Update/Delete devuelvan promesas, esperen a `down` antes de `up` y muestren el error real (B-11, B-12, B-12b, B-12c).
5. **Fijar la versión de la imagen** de `code-server` (B-04).

## Prioridad media
6. Detener túnel y contenedor al salir, con confirmación (B-13).
7. Soportar `docker compose` (v2) con detección y ruta configurable de Docker Desktop (B-15, B-19).
8. Corregir el empaquetado: `files` e icono en `package.json` (B-23); sacar el `.exe` del repo y publicarlo como release (B-24).
9. Volumen persistente para configuración y extensiones de VS Code (sección 4 de `docs/OPERACION.md`).
10. Estilos locales en lugar de CDN para uso sin Internet (B-18).
11. Eliminar código muerto: `selectFolder` y el canal `select-volume-directories` (B-10, B-10b).

## Prioridad baja
12. Pruebas de los flujos con Docker simulado y CI mínimo (B-25).
13. Zona horaria tomada del sistema (B-20).
14. Alternativa al túnel de terceros (p. ej. túnel propio) (B-16).
15. Registro a archivo y vista de estado del contenedor en la ventana.
16. Del README original: ampliar gestión de Docker, compatibilidad multiplataforma (macOS/Linux) y más herramientas de desarrollo.
