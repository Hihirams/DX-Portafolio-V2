// ============================================
// ELECTRON MAIN - Proceso principal
// ============================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron'); // ← SOLO una vez
const path = require('path');

// fs de dos sabores:
const fsSync = require('fs');                 // sync: existsSync, mkdirSync...
const fs = require('fs').promises;            // promesas: readFile, writeFile...

const IS_DEV = process.argv.includes('--dev') || !app.isPackaged;

// ✅ Resolver raíz de proyecto priorizando carpeta del .exe si hay datos
// Reemplaza tu resolveProjectRoot() completo por este
function resolveProjectRoot() {
  const path = require('path');
  const fs = require('fs');

  // 1) Si electron-builder portable: directorio real del .exe
  const portableDir = process.env.PORTABLE_EXECUTABLE_DIR || null;

  // 2) "Start in" del acceso directo / cwd
  const startIn = process.cwd();

  // 3) Carpeta del ejecutable que realmente corrió
  const exeDir = path.dirname(process.execPath);

  // 4) Salir de resources/app.asar → ir a la carpeta que lo contiene
  const resourcesParent = (process.resourcesPath)
    ? path.join(process.resourcesPath, '..')
    : null;

  // 5) Salir de app.asar por __dirname (cuando el main vive dentro del asar)
  const asarEscape = path.join(__dirname, '..', '..');

  const clean = (p) => (p && p.includes('.asar')) ? path.dirname(p) : p;

  const candidates = [
    clean(portableDir),
    clean(startIn),
    clean(exeDir),
    clean(resourcesParent),
    clean(asarEscape),
  ].filter(Boolean);

  const hasBoth = (dir) => {
    try {
      const d = path.join(dir, 'data');
      const u = path.join(dir, 'users');
      return fs.existsSync(d) && fs.statSync(d).isDirectory() &&
             fs.existsSync(u) && fs.statSync(u).isDirectory();
    } catch { return false; }
  };

  // Preferir carpeta que tiene *ambas* (data y users)
  for (const c of candidates) if (hasBoth(c)) return c;

  // Si no hay ambas, al menos la que tenga uno de los dos
  for (const c of candidates) {
    try {
      if (fs.existsSync(path.join(c, 'data')) || fs.existsSync(path.join(c, 'users'))) return c;
    } catch {}
  }

  // Último recurso: exeDir
  return exeDir;
}



const PROJECT_ROOT = resolveProjectRoot();
const USERS_DIR = path.join(PROJECT_ROOT, 'users');
const DATA_DIR  = path.join(PROJECT_ROOT, 'data');

console.log('[RUTAS]');
console.log('  PROJECT_ROOT:', PROJECT_ROOT);
console.log('  USERS_DIR   :', USERS_DIR);
console.log('  DATA_DIR    :', DATA_DIR);
console.log('  IS_DEV      :', IS_DEV);
console.log('   app.isPackaged:', app.isPackaged);
console.log('   process.execPath:', process.execPath);
// ==================== CREAR VENTANA ====================

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false
        },
        backgroundColor: '#000000',
        show: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Abrir DevTools en modo desarrollo
    if (IS_DEV) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    initializeDirectories();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==================== INICIALIZAR DIRECTORIOS ====================

function initializeDirectories() {
    const dirs = [
        USERS_DIR,
        DATA_DIR
    ];

    dirs.forEach(dir => {
        if (!fsSync.existsSync(dir)) {
            fsSync.mkdirSync(dir, { recursive: true });
            console.log(`Directorio creado: ${dir}`);
        }
    });
}

// ==================== IPC HANDLERS ====================

