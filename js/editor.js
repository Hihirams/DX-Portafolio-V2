// ============================================
// EDITOR.JS - Lógica del Editor de Portafolios
// ============================================

let currentProject = null;
let editorMode = 'edit'; // 'new' or 'edit'
let hasUnsavedChanges = false;
let deletedExtraFiles = []; // ✅ NUEVO: Rastrear archivos eliminados

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Datos cargados, inicializando Editor...');
    initEditor();
});

function initEditor() {
    console.log('📋 Verificando sesión...');
    console.log('dataManager disponible:', typeof dataManager !== 'undefined');
    console.log('Usuario actual:', dataManager?.currentUser);
    
    // Verificar que el usuario esté loggeado
    if (!dataManager || !dataManager.isLoggedIn()) {
        console.error('❌ No hay sesión activa');
        alert('You must log in to access the editor');
        window.location.href = 'index.html';
        return;
    }

    console.log('✅ Sesión verificada:', dataManager.getCurrentUser());

    // Determinar el modo del editor
    editorMode = localStorage.getItem('editorMode') || 'edit';
    const projectId = localStorage.getItem('editingProjectId');

    console.log('📋 Modo del editor:', editorMode);
    console.log('📋 Project ID:', projectId);

    if (editorMode === 'new') {
        // Modo: Nuevo Proyecto
        console.log('📋 Modo: Nuevo Proyecto');
        createNewProject();
    } else if (editorMode === 'edit' && projectId) {
        // Modo: Editar Proyecto Existente
        console.log('✏️ Modo: Editar Proyecto', projectId);
        loadProject(projectId);
    } else {
        console.error('❌ No se especificó un proyecto válido');
        alert('No project was specified to edit');
        window.location.href = 'index.html';
        return;
    }

    // Setup event listeners
    setupEventListeners();
    
    // Cargar tema guardado
    loadTheme();
    
    // Limpiar localStorage
    localStorage.removeItem('editorMode');
    localStorage.removeItem('editingProjectId');
}

// ==================== NEW PROJECT ====================

