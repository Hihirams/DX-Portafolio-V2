# 🎨 Ejemplos Visuales y Estructura de Datos

## 📊 Estructura de Datos - Proyecto con Extra Files

```javascript
{
  id: "proj1731456789012",
  ownerId: "user1",
  title: "Quality Clinic Unity",
  icon: "🏥",
  status: "in-progress",
  priority: "high",
  progress: 75,
  targetDate: "2025-12-31",
  currentPhase: "Implementación de visualización 3D de la planta...",
  
  achievements: {
    "2025-01": "Modelo 3D base completado",
    "2025-02": "Sistema de navegación implementado"
  },
  
  blockers: {
    type: "warning",
    message: "Esperando datos de producción actualizados"
  },
  
  nextSteps: {
    "2025-03": "Integrar datos en tiempo real",
    "2025-04": "Testing con usuarios finales"
  },
  
  ganttImage: "data:image/png;base64,iVBORw0KGgoAAAANS...",
  
  videos: [
    {
      src: "data:video/mp4;base64,AAAAIGZ0eXBpc29t...",
      title: "Demo de navegación",
      fileName: "demo-navigation.mp4",
      fileType: "video/mp4",
      fileSize: 2048000
    }
  ],
  
  images: [
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANS...",
      title: "Vista general de la planta",
      fileName: "planta-vista-general.png",
      fileType: "image/png",
      fileSize: 512000
    }
  ],
  
  // ⭐ NUEVA SECCIÓN
  extraFiles: [
    {
      src: "data:application/pdf;base64,JVBERi0xLjQKJ...",
      title: "Reporte Ejecutivo Q4 2025",
      fileName: "reporte-q4-2025.pdf",
      fileType: "application/pdf",
      fileSize: 1024000,
      extension: "pdf"
    },
    {
      src: "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,UEsDBBQ...",
      title: "Métricas de Producción",
      fileName: "metricas-produccion.xlsx",
      fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      fileSize: 768000,
      extension: "xlsx"
    },
    {
      src: "data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,UEsD...",
      title: "Presentación para Dirección",
      fileName: "presentacion-direccion.pptx",
      fileType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      fileSize: 2048000,
      extension: "pptx"
    },
    {
      src: "data:application/zip;base64,UEsFBgAAAAAAAAAAAA...",
      title: "Archivos de Diseño",
      fileName: "archivos-diseno.zip",
      fileType: "application/zip",
      fileSize: 5120000,
      extension: "zip"
    }
  ],
  
  createdAt: "2025-01-15",
  updatedAt: "2025-03-20"
}
```

## 🎨 Aspecto Visual

### En el Editor (portfolio-editor.html)

```
┌─────────────────────────────────────────────────────────────┐
│ 📹 Multimedia                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 📊 Diagrama de Gantt                                        │
│ [Imagen del Gantt]                                          │
│ [+ Subir Gantt]                                             │
│                                                              │
│ 🖼️ Galería de Imágenes                                     │
│ [Miniaturas de imágenes]                                    │
│ [+ Agregar Imágenes]                                        │
│                                                              │
│ 🎬 Galería de Videos                                        │
│ [Miniaturas de videos]                                      │
│ [+ Agregar Videos]                                          │
│                                                              │
│ 📎 Archivos Extras                    ← NUEVO               │
│ Cualquier tipo de archivo: PDF, Excel, PowerPoint, ZIP...  │
│                                                              │
│ ┌───────────────────────────────────────────────────────┐  │
│ │ 📄  Reporte Ejecutivo Q4 2025           [×]           │  │
│ │     reporte-q4-2025.pdf  •  1000.00 KB                │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 📊  Métricas de Producción              [×]           │  │
│ │     metricas-produccion.xlsx  •  750.00 KB            │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 📊  Presentación para Dirección         [×]           │  │
│ │     presentacion-direccion.pptx  •  2000.00 KB        │  │
│ ├───────────────────────────────────────────────────────┤  │
│ │ 📦  Archivos de Diseño                  [×]           │  │
│ │     archivos-diseno.zip  •  5000.00 KB                │  │
│ └───────────────────────────────────────────────────────┘  │
│                                                              │
│ [+ Agregar Archivos]                    ← BOTÓN             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### En el Viewer (portfolio-viewer.html)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏥 Quality Clinic Unity                                     │
│                                                              │
│ ████████████████░░░░  75%    [En Progreso]                 │
│                                                              │
│ 📅 Fase Actual                                              │
│ Implementación de visualización 3D de la planta...         │
│                                                              │
│ ✅ Logros Recientes                                         │
│ • Modelo 3D base completado                                 │
│ • Sistema de navegación implementado                        │
│                                                              │
│ ⚠️ Bloqueos                                                 │
│ Esperando datos de producción actualizados                  │
│                                                              │
│ 🎯 Próximos Pasos                                          │
│ • Mar 2025: Integrar datos en tiempo real                   │
│ • Abr 2025: Testing con usuarios finales                    │
│                                                              │
│ [📊 Ver Gantt]  [🎬 Videos]  [🖼️ Imágenes]  [📎 Archivos] │
│                                             └─── NUEVO      │
│                                                  (Morado)   │
└─────────────────────────────────────────────────────────────┘
```

### Modal de Archivos Extras (al hacer clic en el botón morado)

