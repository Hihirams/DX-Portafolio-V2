# 📋 Guía de Implementación Paso a Paso - Archivos Extras

## ⚠️ IMPORTANTE: Hacer backup antes de empezar
Copia todo el proyecto a una carpeta de respaldo antes de hacer cambios.

## 📝 Orden de Implementación

### Paso 1: Modificar portfolio-editor.html ✏️

1. Abre `portfolio-editor.html`
2. Busca la línea 242 (o busca el texto: `<!-- Galería de Videos -->`)
3. Ve hasta el final de esa subsección (después del `</div>` del botón "Agregar Videos")
4. **ANTES** de la línea que dice `</div>` (el cierre de la sección Multimedia)
5. Pega el código de: `1_portfolio-editor_html_agregar.txt`

**Resultado esperado:**
```html
    <!-- Galería de Videos -->
    <div class="media-subsection">
        ...
    </div>

    <!-- Archivos Extras -->  ← NUEVO
    <div class="media-subsection">
        ...
    </div>
</div>  ← Cierre de Multimedia
```

---

### Paso 2: Modificar editor.js 📝

#### 2.1 Agregar extraFiles en nuevo proyecto
1. Abre `editor.js`
2. Busca la función `createNewProject()`
3. Busca la línea que dice: `images: [],` (aproximadamente línea 96)
4. **DESPUÉS** de esa línea, agrega: `extraFiles: [],`

#### 2.2 Agregar carga de extra files
1. Busca la función `loadProject()`
2. Busca donde dice:
   ```javascript
   loadGantt();
   loadImages();
   loadVideos();
   ```
3. **DESPUÉS** de `loadVideos();` agrega: `loadExtraFiles();`

#### 2.3 Agregar todas las funciones nuevas
1. Ve al final del archivo `editor.js` (antes de la última línea)
2. Pega TODO el código de: `2_editor_js_agregar.txt` (desde PASO 3 en adelante)

**Funciones que se agregan:**
- `getFileIcon(fileName)`
- `loadExtraFiles()`
- `uploadExtraFiles()`
- `updateExtraFileTitle(index, newTitle)`
- `removeExtraFile(index)`

---

### Paso 3: Modificar viewer.js 👁️

Este es el archivo MÁS IMPORTANTE. Sigue cada paso con cuidado:

#### 3.1 Actualizar normalizeProject()
1. Abre `viewer.js`
2. Busca la función `normalizeProject()` (aproximadamente línea 11)
3. Busca donde termina la normalización de `videos` (línea 36 aprox)
4. **DESPUÉS** de la sección de videos, agrega el código del PASO 1 de `3_viewer_js_agregar.txt`

#### 3.2 Agregar verificación hasExtraFiles
1. Busca la función `generateProjectSlides()` (aproximadamente línea 219)
2. Busca donde se define `hasVideos` (línea 234 aprox)
3. **DESPUÉS** de la definición de `hasVideos`, agrega el código del PASO 2

#### 3.3 Agregar botón en HTML
1. En la misma función `generateProjectSlides()`
2. Busca donde se generan los botones multimedia (aprox línea 270-280)
3. Verás algo así:
   ```javascript
   ${hasGantt ? `<button...` }
   ${hasVideos ? `<button...` }
   ${hasImages ? `<button...` }
   ```
4. **DESPUÉS** del botón de `hasImages`, agrega el código del PASO 3

#### 3.4 Agregar función getFileIcon()
1. Ve al final del archivo (antes de la sección `// ==================== THEME ====================`)
2. Pega el código del PASO 4

#### 3.5 Agregar funciones del modal
1. Busca la función `closeImageLightbox()` (aproximadamente línea 663)
2. **DESPUÉS** de esa función, agrega el código del PASO 5 (3 funciones):
   - `openExtraFilesModal()`
   - `closeExtraFilesModal()`
   - `downloadExtraFile()`

#### 3.6 Agregar listener para cerrar modal
1. Busca donde están los event listeners de modales (aprox línea 711)
2. Verás varios `document.getElementById(...).addEventListener(...)`
3. **DESPUÉS** del listener de `imageLightboxModal`, agrega el código del PASO 6