function createNewProject() {
    const user = dataManager.getCurrentUser();
    
    if (!user) {
        console.error('❌ No se pudo obtener el usuario actual');
        alert('Error: Invalid user');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('📋 Creando proyecto para usuario:', user.id);
    
    currentProject = {
        id: `proj${Date.now()}`, // ID temporal
        ownerId: user.id,
        title: 'New Project',
        icon: '📋',
        status: 'discovery',
        priority: 'medium',
        progress: 0,
        targetDate: new Date().toISOString().split('T')[0],
        currentPhase: '',
        achievements: {},
        blockers: {
            type: 'info',
            message: ''
        },
        nextSteps: {},
        ganttImage: '',
        videos: [],
        images: [],
        extraFiles: [],
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };

    console.log('✅ Proyecto nuevo creado:', currentProject);
    console.log('📋 ganttImage al crear:', {
        value: currentProject.ganttImage,
        type: typeof currentProject.ganttImage,
        isNull: currentProject.ganttImage === null
    });
    loadProjectData();
    updateEditorTitle('New Project');
}

// ==================== LOAD PROJECT ====================

async function loadProject(projectId) {
    console.log(`📁 Cargando proyecto ${projectId}...`);

    // 1. Intentar obtener el proyecto completo desde el DataManager
    let project = await dataManager.loadFullProject(projectId);

    // 2. Si no lo encuentra completo, usar el índice básico
    if (!project) {
        console.warn("⚠️ Proyecto completo no encontrado, usando índice.");
        project = dataManager.getProjectById(projectId);
    }

    if (!project) {
        alert('❌ Project not found.');
        window.location.href = 'index.html';
        return;
    }

    // 3. Verificar que el usuario pueda editar este proyecto
    if (!dataManager.canEditProject(projectId)) {
        alert('You do not have permission to edit this project');
        window.location.href = 'index.html';
        return;
    }

    // 4. Normalizar y asegurar campos mínimos
    currentProject = JSON.parse(JSON.stringify(project));

if (!currentProject.images) currentProject.images = [];
    if (!currentProject.videos) currentProject.videos = [];
    
    // ✅ CORREGIDO: Preservar originalGanttPath para evitar duplicación
    // ✅ CORREGIDO: NO copiar path a ganttImage - evita error de carga
    if (currentProject.ganttImagePath && currentProject.ganttImagePath.startsWith('users/')) {
        // Preservar el path original para indicar que ya está guardado
        currentProject.originalGanttPath = currentProject.ganttImagePath;
        // NO copiar el path a ganttImage - se cargará dinámicamente
        // currentProject.ganttImage = '';  // Comentado: loadGantt() lo manejará
    } else if (!currentProject.ganttImage && currentProject.ganttImagePath) {
        // Si ganttImagePath no es un path válido, limpiar
        currentProject.originalGanttPath = null;
    }


 // 5. Normalizar rutas: PRESERVAR originalPath para evitar duplicación
    currentProject.images = currentProject.images.map(img => {
        const srcPath = img.src || img.path || '';
        return {
            src: srcPath,
            originalPath: srcPath.startsWith('users/') ? srcPath : null, // ✅ Preservar path original
            title: img.title || img.fileName || 'Imagen',
            fileName: img.fileName || '',
            fileType: img.fileType || 'image/png',
            fileSize: img.fileSize || 0
        };
    });

    currentProject.videos = currentProject.videos.map(v => {
        const srcPath = v.src || v.path || '';
        return {
            src: srcPath,
            originalPath: srcPath.startsWith('users/') ? srcPath : null, // ✅ Preservar path original
            title: v.title || v.fileName || 'Video',
            fileName: v.fileName || '',
            fileType: v.fileType || 'video/mp4',
            fileSize: v.fileSize || 0
        };
    });

    // ✅ NUEVO: Hacer lo mismo para extraFiles
    if (currentProject.extraFiles && Array.isArray(currentProject.extraFiles)) {
        currentProject.extraFiles = currentProject.extraFiles.map(f => {
            const srcPath = f.src || f.path || '';
            return {
                src: srcPath,
                originalPath: srcPath.startsWith('users/') ? srcPath : null, // ✅ Preservar path original
                title: f.title || f.fileName || 'Archivo',
                fileName: f.fileName || '',
                fileType: f.fileType || 'application/octet-stream',
                fileSize: f.fileSize || 0,
                extension: f.extension || ''
            };
        });
    }

    // 6. Cargar en formulario
    loadProjectData();
    updateEditorTitle(currentProject.title);

    console.log("✅ Proyecto cargado correctamente:", currentProject.title);
}


// ==================== LOAD PROJECT DATA INTO FORM ====================

function loadProjectData() {
    // Información Básica
    document.getElementById('projectIcon').value = currentProject.icon || '';
    document.getElementById('projectTitle').value = currentProject.title || '';
    document.getElementById('projectConcept').value = currentProject.concept || '';
    document.getElementById('currentPhase').value = currentProject.currentPhase || '';
    document.getElementById('projectStatus').value = currentProject.status || 'discovery';
    document.getElementById('projectPriority').value = currentProject.priority || 'medium';

    // Progreso y Fechas
    document.getElementById('projectProgress').value = currentProject.progress || 0;
    document.getElementById('targetDate').value = currentProject.targetDate || '';
    updateProgressDisplay();

    // Logros
    loadAchievements();

    // Bloqueos
    document.getElementById('blockerType').value = currentProject.blockers?.type || 'info';
    document.getElementById('blockerMessage').value = currentProject.blockers?.message || '';

    // Próximos Pasos
    loadNextSteps();

    // Multimedia
    loadGantt();
    loadImages();
    loadVideos();
    loadExtraFiles();
}

// ==================== ACHIEVEMENTS ====================

function loadAchievements() {
    const container = document.getElementById('achievementsList');
    container.innerHTML = '';

    const achievements = currentProject.achievements || {};
    
    if (Object.keys(achievements).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No achievements added yet</p>';
        return;
    }

    Object.entries(achievements).forEach(([date, text]) => {
        container.appendChild(createAchievementItem(date, text));
    });
}

function createAchievementItem(date = '', text = '') {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    
    item.innerHTML = `
        <div class="dynamic-item-header">
            <span class="dynamic-item-title">Achievement</span>
            <button class="btn-remove-item" onclick="removeAchievementItem(this)">×</button>
        </div>
        <div class="form-group">
            <label>Date (YYYY-MM)</label>
            <input type="text" class="achievement-date" placeholder="2025-10" value="${date}" pattern="\\d{4}-\\d{2}">
        </div>
        <div class="form-group">
            <label>Achievement Description</label>
            <textarea class="achievement-text" rows="2" placeholder="Describe the achievement...">${text}</textarea>
        </div>
    `;
    
    return item;
}

function addAchievement() {
    const container = document.getElementById('achievementsList');
    
    // Remover mensaje de "no hay logros" si existe
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    container.appendChild(createAchievementItem());
    markAsUnsaved();
}

function removeAchievementItem(btn) {
    btn.closest('.dynamic-item').remove();
    markAsUnsaved();
    
    // Si no quedan items, mostrar mensaje
    const container = document.getElementById('achievementsList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No achievements added yet</p>';
    }
}

// ==================== NEXT STEPS ====================

function loadNextSteps() {
    const container = document.getElementById('nextStepsList');
    container.innerHTML = '';

    const nextSteps = currentProject.nextSteps || {};
    
    if (Object.keys(nextSteps).length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No next steps added</p>';
        return;
    }

    Object.entries(nextSteps).forEach(([date, text]) => {
        container.appendChild(createNextStepItem(date, text));
    });
}

function createNextStepItem(date = '', text = '') {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    
    item.innerHTML = `
        <div class="dynamic-item-header">
            <span class="dynamic-item-title">Next Step</span>
            <button class="btn-remove-item" onclick="removeNextStepItem(this)">×</button>
        </div>
        <div class="form-group">
            <label>Date (YYYY-MM)</label>
            <input type="text" class="nextstep-date" placeholder="2025-11" value="${date}" pattern="\\d{4}-\\d{2}">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="nextstep-text" rows="2" placeholder="Describe the next step...">${text}</textarea>
        </div>
    `;
    
    return item;
}

function addNextStep() {
    const container = document.getElementById('nextStepsList');
    
    // Remover mensaje si existe
    if (container.querySelector('p')) {
        container.innerHTML = '';
    }
    
    container.appendChild(createNextStepItem());
    markAsUnsaved();
}

function removeNextStepItem(btn) {
    btn.closest('.dynamic-item').remove();
    markAsUnsaved();
    
    // Si no quedan items, mostrar mensaje
    const container = document.getElementById('nextStepsList');
    if (container.children.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No next steps added</p>';
    }
}

// ==================== GANTT ====================

async function loadGantt() {
    const container = document.getElementById('ganttPreview');
    
    if (!container) {
        console.error('❌ Elemento ganttPreview no encontrado');
        return;
    }
    
    // ✅ CASO 1: Hay originalGanttPath = cargar desde filesystem
    if (currentProject.originalGanttPath && currentProject.originalGanttPath.startsWith('users/')) {
        try {
            const result = await window.electronAPI.readMedia(currentProject.originalGanttPath);
            if (result.success && result.data) {
                container.innerHTML = `
                    <div class="media-preview-item">
                        <img src="${result.data}" alt="Gantt">
                        <button class="btn-remove-media" onclick="removeGantt()">×</button>
                    </div>
                `;
                return;
            }
        } catch (e) {
            console.error('❌ Error cargando Gantt desde filesystem:', e.message);
        }
    }
    
    // ✅ CASO 2: Hay ganttImage en base64 (nuevo upload)
    if (currentProject.ganttImage && currentProject.ganttImage.startsWith('data:')) {
        container.innerHTML = `
            <div class="media-preview-item">
                <img src="${currentProject.ganttImage}" alt="Gantt">
                <button class="btn-remove-media" onclick="removeGantt()">×</button>
            </div>
        `;
    } else {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No Gantt chart loaded</p>';
    }
}

async function uploadGantt() {
    const file = await fileManager.openFile([
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }
    ]);

    if (file) {
        // ✅ NUEVO Gantt subido = reemplazar
        currentProject.ganttImage = file.data;
        delete currentProject.originalGanttPath; // Limpiar path anterior
        await loadGantt();
        markAsUnsaved();
    }
}


