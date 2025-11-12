# 📎 Guía: Guardar Archivos Extras Físicamente + Ocultar Sección

## 🎯 Objetivos

1. ✅ Guardar archivos extras físicamente en carpetas (como gantt, images, videos)
2. ✅ Crear carpeta `extra-files/` automáticamente
3. ✅ Ocultar sección de Archivos Extras excepto en la pestaña Multimedia

---

## 📝 Cambios a Realizar

### CAMBIO 1: electron-main.js
**Archivo:** `electron-main.js`
**Línea:** ~420

**BUSCAR:**
```javascript
const subdirs = ['images', 'videos', 'gantt'];
```

**REEMPLAZAR CON:**
```javascript
const subdirs = ['images', 'videos', 'gantt', 'extra-files'];
```

**Qué hace:** Agrega 'extra-files' a la lista de subdirectorios que se crean automáticamente al crear un proyecto nuevo.

---

### CAMBIO 2: file-manager.js (2 partes)

#### Parte A: Agregar procesamiento de extraFiles en saveProject()

**Archivo:** `file-manager.js`
**Línea:** ~122 (después de la sección de videos)

**DESPUÉS DE:**
```javascript
        } else {
            console.log('\n❌ No hay videos para guardar');
        }
```

**AGREGAR:**
```javascript
        // ✅ 5. Procesar y guardar archivos extras
        if (projectData.extraFiles && projectData.extraFiles.length > 0) {
            console.log(`\n📎 Procesando ${projectData.extraFiles.length} archivos extras...`);
            
            try {
                const extraFilesPaths = await this.saveExtraFiles(userId, projectId, projectData.extraFiles);
                console.log(`  ✅ ${extraFilesPaths.length}/${projectData.extraFiles.length} archivos guardados`);
                projectData.extraFiles = extraFilesPaths;
            } catch (fileError) {
                console.error('  ❌ ERROR guardando archivos extras:', fileError.message);
                console.error('  Stack:', fileError.stack);
                // Mantener los archivos que sí se guardaron
                console.warn('  ⚠️ Continuando con los archivos guardados hasta ahora...');
            }
        } else {
            console.log('\n❌ No hay archivos extras para guardar');
        }
```

#### Parte B: Agregar función saveExtraFiles() completa

**Archivo:** `file-manager.js`
**Ubicación:** Al final del archivo (después de `saveVideos()`)

**AGREGAR LA FUNCIÓN COMPLETA** (ver archivo CAMBIO_2_file-manager.txt para el código completo)

---

### CAMBIO 3: portfolio-editor.html

**Archivo:** `portfolio-editor.html`
**Línea:** ~242

**Problema:** La sección de Archivos Extras aparece en todas las pestañas.

**Solución:** Verificar que esté DENTRO de `<div class="editor-section" id="section-media">`

**Estructura correcta:**
```html
<!-- Sección: Multimedia -->
<div class="editor-section" id="section-media">
    <h2 class="section-title">📹 Multimedia</h2>
    
    <!-- Gantt -->
    <div class="media-subsection">...</div>
    
    <!-- Galería de Imágenes -->
    <div class="media-subsection">...</div>
    
    <!-- Galería de Videos -->
    <div class="media-subsection">...</div>
    
    <!-- Archivos Extras -->
    <div class="media-subsection">
        <h3>📎 Archivos Extras</h3>
        <p class="subsection-description">Cualquier tipo de archivo: PDF, Excel, PowerPoint, ZIP, etc.</p>
        <div id="extraFilesPreview" class="media-preview">
            <!-- Se llenará dinámicamente -->
        </div>
        <button class="btn-add" onclick="uploadExtraFiles()">
            + Agregar Archivos
        </button>
    </div>
</div>  ← ESTE ES EL CIERRE - Archivos Extras debe estar ANTES de este cierre
```

**IMPORTANTE:** La sección `<!-- Archivos Extras -->` debe estar ANTES del `</div>` que cierra `section-media`.

---

## ✅ Verificación

### Después de implementar los cambios:

