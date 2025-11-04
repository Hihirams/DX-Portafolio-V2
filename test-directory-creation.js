// ============================================
// SCRIPT DE PRUEBA - Creación de directorios
// ============================================
// USO: node test-directory-creation.js

const fs = require('fs');
const path = require('path');

// Simular las constantes del electron-main.js
const IS_DEV = process.argv.includes('--dev') || !process.argv.includes('--packaged');
const exeDir = path.dirname(process.argv[0] || process.execPath);
const PROJECT_ROOT = IS_DEV ? path.join(__dirname, '..') : exeDir;
const USERS_DIR = path.join(PROJECT_ROOT, 'users');

console.log('🔧 TEST: Creación de directorios para proyectos');
console.log('='.repeat(80));
console.log('IS_DEV:', IS_DEV);
console.log('PROJECT_ROOT:', PROJECT_ROOT);
console.log('USERS_DIR:', USERS_DIR);
console.log('='.repeat(80));

// Función para limpiar jerarquía (simulando cleanDirectoryHierarchy)
async function cleanDirectoryHierarchy(basePath, relativePaths) {
    console.log('\n🧹 LIMPIANDO JERARQUÍA DE DIRECTORIOS...');

    for (const relPath of relativePaths) {
        const fullPath = path.join(basePath, relPath);
        console.log(`  📁 Verificando: ${relPath}`);

        try {
            const stats = await fs.promises.stat(fullPath);

            if (stats.isFile()) {
                console.warn(`    ⚠️ ARCHIVO CONFLICTIVO: ${relPath} (debería ser directorio)`);
                await fs.promises.unlink(fullPath);
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

// Función para crear directorios (simulando el handler)
async function createProjectDirectories(userId, projectId) {
    console.log('🚀 CREANDO DIRECTORIOS PARA PROYECTO...');
    console.log('userId:', userId);
    console.log('projectId:', projectId);

    try {
        const projectDir = path.join(USERS_DIR, userId, 'projects', projectId);
        const subdirs = ['images', 'videos', 'gantt'];

        console.log('📂 TARGET PATH:', projectDir);

        // Limpiar jerarquía completa
        const hierarchyPaths = [
            'users',
            `users/${userId}`,
            `users/${userId}/projects`,
            `users/${userId}/projects/${projectId}`
        ];

        await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);

        // Crear directorio principal
        console.log('\n📁 Creando estructura de directorios...');
        try {
            await fs.promises.mkdir(projectDir, { recursive: true });
            console.log('  ✅ Directorio principal creado');
        } catch (mkdirError) {
            console.warn('  ⚠️ mkdir falló, intentando limpieza forzada...');
            await cleanDirectoryHierarchy(PROJECT_ROOT, hierarchyPaths);
            await fs.promises.mkdir(projectDir, { recursive: true });
            console.log('  ✅ Directorio principal creado (segundo intento)');
        }

        // Verificar creación
        const finalCheck = fs.existsSync(projectDir) && fs.statSync(projectDir).isDirectory();
        if (!finalCheck) {
            throw new Error(`Failed to create project directory: ${projectDir}`);
        }

        // Crear subdirectorios
        console.log('📁 Creando subdirectorios...');
        for (const subdir of subdirs) {
            const subDirPath = path.join(projectDir, subdir);
            await fs.promises.mkdir(subDirPath, { recursive: true });
            console.log(`  ✅ ${subdir}/`);
        }

        console.log('\n✅✅✅ ESTRUCTURA CREADA EXITOSAMENTE ✅✅✅');
        return { success: true, path: projectDir };

    } catch (error) {
        console.error('\n❌❌❌ ERROR CRÍTICO ❌❌❌');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        return { success: false, error: error.message, code: error.code };
    }
}

// Función para verificar estructura
function verifyStructure(userId, projectId) {
    console.log('\n🔍 VERIFICANDO ESTRUCTURA FINAL...');

    const paths = [
        'users',
        `users/${userId}`,
        `users/${userId}/projects`,
        `users/${userId}/projects/${projectId}`,
        `users/${userId}/projects/${projectId}/images`,
        `users/${userId}/projects/${projectId}/videos`,
        `users/${userId}/projects/${projectId}/gantt`
    ];

    let allGood = true;

    paths.forEach(p => {
        const fullPath = path.join(PROJECT_ROOT, p);
        const exists = fs.existsSync(fullPath);
        const isDir = exists ? fs.statSync(fullPath).isDirectory() : false;

        if (exists && isDir) {
            console.log(`  ✅ ${p}`);
        } else {
            console.log(`  ❌ ${p} - ${exists ? 'ES ARCHIVO' : 'NO EXISTE'}`);
            allGood = false;
        }
    });

    return allGood;
}

// Ejecutar prueba
async function runTest() {
    const userId = 'user1';
    const projectId = `proj${Date.now()}`;

    console.log('🧪 INICIANDO PRUEBA...');

    // Crear algunos archivos conflictivos para probar
    console.log('\n📝 Creando archivos conflictivos para probar...');
    const conflictFiles = [
        path.join(PROJECT_ROOT, 'users'),
        path.join(PROJECT_ROOT, 'users', userId),
        path.join(PROJECT_ROOT, 'users', userId, 'projects')
    ];

    for (const filePath of conflictFiles) {
        try {
            // Crear archivo vacío
            await fs.promises.writeFile(filePath, 'conflict test');
            console.log(`  📄 Creado archivo conflictivo: ${path.relative(PROJECT_ROOT, filePath)}`);
        } catch (err) {
            // Ignorar si ya existe
        }
    }

    // Ejecutar creación de directorios
    const result = await createProjectDirectories(userId, projectId);

    if (result.success) {
        console.log('\n🎉 PRUEBA EXITOSA');
        console.log('Directorio creado:', result.path);

        // Verificar estructura
        const structureOk = verifyStructure(userId, projectId);
        if (structureOk) {
            console.log('\n✅ ESTRUCTURA VERIFICADA CORRECTAMENTE');
        } else {
            console.log('\n❌ ESTRUCTURA INCORRECTA');
        }
    } else {
        console.log('\n💥 PRUEBA FALLIDA');
        console.log('Error:', result.error);
        console.log('Code:', result.code);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ PRUEBA COMPLETADA');
    console.log('='.repeat(80));
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runTest().catch(console.error);
}

module.exports = { createProjectDirectories, cleanDirectoryHierarchy };