function removeGantt() {
    currentProject.ganttImage = '';
    delete currentProject.originalGanttPath; // Limpiar path anterior
    loadGantt();
    markAsUnsaved();
}


// ==================== IMAGES ====================

function loadImages() {
    const container = document.getElementById('imagesPreview');
    
    if (!container) {
        console.error('❌ Elemento imagesPreview no encontrado');
        return;
    }
    
    if (!currentProject.images || currentProject.images.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No images loaded</p>';
        return;
    }

    container.innerHTML = currentProject.images.map((img, index) => `
        <div class="media-preview-item">
            <img src="${img.src}" alt="${img.title}">
            <div class="media-info">
                <input type="text" class="media-title" value="${img.title}" 
                       onchange="updateImageTitle(${index}, this.value)">
            </div>
            <button class="btn-remove-media" onclick="removeImage(${index})">×</button>
        </div>
    `).join('');
}

async function uploadImages() {
    const file = await fileManager.openFile([
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }
    ]);

    if (file) {
        currentProject.images.push({
            src: file.data,
            title: file.fileName,
            fileName: file.fileName,
            fileType: file.mimeType,
            fileSize: 0
        });
        
        loadImages();
        markAsUnsaved();
    }
}

function updateImageTitle(index, newTitle) {
    if (currentProject.images[index]) {
        currentProject.images[index].title = newTitle;
        markAsUnsaved();
    }
}