// ✅ FUNCIÓN AUXILIAR: Verificar y limpiar archivos conflictivos
async function ensureDirectoryPath(dirPath) {
    try {
        const stats = await fs.stat(dirPath);

        // Si existe como ARCHIVO, eliminarlo
        if (stats.isFile()) {
            console.warn(`  ⚠️ ARCHIVO CONFLICTIVO DETECTADO: ${dirPath}`);
            await fs.unlink(dirPath);
            console.log(`  ✅ Archivo conflictivo eliminado: ${dirPath}`);
            return false; // No existe como directorio
        }
        // Si es directorio, está bien
        else if (stats.isDirectory()) {
            return true;
        }
    } catch (err) {
        // No existe, perfecto - se creará después
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return false;
}

// ✅ FUNCIÓN MEJORADA: Limpiar jerarquía completa de directorios
async function cleanDirectoryHierarchy(basePath, relativePaths) {
    console.log('\n🧹 LIMPIANDO JERARQUÍA DE DIRECTORIOS...');

    for (const relPath of relativePaths) {
        const fullPath = path.join(basePath, relPath);
        console.log(`  📁 Verificando: ${relPath}`);

        try {
            const stats = await fs.stat(fullPath);

            if (stats.isFile()) {
                console.warn(`    ⚠️ ARCHIVO CONFLICTIVO: ${relPath} (debería ser directorio)`);
                await fs.unlink(fullPath);
                console.log(`    ✅ Archivo eliminado: ${relPath}`);
            } else if (stats.isDirectory()) {
                console.log(`    ✅ Directorio OK: ${relPath}`);
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`    ℹ️ No existe (se creará): ${relPath}`);
            } else {
                console.error(`    ❌ Error verificando ${relPath}:`, err.message);
                throw err;
            }
        }
    }

    console.log('✅ Limpieza de jerarquía completada\n');
}

// ====== FILE OPERATIONS ======

// Leer archivo JSON
ipcMain.handle('file:readJSON', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        console.log('Leyendo JSON desde:', fullPath);
        const data = await fs.readFile(fullPath, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('Error leyendo JSON:', error);
        return { success: false, error: error.message };
    }
});

// Escribir archivo JSON
ipcMain.handle('file:writeJSON', async (event, filePath, data) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const dir = path.dirname(fullPath);
        
        console.log('Escribiendo JSON en:', fullPath);
        
        // Crear directorio si no existe
        if (!fsSync.existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }

        await fs.writeFile(fullPath, JSON.stringify(data, null, 2), 'utf8');
        return { success: true };
    } catch (error) {
        console.error('Error escribiendo JSON:', error);
        return { success: false, error: error.message };
    }
});

// Guardar archivo (imagen, video, etc.)
ipcMain.handle('file:saveMedia', async (event, filePath, base64Data) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const dir = path.dirname(fullPath);
        
        // Crear directorio si no existe
        if (!fsSync.existsSync(dir)) {
            await fs.mkdir(dir, { recursive: true });
        }

        // Extraer data real del base64 (quitar "data:image/png;base64,")
        const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
        const buffer = Buffer.from(base64String, 'base64');
        
        await fs.writeFile(fullPath, buffer);
        return { success: true, path: filePath };
    } catch (error) {
        console.error('Error guardando media:', error);
        return { success: false, error: error.message };
    }
});

// Leer archivo como base64
ipcMain.handle('file:readMedia', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const buffer = await fs.readFile(fullPath);
        const base64 = buffer.toString('base64');
        
        // Detectar tipo de archivo
        const ext = path.extname(filePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
            mimeType = `image/${ext.substring(1)}`;
        } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
            mimeType = `video/${ext.substring(1)}`;
        }
        
        return { 
            success: true, 
            data: `data:${mimeType};base64,${base64}`,
            mimeType 
        };
    } catch (error) {
        console.error('Error leyendo media:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar archivo
ipcMain.handle('file:delete', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        await fs.unlink(fullPath);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar directorio recursivamente
ipcMain.handle('file:deleteDir', async (event, dirPath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, dirPath);
        await fs.rm(fullPath, { recursive: true, force: true });
        return { success: true };
    } catch (error) {
        console.error('Error eliminando directorio:', error);
        return { success: false, error: error.message };
    }
});

// Verificar si existe archivo/directorio
// Verificar si existe archivo/directorio
ipcMain.handle('file:exists', async (event, filePath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, filePath);
        const exists = fsSync.existsSync(fullPath);
        console.log('='.repeat(60));
        console.log('🔍 VERIFICANDO EXISTENCIA:');
        console.log('   Ruta relativa:', filePath);
        console.log('   PROJECT_ROOT:', PROJECT_ROOT);
        console.log('   Ruta completa:', fullPath);
        console.log('   ¿Existe?:', exists);
        console.log('='.repeat(60));
        return { success: true, exists };
    } catch (error) {
        console.error('❌ Error verificando existencia:', error);
        return { success: false, error: error.message };
    }
});

