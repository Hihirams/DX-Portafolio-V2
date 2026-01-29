// ============================================
// ELECTRON MAIN - Proceso principal
// ============================================

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// fs de dos sabores:
const fsSync = require('fs');                 // sync: existsSync, mkdirSync...
const fs = require('fs').promises;            // promesas: readFile, writeFile...

// ✅ FIX: Check if running in Electron main process
if (typeof app === 'undefined') {
    console.error('❌ This script must be run in Electron main process');
    process.exit(1);
}

// ⚡ OPTIMIZACIÓN: Flags de V8 para inicio más rápido
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

const IS_DEV = process.argv.includes('--dev');

// ✅ OPTIMIZADO: Resolver raíz de proyecto de forma más eficiente
function resolveProjectRoot() {
    // PORTABLE: usar directamente PORTABLE_EXECUTABLE_DIR (más rápido)
    const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
    if (portableDir && fsSync.existsSync(path.join(portableDir, 'data'))) {
        return portableDir;
    }

    // DESARROLLO: usar el directorio del proyecto
    if (IS_DEV) {
        return __dirname;
    }

    // PORTABLE SIN ENV: buscar junto al exe
    const exeDir = path.dirname(process.execPath);
    if (fsSync.existsSync(path.join(exeDir, 'data'))) {
        return exeDir;
    }

    // CWD: carpeta de trabajo actual
    const cwd = process.cwd();
    if (fsSync.existsSync(path.join(cwd, 'data'))) {
        return cwd;
    }

    // ÚLTIMO RECURSO: exeDir
    return exeDir;
}

const PROJECT_ROOT = resolveProjectRoot();
const USERS_DIR = path.join(PROJECT_ROOT, 'users');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');

// Solo mostrar logs en modo desarrollo
if (IS_DEV) {
    console.log('[RUTAS]');
    console.log('  PROJECT_ROOT:', PROJECT_ROOT);
    console.log('  USERS_DIR   :', USERS_DIR);
    console.log('  DATA_DIR    :', DATA_DIR);
    console.log('  IS_DEV      :', IS_DEV);
    console.log('  process.execPath:', process.execPath);
}
// ==================== CREAR VENTANA ====================