function removeImage(index) {
    currentProject.images.splice(index, 1);
    loadImages();
    markAsUnsaved();
}

// ==================== VIDEOS ====================

function loadVideos() {
    const container = document.getElementById('videosPreview');
    
    if (!container) {
        console.error('❌ Elemento videosPreview no encontrado');
        return;
    }
    
    if (!currentProject.videos || currentProject.videos.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No videos loaded</p>';
        return;
    }

    container.innerHTML = currentProject.videos.map((video, index) => `
        <div class="media-preview-item">
            <video src="${video.src}" controls></video>
            <div class="media-info">
                <input type="text" class="media-title" value="${video.title}" 
                       onchange="updateVideoTitle(${index}, this.value)">
            </div>
            <button class="btn-remove-media" onclick="removeVideo(${index})">×</button>
        </div>
    `).join('');
}

async function uploadVideos() {
    const file = await fileManager.openFile([
        { name: 'Videos', extensions: ['mp4', 'webm', 'mov'] }
    ]);

    if (file) {
        currentProject.videos.push({
            src: file.data,
            title: file.fileName,
            fileName: file.fileName,
            fileType: file.mimeType,
            fileSize: 0
        });
        
        loadVideos();
        markAsUnsaved();
    }
}

function updateVideoTitle(index, newTitle) {
    if (currentProject.videos[index]) {
        currentProject.videos[index].title = newTitle;
        markAsUnsaved();
    }
}

function removeVideo(index) {
    currentProject.videos.splice(index, 1);
    loadVideos();
    markAsUnsaved();
}

function getFileIcon(fileName) {
    if (!fileName) return '📁';
    
const ext = fileName.split('.').pop().toLowerCase();
const icons = {
    // Documentos
    'pdf': '📄',
    'doc': '📁', 'docx': '📁',
    'txt': '📄',

    // Hojas de cálculo
    'xls': '📊', 'xlsx': '📊', 'csv': '📊',

    // Presentaciones
    'ppt': '📈', 'pptx': '📈',

    // Comprimidos
    'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️',

    // Imágenes
    'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',

    // Videos
    'mp4': '🎬', 'avi': '🎬', 'mov': '🎬', 'webm': '🎬',

    // Código
    'js': '💻', 'py': '💻', 'java': '💻', 'cpp': '💻', 'html': '💻', 'css': '💻'
};

    
    return icons[ext] || '📁';
}

