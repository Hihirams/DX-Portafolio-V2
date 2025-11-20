// Inicializacion de datos - Carga proyectos desde data/projects.json o carpetas users
console.log('Verificando estructura de datos...');

async function initializeData() {
    try {
        // CRÍTICO: Esperar a que el filesystem esté listo
        await new Promise(resolve => setTimeout(resolve, 100));
        
        console.log('🔍 VERIFICANDO: data/users.json...');
        
        // 1. Verificar si users.json existe
        const usersExist = await window.electronAPI.fileExists('data/users.json');
        console.log('📄 users.json existe?', usersExist.exists);
        
        if (!usersExist.exists) {
            console.log('⚠️ users.json NO existe, creando estructura inicial...');
            await createInitialStructure();
        } else {
            console.log('✅ users.json ya existe, saltando creación inicial');
        }

        console.log('🔍 VERIFICANDO: data/projects.json...');
        
        // 2. Intentar cargar proyectos desde data/projects.json
        const projectsExist = await window.electronAPI.fileExists('data/projects.json');
        console.log('📄 projects.json existe?', projectsExist.exists);
        
        if (projectsExist.exists) {
            // Verificar si el archivo tiene proyectos
            const projectsData = await window.electronAPI.readJSON('data/projects.json');
            console.log('📊 Contenido de projects.json:', projectsData);
            
            if (projectsData.success && projectsData.data && projectsData.data.projects && projectsData.data.projects.length > 0) {
                console.log(`✅ Usando ${projectsData.data.projects.length} proyectos de data/projects.json`);
            } else {
                console.log('⚠️ projects.json existe pero está vacío, escaneando carpetas...');
                await loadProjectsFromUserFolders();
            }
        } else {
            console.log('⚠️ projects.json NO existe, escaneando carpetas...');
            await loadProjectsFromUserFolders();
        }

        console.log('✅ Estructura de datos inicializada correctamente');
        
        // 3. Recargar datos en dataManager
        console.log('🔄 Recargando datos en dataManager...');
        await dataManager.loadAllData();

        // 📢 Notificar que ya hay datos listos (Home, Viewer, Editor escuchan esto)
        document.dispatchEvent(new Event('dataLoaded'));

        
        return true;
    } catch (error) {
        console.error('❌ Error inicializando datos:', error);
        return false;
    }
}

