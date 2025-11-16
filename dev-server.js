#!/usr/bin/env node

/**
 * Servidor de desarrollo para Portafolio DX
 * Permite ver cambios en vivo sin necesidad de compilar
 * 
 * Uso: node dev-server.js
 * Acceso: http://localhost:3000
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const ROOT_DIR = __dirname;

// MIME types
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.ico': 'image/x-icon'
};

/**
 * Sirve archivos estáticos
 */
function serveFile(filePath, res) {
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - Archivo no encontrado');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        
        res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        res.end(data);
    });
}

/**
 * Lista directorios (para el API listdir)
 */
function listDirectory(dirPath, res) {
    try {
        const fullPath = path.join(ROOT_DIR, dirPath);
        
        // Seguridad: no permitir acceso fuera de ROOT_DIR
        if (!fullPath.startsWith(ROOT_DIR)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Acceso denegado' }));
            return;
        }

        fs.readdir(fullPath, (err, files) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Directorio no encontrado' }));
                return;
            }

            // Filtrar archivos ocultos
            const filteredFiles = files.filter(f => !f.startsWith('.'));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ files: filteredFiles }));
        });
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
    }
}

/**
 * Crea el servidor
 */
const server = http.createServer((req, res) => {
    // CORS headers para desarrollo
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Rutas especiales para API
    if (pathname === '/api/listdir') {
        const dirPath = parsedUrl.query.path;
        listDirectory(dirPath, res);
        return;
    }

    // Archivo raíz
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Ruta a archivo
    let filePath = path.join(ROOT_DIR, pathname);

    // Seguridad: no permitir acceso fuera de ROOT_DIR
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 - Acceso denegado');
        return;
    }

    // Verificar si es un directorio
    fs.stat(filePath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 - No encontrado');
            return;
        }

        if (stats.isDirectory()) {
            // Si es directorio, intentar servir index.html
            filePath = path.join(filePath, 'index.html');
        }

        serveFile(filePath, res);
    });
});

/**
 * Inicia el servidor
 */
server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║           🚀 Servidor de Desarrollo - Portafolio DX           ║
║                                                                ║
║   URL: http://localhost:${PORT}                                     ║
║                                                                ║
║   Características:                                            ║
║   ✅ Hot-reload automático de datos                           ║
║   ✅ Sin necesidad de compilar (build)                        ║
║   ✅ Cambios en vivo cada 3 segundos                          ║
║                                                                ║
║   Para detener: Presiona Ctrl+C                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
    
    console.log('📝 Editando projects.json para ver cambios en vivo...\n');
});

/**
 * Manejo de errores
 */
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Puerto ${PORT} ya está en uso`);
        console.error('Intenta detener otros procesos o usa un puerto diferente');
        process.exit(1);
    } else {
        console.error('❌ Error del servidor:', error);
        process.exit(1);
    }
});

// Manejador de señales para salida limpia
process.on('SIGINT', () => {
    console.log('\n\n🛑 Servidor detenido');
    process.exit(0);
});
