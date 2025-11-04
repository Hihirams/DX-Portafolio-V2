// ============================================
// FILE MANAGER - Sistema de gestion de archivos local (Electron)
// ============================================

class FileManager {
    constructor() {
        this.api = window.electronAPI;
        this.isElectron = typeof window.electronAPI !== 'undefined';
        
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible. Esta aplicacion requiere Electron.');
        } else {
            console.log('âœ… Electron API disponible');
        }
    }

    // ==================== PROJECT OPERATIONS ====================

    async saveProject(userId, projectData) {
    if (!this.isElectron) {
        console.error('❌ Electron API no disponible');
        return false;
    }

    try {
        const projectId = projectData.id;
        console.log('\n╔════════════════════════════════════════╗');
        console.log(`║  💾 GUARDANDO PROYECTO ${projectId.substring(0, 15)}...  ║`);
        console.log('╚════════════════════════════════════════╝');
        console.log(`👤 Usuario: ${userId}`);

        // 1. Crear estructura de directorios si no existe
        console.log('📁 Creando directorios...');
        const dirResult = await this.api.createProjectDir(userId, projectId);

        // Mostrar debug info del main process si está disponible
        if (dirResult.debug) {
            console.log('\n📋 DEBUG INFO DEL MAIN PROCESS:');
            console.log('─'.repeat(80));
            console.log('PROJECT_ROOT:', dirResult.debug.PROJECT_ROOT);
            console.log('USERS_DIR:', dirResult.debug.USERS_DIR);
            console.log('userId:', dirResult.debug.userId);
            console.log('projectId:', dirResult.debug.projectId);
            console.log('─'.repeat(80));
        }

        if (!dirResult.success) {
            console.error('❌ Error creando directorios:', dirResult.error);
            if (dirResult.code) {
                console.error('   Error Code:', dirResult.code);
            }
            if (dirResult.debug) {
                console.error('   Debug Info:', JSON.stringify(dirResult.debug, null, 2));
            }
            return false;
        }
        console.log('  ✅ Directorios creados');

        // ✅ 2. Procesar y guardar Gantt (CON MEJOR DEBUG Y ERROR HANDLING)
        if (projectData.ganttImage) {
            console.log('\n🖼️ Procesando Gantt...');
            console.log('  📊 Detalles:');
            console.log('    - Tipo:', typeof projectData.ganttImage);
            console.log('    - Longitud:', projectData.ganttImage.length);
            console.log('    - Inicia con data:?', projectData.ganttImage.startsWith('data:'));
            console.log('    - Preview:', projectData.ganttImage.substring(0, 60) + '...');
            
            try {
                const ganttPath = await this.saveGantt(userId, projectId, projectData.ganttImage);
                console.log('  ✅ Gantt guardado en:', ganttPath);
                projectData.ganttImagePath = ganttPath;
                
                // Limpiar data URI para ahorrar espacio en JSON
                delete projectData.ganttImage;
                console.log('  ✅ Data URI limpiado del JSON');
            } catch (ganttError) {
                console.error('  ❌ ERROR guardando Gantt:', ganttError.message);
                console.error('  Stack:', ganttError.stack);
                // ⚠️ NO fallar todo el guardado por un error en Gantt
                // Simplemente no lo guardamos y continuamos
                delete projectData.ganttImage;
                console.warn('  ⚠️ Continuando sin Gantt...');
            }
        } else {
            console.log('\nℹ️ No hay Gantt para guardar (ganttImage vacío o undefined)');
        }

        // ✅ 3. Procesar y guardar imágenes (CON MEJOR DEBUG)
        if (projectData.images && projectData.images.length > 0) {
            console.log(`\n📸 Procesando ${projectData.images.length} imágenes...`);
            
            try {
                const imagePaths = await this.saveImages(userId, projectId, projectData.images);
                console.log(`  ✅ ${imagePaths.length}/${projectData.images.length} imágenes guardadas`);
                projectData.images = imagePaths;
            } catch (imgError) {
                console.error('  ❌ ERROR guardando imágenes:', imgError.message);
                console.error('  Stack:', imgError.stack);
                // Mantener las imágenes que sí se guardaron (si las hay)
                console.warn('  ⚠️ Continuando con las imágenes guardadas hasta ahora...');
            }
        } else {
            console.log('\nℹ️ No hay imágenes para guardar');
        }

        // ✅ 4. Procesar y guardar videos (CON MEJOR DEBUG)
        if (projectData.videos && projectData.videos.length > 0) {
            console.log(`\n🎥 Procesando ${projectData.videos.length} videos...`);
            
            try {
                const videoPaths = await this.saveVideos(userId, projectId, projectData.videos);
                console.log(`  ✅ ${videoPaths.length}/${projectData.videos.length} videos guardados`);
                projectData.videos = videoPaths;
            } catch (vidError) {
                console.error('  ❌ ERROR guardando videos:', vidError.message);
                console.error('  Stack:', vidError.stack);
                // Mantener los videos que sí se guardaron
                console.warn('  ⚠️ Continuando con los videos guardados hasta ahora...');
            }
        } else {
            console.log('\nℹ️ No hay videos para guardar');
        }

        // 5. Guardar JSON del proyecto (ligero, sin base64)
        console.log('\n💾 Guardando JSON del proyecto...');
        console.log('  📊 Resumen del JSON:');
        console.log('    - ID:', projectData.id);
        console.log('    - Título:', projectData.title);
        console.log('    - ganttImagePath:', projectData.ganttImagePath || 'ninguno');
        console.log('    - Imágenes:', projectData.images?.length || 0);
        console.log('    - Videos:', projectData.videos?.length || 0);
        
        const result = await this.api.saveProject(userId, projectId, projectData);

        if (result.success) {
            // Construye la "ficha" que usa el Home (ajusta campos según tu UI)
            const meta = {
                id: projectData.id,
                ownerId: projectData.ownerId,
                title: projectData.title,
                status: projectData.status,
                progress: projectData.progress ?? 0,
                icon: projectData.icon || '📋',
                updatedAt: Date.now()
            };

            try {
                await this.upsertProjectInIndex(meta);
                console.log('✅ Índice data/projects.json actualizado');
            } catch (e) {
                console.warn('⚠️ No se pudo actualizar el índice:', e?.message);
            }

            console.log('\n╔════════════════════════════════════════╗');
            console.log('║  ✅✅✅ PROYECTO GUARDADO EXITOSAMENTE ✅✅✅  ║');
            console.log('╚════════════════════════════════════════╝\n');

            // (Opcional) Notificar al Home para refrescar sin recargar
            try { window.electronAPI?.notify?.('dataReloaded'); } catch {}

            return true;
        } else {
            console.error('\n╔════════════════════════════════════════╗');
            console.error('║  ❌ ERROR GUARDANDO JSON DEL PROYECTO  ║');
            console.error('╚════════════════════════════════════════╝');
            console.error('Error:', result.error);
            return false;
        }

    } catch (error) {
        console.error('\n╔════════════════════════════════════════╗');
        console.error('║  ❌❌❌ ERROR CRÍTICO EN SAVEPROJECT ❌❌❌  ║');
        console.error('╚════════════════════════════════════════╝');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}


// =============== 2. MÉTODO saveGantt (líneas ~155-166) ===============

async saveGantt(userId, projectId, base64Data) {
    console.log('\n  🖼️ [saveGantt] Iniciando guardado de Gantt...');
    console.log('    - userId:', userId);
    console.log('    - projectId:', projectId);
    console.log('    - base64Data tipo:', typeof base64Data);
    console.log('    - base64Data longitud:', base64Data?.length || 0);
    
    // ✅ Validar que base64Data sea válido
    if (!base64Data || typeof base64Data !== 'string') {
        const error = new Error('❌ Gantt data is invalid (not a string or empty)');
        console.error('  ' + error.message);
        throw error;
    }
    
    if (!base64Data.startsWith('data:')) {
        const error = new Error('❌ Gantt data is not a valid data URI (does not start with "data:")');
        console.error('  ' + error.message);
        console.error('    Received:', base64Data.substring(0, 100));
        throw error;
    }

    const fileName = `gantt_${Date.now()}.png`;
    const filePath = `users/${userId}/projects/${projectId}/gantt/${fileName}`;
    
    console.log('    - Guardando en:', filePath);
    console.log('    - Tamaño aproximado:', Math.round(base64Data.length / 1024), 'KB');

    try {
        const result = await this.api.saveMedia(filePath, base64Data);

        console.log('    - Resultado de saveMedia:', {
            success: result.success,
            error: result.error || 'ninguno'
        });

        if (result.success) {
            console.log('  ✅ [saveGantt] Gantt guardado exitosamente');
            console.log('    Path final:', filePath);
            return filePath;
        } else {
            const error = new Error(`Error en saveMedia: ${result.error}`);
            console.error('  ❌ [saveGantt]', error.message);
            throw error;
        }
    } catch (error) {
        console.error('  ❌ [saveGantt] Error crítico:', error.message);
        throw error;
    }
}


// =============== 3. MÉTODO saveImages (líneas ~180-209) ===============

async saveImages(userId, projectId, images) {
    const savedImages = [];

    console.log(`\n  📸 [saveImages] Iniciando guardado de ${images.length} imágenes...`);

    for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`\n  [Imagen ${i + 1}/${images.length}]`);
        console.log('    - Título:', image.title || 'Sin título');
        console.log('    - hasSrc:', !!image.src);
        console.log('    - hasData:', !!image.data);
        
        if (image.src) {
            const srcType = image.src.startsWith('data:') ? 'base64' : 
                           image.src.startsWith('users/') ? 'path' : 'unknown';
            console.log('    - srcType:', srcType);
            console.log('    - srcPreview:', image.src.substring(0, 60) + '...');
        }

        // Si la imagen ya tiene una ruta guardada (no base64), mantenerla
        if (image.src && !image.src.startsWith('data:')) {
            console.log('    ✅ Ya guardada, manteniendo path');
            savedImages.push(image);
            continue;
        }

        // Nueva imagen con src en base64
        if (image.src && image.src.startsWith('data:')) {
            console.log('    💾 Guardando imagen con src base64...');
            const ext = this.getExtensionFromMimeType(image.fileType || image.mimeType || 'image/png');
            const fileName = `image_${Date.now()}_${i}.${ext}`;
            const filePath = `users/${userId}/projects/${projectId}/images/${fileName}`;
            console.log('    - Path destino:', filePath);

            try {
                const result = await this.api.saveMedia(filePath, image.src);

                if (result.success) {
                    console.log('    ✅ Imagen guardada exitosamente');
                    savedImages.push({
                        src: filePath,
                        title: image.title || `Imagen ${i + 1}`
                    });
                } else {
                    console.error('    ❌ Error:', result.error);
                }
            } catch (error) {
                console.error('    ❌ Error crítico:', error.message);
            }
        }
        
        // Nueva imagen con data en base64 (formato antiguo)
        else if (image.data) {
            console.log('    💾 Guardando imagen con data base64...');
            const ext = this.getExtensionFromMimeType(image.fileType || image.mimeType || 'image/png');
            const fileName = `image_${Date.now()}_${i}.${ext}`;
            const filePath = `users/${userId}/projects/${projectId}/images/${fileName}`;
            console.log('    - Path destino:', filePath);

            try {
                const result = await this.api.saveMedia(filePath, image.data);

                if (result.success) {
                    console.log('    ✅ Imagen guardada exitosamente');
                    savedImages.push({
                        src: filePath,
                        title: image.title || `Imagen ${i + 1}`
                    });
                } else {
                    console.error('    ❌ Error:', result.error);
                }
            } catch (error) {
                console.error('    ❌ Error crítico:', error.message);
            }
        } else {
            console.warn('    ⚠️ Imagen sin src ni data, omitiendo');
        }
    }

    console.log(`\n  ✅ [saveImages] Total guardadas: ${savedImages.length}/${images.length}`);
    return savedImages;
}