// Listar archivos en directorio
ipcMain.handle('file:listDir', async (event, dirPath) => {
    try {
        const fullPath = path.join(PROJECT_ROOT, dirPath);
        console.log('Listando directorio:', fullPath);
        const files = await fs.readdir(fullPath);
        return { success: true, files };
    } catch (error) {
        console.error('Error listando directorio:', error);
        return { success: false, error: error.message };
    }
});

// ====== DIALOG OPERATIONS ======

// Abrir dialogo para seleccionar archivo
ipcMain.handle('dialog:openFile', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: options.filters || []
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        const ext = path.extname(filePath).toLowerCase();
        
        let mimeType = 'application/octet-stream';
        if (['.png', '.jpg', '.jpeg', '.gif', '.webp'].includes(ext)) {
            mimeType = `image/${ext.substring(1)}`;
        } else if (['.mp4', '.webm', '.mov'].includes(ext)) {
            mimeType = `video/${ext.substring(1)}`;
        }

        return {
            success: true,
            path: filePath,
            fileName: path.basename(filePath),
            data: `data:${mimeType};base64,${base64}`,
            mimeType
        };
    }

    return { success: false, canceled: true };
});

// ====== PROJECT OPERATIONS ======

// Crear directorio para nuevo proyecto
ipcMain.handle('project:createDir', async (event, userId, projectId) => {
    console.log('='.repeat(80));
    console.log('🚀 PROJECT:CREATE_DIR HANDLER STARTED');
    console.log('='.repeat(80));
    console.log('📝 Parameters:');
    console.log('   userId:', userId);
    console.log('   projectId:', projectId);

    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const subdirs = ['images', 'videos', 'gantt'];

        console.log('📂 TARGET PATH:', projectDir);
        console.log('🔍 BASE PATHS:');
        console.log('   PROJECT_ROOT:', PROJECT_ROOT);
        console.log('   USERS_DIR:', USERS_DIR);

        // ✅ CRÍTICO: Limpiar TODA la jerarquía antes de crear directorios
        const hierarchyPaths = [
            'users',
            `users/${userId}`,
            `users/${userId}/projects`,
            `users/${userId}/projects/${projectId}`
        ];

        await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);

        // Crear directorio principal del proyecto con mkdir recursive
        console.log('\n📁 Creando estructura de directorios...');
        try {
            await fs.mkdir(projectDir, { recursive: true });
            console.log('  ✅ Directorio principal creado');
        } catch (mkdirError) {
            // Si falla, intentar una vez más después de una limpieza más agresiva
            console.warn('  ⚠️ mkdir falló, intentando limpieza forzada...');
            await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);
            await fs.mkdir(projectDir, { recursive: true });
            console.log('  ✅ Directorio principal creado (segundo intento)');
        }

        // Verificar que se creó correctamente
        const finalCheck = fsSync.existsSync(projectDir) && fsSync.statSync(projectDir).isDirectory();
        if (!finalCheck) {
            return {
                success: false,
                error: `Failed to create project directory: ${projectDir}`,
                debug: {
                    projectDir,
                    PROJECT_ROOT,
                    USERS_DIR,
                    hierarchyPaths
                }
            };
        }

        // Crear subdirectorios
        console.log('📁 Creando subdirectorios...');
        for (const subdir of subdirs) {
            const subDirPath = path.join(projectDir, subdir);
            await fs.mkdir(subDirPath, { recursive: true });
            console.log(`  ✅ ${subdir}/`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅✅✅ ESTRUCTURA DE DIRECTORIOS CREADA EXITOSAMENTE ✅✅✅');
        console.log('='.repeat(80));
        return { success: true, path: projectDir };

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('❌❌❌ ERROR CRÍTICO EN PROJECT:CREATEDIR ❌❌❌');
        console.error('='.repeat(80));
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
        console.error('='.repeat(80));

        // Información de debug adicional
        const debugInfo = {
            PROJECT_ROOT,
            USERS_DIR,
            userId,
            projectId,
            error: error.message,
            code: error.code,
            stack: error.stack
        };

        return {
            success: false,
            error: error.message,
            code: error.code,
            debug: debugInfo
        };
    }
});