#### 3.7 Agregar ESC key
1. Busca donde dice: `document.addEventListener('keydown', function(e) {`
2. Dentro del bloque `if (e.key === 'Escape')`, agrega: `closeExtraFilesModal();`

---

### Paso 4: Modificar portfolio-viewer.html 📄

1. Abre `portfolio-viewer.html`
2. Busca el final del modal `<!-- Image Lightbox Modal -->` (línea 133)
3. **DESPUÉS** de ese modal (antes de `<!-- Scripts -->`), pega el código de: `4_portfolio-viewer_html_agregar.txt`

---

### Paso 5: Modificar viewer.css 🎨

1. Abre `viewer.css`
2. Ve al final del archivo
3. Pega TODO el código de: `5_viewer_css_agregar.txt`

---

### Paso 6: Modificar editor.css 🎨

1. Abre `editor.css`
2. Ve al final del archivo
3. Pega TODO el código de: `6_editor_css_agregar.txt`

---

## ✅ Verificación

### Lista de Verificación - Portfolio Editor:
- [ ] La sección "📎 Archivos Extras" aparece en Multimedia
- [ ] Puedo hacer clic en "+ Agregar Archivos"
- [ ] Se abre el selector de archivos del sistema
- [ ] Puedo seleccionar cualquier tipo de archivo
- [ ] El archivo aparece en la lista con su icono correcto
- [ ] Puedo cambiar el título del archivo
- [ ] Puedo eliminar el archivo con el botón ×
- [ ] Al guardar, no hay errores en consola

### Lista de Verificación - Portfolio Viewer:
- [ ] El botón "📎 Archivos Extras" aparece (color morado)
- [ ] El botón SOLO aparece si hay archivos cargados
- [ ] Al hacer clic, se abre el modal con la lista de archivos
- [ ] Cada archivo muestra: icono, título, nombre y tamaño
- [ ] Al hacer clic en un archivo, se descarga correctamente
- [ ] Puedo cerrar el modal con el botón × o con ESC

---

## 🐛 Solución de Problemas

### "No aparece el botón Archivos Extras en el viewer"
- Verifica que hayas agregado archivos en el editor
- Verifica que `hasExtraFiles` esté correctamente definido
- Revisa la consola del navegador (F12) en busca de errores

### "Error al cargar archivos en el editor"
- Verifica que `extraFiles` esté inicializado en `createNewProject()`
- Verifica que `loadExtraFiles()` esté siendo llamado en `loadProject()`

### "El modal no se abre"
- Verifica que el modal esté en el HTML con id `extraFilesModal`
- Verifica que los event listeners estén agregados correctamente
- Revisa la consola del navegador (F12)

### "Error al descargar archivos"
- Verifica que la función `resolveMediaSrc()` funcione correctamente
- Puede ser un problema con base64 - revisa la consola

---

## 🎯 Pruebas Recomendadas

1. **Crear proyecto nuevo:**
   - Crear nuevo proyecto
   - Agregar varios tipos de archivos (PDF, Excel, ZIP, etc.)
   - Verificar que se muestren con iconos correctos
   - Guardar proyecto

2. **Editar proyecto existente:**
   - Abrir proyecto guardado
   - Verificar que los archivos extras se carguen correctamente
   - Agregar más archivos
   - Eliminar archivos
   - Guardar cambios

3. **Ver en el viewer:**
   - Abrir portfolio en modo viewer
   - Verificar que el botón morado aparezca
   - Abrir modal de archivos extras
   - Descargar algunos archivos
   - Verificar que se descarguen correctamente

---

## 📞 Soporte

Si tienes algún problema con la implementación, revisa:
1. La consola del navegador (F12) para ver errores
2. Que todos los IDs de elementos HTML coincidan
3. Que las funciones estén en el lugar correcto del archivo
4. Que no haya errores de sintaxis (comas, llaves, paréntesis)

---

✅ **Una vez que hayas completado todos los pasos, la funcionalidad de Archivos Extras estará lista!**