// =============== 4. MÉTODO saveVideos (líneas ~236-265) ===============

async saveVideos(userId, projectId, videos) {
    const savedVideos = [];

    console.log(`\n  🎥 [saveVideos] Iniciando guardado de ${videos.length} videos...`);

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        console.log(`\n  [Video ${i + 1}/${videos.length}]`);
        console.log('    - Título:', video.title || 'Sin título');
        console.log('    - hasSrc:', !!video.src);
        console.log('    - hasData:', !!video.data);

        // Si el video ya tiene una ruta guardada, mantenerla
        if (video.src && !video.src.startsWith('data:')) {
            console.log('    ✅ Ya guardado, manteniendo path');
            savedVideos.push(video);
            continue;
        }

        // Nuevo video con src en base64
        if (video.src && video.src.startsWith('data:')) {
            console.log('    💾 Guardando video con src base64...');
            const ext = this.getExtensionFromMimeType(video.fileType || video.mimeType || 'video/mp4');
            const fileName = `video_${Date.now()}_${i}.${ext}`;
            const filePath = `users/${userId}/projects/${projectId}/videos/${fileName}`;
            console.log('    - Path destino:', filePath);

            try {
                const result = await this.api.saveMedia(filePath, video.src);

                if (result.success) {
                    console.log('    ✅ Video guardado exitosamente');
                    savedVideos.push({
                        src: filePath,
                        title: video.title || `Video ${i + 1}`
                    });
                } else {
                    console.error('    ❌ Error:', result.error);
                }
            } catch (error) {
                console.error('    ❌ Error crítico:', error.message);
            }
        }
        
        // Nuevo video con data en base64 (formato antiguo)
        else if (video.data) {
            console.log('    💾 Guardando video con data base64...');
            const ext = this.getExtensionFromMimeType(video.fileType || video.mimeType || 'video/mp4');
            const fileName = `video_${Date.now()}_${i}.${ext}`;
            const filePath = `users/${userId}/projects/${projectId}/videos/${fileName}`;
            console.log('    - Path destino:', filePath);

            try {
                const result = await this.api.saveMedia(filePath, video.data);

                if (result.success) {
                    console.log('    ✅ Video guardado exitosamente');
                    savedVideos.push({
                        src: filePath,
                        title: video.title || `Video ${i + 1}`
                    });
                } else {
                    console.error('    ❌ Error:', result.error);
                }
            } catch (error) {
                console.error('    ❌ Error crítico:', error.message);
            }
        } else {
            console.warn('    ⚠️ Video sin src ni data, omitiendo');
        }
    }

    console.log(`\n  ✅ [saveVideos] Total guardados: ${savedVideos.length}/${videos.length}`);
    return savedVideos;
}

    async loadProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return null;
        }

        try {
            console.log(`ðŸ“‚ Cargando proyecto ${projectId}...`);

            // 1. Cargar JSON del proyecto
            const result = await this.api.loadProject(userId, projectId);

            if (!result.success) {
                console.error('âŒ Error cargando proyecto:', result.error);
                return null;
            }

            const projectData = result.data;

            // 2. Cargar imagen Gantt si existe
            if (projectData.ganttImagePath) {
                projectData.ganttImage = await this.loadGantt(userId, projectId, projectData.ganttImagePath);
            }

            // 3. Cargar imagenes
            if (projectData.images && projectData.images.length > 0) {
                projectData.images = await this.loadImages(userId, projectId, projectData.images);
            }

            // 4. Cargar videos
            if (projectData.videos && projectData.videos.length > 0) {
                projectData.videos = await this.loadVideos(userId, projectId, projectData.videos);
            }

            console.log(`âœ… Proyecto ${projectId} cargado correctamente`);
            return projectData;

        } catch (error) {
            console.error('âŒ Error en loadProject:', error);
            return null;
        }
    }

    async deleteProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return false;
        }

        try {
            console.log(`ðŸ—‘ï¸ Eliminando proyecto ${projectId}...`);
            const result = await this.api.deleteProject(userId, projectId);

            if (result.success) {
                console.log(`âœ… Proyecto ${projectId} eliminado correctamente`);
                return true;
            } else {
                console.error('âŒ Error eliminando proyecto:', result.error);
                return false;
            }
        } catch (error) {
            console.error('âŒ Error en deleteProject:', error);
            return false;
        }
    }

    async listProjectsByUser(userId) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return [];
        }

        try {
            const result = await this.api.listProjectsByUser(userId);
            if (result.success) {
                return result.projects;
            }
            return [];
        } catch (error) {
            console.error('âŒ Error listando proyectos:', error);
            return [];
        }
    }

    // ==================== GANTT OPERATIONS ====================

    async saveGantt(userId, projectId, base64Data) {
        console.log('💾 saveGantt llamado con:', {
            userId,
            projectId,
            dataType: typeof base64Data,
            dataLength: base64Data?.length,
            dataPreview: base64Data?.substring(0, 50)
        });
        
        const fileName = `gantt_${Date.now()}.png`;
        const filePath = `users/${userId}/projects/${projectId}/gantt/${fileName}`;
        
        console.log('📁 Ruta del archivo:', filePath);

        const result = await this.api.saveMedia(filePath, base64Data);
        
        console.log('📊 Resultado de saveMedia:', result);

        if (result.success) {
            console.log('✅ Gantt guardado exitosamente');
            return filePath;
        }

        console.error('❌ saveMedia falló:', result.error);
        throw new Error(`Error guardando Gantt: ${result.error || 'Unknown error'}`);
    }

    async loadGantt(userId, projectId, filePath) {
        const result = await this.api.readMedia(filePath);

        if (result.success) {
            return result.data;
        }

        return null;
    }

    // ==================== IMAGE OPERATIONS ====================

    async saveImages(userId, projectId, images) {
        const savedImages = [];

        for (let i = 0; i < images.length; i++) {
            const image = images[i];

            // Si la imagen ya tiene una ruta guardada, mantenerla
            if (image.src && !image.src.startsWith('data:')) {
                savedImages.push(image);
                continue;
            }

            // Nueva imagen (base64)
            if (image.data) {
                const fileName = `image_${Date.now()}_${i}.${this.getExtensionFromMimeType(image.mimeType)}`;
                const filePath = `users/${userId}/projects/${projectId}/images/${fileName}`;

                const result = await this.api.saveMedia(filePath, image.data);

                if (result.success) {
                    savedImages.push({
                        src: filePath,
                        title: image.title || `Imagen ${i + 1}`
                    });
                }
            }
        }

        return savedImages;
    }

    async loadImages(userId, projectId, images) {
        const loadedImages = [];

        for (const image of images) {
            if (image.src) {
                const result = await this.api.readMedia(image.src);

                if (result.success) {
                    loadedImages.push({
                        src: result.data,
                        title: image.title,
                        path: image.src
                    });
                } else {
                    // Si falla al cargar, usar la ruta original
                    loadedImages.push(image);
                }
            }
        }

        return loadedImages;
    }

    // ==================== VIDEO OPERATIONS ====================

    async saveVideos(userId, projectId, videos) {
        const savedVideos = [];

        for (let i = 0; i < videos.length; i++) {
            const video = videos[i];

            // Si el video ya tiene una ruta guardada, mantenerla
            if (video.src && !video.src.startsWith('data:')) {
                savedVideos.push(video);
                continue;
            }

            // Nuevo video (base64)
            if (video.data) {
                const fileName = `video_${Date.now()}_${i}.${this.getExtensionFromMimeType(video.mimeType)}`;
                const filePath = `users/${userId}/projects/${projectId}/videos/${fileName}`;

                const result = await this.api.saveMedia(filePath, video.data);

                if (result.success) {
                    savedVideos.push({
                        src: filePath,
                        title: video.title || `Video ${i + 1}`
                    });
                }
            }
        }

        return savedVideos;
    }

    async loadVideos(userId, projectId, videos) {
        const loadedVideos = [];

        for (const video of videos) {
            if (video.src) {
                // Para videos, solo retornamos la ruta (el video tag los cargarÃƒÂ¡ directamente)
                loadedVideos.push({
                    src: video.src,
                    title: video.title
                });
            }
        }

        return loadedVideos;
    }

    // ==================== HELPERS ====================

    getExtensionFromMimeType(mimeType) {
        const mimeMap = {
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/mov': 'mov'
        };

        return mimeMap[mimeType] || 'png';
    }

    // ==================== FILE DIALOG ====================

    async openFile(filters = []) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return null;
        }

        try {
            const result = await this.api.openFileDialog({ filters });

            if (result.success && !result.canceled) {
                return {
                    path: result.path,
                    fileName: result.fileName,
                    data: result.data,
                    mimeType: result.mimeType
                };
            }

            return null;
        } catch (error) {
            console.error('âŒ Error abriendo archivo:', error);
            return null;
        }
    }

    // ==================== USER & DATA OPERATIONS ====================

    async loadUsers() {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return [];
        }

        try {
            console.log('ðŸ“– Cargando usuarios desde data/users.json...');
            const result = await this.api.readJSON('data/users.json');
            
            if (result.success) {
                const users = result.data.users || [];
                console.log(`âœ… ${users.length} usuarios cargados desde archivo`);
                return users;
            } else {
                console.error('âŒ Error leyendo users.json:', result.error);
                return [];
            }
        } catch (error) {
            console.error('âŒ Error cargando usuarios:', error);
            return [];
        }
    }

    async saveUsers(users) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('data/users.json', { users });
            return result.success;
        } catch (error) {
            console.error('âŒ Error guardando usuarios:', error);
            return false;
        }
    }

    async loadConfig() {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return {};
        }

        try {
            console.log('ðŸ“– Cargando configuracion desde config.json...');
            const result = await this.api.readJSON('config.json');
            
            if (result.success) {
                console.log('âœ… Configuracion cargada');
                return result.data;
            } else {
                console.error('âŒ Error leyendo config.json:', result.error);
                return {};
            }
        } catch (error) {
            console.error('âŒ Error cargando config:', error);
            return {};
        }
    }

    async saveConfig(config) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('config.json', config);
            return result.success;
        } catch (error) {
            console.error('âŒ Error guardando config:', error);
            return false;
        }
    }

    async loadProjectsIndex() {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return { projects: [], stats: {} };
        }

        try {
            console.log('ðŸ“– Cargando indice de proyectos desde data/projects-index.json...');
            const result = await this.api.readJSON('data/projects-index.json');
            
            if (result.success) {
                console.log(`âœ… ${result.data.projects?.length || 0} proyectos en indice`);
                return result.data;
            } else {
                console.error('âŒ Error leyendo projects-index.json:', result.error);
                return { projects: [], stats: {} };
            }
        } catch (error) {
            console.error('âŒ Error cargando projects-index:', error);
            return { projects: [], stats: {} };
        }
    }

    async saveProjectsIndex(indexData) {
        if (!this.isElectron) {
            console.error('âŒ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('data/projects-index.json', indexData);
            return result.success;
        } catch (error) {
            console.error('âŒ Error guardando projects-index:', error);
            return false;
        }
    }

// file-manager.js -> loadAllProjects()
async loadAllProjects() {
  if (!this.isElectron) return [];

  try {
    // Si no existe, crÃ©alo vacÃ­o
    const exist = await this.api.fileExists('data/projects.json');
    if (!exist.exists) {
      await this.api.writeJSON('data/projects.json', { projects: [] });
    }

    console.log('ðŸ"– Cargando proyectos desde data/projects.json...');
    const result = await this.api.readJSON('data/projects.json');
    if (result.success) {
      const projects = result.data.projects || [];
      console.log(`âœ… ${projects.length} proyectos cargados desde archivo`);
      return projects;
    } else {
      console.error('âŒ Error leyendo projects.json:', result.error);
      return [];
    }
  } catch (error) {
    console.error('âŒ Error cargando proyectos:', error);
    return [];
  }
}

// Inserta/actualiza el índice data/projects.json
async upsertProjectInIndex(projectMeta) {
  // projectMeta: { id, ownerId, title, status, progress, icon, createdAt, updatedAt, ... }
  const INDEX_PATH = 'data/projects.json';

  // Asegurar archivo
  const exist = await this.api.fileExists(INDEX_PATH);
  if (!exist.exists) {
    await this.api.writeJSON(INDEX_PATH, { projects: [] });
  }

  // Leer índice
  const read = await this.api.readJSON(INDEX_PATH);
  let wrapper = read.success ? (read.data || {}) : {};
  let arr = Array.isArray(wrapper) ? wrapper : (wrapper.projects || []);

  // Normalizar: si el archivo era un array "puro", envuélvelo
  if (!Array.isArray(arr)) arr = [];
  // Upsert por id
  const i = arr.findIndex(p => p.id === projectMeta.id);
  if (i >= 0) {
    arr[i] = { ...arr[i], ...projectMeta };
  } else {
    arr.push(projectMeta);
  }

  // Escribir de vuelta con el wrapper { projects: [...] }
  await this.api.writeJSON(INDEX_PATH, { projects: arr });
}

}

// Instancia global
const fileManager = new FileManager();

console.log('âœ“ File Manager (Electron) cargado');