function createWindow() {
    // Resolver ruta del icono que funcione en desarrollo y producción
    const iconPath = IS_DEV
        ? path.join(__dirname, 'assets', 'logo-dx.ico')
        : path.join(PROJECT_ROOT, 'assets', 'logo-dx.ico');

    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1200,
        minHeight: 700,
        icon: iconPath,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            enableRemoteModule: false,
            backgroundThrottling: false  // ⚡ Prevenir throttling durante carga inicial
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
    // Interceptar peticiones de assets para servirlos desde PROJECT_ROOT
    const { protocol } = require('electron');
    protocol.interceptFileProtocol('file', (request, callback) => {
        const url = request.url.substr(7); // quitar 'file://'

        // Si la petición es para assets/, servirlo desde PROJECT_ROOT/assets/
        if (url.includes('/assets/') || url.includes('\\assets\\')) {
            const assetPath = url.split(/[\\/]assets[\\/]/).pop();
            const fullPath = path.join(PROJECT_ROOT, 'assets', assetPath);
            callback({ path: fullPath });
        } else {
            callback({ path: path.normalize(url) });
        }
    });


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

// âœ… FUNCIÃ“N AUXILIAR: Verificar y limpiar archivos conflictivos
async function ensureDirectoryPath(dirPath) {
    try {
        const stats = await fs.stat(dirPath);

        // Si existe como ARCHIVO, eliminarlo
        if (stats.isFile()) {
            console.warn(`  âš ï¸ ARCHIVO CONFLICTIVO DETECTADO: ${dirPath}`);
            await fs.unlink(dirPath);
            console.log(`  âœ… Archivo conflictivo eliminado: ${dirPath}`);
            return false; // No existe como directorio
        }
        // Si es directorio, estÃ¡ bien
        else if (stats.isDirectory()) {
            return true;
        }
    } catch (err) {
        // No existe, perfecto - se crearÃ¡ despuÃ©s
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return false;
}

// âœ… FUNCIÃ“N MEJORADA: Limpiar jerarquÃ­a completa de directorios
async function cleanDirectoryHierarchy(basePath, relativePaths) {
    console.log('\nðŸ§¹ LIMPIANDO JERARQUÃA DE DIRECTORIOS...');

    for (const relPath of relativePaths) {
        const fullPath = path.join(basePath, relPath);
        console.log(`  ðŸ“ Verificando: ${relPath}`);

        try {
            const stats = await fs.stat(fullPath);

            if (stats.isFile()) {
                console.warn(`    âš ï¸ ARCHIVO CONFLICTIVO: ${relPath} (deberÃ­a ser directorio)`);
                await fs.unlink(fullPath);
                console.log(`    âœ… Archivo eliminado: ${relPath}`);
            } else if (stats.isDirectory()) {
                console.log(`    âœ… Directorio OK: ${relPath}`);
            }
        } catch (err) {
            if (err.code === 'ENOENT') {
                console.log(`    â„¹ï¸ No existe (se crearÃ¡): ${relPath}`);
            } else {
                console.error(`    âŒ Error verificando ${relPath}:`, err.message);
                throw err;
            }
        }
    }

    console.log('âœ… Limpieza de jerarquÃ­a completada\n');
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
            if (ext === '.jpg' || ext === '.jpeg') {
                mimeType = 'image/jpeg';
            } else {
                mimeType = `image/${ext.substring(1)}`;
            }
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
        console.log('ðŸ” VERIFICANDO EXISTENCIA:');
        console.log('   Ruta relativa:', filePath);
        console.log('   PROJECT_ROOT:', PROJECT_ROOT);
        console.log('   Ruta completa:', fullPath);
        console.log('   Â¿Existe?:', exists);
        console.log('='.repeat(60));
        return { success: true, exists };
    } catch (error) {
        console.error('âŒ Error verificando existencia:', error);
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
    console.log('ðŸš€ PROJECT:CREATE_DIR HANDLER STARTED');
    console.log('='.repeat(80));
    console.log('ðŸ“ Parameters:');
    console.log('   userId:', userId);
    console.log('   projectId:', projectId);

    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const subdirs = ['images', 'videos', 'gantt', 'extra-files'];

        console.log('ðŸ“‚ TARGET PATH:', projectDir);
        console.log('ðŸ” BASE PATHS:');
        console.log('   PROJECT_ROOT:', PROJECT_ROOT);
        console.log('   USERS_DIR:', USERS_DIR);

        // âœ… CRÃTICO: Limpiar TODA la jerarquÃ­a antes de crear directorios
        const hierarchyPaths = [
            'users',
            `users/${userId}`,
            `users/${userId}/projects`,
            `users/${userId}/projects/${projectId}`
        ];

        await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);

        // Crear directorio principal del proyecto con mkdir recursive
        console.log('\nðŸ“ Creando estructura de directorios...');
        try {
            await fs.mkdir(projectDir, { recursive: true });
            console.log('  âœ… Directorio principal creado');
        } catch (mkdirError) {
            // Si falla, intentar una vez mÃ¡s despuÃ©s de una limpieza mÃ¡s agresiva
            console.warn('  âš ï¸ mkdir fallÃ³, intentando limpieza forzada...');
            await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);
            await fs.mkdir(projectDir, { recursive: true });
            console.log('  âœ… Directorio principal creado (segundo intento)');
        }

        // Verificar que se creÃ³ correctamente
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
        console.log('ðŸ“ Creando subdirectorios...');
        for (const subdir of subdirs) {
            const subDirPath = path.join(projectDir, subdir);
            await fs.mkdir(subDirPath, { recursive: true });
            console.log(`  âœ… ${subdir}/`);
        }

        console.log('\n' + '='.repeat(80));
        console.log('âœ…âœ…âœ… ESTRUCTURA DE DIRECTORIOS CREADA EXITOSAMENTE âœ…âœ…âœ…');
        console.log('='.repeat(80));
        return { success: true, path: projectDir };

    } catch (error) {
        console.error('\n' + '='.repeat(80));
        console.error('âŒâŒâŒ ERROR CRÃTICO EN PROJECT:CREATEDIR âŒâŒâŒ');
        console.error('='.repeat(80));
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Stack:', error.stack);
        console.error('='.repeat(80));

        // InformaciÃ³n de debug adicional
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

        // Verificar si existe y quÃ© tipo es
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
        // 1. Eliminar la carpeta del proyecto
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        await fs.rm(projectDir, { recursive: true, force: true });
        console.log(`📁 Carpeta del proyecto eliminada: ${projectId}`);

        // 2. Actualizar el archivo projects.json en data/
        const projectsJsonPath = path.join(DATA_DIR, 'projects.json');

        if (fsSync.existsSync(projectsJsonPath)) {
            const projectsData = JSON.parse(await fs.readFile(projectsJsonPath, 'utf8'));

            // Filtrar el proyecto eliminado
            const originalLength = projectsData.projects.length;
            projectsData.projects = projectsData.projects.filter(p => p.id !== projectId);

            // Guardar el archivo actualizado
            await fs.writeFile(projectsJsonPath, JSON.stringify(projectsData, null, 2), 'utf8');

            const deletedCount = originalLength - projectsData.projects.length;
            console.log(`✅ Proyecto ${projectId} eliminado de projects.json (${deletedCount} entrada(s))`);
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error eliminando proyecto:', error);
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

// Transfer project to another user
ipcMain.handle('project:transfer', async (event, fromUserId, toUserId, projectId) => {
    console.log('='.repeat(80));
    console.log('🔄 PROJECT:TRANSFER HANDLER STARTED');
    console.log('='.repeat(80));
    console.log('📂 Parameters:');
    console.log('   fromUserId:', fromUserId);
    console.log('   toUserId:', toUserId);
    console.log('   projectId:', projectId);

    try {
        const sourceDir = path.join(USERS_DIR, fromUserId, 'projects', projectId);
        const destDir = path.join(USERS_DIR, toUserId, 'projects', projectId);
        const projectFile = path.join(sourceDir, 'project.json');

        console.log('📂 Source:', sourceDir);
        console.log('📂 Destination:', destDir);

        // 1. Check if source exists
        if (!fsSync.existsSync(sourceDir)) {
            console.error('❌ Source project directory does not exist');
            return { success: false, error: 'Source project not found' };
        }

        // 2. Create destination user's projects directory if needed
        const destUserProjectsDir = path.join(USERS_DIR, toUserId, 'projects');
        if (!fsSync.existsSync(destUserProjectsDir)) {
            await fs.mkdir(destUserProjectsDir, { recursive: true });
            console.log('✅ Created destination projects directory');
        }

        // 3. Copy the entire project folder
        console.log('📋 Copying project folder...');
        await copyDirectoryRecursive(sourceDir, destDir);
        console.log('✅ Project folder copied');

        // 4. Load and update project.json with new ownerId
        console.log('📝 Updating project.json with new owner...');
        const projectDataRaw = await fs.readFile(path.join(destDir, 'project.json'), 'utf8');
        const projectData = JSON.parse(projectDataRaw);

        // Read users.json to get new owner's name
        const usersJsonPath = path.join(DATA_DIR, 'users.json');
        let newOwnerName = 'Unknown';
        if (fsSync.existsSync(usersJsonPath)) {
            const usersData = JSON.parse(await fs.readFile(usersJsonPath, 'utf8'));
            const newOwner = usersData.users.find(u => u.id === toUserId);
            if (newOwner) {
                newOwnerName = newOwner.name;
            }
        }

        projectData.ownerId = toUserId;
        projectData.ownerName = newOwnerName;
        projectData.updatedAt = new Date().toISOString();

        await fs.writeFile(path.join(destDir, 'project.json'), JSON.stringify(projectData, null, 2), 'utf8');
        console.log('✅ project.json updated with new owner:', newOwnerName);

        // 5. Update data/projects.json
        const projectsJsonPath = path.join(DATA_DIR, 'projects.json');
        if (fsSync.existsSync(projectsJsonPath)) {
            const projectsFile = JSON.parse(await fs.readFile(projectsJsonPath, 'utf8'));
            const projectIndex = projectsFile.projects.findIndex(p => p.id === projectId);

            if (projectIndex >= 0) {
                projectsFile.projects[projectIndex].ownerId = toUserId;
                projectsFile.projects[projectIndex].ownerName = newOwnerName;
                projectsFile.projects[projectIndex].updatedAt = new Date().toISOString();
                await fs.writeFile(projectsJsonPath, JSON.stringify(projectsFile, null, 2), 'utf8');
                console.log('✅ data/projects.json updated');
            }
        }

        // 6. Delete source folder
        console.log('🗑️ Deleting source folder...');
        await fs.rm(sourceDir, { recursive: true, force: true });
        console.log('✅ Source folder deleted');

        console.log('='.repeat(80));
        console.log('✅✅✅ PROJECT TRANSFERRED SUCCESSFULLY ✅✅✅');
        console.log('='.repeat(80));

        return { success: true };
    } catch (error) {
        console.error('❌ Error transferring project:', error);
        return { success: false, error: error.message };
    }
});

// Helper function for recursive directory copy
async function copyDirectoryRecursive(source, dest) {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(source, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            await copyDirectoryRecursive(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

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
