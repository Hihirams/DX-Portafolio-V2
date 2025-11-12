// ============================================
// FILE MANAGER - Sistema de gestion de archivos local (Electron)
// ============================================

class FileManager {
    constructor() {
        this.api = window.electronAPI;
        this.isElectron = typeof window.electronAPI !== 'undefined';
        
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible. Esta aplicacion requiere Electron.');
        } else {
            console.log('Ã¢Å“â€¦ Electron API disponible');
        }
    }

    // ==================== PROJECT OPERATIONS ====================

    async saveProject(userId, projectData) {
    if (!this.isElectron) {
        console.error('âŒ Electron API no disponible');
        return false;
    }

    try {
        const projectId = projectData.id;
        console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
        console.log(`â•‘  ðŸ’¾ GUARDANDO PROYECTO ${projectId.substring(0, 15)}...  â•‘`);
        console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        console.log(`ðŸ‘¤ Usuario: ${userId}`);

        // 1. Crear estructura de directorios si no existe
        console.log('ðŸ“ Creando directorios...');
        const dirResult = await this.api.createProjectDir(userId, projectId);

        // Mostrar debug info del main process si estÃ¡ disponible
        if (dirResult.debug) {
            console.log('\nðŸ“‹ DEBUG INFO DEL MAIN PROCESS:');
            console.log('â”€'.repeat(80));
            console.log('PROJECT_ROOT:', dirResult.debug.PROJECT_ROOT);
            console.log('USERS_DIR:', dirResult.debug.USERS_DIR);
            console.log('userId:', dirResult.debug.userId);
            console.log('projectId:', dirResult.debug.projectId);
            console.log('â”€'.repeat(80));
        }

        if (!dirResult.success) {
            console.error('âŒ Error creando directorios:', dirResult.error);
            if (dirResult.code) {
                console.error('   Error Code:', dirResult.code);
            }
            if (dirResult.debug) {
                console.error('   Debug Info:', JSON.stringify(dirResult.debug, null, 2));
            }
            return false;
        }
        console.log('  âœ… Directorios creados');

 // ✅ 2. Procesar y guardar Gantt (CON DETECCIÓN DE PATH EXISTENTE)
        if (projectData.ganttImage) {
            console.log('\n📊️ Procesando Gantt...');
            
            // ✅ Verificar si ya está guardado (tiene originalGanttPath o es un path)
            const isExistingPath = (projectData.originalGanttPath && projectData.originalGanttPath.startsWith('users/')) ||
                                   (typeof projectData.ganttImage === 'string' && projectData.ganttImage.startsWith('users/'));
            
            if (isExistingPath) {
                // Ya guardado - usar el path existente
                const existingPath = projectData.originalGanttPath || projectData.ganttImage;
                console.log('  ✅ Gantt ya existe en:', existingPath);
                projectData.ganttImagePath = existingPath;
                delete projectData.ganttImage;
                delete projectData.originalGanttPath; // Limpiar campo temporal
                console.log('  ✅ Usando Gantt existente (no duplicado)');
            } else if (projectData.ganttImage.startsWith('data:')) {
                // Nuevo Gantt en Base64 - guardarlo
                console.log('  📋 Nuevo Gantt detectado (Base64)');
                console.log('    - Tipo:', typeof projectData.ganttImage);
                console.log('    - Longitud:', projectData.ganttImage.length);
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
                    delete projectData.ganttImage;
                    console.warn('  ⚠️ Continuando sin Gantt...');
                }
            } else {
                console.warn('  ⚠️ ganttImage no es Base64 ni path válido');
                delete projectData.ganttImage;
            }
        } else {
            console.log('\n❌ No hay Gantt para guardar (ganttImage vacío o undefined)');
        }


        // âœ… 3. Procesar y guardar imÃ¡genes (CON MEJOR DEBUG)
        if (projectData.images && projectData.images.length > 0) {
            console.log(`\nðŸ“¸ Procesando ${projectData.images.length} imÃ¡genes...`);
            
            try {
                const imagePaths = await this.saveImages(userId, projectId, projectData.images);
                console.log(`  âœ… ${imagePaths.length}/${projectData.images.length} imÃ¡genes guardadas`);
                projectData.images = imagePaths;
            } catch (imgError) {
                console.error('  âŒ ERROR guardando imÃ¡genes:', imgError.message);
                console.error('  Stack:', imgError.stack);
                // Mantener las imÃ¡genes que sÃ­ se guardaron (si las hay)
                console.warn('  âš ï¸ Continuando con las imÃ¡genes guardadas hasta ahora...');
            }
        } else {
            console.log('\nâ„¹ï¸ No hay imÃ¡genes para guardar');
        }

        // âœ… 4. Procesar y guardar videos (CON MEJOR DEBUG)
        if (projectData.videos && projectData.videos.length > 0) {
            console.log(`\nðŸŽ¥ Procesando ${projectData.videos.length} videos...`);
            
            try {
                const videoPaths = await this.saveVideos(userId, projectId, projectData.videos);
                console.log(`  âœ… ${videoPaths.length}/${projectData.videos.length} videos guardados`);
                projectData.videos = videoPaths;
            } catch (vidError) {
                console.error('  âŒ ERROR guardando videos:', vidError.message);
                console.error('  Stack:', vidError.stack);
                // Mantener los videos que sÃ­ se guardaron
                console.warn('  âš ï¸ Continuando con los videos guardados hasta ahora...');
            }
        } else {
            console.log('\nâ„¹ï¸ No hay videos para guardar');
        }

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

        // 5. Guardar JSON del proyecto (ligero, sin base64)
        console.log('\nðŸ’¾ Guardando JSON del proyecto...');
        console.log('  ðŸ“Š Resumen del JSON:');
        console.log('    - ID:', projectData.id);
        console.log('    - TÃ­tulo:', projectData.title);
        console.log('    - ganttImagePath:', projectData.ganttImagePath || 'ninguno');
        console.log('    - ImÃ¡genes:', projectData.images?.length || 0);
        console.log('    - Videos:', projectData.videos?.length || 0);
        
        const result = await this.api.saveProject(userId, projectId, projectData);

        if (result.success) {
            // Construye la "ficha" que usa el Home (ajusta campos segÃºn tu UI)
            const meta = {
                id: projectData.id,
                ownerId: projectData.ownerId,
                title: projectData.title,
                status: projectData.status,
                progress: projectData.progress ?? 0,
                icon: projectData.icon || 'ðŸ“‹',
                currentPhase: projectData.currentPhase || '',  // ✅ AGREGADO: currentPhase
                updatedAt: Date.now()
            };

            try {
                await this.upsertProjectInIndex(meta);
                console.log('âœ… Ãndice data/projects.json actualizado');
            } catch (e) {
                console.warn('âš ï¸ No se pudo actualizar el Ã­ndice:', e?.message);
            }

            console.log('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
            console.log('â•‘  âœ…âœ…âœ… PROYECTO GUARDADO EXITOSAMENTE âœ…âœ…âœ…  â•‘');
            console.log('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•\n');

            // (Opcional) Notificar al Home para refrescar sin recargar
            try { window.electronAPI?.notify?.('dataReloaded'); } catch {}

            return true;
        } else {
            console.error('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
            console.error('â•‘  âŒ ERROR GUARDANDO JSON DEL PROYECTO  â•‘');
            console.error('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            console.error('Error:', result.error);
            return false;
        }

    } catch (error) {
        console.error('\nâ•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—');
        console.error('â•‘  âŒâŒâŒ ERROR CRÃTICO EN SAVEPROJECT âŒâŒâŒ  â•‘');
        console.error('â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        return false;
    }
}


// =============== 2. MÃ‰TODO saveImages ===============

async saveImages(userId, projectId, images) {
  const savedImages = [];
  console.log(`\n  ðŸ“¸ [saveImages] Iniciando guardado de ${images.length} imÃ¡genes...`);

  for (let i = 0; i < images.length; i++) {
    const raw = images[i];
    const image = (typeof raw === 'string') ? { src: raw, title: `Imagen ${i+1}` } : raw;

// ✅ Verificar PRIMERO originalPath (significa que ya está guardado)
    const hasPath = (typeof image.originalPath === 'string' && image.originalPath.startsWith('users/')) ||
                    (typeof image.src === 'string' && image.src.startsWith('users/'));
    const hasBase64Src = typeof image.src === 'string' && image.src.startsWith('data:');
    const hasBase64Data = typeof image.data === 'string' && image.data.startsWith('data:');

    if (hasPath) {
      // Ya guardada - usar originalPath o src
      const existingPath = image.originalPath || image.src;
      console.log(`    ✅ Imagen ${i+1}: Ya existe en ${existingPath}`);
      savedImages.push({ 
        src: existingPath, 
        title: image.title || `Imagen ${i+1}` 
      });
      continue;
    }

    const base64 = hasBase64Src ? image.src : (hasBase64Data ? image.data : null);
    if (!base64) {
      console.warn('    âš ï¸ Imagen sin datos vÃ¡lidos, omitiendo');
      continue;
    }

    const ext = this.getExtensionFromMimeType(image.fileType || image.mimeType || 'image/png');
    const fileName = `image_${Date.now()}_${i}.${ext}`;
    const filePath = `users/${userId}/projects/${projectId}/images/${fileName}`;

    try {
      const result = await this.api.saveMedia(filePath, base64);
      if (result.success) {
        savedImages.push({ src: filePath, title: image.title || `Imagen ${i+1}` });
      } else {
        console.error('    âŒ Error guardando imagen:', result.error);
      }
    } catch (e) {
      console.error('    âŒ Error crÃ­tico guardando imagen:', e.message);
    }
  }

  console.log(`\n  âœ… [saveImages] Total guardadas: ${savedImages.length}/${images.length}`);
  return savedImages;
}


// =============== 3. MÃ‰TODO saveVideos ===============

async saveVideos(userId, projectId, videos) {
  const savedVideos = [];
  console.log(`\n  ðŸŽ¥ [saveVideos] Iniciando guardado de ${videos.length} videos...`);

  for (let i = 0; i < videos.length; i++) {
    const raw = videos[i];
    const video = (typeof raw === 'string') ? { src: raw, title: `Video ${i+1}` } : raw;

    // ✅ Verificar PRIMERO originalPath (significa que ya está guardado)
    const hasPath = (typeof video.originalPath === 'string' && video.originalPath.startsWith('users/')) ||
                    (typeof video.src === 'string' && video.src.startsWith('users/'));
    const hasBase64Src = typeof video.src === 'string' && video.src.startsWith('data:');
    const hasBase64Data = typeof video.data === 'string' && video.data.startsWith('data:');

    if (hasPath) {
      // Ya guardado - usar originalPath o src
      const existingPath = video.originalPath || video.src;
      console.log(`    ✅ Video ${i+1}: Ya existe en ${existingPath}`);
      savedVideos.push({ 
        src: existingPath, 
        title: video.title || `Video ${i+1}` 
      });
      continue;
    }

    const base64 = hasBase64Src ? video.src : (hasBase64Data ? video.data : null);
    if (!base64) {
      console.warn('    âš ï¸ Video sin datos vÃ¡lidos, omitiendo');
      continue;
    }

    const ext = this.getExtensionFromMimeType(video.fileType || video.mimeType || 'video/mp4');
    const fileName = `video_${Date.now()}_${i}.${ext}`;
    const filePath = `users/${userId}/projects/${projectId}/videos/${fileName}`;

    try {
      const result = await this.api.saveMedia(filePath, base64);
      if (result.success) {
        savedVideos.push({ src: filePath, title: video.title || `Video ${i+1}` });
      } else {
        console.error('    âŒ Error guardando video:', result.error);
      }
    } catch (e) {
      console.error('    âŒ Error crÃ­tico guardando video:', e.message);
    }
  }

  console.log(`\n  âœ… [saveVideos] Total guardados: ${savedVideos.length}/${videos.length}`);
  return savedVideos;
}

    async loadProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return null;
        }

        try {
            console.log(`Ã°Å¸â€œâ€š Cargando proyecto ${projectId}...`);

            // 1. Cargar JSON del proyecto
            const result = await this.api.loadProject(userId, projectId);

            if (!result.success) {
                console.error('Ã¢ÂÅ’ Error cargando proyecto:', result.error);
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

            console.log(`Ã¢Å“â€¦ Proyecto ${projectId} cargado correctamente`);
            return projectData;

        } catch (error) {
            console.error('Ã¢ÂÅ’ Error en loadProject:', error);
            return null;
        }
    }

    async deleteProject(userId, projectId) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return false;
        }

        try {
            console.log(`Ã°Å¸â€”â€˜Ã¯Â¸Â Eliminando proyecto ${projectId}...`);
            const result = await this.api.deleteProject(userId, projectId);

            if (result.success) {
                console.log(`Ã¢Å“â€¦ Proyecto ${projectId} eliminado correctamente`);
                return true;
            } else {
                console.error('Ã¢ÂÅ’ Error eliminando proyecto:', result.error);
                return false;
            }
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error en deleteProject:', error);
            return false;
        }
    }

    async listProjectsByUser(userId) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return [];
        }

        try {
            const result = await this.api.listProjectsByUser(userId);
            if (result.success) {
                return result.projects;
            }
            return [];
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error listando proyectos:', error);
            return [];
        }
    }

    // ==================== GANTT OPERATIONS ====================

    async saveGantt(userId, projectId, base64Data) {
        console.log('ðŸ’¾ saveGantt llamado con:', {
            userId,
            projectId,
            dataType: typeof base64Data,
            dataLength: base64Data?.length,
            dataPreview: base64Data?.substring(0, 50)
        });
        
        const fileName = `gantt_${Date.now()}.png`;
        const filePath = `users/${userId}/projects/${projectId}/gantt/${fileName}`;
        
        console.log('ðŸ“ Ruta del archivo:', filePath);

        const result = await this.api.saveMedia(filePath, base64Data);
        
        console.log('ðŸ“Š Resultado de saveMedia:', result);

        if (result.success) {
            console.log('âœ… Gantt guardado exitosamente');
            return filePath;
        }

        console.error('âŒ saveMedia fallÃ³:', result.error);
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

    async loadVideos(userId, projectId, videos) {
        const loadedVideos = [];

        for (const video of videos) {
            if (video.src) {
                // Para videos, solo retornamos la ruta (el video tag los cargarÃƒÆ’Ã‚Â¡ directamente)
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
            // Imágenes
            'image/png': 'png',
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/gif': 'gif',
            'image/webp': 'webp',
            // Videos
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/mov': 'mov',
            'video/quicktime': 'mov',
            'video/x-msvideo': 'avi',
            // Documentos
            'application/pdf': 'pdf',
            'application/msword': 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
            'text/plain': 'txt',
            // Hojas de cálculo
            'application/vnd.ms-excel': 'xls',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
            'text/csv': 'csv',
            // Presentaciones
            'application/vnd.ms-powerpoint': 'ppt',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
            // Comprimidos
            'application/zip': 'zip',
            'application/x-rar-compressed': 'rar',
            'application/x-7z-compressed': '7z',
            // Código
            'text/javascript': 'js',
            'application/json': 'json',
            'text/html': 'html',
            'text/css': 'css',
            'text/xml': 'xml',
            // Otros
            'application/octet-stream': 'bin'
        };

        return mimeMap[mimeType] || 'bin';
    }

    // ==================== FILE DIALOG ====================

    async openFile(filters = []) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
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
            console.error('Ã¢ÂÅ’ Error abriendo archivo:', error);
            return null;
        }
    }

    // ==================== USER & DATA OPERATIONS ====================

    async loadUsers() {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return [];
        }

        try {
            console.log('Ã°Å¸â€œâ€“ Cargando usuarios desde data/users.json...');
            const result = await this.api.readJSON('data/users.json');
            
            if (result.success) {
                const users = result.data.users || [];
                console.log(`Ã¢Å“â€¦ ${users.length} usuarios cargados desde archivo`);
                return users;
            } else {
                console.error('Ã¢ÂÅ’ Error leyendo users.json:', result.error);
                return [];
            }
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error cargando usuarios:', error);
            return [];
        }
    }

    async saveUsers(users) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('data/users.json', { users });
            return result.success;
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error guardando usuarios:', error);
            return false;
        }
    }

    async loadConfig() {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return {};
        }

        try {
            console.log('Ã°Å¸â€œâ€“ Cargando configuracion desde config.json...');
            const result = await this.api.readJSON('config.json');
            
            if (result.success) {
                console.log('Ã¢Å“â€¦ Configuracion cargada');
                return result.data;
            } else {
                console.error('Ã¢ÂÅ’ Error leyendo config.json:', result.error);
                return {};
            }
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error cargando config:', error);
            return {};
        }
    }

    async saveConfig(config) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('config.json', config);
            return result.success;
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error guardando config:', error);
            return false;
        }
    }

    async loadProjectsIndex() {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return { projects: [], stats: {} };
        }

        try {
            console.log('Ã°Å¸â€œâ€“ Cargando indice de proyectos desde data/projects-index.json...');
            const result = await this.api.readJSON('data/projects-index.json');
            
            if (result.success) {
                console.log(`Ã¢Å“â€¦ ${result.data.projects?.length || 0} proyectos en indice`);
                return result.data;
            } else {
                console.error('Ã¢ÂÅ’ Error leyendo projects-index.json:', result.error);
                return { projects: [], stats: {} };
            }
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error cargando projects-index:', error);
            return { projects: [], stats: {} };
        }
    }

    async saveProjectsIndex(indexData) {
        if (!this.isElectron) {
            console.error('Ã¢ÂÅ’ Electron API no disponible');
            return false;
        }

        try {
            const result = await this.api.writeJSON('data/projects-index.json', indexData);
            return result.success;
        } catch (error) {
            console.error('Ã¢ÂÅ’ Error guardando projects-index:', error);
            return false;
        }
    }