function loadExtraFiles() {
    const container = document.getElementById('extraFilesPreview');
    
    if (!container) {
        console.error('❌ Elemento extraFilesPreview no encontrado');
        return;
    }
    
    // Normalizar extraFiles si no existe
    if (!currentProject.extraFiles) {
        currentProject.extraFiles = [];
    }
    
    // Asegurar que sea un array
    if (!Array.isArray(currentProject.extraFiles)) {
        currentProject.extraFiles = [];
    }
    
    if (currentProject.extraFiles.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No extra files loaded</p>';
        return;
    }

    container.innerHTML = currentProject.extraFiles.map((file, index) => {
        const icon = getFileIcon(file.fileName);
        const sizeInKB = file.fileSize ? (file.fileSize / 1024).toFixed(2) : '0';
        
        return `
            <div class="media-preview-item extra-file-item">
                <div class="file-icon">${icon}</div>
                <div class="media-info">
                    <input type="text" class="media-title" value="${file.title}" 
                           onchange="updateExtraFileTitle(${index}, this.value)">
                    <div class="file-meta">
                        <span class="file-name">${file.fileName}</span>
                        <span class="file-size">${sizeInKB} KB</span>
                    </div>
                </div>
                <button class="btn-remove-media" onclick="removeExtraFile(${index})">×</button>
            </div>
        `;
    }).join('');
}

async function uploadExtraFiles() {
    // No filtrar extensiones - aceptar cualquier tipo de archivo
    const file = await fileManager.openFile();

    if (file) {
        // Asegurar que extraFiles existe
        if (!currentProject.extraFiles) {
            currentProject.extraFiles = [];
        }
        
        currentProject.extraFiles.push({
            src: file.data,
            title: file.fileName,
            fileName: file.fileName,
            fileType: file.mimeType || 'application/octet-stream',
            fileSize: file.size || 0,
            extension: file.fileName.split('.').pop().toLowerCase()
        });
        
        loadExtraFiles();
        markAsUnsaved();
    }
}

function updateExtraFileTitle(index, newTitle) {
    if (currentProject.extraFiles && currentProject.extraFiles[index]) {
        currentProject.extraFiles[index].title = newTitle;
        markAsUnsaved();
    }
}

function removeExtraFile(index) {
    if (currentProject.extraFiles) {
        // ✅ NUEVO: Guardar referencia del archivo eliminado para eliminarlo del filesystem
        const deletedFile = currentProject.extraFiles[index];
        if (deletedFile && (deletedFile.src || deletedFile.path)) {
            deletedExtraFiles.push(deletedFile.src || deletedFile.path);
            console.log('📁 Archivo marcado para eliminar:', deletedFile.src || deletedFile.path);
        }
        
        currentProject.extraFiles.splice(index, 1);
        loadExtraFiles();
        markAsUnsaved();
    }
}

// ==================== EVENT LISTENERS ====================

function setupEventListeners() {
    // Detectar cambios en formularios
    const formInputs = document.querySelectorAll('input, textarea, select');
    formInputs.forEach(input => {
        input.addEventListener('change', markAsUnsaved);
    });

    // Progress slider
    const progressSlider = document.getElementById('projectProgress');
    if (progressSlider) {
        progressSlider.addEventListener('input', updateProgressDisplay);
    }
}

function updateProgressDisplay() {
    const value = document.getElementById('projectProgress').value;
    document.getElementById('progressValue').textContent = `${value}%`;
}

function markAsUnsaved() {
    hasUnsavedChanges = true;
    document.getElementById('editorStatus').textContent = 'Unsaved';
}

// ==================== SAVE PROJECT ====================

