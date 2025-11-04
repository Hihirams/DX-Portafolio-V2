// ============================================
// SCRIPT DE DIAGNÓSTICO - Ejecutar con Node
// ============================================
// USO: node diagnostic-script.js

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO AUTOMÁTICO DEL SISTEMA\n');
console.log('='.repeat(80));

// 1. Detectar directorio del proyecto
const projectRoot = __dirname;
console.log('📂 PROJECT ROOT:', projectRoot);
console.log('='.repeat(80));

// 2. Verificar estructura esperada
console.log('\n📊 VERIFICANDO ESTRUCTURA DE ARCHIVOS:\n');

const pathsToCheck = [
    'users',
    'data',
    'data/users.json',
    'data/projects.json',
    'electron-main.js',
    'file-manager.js',
    'preload.js'
];

const results = [];

pathsToCheck.forEach(pathToCheck => {
    const fullPath = path.join(projectRoot, pathToCheck);
    const name = pathToCheck.padEnd(25);
    
    try {
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            
            if (stats.isDirectory()) {
                console.log(`✅ ${name} → DIRECTORIO`);
                results.push({ path: pathToCheck, status: 'directory', ok: true });
            } else if (stats.isFile()) {
                const shouldBeDir = !path.extname(pathToCheck); // Sin extensión = debería ser directorio
                
                if (shouldBeDir) {
                    console.log(`❌ ${name} → ARCHIVO (debería ser DIRECTORIO) 🔥`);
                    results.push({ path: pathToCheck, status: 'file-should-be-dir', ok: false });
                } else {
                    console.log(`✅ ${name} → ARCHIVO`);
                    results.push({ path: pathToCheck, status: 'file', ok: true });
                }
            }
        } else {
            if (pathToCheck.includes('.')) {
                console.log(`⚠️  ${name} → NO EXISTE (archivo esperado)`);
                results.push({ path: pathToCheck, status: 'missing-file', ok: false });
            } else {
                console.log(`ℹ️  ${name} → NO EXISTE (se creará al ejecutar)`);
                results.push({ path: pathToCheck, status: 'missing-dir', ok: true });
            }
        }
    } catch (error) {
        console.log(`❌ ${name} → ERROR: ${error.message}`);
        results.push({ path: pathToCheck, status: 'error', ok: false, error: error.message });
    }
});

// 3. Análisis de problemas
console.log('\n' + '='.repeat(80));
console.log('📋 ANÁLISIS DE PROBLEMAS:\n');

const problems = results.filter(r => !r.ok);

if (problems.length === 0) {
    console.log('✅ No se detectaron problemas en la estructura de archivos.');
} else {
    console.log(`❌ Se detectaron ${problems.length} problema(s):\n`);
    
    problems.forEach((problem, index) => {
        console.log(`${index + 1}. ${problem.path}`);
        console.log(`   Estado: ${problem.status}`);
        
        if (problem.status === 'file-should-be-dir') {
            console.log(`   🔥 PROBLEMA CRÍTICO: Este es un archivo pero debe ser un directorio`);
            console.log(`   Solución: Eliminar archivo y dejar que la app cree el directorio`);
            console.log(`   Comando: rm "${problem.path}" o elimina manualmente`);
        } else if (problem.status === 'missing-file') {
            console.log(`   ⚠️ Archivo necesario no encontrado`);
            console.log(`   Solución: Verifica que el archivo exista en la carpeta del proyecto`);
        } else if (problem.status === 'error') {
            console.log(`   ❌ Error: ${problem.error}`);
        }
        
        console.log('');
    });
}

// 4. Verificar permisos (solo en sistemas Unix)
if (process.platform !== 'win32') {
    console.log('='.repeat(80));
    console.log('🔐 VERIFICANDO PERMISOS:\n');
    
    const dirsToCheck = ['users', 'data'];
    
    dirsToCheck.forEach(dir => {
        const fullPath = path.join(projectRoot, dir);
        if (fs.existsSync(fullPath)) {
            try {
                const stats = fs.statSync(fullPath);
                const mode = (stats.mode & parseInt('777', 8)).toString(8);
                console.log(`📁 ${dir.padEnd(10)} → Permisos: ${mode}`);
                
                if (mode < '755') {
                    console.log(`   ⚠️ Permisos insuficientes (recomendado: 755 o mayor)`);
                }
            } catch (err) {
                console.log(`❌ ${dir} → Error verificando permisos: ${err.message}`);
            }
        }
    });
}