async function createInitialStructure() {
    // Crear users.json con usuarios de ejemplo
    const initialUsers = {
        users: [
            {
                id: "hiram.gonzalez",
                username: "hiram.gonzalez",
                password: "demo123",
                name: "Hiram Gonzalez",
                role: "DX Engineer",
                email: "hiram@dx.com",
                avatar: null,
                createdAt: new Date().toISOString()
            },
            {
                id: "sandra.santos",
                username: "sandra.santos",
                password: "demo123",
                name: "Sandra Santos",
                role: "DX Lead",
                email: "sandra@dx.com",
                avatar: null,
                createdAt: new Date().toISOString()
            },
            {
                id: "miguel.coronado",
                username: "miguel.coronado",
                password: "demo123",
                name: "Miguel Coronado",
                role: "DX Developer",
                email: "miguel@dx.com",
                avatar: null,
                createdAt: new Date().toISOString()
            },
            {
                id: "brayan.rocha",
                username: "brayan.rocha",
                password: "demo123",
                name: "Brayan Rocha",
                role: "DX Analyst",
                email: "brayan@dx.com",
                avatar: null,
                createdAt: new Date().toISOString()
            }
        ]
    };

    await window.electronAPI.writeJSON('data/users.json', initialUsers);
    console.log('users.json creado');

    // Recargar usuarios
    console.log('Recargando usuarios...');
    await dataManager.loadUsers();

    // Crear config.json SOLO si no existe
    const configExists = await window.electronAPI.fileExists('config.json');
    
    if (!configExists.exists) {
        const initialConfig = {
            appName: "Portafolio DX",
            version: "1.0.0",
            projectStatuses: {
                "discovery": {
                    label: "Discovery",
                    badge: "Discovery",
                    badgeClass: "badge-discovery",
                    color: "#9D00FF",
                    icon: "🔍"
                },
                "decision": {
                    label: "Decision",
                    badge: "Decision",
                    badgeClass: "badge-decision",
                    color: "#00D9FF",
                    icon: "✓"
                },
                "develop": {
                    label: "Develop",
                    badge: "Develop",
                    badgeClass: "badge-develop",
                    color: "#FF6B00",
                    icon: "⚙"
                },
                "pilot": {
                    label: "Pilot",
                    badge: "Pilot",
                    badgeClass: "badge-pilot",
                    color: "#FFD600",
                    icon: "🚀"
                },
                "yoko-tenkai": {
                    label: "Yoko Tenkai",
                    badge: "Yoko Tenkai",
                    badgeClass: "badge-yoko-tenkai",
                    color: "#00FF85",
                    icon: "✓"
                }
            },
            priorities: {
                "high": {
                    label: "Alta",
                    badge: "Alta Prioridad",
                    badgeClass: "badge-priority-high",
                    color: "#FF0000"
                },
                "medium": {
                    label: "Media",
                    badge: "Prioridad Media",
                    badgeClass: "badge-priority-medium",
                    color: "#FFA500"
                },
                "low": {
                    label: "Baja",
                    badge: "Baja Prioridad",
                    badgeClass: "badge-priority-low",
                    color: "#00FF00"
                }
            },
            blockerTypes: {
                "technical": {
                    label: "Técnico",
                    icon: "⚙️"
                },
                "resources": {
                    label: "Recursos",
                    icon: "👥"
                },
                "dependencies": {
                    label: "Dependencias",
                    icon: "🔗"
                },
                "approval": {
                    label: "Aprobación",
                    icon: "✋"
                }
            },
            theme: "system",
            lastUpdated: new Date().toISOString()
        };

        await window.electronAPI.writeJSON('config.json', initialConfig);
        console.log('config.json creado');
    }

    // Recargar config
    console.log('Recargando config...');
    await dataManager.loadConfig();
}