#### 1. Crear carpeta extra-files automáticamente
- [ ] Crear un nuevo proyecto
- [ ] Verificar en File Explorer que se creó:
  ```
  users/[userId]/projects/[projectId]/extra-files/
  ```

#### 2. Guardar archivos físicamente
- [ ] En el editor, ir a Multimedia > Archivos Extras
- [ ] Subir un archivo PDF
- [ ] Guardar el proyecto
- [ ] Verificar en File Explorer que el archivo está en:
  ```
  users/[userId]/projects/[projectId]/extra-files/archivo.pdf
  ```
- [ ] Abrir `project.json` y verificar que en `extraFiles` dice:
  ```json
  "extraFiles": [
    {
      "src": "users/user1/projects/proj123/extra-files/archivo.pdf",
      "title": "Mi Archivo",
      ...
    }
  ]
  ```

#### 3. Descargar archivo desde viewer
- [ ] Abrir el proyecto en modo viewer
- [ ] Verificar que el botón morado "📎 Archivos Extras" aparece
- [ ] Hacer clic y verificar que el archivo se descarga correctamente

#### 4. Sección solo visible en Multimedia
- [ ] En el editor, hacer clic en "📋 Información Básica"
- [ ] Verificar que NO se ve la sección de Archivos Extras
- [ ] Hacer clic en "✅ Logros Recientes"
- [ ] Verificar que NO se ve la sección de Archivos Extras
- [ ] Hacer clic en "📹 Multimedia"
- [ ] Verificar que SÍ se ve la sección de Archivos Extras

---

## 🐛 Solución de Problemas

### "No se crea la carpeta extra-files"
- Verifica que agregaste 'extra-files' al array `subdirs` en `electron-main.js`
- Intenta eliminar el proyecto y crearlo de nuevo

### "Los archivos no se guardan físicamente"
- Verifica que agregaste la función `saveExtraFiles()` en `file-manager.js`
- Verifica que agregaste el código de procesamiento en `saveProject()`
- Revisa la consola del navegador (F12) para ver errores

### "La sección aparece en todas las pestañas"
- Verifica que la sección de Archivos Extras está DENTRO de `<div id="section-media">`
- Verifica que está ANTES del `</div>` de cierre de `section-media`
- Verifica que el HTML esté correctamente anidado

### "El archivo se guarda pero no se descarga"
- Verifica que el path en el JSON sea correcto (debe empezar con `users/`)
- Verifica que `resolveMediaSrc()` en viewer.js funcione correctamente

---

## 📊 Estructura Final

```
users/
└── user1/
    └── projects/
        └── proj1234567890/
            ├── project.json
            ├── gantt/
            │   └── gantt-chart.png
            ├── images/
            │   └── image-1.jpg
            ├── videos/
            │   └── video-1.mp4
            └── extra-files/  ← NUEVA CARPETA
                ├── reporte-1234567890.pdf
                ├── documento-1234567891.docx
                └── datos-1234567892.xlsx
```

**project.json:**
```json
{
  "id": "proj1234567890",
  "ganttImagePath": "users/user1/projects/proj1234567890/gantt/gantt-chart.png",
  "images": [
    {
      "src": "users/user1/projects/proj1234567890/images/image-1.jpg",
      "title": "Captura de pantalla"
    }
  ],
  "videos": [
    {
      "src": "users/user1/projects/proj1234567890/videos/video-1.mp4",
      "title": "Demo"
    }
  ],
  "extraFiles": [
    {
      "src": "users/user1/projects/proj1234567890/extra-files/reporte-1234567890.pdf",
      "title": "Reporte Q4",
      "fileName": "reporte-1234567890.pdf",
      "fileType": "application/pdf",
      "fileSize": 1024000,
      "extension": "pdf"
    }
  ]
}
```

---

## 🎉 ¡Listo!

Después de estos 3 cambios:
✅ Los archivos extras se guardarán físicamente
✅ La carpeta `extra-files/` se creará automáticamente
✅ La sección solo será visible en la pestaña Multimedia

**Tiempo estimado de implementación:** 15-20 minutos