// 5. Verificar código en electron-main.js
console.log('\n' + '='.repeat(80));
console.log('🔍 VERIFICANDO CÓDIGO DE electron-main.js:\n');

const electronMainPath = path.join(projectRoot, 'electron-main.js');

if (fs.existsSync(electronMainPath)) {
    const content = fs.readFileSync(electronMainPath, 'utf8');
    
    const checks = [
        {
            name: 'Función ensureDirectoryPath',
            pattern: /async function ensureDirectoryPath/,
            required: true
        },
        {
            name: 'Handler project:createDir',
            pattern: /ipcMain\.handle\('project:createDir'/,
            required: true
        },
        {
            name: 'Verificación de pathLevels',
            pattern: /const pathLevels = \[/,
            required: true
        },
        {
            name: 'Detección de archivos (isFile)',
            pattern: /if \(isFile\)/,
            required: true
        },
        {
            name: 'Eliminación de archivos conflictivos (unlink)',
            pattern: /await fs\.unlink\(/,
            required: true
        }
    ];
    
    checks.forEach(check => {
        if (check.pattern.test(content)) {
            console.log(`✅ ${check.name}: Presente`);
        } else {
            console.log(`❌ ${check.name}: NO ENCONTRADO ${check.required ? '🔥 CRÍTICO' : ''}`);
        }
    });
} else {
    console.log('❌ electron-main.js no encontrado');
}

// 6. Recomendaciones finales
console.log('\n' + '='.repeat(80));
console.log('💡 RECOMENDACIONES:\n');

if (problems.length > 0) {
    console.log('1. SOLUCIONA LOS PROBLEMAS DETECTADOS ARRIBA');
    
    const fileProblems = problems.filter(p => p.status === 'file-should-be-dir');
    if (fileProblems.length > 0) {
        console.log('\n2. ELIMINA ARCHIVOS CONFLICTIVOS:');
        fileProblems.forEach(p => {
            console.log(`   rm "${p.path}"`);
        });
    }
    
    console.log('\n3. REINICIA LA APLICACIÓN:');
    console.log('   npm start');
} else {
    console.log('✅ No se detectaron problemas obvios.');
    console.log('\nSi el error persiste:');
    console.log('1. Elimina la carpeta users: rm -rf users/');
    console.log('2. Ejecuta la app en modo debug');
    console.log('3. Revisa los logs del main process en la TERMINAL');
    console.log('4. Usa electron-main-DEBUG.js y file-manager-DEBUG.js');
}

console.log('\n' + '='.repeat(80));
console.log('✅ DIAGNÓSTICO COMPLETADO');
console.log('='.repeat(80));

// 7. Generar reporte
const reportPath = path.join(projectRoot, 'diagnostic-report.txt');
const report = [];

report.push('═══════════════════════════════════════════════════════════════════════════════');
report.push('                    REPORTE DE DIAGNÓSTICO AUTOMÁTICO                         ');
report.push('═══════════════════════════════════════════════════════════════════════════════');
report.push('');
report.push(`Fecha: ${new Date().toISOString()}`);
report.push(`Sistema: ${process.platform}`);
report.push(`Node: ${process.version}`);
report.push(`Directorio: ${projectRoot}`);
report.push('');
report.push('─────────────────────────────────────────────────────────────────────────────');
report.push('RESULTADOS:');
report.push('─────────────────────────────────────────────────────────────────────────────');
report.push('');

results.forEach(r => {
    report.push(`[${r.ok ? 'OK' : 'PROBLEMA'}] ${r.path} → ${r.status}`);
    if (r.error) report.push(`           Error: ${r.error}`);
});

report.push('');
report.push('─────────────────────────────────────────────────────────────────────────────');
report.push('PROBLEMAS DETECTADOS:');
report.push('─────────────────────────────────────────────────────────────────────────────');
report.push('');

if (problems.length === 0) {
    report.push('✅ No se detectaron problemas');
} else {
    problems.forEach((p, i) => {
        report.push(`${i + 1}. ${p.path} (${p.status})`);
    });
}

report.push('');
report.push('═══════════════════════════════════════════════════════════════════════════════');

fs.writeFileSync(reportPath, report.join('\n'));
console.log(`\n📄 Reporte guardado en: ${reportPath}`);