async function saveProject() {
    if (!currentProject) {
        alert('There is no project to save');
        return;
    }

    // Recopilar datos del formulario
    const updatedProject = {
        ...currentProject,
        icon: document.getElementById('projectIcon').value,
        title: document.getElementById('projectTitle').value,
        concept: document.getElementById('projectConcept').value,
        currentPhase: document.getElementById('currentPhase').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        progress: parseInt(document.getElementById('projectProgress').value),
        targetDate: document.getElementById('targetDate').value,
        blockers: {
            type: document.getElementById('blockerType').value,
            message: document.getElementById('blockerMessage').value
        },
        achievements: collectAchievements(),
        nextSteps: collectNextSteps(),
        updatedAt: new Date().toISOString()
    };
    
    console.log('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
    console.log('📋 DEBUG COMPLETO - Proyecto antes de guardar');
    console.log('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
    
    console.log('📋 Basic Info:', {
        id: updatedProject.id,
        title: updatedProject.title,
        ownerId: updatedProject.ownerId,
        status: updatedProject.status,
        progress: updatedProject.progress
    });

    console.log('\n🖼️ GANTT Image:', {
        exists: !!updatedProject.ganttImage,
        isString: typeof updatedProject.ganttImage === 'string',
        length: updatedProject.ganttImage?.length || 0,
        startsWithData: updatedProject.ganttImage?.startsWith('data:') || false,
        preview: updatedProject.ganttImage ? 
            updatedProject.ganttImage.substring(0, 60) + '...' : 'null'
    });

    console.log('\n📁 Images:', {
        count: updatedProject.images?.length || 0,
        details: updatedProject.images?.map((img, i) => ({
            index: i,
            title: img.title || 'Sin título',
            hasData: !!img.data,
            hasSrc: !!img.src,
            srcType: img.src?.startsWith('data:') ? 'base64' : 
                     img.src?.startsWith('users/') ? 'path' : 
                     img.src ? 'other' : 'none',
            srcPreview: img.src ? img.src.substring(0, 60) + '...' : 'null'
        })) || []
    });

    console.log('\n🎥 Videos:', {
        count: updatedProject.videos?.length || 0,
        details: updatedProject.videos?.map((v, i) => ({
            index: i,
            title: v.title || 'Sin título',
            hasData: !!v.data,
            hasSrc: !!v.src,
            srcType: v.src?.startsWith('data:') ? 'base64' : 
                     v.src?.startsWith('users/') ? 'path' : 
                     v.src ? 'other' : 'none'
        })) || []
    });

    console.log('••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••\n');

    // Mostrar feedback
    document.getElementById('editorTitle').textContent = '💾 Saving...';
    document.getElementById('editorStatus').textContent = 'Processing';

    // ✅ Eliminar archivos físicos que fueron eliminados ANTES de guardar el proyecto
    if (deletedExtraFiles.length > 0) {
        console.log(`🗑️ Eliminando ${deletedExtraFiles.length} archivos del filesystem...`);
        for (const filePath of deletedExtraFiles) {
            try {
                const result = await window.electronAPI.deleteFile(filePath);
                if (result.success) {
                    console.log(`✅ Archivo eliminado: ${filePath}`);
                } else {
                    console.warn(`⚠️ No se pudo eliminar: ${filePath} - ${result.error}`);
                }
            } catch (error) {
                console.error(`❌ Error eliminando archivo ${filePath}:`, error.message);
            }
        }
        // Limpiar la lista de archivos eliminados
        deletedExtraFiles = [];
    }

    // Guardar proyecto en la base de datos
    let success = false;
    
    try {
        if (editorMode === 'new') {
            // Crear nuevo proyecto
            console.log('📋 Modo: Crear nuevo proyecto');
            const newProject = await dataManager.createProject(updatedProject);
            success = newProject !== null;
            
            if (success) {
                console.log('✅ Nuevo proyecto creado:', newProject.id);
            } else {
                console.error('❌ createProject retornó null');
            }
        } else {
            // Actualizar proyecto existente
            console.log('✏️ Modo: Actualizar proyecto existente');
            const updated = await dataManager.updateProject(currentProject.id, updatedProject);
            success = updated !== null;
            
            if (success) {
                console.log('✅ Proyecto actualizado:', updated.id);
            } else {
                console.error('❌ updateProject retornó null');
            }
        }
    } catch (error) {
        console.error('❌ Error CRÍTICO al guardar:', error);
        console.error('Stack:', error.stack);
        success = false;
    }

    if (success) {
        console.log('\n✅✅✅ PROYECTO GUARDADO CORRECTAMENTE ✅✅✅\n');
        hasUnsavedChanges = false;
        document.getElementById('editorStatus').textContent = '✅ Saved';
        
        // Emitir evento para recargar datos en Home
        window.dispatchEvent(new Event('dataReloaded'));

        // Redirigir después de un momento
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    } else {
        console.error('\n❌❌❌ ERROR AL GUARDAR EL PROYECTO ❌❌❌\n');
        alert('❌ Error saving the project. Check the console for more details.');
        document.getElementById('editorTitle').textContent = `Editing: ${currentProject.title}`;
        document.getElementById('editorStatus').textContent = 'Error';
    }
}

function collectAchievements() {
    const achievements = {};
    const items = document.querySelectorAll('#achievementsList .dynamic-item');
    
    items.forEach(item => {
        const date = item.querySelector('.achievement-date').value;
        const text = item.querySelector('.achievement-text').value;
        if (date && text) {
            achievements[date] = text;
        }
    });
    
    return achievements;
}

function collectNextSteps() {
    const nextSteps = {};
    const items = document.querySelectorAll('#nextStepsList .dynamic-item');
    
    items.forEach(item => {
        const date = item.querySelector('.nextstep-date').value;
        const text = item.querySelector('.nextstep-text').value;
        if (date && text) {
            nextSteps[date] = text;
        }
    });
    
    return nextSteps;
}

// ==================== PREVIEW ====================

function previewProject() {
    // Recopilar datos actuales (sin guardar)
    const previewData = {
        icon: document.getElementById('projectIcon').value,
        title: document.getElementById('projectTitle').value,
        currentPhase: document.getElementById('currentPhase').value,
        progress: parseInt(document.getElementById('projectProgress').value),
        targetDate: document.getElementById('targetDate').value,
        status: document.getElementById('projectStatus').value,
        priority: document.getElementById('projectPriority').value,
        blockers: {
            type: document.getElementById('blockerType').value,
            message: document.getElementById('blockerMessage').value
        },
        achievements: collectAchievements(),
        nextSteps: collectNextSteps()
    };

    // Generar HTML de vista previa
    const previewHTML = generatePreviewHTML(previewData);
    
    // Mostrar en modal
    document.getElementById('previewContent').innerHTML = previewHTML;
    document.getElementById('previewModal').classList.add('active');
}

function generatePreviewHTML(data) {
    const statusConfig = dataManager.getStatusConfig(data.status);
    const priorityConfig = dataManager.getPriorityConfig(data.priority);
    
    return `
        <div style="padding: 40px; background: var(--bg-card); border-radius: 12px;">
            <div class="project-header">
                <h2 class="project-title">${data.icon} ${data.title}</h2>
                <span class="badge ${priorityConfig.badgeClass || statusConfig.badgeClass}">
                    ${priorityConfig.badge || statusConfig.badge}
                </span>
            </div>

            <div class="progress-container">
                <div class="progress-header">
                    <span class="progress-percentage">${data.progress}%</span>
                    <span class="progress-date">🎯 ${data.targetDate}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${data.progress}%"></div>
                </div>
            </div>

            <div class="info-section">
                <div class="info-title">📋 Current Phase</div>
                <div class="info-content">${data.currentPhase}</div>
            </div>

            ${Object.keys(data.achievements).length > 0 ? `
                <div class="info-section success">
                    <div class="info-title">✅ Recent Achievements</div>
                    <div class="info-content">
                        ${Object.entries(data.achievements).map(([date, text]) => 
                            `<strong>${date}:</strong> ${text}`
                        ).join('<br>')}
                    </div>
                </div>
            ` : ''}

            ${data.blockers.message ? `
                <div class="info-section ${data.blockers.type}">
                    <div class="info-title">⚠️ ${data.blockers.type === 'alert' ? 'Blocker' : 'Status'}</div>
                    <div class="info-content">${data.blockers.message}</div>
                </div>
            ` : ''}

            ${Object.keys(data.nextSteps).length > 0 ? `
                <div class="info-section">
                    <div class="info-title">🎯 Next Steps</div>
                    <div class="info-content">
                        ${Object.entries(data.nextSteps).map(([date, text]) => 
                            `<strong>${date}:</strong> ${text}`
                        ).join('<br>')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function closePreviewModal() {
    document.getElementById('previewModal').classList.remove('active');
}

// ==================== CANCEL EDIT ====================

function cancelEdit() {
    if (hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
            return;
        }
    }
    
    window.location.href = 'index.html';
}

// ==================== THEME TOGGLE ====================

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    }
}

// ==================== DELETE PROJECT ====================

function deleteProject() {
    if (!currentProject) {
        alert('There is no project to delete');
        return;
    }

    // Mostrar modal
    document.getElementById('deleteProjectTitle').textContent = currentProject.title;
    document.getElementById('deleteModal').classList.add('active');
    document.getElementById('confirmDeleteText').value = '';
    document.getElementById('btnConfirmDelete').disabled = true;

    // Validación en tiempo real
    const confirmInput = document.getElementById('confirmDeleteText');
    const confirmBtn = document.getElementById('btnConfirmDelete');
    
    confirmInput.oninput = function() {
        if (this.value.trim() === currentProject.title.trim()) {
            confirmBtn.disabled = false;
        } else {
            confirmBtn.disabled = true;
        }
    };
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    document.getElementById('confirmDeleteText').value = '';
}

async function confirmDelete() {
    const confirmText = document.getElementById('confirmDeleteText').value.trim();
    
    if (confirmText !== currentProject.title.trim()) {
        alert('The project name does not match');
        return;
    }

    closeDeleteModal();

    // Mostrar feedback
    const originalTitle = document.getElementById('editorTitle').textContent;
    document.getElementById('editorTitle').textContent = '🗑️ Deleting project...';
    document.getElementById('editorStatus').textContent = 'Processing';

    try {
        // Llamar a la eliminación real
        const success = await dataManager.deleteProject(currentProject.id);

        if (success) {
            console.log('✅ Proyecto eliminado correctamente');
            alert('✅ Project deleted successfully');
            
            // No hay cambios sin guardar
            hasUnsavedChanges = false;
            
            // Redirigir al home
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } else {
            throw new Error('Error al eliminar el proyecto');
        }
    } catch (error) {
        console.error('❌ Error eliminando proyecto:', error);
        alert('❌ Error deleting the project. Please try again.');
        document.getElementById('editorTitle').textContent = originalTitle;
        document.getElementById('editorStatus').textContent = 'Error';
    }
}

// ==================== HELPERS ====================

function updateEditorTitle(title) {
    document.getElementById('editorTitle').textContent = `Editing: ${title}`;
}

// Agregar método canEditProject a dataManager si no existe
if (dataManager && !dataManager.canEditProject) {
    dataManager.canEditProject = function(projectId) {
        const project = this.getProjectById(projectId);
        if (!project) return false;
        if (!this.currentUser) return false;
        return project.ownerId === this.currentUser.id;
    };
}

// ==================== SWITCH SECTION ====================

function switchSection(sectionName) {
    console.log('📋 Cambiando a sección:', sectionName);
    
    // Ocultar todas las secciones
    document.querySelectorAll('.editor-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover active de todos los botones
    document.querySelectorAll('.editor-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const targetSection = document.getElementById('section-' + sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('❌ Sección no encontrada:', 'section-' + sectionName);
    }
    
    // Activar botón correspondiente
    const targetButton = document.querySelector(`[data-section="${sectionName}"]`);
    if (targetButton) {
        targetButton.classList.add('active');
    }
}

console.log('✅ Editor.js cargado');