// Guardar proyecto completo
ipcMain.handle('project:save', async (event, userId, projectId, projectData) => {
    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const projectFile = path.join(projectDir, 'project.json');

        console.log('Guardando proyecto en:', projectFile);
        console.log('  projectDir:', projectDir);
        console.log('  projectFile:', projectFile);

        // Verificar si existe y qué tipo es
        const exists = fsSync.existsSync(projectDir);
        const isDirectory = exists ? fsSync.statSync(projectDir).isDirectory() : false;

        console.log('  projectDir exists:', exists, 'isDirectory:', isDirectory);

        if (exists && !isDirectory) {
            console.error('  ERROR: projectDir existe pero no es un directorio!');
            // Si existe como archivo, eliminarlo
            await fs.unlink(projectDir);
            console.log('  Archivo conflictivo eliminado');
        }

        // Crear directorio si no existe
        if (!exists || !isDirectory) {
            await fs.mkdir(projectDir, { recursive: true });
            console.log('  Directorio creado');
        }

        // Guardar JSON del proyecto (sin archivos pesados)
        await fs.writeFile(projectFile, JSON.stringify(projectData, null, 2), 'utf8');

        console.log(`Proyecto guardado: ${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error guardando proyecto:', error);
        console.error('  Error details:', error.message);
        console.error('  Stack:', error.stack);
        return { success: false, error: error.message };
    }
});

// Cargar proyecto
ipcMain.handle('project:load', async (event, userId, projectId) => {
    try {
        const projectFile = path.join(USERS_DIR, userId, 'projects', projectId, 'project.json');
        const data = await fs.readFile(projectFile, 'utf8');
        return { success: true, data: JSON.parse(data) };
    } catch (error) {
        console.error('Error cargando proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Eliminar proyecto completo
ipcMain.handle('project:delete', async (event, userId, projectId) => {
    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(`Proyecto eliminado: ${projectId}`);
        return { success: true };
    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        return { success: false, error: error.message };
    }
});

// Listar todos los proyectos de un usuario
ipcMain.handle('project:listByUser', async (event, userId) => {
    try {
        const projectsDir = path.join(USERS_DIR, userId, 'projects');
        
        if (!fsSync.existsSync(projectsDir)) {
            return { success: true, projects: [] };
        }
        
        const projectFolders = await fs.readdir(projectsDir);
        const projects = [];
        
        for (const folder of projectFolders) {
            const projectFile = path.join(projectsDir, folder, 'project.json');
            if (fsSync.existsSync(projectFile)) {
                const data = await fs.readFile(projectFile, 'utf8');
                projects.push(JSON.parse(data));
            }
        }
        
        return { success: true, projects };
    } catch (error) {
        console.error('Error listando proyectos:', error);
        return { success: false, error: error.message };
    }
});

// ====== USER OPERATIONS ======

// Crear directorio para nuevo usuario
ipcMain.handle('user:createDir', async (event, userId) => {
    try {
        const userDir = path.join(USERS_DIR, userId);
        const projectsDir = path.join(userDir, 'projects');
        
        await fs.mkdir(projectsDir, { recursive: true });
        
        console.log(`Directorio de usuario creado: ${userDir}`);
        return { success: true, path: userDir };
    } catch (error) {
        console.error('Error creando directorio de usuario:', error);
        return { success: false, error: error.message };
    }
});

console.log('Electron Main Process cargado');
