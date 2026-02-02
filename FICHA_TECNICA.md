# 📋 Ficha Técnica - DX Portfolio V2

**Nombre del Proyecto:** Portfolio DX  
**Versión:** 1.0.0  
**Autor:** DX Team  
**Licencia:** MIT  
**Última Actualización:** Febrero 2026

---

## 📖 Descripción General

DX Portfolio es un **sistema de gestión de proyectos y portafolios** desarrollado como aplicación de escritorio utilizando **Electron**. Permite a los usuarios gestionar proyectos, visualizar portafolios, cargar videos y manejar la información de manera colaborativa en un entorno compartido en red.

---

## 🛠️ Stack Tecnológico

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Electron** | ^28.0.0 | Framework para aplicación de escritorio |
| **Node.js** | Requerido | Runtime para desarrollo y build |
| **HTML5** | - | Estructura de interfaces |
| **CSS3 (Vanilla)** | - | Estilos con diseño glassmorphism |
| **JavaScript (ES6+)** | - | Lógica de frontend y backend |
| **electron-builder** | ^26.0.12 | Empaquetado de aplicación portable |
| **pnpm** | - | Gestor de paquetes (alternativa a npm) |

---

## 🏗️ Arquitectura del Sistema

### Patrón de Arquitectura
```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON APP                            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    IPC    ┌─────────────────────────┐  │
│  │  Main Process   │◄─────────►│   Renderer Process      │  │
│  │ (electron-main) │           │   (HTML/CSS/JS)         │  │
│  └────────┬────────┘           └───────────┬─────────────┘  │
│           │                                │                │
│           ▼                                ▼                │
│  ┌─────────────────┐           ┌─────────────────────────┐  │
│  │   File System   │           │     preload.js          │  │
│  │  (users/data)   │           │  (Bridge IPC seguro)    │  │
│  └─────────────────┘           └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Comunicación IPC
- **Main Process** (`electron-main.js`): Maneja operaciones del sistema de archivos
- **Preload Script** (`preload.js`): Bridge seguro entre main y renderer
- **Renderer Process**: Páginas HTML con JavaScript del lado del cliente

---

## 📁 Estructura de Directorios

```
DX-Portafolio-V2/
├── 📄 electron-main.js      # Proceso principal de Electron
├── 📄 preload.js            # Bridge IPC seguro
├── 📄 package.json          # Configuración del proyecto
├── 📄 config.json           # Configuración de estados y prioridades
│
├── 📁 js/                   # Scripts JavaScript (14 archivos)
│   ├── data-manager.js      # Gestión de datos y sesión (CORE)
│   ├── home.js              # Lógica de página principal
│   ├── editor.js            # Editor de portafolios
│   ├── viewer.js            # Visor de portafolios
│   ├── project-manager.js   # Gestión avanzada de proyectos (3355 líneas)
│   ├── my-projects.js       # Vista "Mis Proyectos" 
│   ├── my-videos.js         # Vista "Mis Videos"
│   ├── file-manager.js      # Operaciones de archivos
│   ├── upload-modal.js      # Modal de carga de videos
│   ├── help-modal.js        # Modal de ayuda
│   ├── loader.js            # Animación de carga
│   ├── main.js              # Funciones comunes
│   ├── init-data.js         # Inicialización de datos
│   └── data-loader-dev.js   # Cargador de desarrollo
│
├── 📁 css/                  # Hojas de estilo (11 archivos)
│   ├── styles.css           # Estilos globales
│   ├── home.css             # Estilos página principal
│   ├── editor.css           # Estilos del editor
│   ├── viewer.css           # Estilos del visor
│   ├── project-manager.css  # Estilos del gestor
│   ├── my-projects.css      # Estilos "Mis Proyectos"
│   ├── my-videos.css        # Estilos "Mis Videos"
│   ├── video-showcase.css   # Estilos showcase de videos
│   ├── loader.css           # Estilos del loader
│   └── carousel-*.css       # Estilos de carruseles
│
├── 📁 data/                 # Datos persistentes
│   ├── users.json           # Lista de usuarios
│   ├── projects.json        # Lista de proyectos
│   ├── projects-index.json  # Índice de proyectos
│   └── videos.json          # Catálogo de videos
│
├── 📁 users/                # Datos por usuario
│   └── {userId}/
│       └── projects/
│           └── {projectId}/
│               ├── project.json
│               ├── images/
│               ├── videos/
│               ├── gantt/
│               └── files/
│
├── 📁 assets/               # Recursos estáticos
│   └── logo-dx.ico          # Icono de la aplicación
│
├── 📁 dist/                 # Build de distribución
│   └── win-unpacked/        # Versión desempaquetada
│
└── 📁 FeaturePages/         # Páginas de características en desarrollo
```

---

## 📄 Páginas HTML Principales

| Archivo | Descripción | Scripts Principales |
|---------|-------------|---------------------|
| `index.html` | Página principal / Login | `home.js`, `data-manager.js` |
| `my-projects.html` | Dashboard de proyectos del usuario | `my-projects.js` |
| `my-videos.html` | Galería de videos del usuario | `my-videos.js` |
| `portfolio-editor.html` | Editor de portafolios | `editor.js` |
| `portfolio-viewer.html` | Visor de presentaciones | `viewer.js` |
| `project-manager.html` | Gestor avanzado con KPIs y gráficas | `project-manager.js` |
| `video-showcase.html` | Showcase público de videos | `video-showcase.css` |

---

## 🔌 API Interna (electronAPI)

### Operaciones de Archivos
```javascript
// Disponibles en window.electronAPI desde preload.js
electronAPI.readJSON(filePath)           // Leer archivo JSON
electronAPI.writeJSON(filePath, data)    // Escribir archivo JSON
electronAPI.saveMedia(filePath, base64)  // Guardar imagen/video
electronAPI.readMedia(filePath)          // Leer archivo como base64
electronAPI.deleteFile(filePath)         // Eliminar archivo
electronAPI.deleteDir(dirPath)           // Eliminar directorio
electronAPI.fileExists(filePath)         // Verificar existencia
electronAPI.listDir(dirPath)             // Listar directorio
```

### Operaciones de Proyectos
```javascript
electronAPI.createProjectDir(userId, projectId)
electronAPI.saveProject(userId, projectId, projectData)
electronAPI.loadProject(userId, projectId)
electronAPI.deleteProject(userId, projectId)
electronAPI.listProjectsByUser(userId)
electronAPI.transferProject(fromUserId, toUserId, projectId)
```

### Operaciones de Usuario
```javascript
electronAPI.createUserDir(userId)
```

### Diálogos del Sistema
```javascript
electronAPI.openFileDialog(options)  // Selector de archivos
```

---

## 💾 Modelos de Datos

### Usuario (`data/users.json`)
```javascript
{
  "id": "user1",
  "username": "hiram.gonzalez",
  "password": "demo123",  // ⚠️ Solo para demo
  "name": "Hiram González",
  "role": "Software Engineer",
  "hierarchyLevel": 3,   // 1=Supervisor, 2=Especialista, 3=Interno
  "email": "hiram@dx.com",
  "avatar": null,
  "createdAt": "2025-10-31T21:23:03.365Z"
}
```

### Proyecto (`data/projects.json`)
```javascript
{
  "id": "proj001",
  "ownerId": "user1",
  "ownerName": "Hiram González",
  "title": "Quality Clinic Unity",
  "icon": "🌐",
  "concept": "Descripción del proyecto...",
  "status": "develop",           // discovery|decision|develop|pilot|yokotenkai|released
  "featured": true,
  "priority": "high",            // high|medium|low
  "priorityNumber": 4,
  "progress": 60,
  "targetDate": "2026-09-15",
  "currentPhase": "Fase actual...",
  "achievements": {
    "2025-08": "Logro 1",
    "2025-09": "Logro 2"
  },
  "blockers": {
    "type": "success",          // success|warning|alert|info
    "message": "Mensaje del blocker"
  },
  "nextSteps": {
    "2025-11": "Paso 1",
    "2025-12": "Paso 2"
  },
  "images": [{ "src": "ruta/imagen.png", "title": "Título" }],
  "videos": [{ "src": "ruta/video.mp4", "title": "Título" }],
  "extraFiles": [],
  "ganttImagePath": "ruta/gantt.png",
  "kpis": {
    "totalHoursEstimated": 766,
    "hoursSpent": 459,
    "fteSaved": 3.5,
    "completion": 60,
    "timeline": { ... },
    "resources": { ... },
    "metrics": { ... }
  },
  "createdAt": "2025-08-01",
  "updatedAt": "2026-01-09T15:38:01.698Z"
}
```

### Configuración de Estados (`config.json`)
```javascript
{
  "projectStatuses": {
    "discovery": { "label": "Discovery", "color": "#9D00FF", "icon": "🔍" },
    "decision":  { "label": "Decision",  "color": "#FFD600", "icon": "🤔" },
    "develop":   { "label": "Develop",   "color": "#00D9FF", "icon": "⚙️" },
    "pilot":     { "label": "Pilot",     "color": "#FF6B00", "icon": "🚀" },
    "yokotenkai":{ "label": "Yokotenkai","color": "#00BFFF", "icon": "🌐" },
    "released":  { "label": "Released",  "color": "#00FF85", "icon": "✓" }
  },
  "priorities": {
    "high":   { "label": "High",   "color": "#FF0000" },
    "medium": { "label": "Medium", "color": "#FFA500" },
    "low":    { "label": "Low",    "color": "#00FF00" }
  },
  "blockerTypes": {
    "technical":    { "label": "Technical",    "icon": "⚙️" },
    "resources":    { "label": "Resources",    "icon": "👥" },
    "dependencies": { "label": "Dependencies", "icon": "🔗" },
    "approval":     { "label": "Approval",     "icon": "✋" }
  }
}
```

---

## 🎨 Sistema de Diseño

### Temas
- **Dark Mode**: Tema principal con fondos oscuros
- **Light Mode**: Tema claro alternativo

### Paleta de Colores
```css
/* Accent Colors */
--accent-purple: #9D00FF;
--accent-cyan: #00D9FF;
--accent-yellow: #FFD600;
--accent-orange: #FF6B00;
--accent-green: #00FF85;
--accent-red: #FF0000;