// file-manager.js -> loadAllProjects()
async loadAllProjects() {
  if (!this.isElectron) return [];

  try {
    // Si no existe, crÃƒÂ©alo vacÃƒÂ­o
    const exist = await this.api.fileExists('data/projects.json');
    if (!exist.exists) {
      await this.api.writeJSON('data/projects.json', { projects: [] });
    }

    console.log('Ã°Å¸"â€“ Cargando proyectos desde data/projects.json...');
    const result = await this.api.readJSON('data/projects.json');
    if (result.success) {
      const projects = result.data.projects || [];
      console.log(`Ã¢Å“â€¦ ${projects.length} proyectos cargados desde archivo`);
      return projects;
    } else {
      console.error('Ã¢ÂÅ’ Error leyendo projects.json:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Ã¢ÂÅ’ Error cargando proyectos:', error);
    return [];
  }
}

// Inserta/actualiza el Ã­ndice data/projects.json
async upsertProjectInIndex(projectMeta) {
  // projectMeta: { id, ownerId, title, status, progress, icon, createdAt, updatedAt, ... }
  const INDEX_PATH = 'data/projects.json';

  // Asegurar archivo
  const exist = await this.api.fileExists(INDEX_PATH);
  if (!exist.exists) {
    await this.api.writeJSON(INDEX_PATH, { projects: [] });
  }

  // Leer Ã­ndice
  const read = await this.api.readJSON(INDEX_PATH);
  let wrapper = read.success ? (read.data || {}) : {};
  let arr = Array.isArray(wrapper) ? wrapper : (wrapper.projects || []);

  // Normalizar: si el archivo era un array "puro", envuÃ©lvelo
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

async saveExtraFiles(userId, projectId, extraFiles) {
  const savedFiles = [];
  console.log(`\n  📎 [saveExtraFiles] Iniciando guardado de ${extraFiles.length} archivos...`);

  for (let i = 0; i < extraFiles.length; i++) {
    const raw = extraFiles[i];
    const file = (typeof raw === 'string') ? { src: raw, title: `Archivo ${i+1}` } : raw;

// ✅ Verificar PRIMERO originalPath (significa que ya está guardado)
    const hasPath = (typeof file.originalPath === 'string' && file.originalPath.startsWith('users/')) ||
                    (typeof file.src === 'string' && file.src.startsWith('users/'));
    const hasBase64Src = typeof file.src === 'string' && file.src.startsWith('data:');
    const hasBase64Data = typeof file.data === 'string' && file.data.startsWith('data:');

    if (hasPath) {
      // Ya guardado físicamente - usar originalPath o src
      const existingPath = file.originalPath || file.src;
      console.log(`    ✅ Archivo ${i+1}: Ya existe en ${existingPath}`);
      savedFiles.push({
        src: existingPath,  // ✅ Usar el path original
        title: file.title || file.fileName || `Archivo ${i+1}`,
        fileName: file.fileName || 'file',
        fileType: file.fileType || 'application/octet-stream',
        fileSize: file.fileSize || 0,
        extension: file.extension || ''
      });
      continue;
    }

    // Nuevo archivo - guardarlo físicamente
    const base64 = hasBase64Src ? file.src : (hasBase64Data ? file.data : null);

    if (!base64) {
      console.warn(`    ⚠️ Archivo ${i+1}: Sin datos base64 válidos`);
      continue;
    }

    // Determinar extensión del archivo
    let extension = file.extension || '';
    if (!extension && file.fileName) {
      extension = file.fileName.split('.').pop() || 'bin';
    }
    if (!extension) {
      extension = this.getExtensionFromMimeType(file.fileType || 'application/octet-stream');
    }

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const safeTitle = (file.fileName || file.title || `archivo-${i+1}`)
      .replace(/\.[^/.]+$/, '') // Quitar extensión si existe
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .substring(0, 30);
    const fileName = `${safeTitle}_${timestamp}.${extension}`;
    
    // Construir path relativo
    const filePath = `users/${userId}/projects/${projectId}/extra-files/${fileName}`;

    console.log(`    📎 Guardando archivo ${i+1}/${extraFiles.length}: ${fileName}`);

    try {
      // ✅ USAR saveMedia (igual que images y videos)
      const result = await this.api.saveMedia(filePath, base64);
      
      if (result.success) {
        console.log(`       ✅ Guardado en: ${filePath}`);
        
        savedFiles.push({
          src: filePath,
          title: file.title || file.fileName || `Archivo ${i+1}`,
          fileName: fileName,
          fileType: file.fileType || 'application/octet-stream',
          fileSize: file.fileSize || 0,
          extension: extension
        });
      } else {
        console.error(`       ❌ Error guardando: ${result.error}`);
      }

    } catch (err) {
      console.error(`    ❌ Archivo ${i+1}: Error`, err.message);
    }
  }

  console.log(`  📎 Total guardados: ${savedFiles.length}/${extraFiles.length}`);
  return savedFiles;
}

}

// Instancia global
const fileManager = new FileManager();

console.log('Ã¢Å“â€œ File Manager (Electron) cargado');