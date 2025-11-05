// ============================================
// DATA MANAGER - Sistema de gestión de datos con archivos locales (Electron)
// ✅ VERSIÓN CORREGIDA - Con persistencia de sesión
// ============================================

class DataManager {
    constructor() {
        this.users = [];
        this.projects = [];
        this.config = {};
        this.currentUser = null;
        
        // ✅ Restaurar sesión al inicializar
        this.restoreSession();
    }

    // ============================================
    // 🔐 SESSION MANAGEMENT (NUEVO)
    // ============================================

    restoreSession() {
        const savedUser = sessionStorage.getItem('portfolioDX_currentUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('✅ Sesión restaurada:', this.currentUser.username);
            } catch (error) {
                console.error('❌ Error restaurando sesión:', error);
                sessionStorage.removeItem('portfolioDX_currentUser');
            }
        }
    }

    saveSession() {
        if (this.currentUser) {
            sessionStorage.setItem('portfolioDX_currentUser', JSON.stringify(this.currentUser));
            console.log('💾 Sesión guardada');
        }
    }

    clearSession() {
        this.currentUser = null;
        sessionStorage.removeItem('portfolioDX_currentUser');
        console.log('🗑️ Sesión limpiada');
    }

    // ======= COMPAT: Home.js / Viewer.js esperan estos helpers =======

    // Login "simple" usado por home.js
    validateCredentials(username, password) {
        const user = this.users.find(u => u.username === username && u.password === password);
        return user || null;
    }

    setCurrentUser(user) {
        this.currentUser = user;
        this.saveSession(); // ✅ Guardar en sessionStorage
        console.log(`✅ Usuario actual: ${user?.name || user?.id}`);
    }

    // Lista de proyectos por usuario (usado por viewer.js)
    getProjectsByUserId(userId) {
        return this.projects.filter(p => p.ownerId === userId);
    }

    // Si no lo tienes, deja también este helper:
    getProjectById(projectId) {
        return this.projects.find(p => p.id === projectId) || null;
    }

    // Carga "proyecto completo" desde /users/<ownerId>/projects/<id>/project.json
    async loadFullProject(projectId) {
        const indexProj = this.getProjectById(projectId);
        if (!indexProj) return null;

        try {
            const full = await fileManager.loadProject(indexProj.ownerId, projectId);
            if (!full) return indexProj; // fallback

            // Normaliza alias del gantt
            if (!full.ganttImage && full.ganttImagePath) full.ganttImage = full.ganttImagePath;

            // Mezcla datos del índice (status/progress/etc.) con el JSON completo (media, descripciones…)
            return { ...indexProj, ...full };
        } catch (e) {
            console.warn('⚠️ loadFullProject: usando índice por fallback', e?.message);
            return indexProj;
        }
    }

    // ==================== LOAD DATA ====================

    async loadAllData() {
        try {
            await Promise.all([
                this.loadUsers(),
                this.loadProjects(),
                this.loadConfig()
            ]);
            console.log('✅ Todos los datos cargados correctamente');
            
            // ✅ Restaurar sesión después de cargar datos
            this.restoreSession();
            
            return true;
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            return false;
        }
    }

    async loadUsers() {
        try {
            const users = await fileManager.loadUsers();
            this.users = users;
            console.log(`✅ ${this.users.length} usuarios cargados`);
            return this.users;
        } catch (error) {
            console.error('❌ Error cargando usuarios:', error);
            this.users = [];
            return [];
        }
    }

    async loadProjects() {
        try {
            // Cargar proyectos completos desde data/projects.json
            const projects = await fileManager.loadAllProjects();
            this.projects = projects;
            console.log(`✅ ${this.projects.length} proyectos cargados`);
            return this.projects;
        } catch (error) {
            console.error('❌ Error cargando proyectos:', error);
            this.projects = [];
            return [];
        }
    }

    async loadConfig() {
        try {
            const config = await fileManager.loadConfig();
            this.config = config;
            console.log('✅ Configuración cargada');
            return this.config;
        } catch (error) {
            console.error('❌ Error cargando config:', error);
            this.config = this.getDefaultConfig();
            return this.config;
        }
    }

    getDefaultConfig() {
        return {
            appName: "Portfolio DX",
            version: "1.0.0",
            theme: "system"
        };
    }

    getStatusConfig(status) {
        if (this.config.projectStatuses && this.config.projectStatuses[status]) {
            return this.config.projectStatuses[status];
        }
        // Fallback si no existe el config
        return {
            label: status,
            badge: status,
            badgeClass: `badge-${status}`,
            color: '#666',
            icon: '◯'
        };
    }

    getPriorityConfig(priority) {
        if (this.config.priorities && this.config.priorities[priority]) {
            return this.config.priorities[priority];
        }
        // Fallback
        return {
            label: priority,
            badge: priority,
            badgeClass: `badge-priority-${priority}`,
            color: '#666'
        };
    }

    getBlockerConfig(type) {
        if (this.config.blockerTypes && this.config.blockerTypes[type]) {
            return this.config.blockerTypes[type];
        }
        // Fallback
        return {
            label: type,
            icon: '⚠️'
        };
    }

    // ==================== USER MANAGEMENT ====================

    async login(username, password) {
        const user = this.users.find(u => 
            u.username === username && u.password === password
        );

        if (user) {
            this.currentUser = user;
            this.saveSession(); // ✅ Guardar sesión
            console.log(`✅ Usuario ${username} ha iniciado sesión`);
            return { success: true, user };
        }

        console.log(`❌ Login fallido para ${username}`);
        return { success: false, message: 'Usuario o contraseña incorrectos' };
    }

    logout() {
        this.clearSession(); // ✅ Limpiar sesión
        console.log('✅ Sesión cerrada');
    }

    isLoggedIn() {
        // ✅ Verificar también sessionStorage
        if (this.currentUser) {
            return true;
        }
        
        // Intentar restaurar sesión
        this.restoreSession();
        return this.currentUser !== null;
    }

    getCurrentUser() {
        // ✅ Restaurar de sessionStorage si es necesario
        if (!this.currentUser) {
            this.restoreSession();
        }
        return this.currentUser;
    }

    async addUser(userData) {
        const newUser = {
            id: userData.username,
            username: userData.username,
            password: userData.password,
            name: userData.name,
            role: userData.role || 'DX Member',
            email: userData.email,
            avatar: userData.avatar || null,
            createdAt: new Date().toISOString()
        };

        this.users.push(newUser);
        await fileManager.saveUsers(this.users);

        // Crear directorio del usuario
        await fileManager.api.createUserDir(newUser.id);

        console.log(`✅ Usuario ${newUser.username} agregado`);
        return newUser;
    }

    async updateUser(userId, updates) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.users[userIndex], ...updates };
            await fileManager.saveUsers(this.users);
            
            // ✅ Si se actualiza el usuario actual, actualizar sesión
            if (this.currentUser && this.currentUser.id === userId) {
                this.currentUser = this.users[userIndex];
                this.saveSession();
            }
            
            console.log(`✅ Usuario ${userId} actualizado`);
            return this.users[userIndex];
        }

        return null;
    }

    async deleteUser(userId) {
        const userIndex = this.users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            this.users.splice(userIndex, 1);
            await fileManager.saveUsers(this.users);
            
            // ✅ Si se elimina el usuario actual, cerrar sesión
            if (this.currentUser && this.currentUser.id === userId) {
                this.logout();
            }
            
            console.log(`✅ Usuario ${userId} eliminado`);
            return true;
        }

        return false;
    }

    getUserById(userId) {
        return this.users.find(u => u.id === userId);
    }

    // ==================== PROJECT MANAGEMENT ====================

    async createProject(projectData) {
        if (!this.currentUser) {
            console.error('❌ No hay usuario loggeado');
            return null;
        }

        const newProject = {
            id: `proj${Date.now()}`,
            ownerId: this.currentUser.id,
            title: projectData.title || 'Nuevo Proyecto',
            icon: projectData.icon || '📋',
            status: projectData.status || 'discovery',
            priority: projectData.priority || 'medium',
            progress: projectData.progress || 0,
            targetDate: projectData.targetDate || '',
            currentPhase: projectData.currentPhase || '',
            achievements: projectData.achievements || {},
            blockers: projectData.blockers || { type: 'info', message: 'Sin bloqueos' },
            nextSteps: projectData.nextSteps || {},
            ganttImage: projectData.ganttImage || '',
            videos: projectData.videos || [],
            images: projectData.images || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Guardar proyecto en archivo
        const saved = await fileManager.saveProject(this.currentUser.id, newProject);

        if (saved) {
            this.projects.push(newProject);
            await this.updateProjectsIndex();
            console.log(`✅ Proyecto ${newProject.id} creado`);
            return newProject;
        }

        console.error('❌ Error guardando proyecto');
        return null;
    }

    async updateProject(projectId, updates) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        
        if (projectIndex !== -1) {
            const project = this.projects[projectIndex];
            
            // Verificar permisos
            if (this.currentUser && project.ownerId !== this.currentUser.id) {
                console.error('❌ Sin permisos para editar este proyecto');
                return null;
            }

            // Actualizar datos
            this.projects[projectIndex] = {
                ...project,
                ...updates,
                updatedAt: new Date().toISOString()
            };

            // Guardar en archivo
            const saved = await fileManager.saveProject(
                project.ownerId,
                this.projects[projectIndex]
            );

            if (saved) {
                await this.updateProjectsIndex();
                console.log(`✅ Proyecto ${projectId} actualizado`);
                return this.projects[projectIndex];
            }
        }

        return null;
    }

    async deleteProject(projectId) {
        const projectIndex = this.projects.findIndex(p => p.id === projectId);
        
        if (projectIndex !== -1) {
            const project = this.projects[projectIndex];
            
            // Verificar permisos
            if (this.currentUser && project.ownerId !== this.currentUser.id) {
                console.error('❌ Sin permisos para eliminar este proyecto');
                return false;
            }

            // Eliminar archivo
            const deleted = await fileManager.deleteProject(project.ownerId, projectId);

            if (deleted) {
                this.projects.splice(projectIndex, 1);
                await this.updateProjectsIndex();
                console.log(`✅ Proyecto ${projectId} eliminado`);
                return true;
            }
        }

        return false;
    }

    getProjectsByUser(userId) {
        return this.projects.filter(p => p.ownerId === userId);
    }

    // Lista los proyectos del usuario actual (o de un userId explícito)
    getMyProjects(userId) {
      const uid = userId || this.getCurrentUser()?.id;
      if (!uid) return [];
      return (this.projects || []).filter(p => p.ownerId === uid);
    }

    getProjectsByStatus(status) {
        return this.projects.filter(p => p.status === status);
    }

    getProjectsByPriority(priority) {
        return this.projects.filter(p => p.priority === priority);
    }

    getAllProjects() {
        return this.projects;
    }

    // ✅ Método para verificar permisos de edición
    canEditProject(projectId) {
        const project = this.getProjectById(projectId);
        if (!project) return false;
        if (!this.currentUser) return false;
        return project.ownerId === this.currentUser.id;
    }

    // ==================== SEARCH & FILTER ====================

    searchProjects(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.projects.filter(p => {
            return (
                p.title.toLowerCase().includes(lowerQuery) ||
                p.currentPhase.toLowerCase().includes(lowerQuery) ||
                p.status.toLowerCase().includes(lowerQuery) ||
                Object.values(p.achievements || {}).some(a => 
                    a.toLowerCase().includes(lowerQuery)
                ) ||
                Object.values(p.nextSteps || {}).some(n => 
                    n.toLowerCase().includes(lowerQuery)
                )
            );
        });
    }

    searchUsers(query) {
        const lowerQuery = query.toLowerCase();
        
        return this.users.filter(u => {
            return (
                u.name.toLowerCase().includes(lowerQuery) ||
                u.username.toLowerCase().includes(lowerQuery) ||
                u.role.toLowerCase().includes(lowerQuery) ||
                u.email.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // ==================== STATS ====================

    getStats() {
        const stats = {
            totalProjects: this.projects.length,
            inProgress: this.projects.filter(p => p.status === 'in-progress').length,
            discovery: this.projects.filter(p => p.status === 'discovery').length,
            hold: this.projects.filter(p => p.status === 'hold').length,
            completed: this.projects.filter(p => p.status === 'completed').length,
            paused: this.projects.filter(p => p.status === 'paused').length,
            totalUsers: this.users.length,
            avgProgress: this.projects.length > 0 
                ? Math.round(this.projects.reduce((sum, p) => sum + p.progress, 0) / this.projects.length)
                : 0
        };

        return stats;
    }

    getUserStats(userId) {
        const userProjects = this.getProjectsByUser(userId);
        const stats = {
            totalProjects: userProjects.length,
            avgProgress: userProjects.length > 0 
                ? Math.round(userProjects.reduce((sum, p) => sum + p.progress, 0) / userProjects.length)
                : 0
        };
        return stats;
    }

    // ==================== PROJECTS INDEX ====================

    async updateProjectsIndex() {
        const indexData = {
            projects: this.projects.map(p => ({
                id: p.id,
                title: p.title,
                ownerId: p.ownerId,
                ownerName: this.getUserById(p.ownerId)?.name || 'Unknown',
                status: p.status,
                priority: p.priority,
                progress: p.progress,
                icon: p.icon,
                updatedAt: p.updatedAt
            })),
            stats: this.getStats(),
            lastUpdated: new Date().toISOString()
        };

        await fileManager.saveProjectsIndex(indexData);
    }

    // ==================== INITIALIZATION ====================

    async initialize() {
        console.log('🚀 Inicializando DataManager (Electron)...');
        
        const success = await this.loadAllData();
        
        if (success) {
            console.log('✅ DataManager inicializado correctamente');
            console.log(`📊 ${this.projects.length} proyectos disponibles`);
            console.log(`👥 ${this.users.length} usuarios registrados`);
            console.log('💾 Almacenamiento: local - Depende del espacio en disco');
            
            // ✅ Mostrar estado de sesión
            if (this.currentUser) {
                console.log(`👤 Sesión activa: ${this.currentUser.username}`);
            } else {
                console.log('🔓 Sin sesión activa');
            }
            
            return true;
        } else {
            console.error('❌ Error inicializando DataManager');
            return false;
        }
    }
}

// Instancia global
const dataManager = new DataManager();

console.log('✅ Data Manager (Electron) cargado con persistencia de sesión');
