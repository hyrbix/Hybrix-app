# Código de trabajo de la app HYBRIX

- `hybrix-app.src.html`: la app completa (diseño, ejercicios, entrenos, plan, etc.). Aquí se hacen los cambios.
- `hx-mark.b64` / `hx-mark.png`: logo HYBRIX que se inserta donde dice `__MARK__`.
- `local.js`: guarda los datos en el celular cuando la app corre fuera de Claude.
- `build_web.py`: arma la versión web (index.html, ícono, manifest y modo sin internet) en la raíz del repositorio.
- `mock.js`: datos de prueba para revisar la app en una computadora.

## Cómo publicar un cambio
1. Editar `fuente/hybrix-app.src.html`.
2. Generar `hybrix-app.html` reemplazando `__MARK__` por `data:image/png;base64,` + contenido de `hx-mark.b64`.
3. Correr `python3 build_web.py` y copiar lo que genera en `hybrix-web/` a la raíz del repositorio.
4. Subir el cambio a la rama `main`. GitHub Pages publica solo en 1–2 minutos en https://hyrbix.github.io/Hybrix-app/