```
┌─────────────────────────────────────────────────────────────┐
│ 🏥 Quality Clinic Unity - Archivos Extras          [×]     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📄  Reporte Ejecutivo Q4 2025                  [⬇]  │    │
│ │     reporte-q4-2025.pdf  •  1000.00 KB               │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📊  Métricas de Producción                     [⬇]  │    │
│ │     metricas-produccion.xlsx  •  750.00 KB           │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📊  Presentación para Dirección                [⬇]  │    │
│ │     presentacion-direccion.pptx  •  2000.00 KB       │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ ┌─────────────────────────────────────────────────────┐    │
│ │ 📦  Archivos de Diseño                         [⬇]  │    │
│ │     archivos-diseno.zip  •  5000.00 KB               │    │
│ └─────────────────────────────────────────────────────┘    │
│                                                              │
│ (Hacer clic en cualquier archivo para descargarlo)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Colores del Botón

```css
/* Botón Archivos Extras - Morado/Púrpura */
Normal:  #8B5CF6 → #7C3AED (gradiente)
Hover:   #7C3AED → #6D28D9 (gradiente)
Sombra:  rgba(139, 92, 246, 0.3)

/* Comparación con otros botones */
Gantt:   Azul   (#3B82F6)
Videos:  Rojo   (#EF4444)
Imágenes: Verde (#10B981)
Archivos: Morado (#8B5CF6) ← NUEVO
```

## 📂 Estructura de Carpetas (File System)

```
users/
├── user1/
│   ├── profile.json
│   └── projects/
│       ├── proj1731456789012/
│       │   ├── project.json
│       │   ├── gantt/
│       │   │   └── gantt-chart.png
│       │   ├── images/
│       │   │   ├── planta-vista-general.png
│       │   │   └── dashboard-analytics.png
│       │   ├── videos/
│       │   │   ├── demo-navigation.mp4
│       │   │   └── tutorial-uso.mp4
│       │   └── extra-files/  ← NUEVA CARPETA
│       │       ├── reporte-q4-2025.pdf
│       │       ├── metricas-produccion.xlsx
│       │       ├── presentacion-direccion.pptx
│       │       └── archivos-diseno.zip
│       │
│       └── proj1731456789013/
│           ├── project.json
│           └── extra-files/  ← Se crea automáticamente
│               └── documentacion.pdf
│
└── user2/
    └── projects/
        └── proj1731456789014/
            ├── project.json
            └── extra-files/
                ├── manual-usuario.pdf
                └── datos-investigacion.xlsx
```

## 🔧 MIME Types Soportados

```javascript
{
  // Documentos
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'txt': 'text/plain',
  
  // Hojas de cálculo
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'csv': 'text/csv',
  
  // Presentaciones
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Comprimidos
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  
  // Imágenes
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  
  // Videos
  'mp4': 'video/mp4',
  'webm': 'video/webm',
  'mov': 'video/quicktime',
  'avi': 'video/x-msvideo',
  
  // Código
  'js': 'text/javascript',
  'py': 'text/x-python',
  'java': 'text/x-java',
  'html': 'text/html',
  'css': 'text/css',
  'json': 'application/json',
  
  // Por defecto
  'default': 'application/octet-stream'
}
```

## 🧪 Casos de Prueba

### Test 1: Agregar Archivo PDF
1. Ir a editor
2. Sección Multimedia > Archivos Extras
3. Clic en "+ Agregar Archivos"
4. Seleccionar un PDF
5. ✅ Debe aparecer con icono 📄
6. ✅ Debe mostrar nombre y tamaño

### Test 2: Múltiples Archivos
1. Agregar varios archivos diferentes
2. ✅ Cada uno con su icono correcto
3. ✅ Todos deben guardarse

### Test 3: Editar Título
1. Cambiar título de un archivo
2. Guardar proyecto
3. Recargar editor
4. ✅ Título debe mantenerse

### Test 4: Eliminar Archivo
1. Clic en × de un archivo
2. ✅ Debe desaparecer
3. Guardar proyecto
4. ✅ No debe reaparecer

### Test 5: Ver en Viewer
1. Ir a viewer
2. ✅ Botón morado debe aparecer
3. Clic en botón
4. ✅ Modal debe abrirse
5. ✅ Archivos deben listarse

### Test 6: Descargar Archivo
1. En viewer, clic en un archivo
2. ✅ Debe descargarse
3. ✅ Archivo debe ser válido y abrirse

### Test 7: Sin Archivos
1. Proyecto sin archivos extras
2. ✅ Botón morado NO debe aparecer en viewer
3. ✅ Editor debe mostrar mensaje "No hay archivos extras"

## 📊 Performance

- **Tamaño máximo recomendado por archivo**: 10 MB
- **Número máximo recomendado de archivos por proyecto**: 20
- **Formatos soportados**: Cualquiera (sin restricciones)
- **Encoding**: Base64 para almacenamiento en JSON

## 🎯 Características Implementadas

✅ Cargar cualquier tipo de archivo
✅ Mostrar icono según extensión
✅ Editar título de archivo
✅ Eliminar archivo
✅ Ver lista de archivos en viewer
✅ Descargar archivo desde viewer
✅ Botón solo visible cuando hay archivos
✅ Color diferenciado (morado)
✅ Soporte para tema claro/oscuro
✅ Carpeta automática extra-files/
✅ Persistencia en JSON
✅ Vista previa en editor