async function loadProjectsFromUserFolders() {
    try {
        const allProjects = [];
        
        // Verificar si existe la carpeta users/
        const usersExist = await window.electronAPI.fileExists('users');
        
        if (!usersExist.exists) {
            console.log('No existe carpeta users/, NO se creará projects.json vacío');
            // NO sobrescribir si ya existe projects.json
            return;
        }

        // Listar directorios de usuarios
        const usersResult = await window.electronAPI.listDir('users');
        
        if (!usersResult.success || !usersResult.files || usersResult.files.length === 0) {
            console.log('Carpeta users/ esta vacia');
            // NO sobrescribir si ya existe projects.json
            return;
        }

        console.log('Usuarios encontrados:', usersResult.files);

        // Para cada usuario
        for (const userId of usersResult.files) {
            // Skip archivos ocultos o especiales
            if (userId.startsWith('.') || userId === 'README_ESTRUCTURA.md' || userId === 'EXAMPLE_project.json') {
                continue;
            }

            // Verificar si tiene carpeta projects/
            const projectsFolderPath = `users/${userId}/projects`;
            const projectsExist = await window.electronAPI.fileExists(projectsFolderPath);
            
            if (!projectsExist.exists) {
                console.log(`  Usuario ${userId} no tiene carpeta projects/`);
                continue;
            }

            // Listar proyectos del usuario
            const projectsResult = await window.electronAPI.listDir(projectsFolderPath);
            
            if (!projectsResult.success || !projectsResult.files || projectsResult.files.length === 0) {
                console.log(`  Usuario ${userId} no tiene proyectos`);
                continue;
            }

            console.log(`  Proyectos de ${userId}:`, projectsResult.files);

            // Para cada proyecto
            for (const projectId of projectsResult.files) {
                // Skip archivos ocultos
                if (projectId.startsWith('.')) {
                    continue;
                }

                try {
                    // Leer project.json
                    const projectJsonPath = `users/${userId}/projects/${projectId}/project.json`;
                    const projectData = await window.electronAPI.readJSON(projectJsonPath);

                    if (projectData.success && projectData.data) {
                        const p = projectData.data;
                        const baseDir = `users/${userId}/projects/${projectId}`;

                        // Auto-hidratar imágenes si no existen en JSON
                        if (!Array.isArray(p.images) || p.images.length === 0) {
                            try {
                                const imgs = await window.electronAPI.listDir(`${baseDir}/images`);
                                const imageFiles = (imgs.files || []).filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f));
                                p.images = imageFiles.map(fn => ({
                                    src: `${baseDir}/images/${fn}`,
                                    title: fn.replace(/\.[^.]+$/, '')
                                }));
                                console.log(`    Auto-hidratadas ${imageFiles.length} imágenes para ${p.title}`);
                            } catch (error) {
                                console.log(`    No se pudieron hidratar imágenes para ${p.title}:`, error.message);
                            }
                        }

                        // Auto-hidratar videos si no existen en JSON
                        if (!Array.isArray(p.videos) || p.videos.length === 0) {
                            try {
                                const vids = await window.electronAPI.listDir(`${baseDir}/videos`);
                                const videoFiles = (vids.files || []).filter(f => /\.(mp4|webm|mov)$/i.test(f));
                                p.videos = videoFiles.map(fn => ({
                                    src: `${baseDir}/videos/${fn}`,
                                    title: fn.replace(/\.[^.]+$/, '')
                                }));
                                console.log(`    Auto-hidratados ${videoFiles.length} videos para ${p.title}`);
                            } catch (error) {
                                console.log(`    No se pudieron hidratar videos para ${p.title}:`, error.message);
                            }
                        }

                        // Auto-hidratar ganttImage si no existe en JSON
                        if (!(p.ganttImage || p.ganttImagePath)) {
                            try {
                                const gantt = await window.electronAPI.listDir(`${baseDir}/gantt`);
                                const ganttFiles = (gantt.files || []).filter(f => /\.(png|jpe?g|gif|webp)$/i.test(f));
                                if (ganttFiles[0]) {
                                    p.ganttImage = `${baseDir}/gantt/${ganttFiles[0]}`;
                                    console.log(`    Auto-hidratada ganttImage para ${p.title}`);
                                }
                            } catch (error) {
                                console.log(`    No se pudo hidratar ganttImage para ${p.title}:`, error.message);
                            }
                        }

                        console.log(`    Proyecto cargado: ${p.title}`);
                        allProjects.push(p);
                    } else {
                        console.log(`    No se pudo leer project.json de ${projectId}`);
                    }
                } catch (error) {
                    console.error(`    Error cargando proyecto ${projectId}:`, error);
                }
            }
        }

        // Guardar todos los proyectos en data/projects.json SOLO si se encontraron proyectos
        if (allProjects.length > 0) {
            const projectsData = { projects: allProjects };
            await window.electronAPI.writeJSON('data/projects.json', projectsData);
            console.log(`Total de proyectos encontrados: ${allProjects.length}`);

            // Crear indice de proyectos
            const indexData = {
                projects: allProjects.map(p => ({
                    id: p.id,
                    title: p.title,
                    ownerId: p.ownerId,
                    status: p.status,
                    priority: p.priority,
                    priorityOrder: p.priorityOrder || 999,
                    progress: p.progress,
                    icon: p.icon,
                    updatedAt: p.updatedAt
                })),
                stats: {
                    total: allProjects.length,
                    discovery: allProjects.filter(p => p.status === 'discovery').length,
                    decision: allProjects.filter(p => p.status === 'decision').length,
                    develop: allProjects.filter(p => p.status === 'develop').length,
                    pilot: allProjects.filter(p => p.status === 'pilot').length,
                    yokoTenkai: allProjects.filter(p => p.status === 'yoko-tenkai').length
                },
                lastUpdated: new Date().toISOString()
            };

            await window.electronAPI.writeJSON('data/projects-index.json', indexData);
            console.log('Indice de proyectos actualizado');
        } else {
            console.log('No se encontraron proyectos en carpetas users/');
        }

    } catch (error) {
        console.error('Error escaneando carpetas de usuarios:', error);
    }
}

// Auto-inicializar cuando el DOM este listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await initializeData();
        if (typeof initHome === 'function') {
            initHome();
        }
    });
} else {
    initializeData().then(() => {
        if (typeof initHome === 'function') {
            initHome();
        }
    });
}

console.log('Init Data (FINAL) cargado');