/* Status Colors */
--status-discovery: #9D00FF;
--status-decision: #FFD600;
--status-develop: #00D9FF;
--status-pilot: #FF6B00;
--status-yokotenkai: #00BFFF;
--status-released: #00FF85;
```

### Efectos Visuales
- **Glassmorphism**: Efectos de vidrio translúcido
- **Mesh Gradients**: Fondos con gradientes dinámicos
- **Micro-animaciones**: Transiciones suaves en interacciones

---

## 🚀 Scripts de NPM

```bash
# Desarrollo
npm start           # Iniciar aplicación
npm run dev         # Iniciar con DevTools

# Build
npm run build:portable   # Crear ejecutable portable
```

---

## 📦 Despliegue

### Requisitos de Build
- Node.js instalado
- Permisos de administrador (solo para build)

### Generación de Ejecutable
```bash
npm install           # Instalar dependencias
npm run build:portable  # Generar PortfolioDX-Portable.exe
```

### Estructura de Distribución
```
\\servidor\PortfolioDX\
├── PortfolioDX-Portable.exe   # Ejecutable
├── users/                      # Datos de usuarios
├── data/                       # Configuración
└── assets/                     # Recursos
```

---

## 👤 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `hiram.gonzalez` | `demo123` | Intern. Software Engineer |
| `sandra.santos` | `demo123` | Sp. Project Evaluation |
| `miguel.coronado` | `demo123` | Sp.Adv Technical Tools |
| `ivanna.rodriguez` | `demo123` | Intern. Software Engineer |
| `angel.alvarez` | `demo123` | Intern. Software Engineer |

---

## 🔄 Flujos Principales

### 1. Flujo de Autenticación
```
index.html → Login Form → DataManager.login() → SessionStorage → Redirect
```

### 2. Flujo de Carga de Proyecto
```
DataManager.loadFullProject() → electronAPI.loadProject() → 
IPC Main → fs.readFile() → Return JSON
```

### 3. Flujo de Guardado de Media
```
File Input → FileReader(base64) → electronAPI.saveMedia() →
IPC Main → fs.writeFile() → Return path
```

---

## 📊 Componentes Principales

### DataManager (`js/data-manager.js`)
**Responsabilidad**: Gestión centralizada de datos y sesión

**Métodos Clave**:
- `loadAllData()` - Carga inicial de todos los datos
- `login(username, password)` - Autenticación
- `createProject(projectData)` - Crear proyecto nuevo
- `updateProject(projectId, updates)` - Actualizar proyecto
- `getCurrentUser()` - Obtener usuario actual
- `saveSession()` / `restoreSession()` - Persistencia de sesión

### ProjectManager (`js/project-manager.js`)
**Responsabilidad**: Dashboard avanzado con gráficas y KPIs

**Características**:
- Filtrado cruzado de proyectos
- Visualización de métricas
- Gráficas de estado y progreso
- Gestión de recursos

### Editor (`js/editor.js`)
**Responsabilidad**: Edición completa de proyectos

**Funcionalidades**:
- Edición de metadatos
- Carga de imágenes/videos
- Gestión de Gantt
- Logros y próximos pasos

---

## ⚠️ Consideraciones Importantes

### Seguridad
- Las contraseñas están en texto plano (solo para demo)
- Para producción, implementar hash + salt
- `preload.js` usa `contextBridge` para IPC seguro

### Rendimiento
- Los videos se almacenan como Base64 (puede ser pesado)
- Considerar streaming para archivos grandes
- El `project-manager.js` es extenso (3355 líneas) - considerar modularizar

### Compatibilidad
- Diseñado para Windows
- Probado en carpetas compartidas de red
- Ejecutable portable sin instalación

---

## 🐛 Debugging

### Logs de Desarrollo
```javascript
// En electron-main.js
if (IS_DEV) {
    console.log('[RUTAS]');
    console.log('  PROJECT_ROOT:', PROJECT_ROOT);
}
```

### Modo Desarrollo
```bash
npm run dev   # Abre con DevTools
```

### Verificar Rutas
Las rutas de proyecto se resuelven desde:
- `process.execPath` en producción
- `__dirname` en desarrollo

---

## 📞 Soporte

**Email**: hiram.gonzalez@na.denso.com

---

## 📝 Notas para Nuevos Desarrolladores

1. **Siempre usar rutas relativas** para recursos de usuario (`users/...`)
2. **DataManager es singleton** - acceder via `window.dataManager`
3. **Evento `dataLoaded`** - indica que los datos están listos
4. **Temas** - respetar clases `.dark-mode` y `.light-mode`
5. **IPC Operations** - todas son async, usar await
6. **Medios** - se manejan como Base64 para compatibilidad Electron

---

*Documento generado el 02 de Febrero de 2026*
