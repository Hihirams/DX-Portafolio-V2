// ============================================
// PROJECT MANAGER - Sistema dinámico con DataManager
// ============================================

let projects = [];
let filteredProjects = [];
let currentPage = 1;
const itemsPerPage = 10;
let charts = {};
let currentResourceProject = null;

// Active filters
let activeFilters = {
    status: 'all',
    block: 'all',
    responsible: null,
    search: ''
};

// Active Analytics Filters
let activeAnalyticsFilters = {
    responsible: null,
    status: null,
    blocked: null,
    projectId: null, // For individual project filtering
    // New cross-filtering state
    crossFilters: {
        responsible: null,
        status: null,
        blocked: null,
        projectId: null
    }
};

// Cross-filtering configuration - which charts can trigger which filters
const crossFilterConfig = {
    // Chart types that can trigger cross-filters
    portfolioStatus: {
        filterType: 'status',
        valueMap: ['discovery', 'decision', 'develop', 'pilot', 'yokotenkai', 'finished']
    },
    teamWorkload: {
        filterType: 'responsible',
        valueMap: null // Will be populated dynamically based on team data
    },
    blockers: {
        filterType: 'blocked',
        valueMap: [false, true] // Index 0 = unblocked, 1 = blocked
    }
    // progressOverview and deliveryTimeline charts can also trigger project filters
};

// Status Mapping
const statusMap = {
    'discovery': { label: 'Discovery', class: 'status-discovery' },
    'decision': { label: 'Decision', class: 'status-decision' },
    'develop': { label: 'Develop', class: 'status-develop' },
    'pilot': { label: 'Pilot', class: 'status-pilot' },
    'yokotenkai': { label: 'Yokotenkai', class: 'status-yokotenkai' },
    'finished': { label: 'Finished', class: 'status-finished' }
};

// ==================== INITIALIZATION ====================

// Verificar si dataManager está disponible y tener proyectos
function startProjectManager() {
    console.log('✓ Iniciando Project Manager...');

    // Cargar tema guardado
    loadTheme();

    // Verificar que dataManager y proyectos estén disponibles
    if (!window.dataManager) {
        console.error('❌ DataManager no está disponible');
        setTimeout(startProjectManager, 500); // Reintentar en 500ms
        return;
    }

    if (!window.dataManager.projects || window.dataManager.projects.length === 0) {
        console.warn('⚠️ DataManager sin proyectos cargados');
    }

    loadProjectsFromDataManager();
    initializeApp();
}

// No ejecutar automáticamente - esperar a ser llamado desde HTML
console.log('✓ Project Manager Script Cargado - esperando inicialización...');

// ==================== DATA LOADING ====================

function loadProjectsFromDataManager() {
    try {
        // Obtener todos los proyectos del dataManager
        projects = dataManager.projects || [];

        console.log(`✓ ${projects.length} proyectos cargados del DataManager`);

        if (projects.length === 0) {
            console.warn('⚠️ No hay proyectos cargados - mostrando tabla vacía');
        }

        // Mapear proyectos al formato esperado por la UI
        projects = projects.map(p => ({
            id: p.id,
            name: (p.priorityNumber ? p.priorityNumber + ". " : "") + p.title,
            status: normalizeStatus(p.status),
            progress: p.progress || 0,
            lastUpdate: p.updatedAt || new Date().toISOString(),
            nextStep: p.currentPhase || 'To be defined',
            deliveryDate: p.targetDate || new Date().toISOString(),
            responsible: dataManager.getUserById(p.ownerId)?.name || 'Unassigned', // Antes: 'Sin asignar'
            ownerId: p.ownerId,
            blocked: p.blockers?.type === 'warning' || p.blockers?.type === 'error' ? true : false,
            blockReason: p.blockers?.message || 'No blockers', // Antes: 'Sin bloqueos'
            blockResponsible: 'System', // Antes: 'Sistema'
            // Preservar datos originales
            _original: p
        }));

        // ✅ NUEVO: Ordenar proyectos por priorityNumber (ascendente: 1, 2, 3...)
        projects.sort((a, b) => {
            const priorityA = a._original.priorityNumber || 999;
            const priorityB = b._original.priorityNumber || 999;
            return priorityA - priorityB;
        });

        filteredProjects = [...projects];

        return true;
    } catch (error) {
        console.error('❌ Error cargando proyectos:', error);
        projects = [];
        filteredProjects = [];
        return false;
    }
}

function normalizeStatus(status) {
    const statusLower = String(status).toLowerCase();
    if (statusLower.includes('discovery')) return 'discovery';
    if (statusLower.includes('decision')) return 'decision';
    if (statusLower.includes('develop')) return 'develop';
    if (statusLower.includes('pilot')) return 'pilot';
    if (statusLower.includes('yokotenkai')) return 'yokotenkai';
    if (statusLower.includes('finished')) return 'finished';
    // Fallback para etapas antiguas
    if (statusLower.includes('progress')) return 'develop';
    if (statusLower.includes('hold')) return 'pilot';
    if (statusLower.includes('completed')) return 'finished';
    return 'discovery';
}

// Reemplazar la función openResourcesModal
function openResourcesModal(projectId, event) {
    // ✅ ARREGLADO: Cargar datos más recientes del dataManager
    let project = projects.find(p => p.id === projectId);
    if (!project) return;

    // Actualizar con datos más recientes del dataManager
    const latestProject = dataManager.getProjectById(projectId);
    if (latestProject) {
        // Mezclar datos recientes
        project._original = latestProject;
    }

    currentResourceProject = project;

    const modal = document.getElementById('resourcesModal');
    const modalContent = document.getElementById('resourcesModalContent');
    const title = document.getElementById('resourcesModalTitle');

    title.textContent = 'RESOURCES';

    // ✅ MEJORADO: Verificar disponibilidad de recursos con datos actualizados
    const hasGantt = project._original?.ganttImage || project._original?.ganttImagePath;
    const hasImages = project._original?.images && Array.isArray(project._original.images) && project._original.images.length > 0;
    const hasVideos = project._original?.videos && Array.isArray(project._original.videos) && project._original.videos.length > 0;
    const hasFiles = project._original?.extraFiles && Array.isArray(project._original.extraFiles) && project._original.extraFiles.length > 0;

    // ✅ ARREGLADO: Actualizar estado de todos los botones
    const btnGantt = document.getElementById('btnGantt');
    const btnImages = document.getElementById('btnImages');
    const btnVideos = document.getElementById('btnVideos');
    const btnFiles = document.getElementById('btnFiles');

    btnGantt.disabled = !hasGantt;
    btnImages.disabled = !hasImages;
    btnVideos.disabled = !hasVideos;
    btnFiles.disabled = !hasFiles;

    // Log para debug
    console.log('📋 Estado de recursos actualizado:', {
        proyecto: project.name,
        gantt: hasGantt,
        images: hasImages,
        videos: hasVideos,
        files: hasFiles
    });

    // Posicionar el modal cerca del botón
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const modalWidth = 420;
    const modalHeight = 180; // Altura aproximada del modal

    // Calcular posición: arriba del botón, centrado horizontalmente
    let top = buttonRect.top - modalHeight - 10;
    let left = buttonRect.left + (buttonRect.width / 2) - (modalWidth / 2);

    // Ajustar si se sale de la pantalla
    if (top < 10) {
        top = buttonRect.bottom + 10; // Mostrar abajo si no cabe arriba
    }
    if (left < 10) {
        left = 10;
    }
    if (left + modalWidth > window.innerWidth - 10) {
        left = window.innerWidth - modalWidth - 10;
    }

    modalContent.style.top = `${top}px`;
    modalContent.style.left = `${left}px`;

    modal.classList.add('active');

    // Cerrar al hacer click fuera
    setTimeout(() => {
        document.addEventListener('click', closeResourcesOnOutsideClick);
    }, 0);
}

async function checkAndUpdateFilesButton(project) {
    try {
        const extraFilesDir = `users/${project.ownerId}/projects/${project.id}/extra-files/`;
        const result = await window.electronAPI.listDir(extraFilesDir);
        const hasFiles = result.success && result.files && result.files.length > 0;
        document.getElementById('btnFiles').disabled = !hasFiles;
    } catch (error) {
        console.log('Verificación de extra-files directory falló, dejando botón deshabilitado:', error);
        // Mantener disabled si falla
        document.getElementById('btnFiles').disabled = true;
    }
}

function closeResourcesOnOutsideClick(e) {
    const modal = document.getElementById('resourcesModal');
    const modalContent = document.getElementById('resourcesModalContent');

    if (modal.classList.contains('active') &&
        !modalContent.contains(e.target) &&
        !e.target.closest('.btn-resources')) {
        closeResourcesModal();
    }
}

function closeResourcesModal() {
    document.getElementById('resourcesModal').classList.remove('active');
    document.removeEventListener('click', closeResourcesOnOutsideClick);
    currentResourceProject = null;
}

// Funciones para abrir recursos específicos
async function openResourceGantt() {
    if (!currentResourceProject) return;

    const project = currentResourceProject._original;
    const ganttPath = project.ganttImage || project.ganttImagePath;

    // ✅ ARREGLADO: Validar antes de procesar
    if (!ganttPath) {
        console.warn('⚠️ This project has no Gantt chart');
        alert('This project has no Gantt chart available');
        return;
    }

    try {
        let ganttSrc = ganttPath;

        // Si es una ruta del filesystem, cargarla
        if (ganttPath.startsWith('users/')) {
            const result = await window.electronAPI.readMedia(ganttPath);
            if (result.success && result.data) {
                ganttSrc = result.data;
            }
        }

        const modal = document.getElementById('ganttViewModal');
        const title = document.getElementById('ganttViewTitle');
        const img = document.getElementById('ganttViewImage');

        title.textContent = `${currentResourceProject.name} - Gantt`;
        img.src = ganttSrc;

        closeResourcesModal();
        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading Gantt:', error);
        alert('Error loading Gantt chart');
    }
}

// Actualizar las funciones de visualización de recursos
async function openResourceImages() {
    if (!currentResourceProject) return;

    const project = currentResourceProject._original;

    // ✅ ARREGLADO: Validar antes de procesar
    if (!project.images || !Array.isArray(project.images) || project.images.length === 0) {
        console.warn('⚠️ This project has no images');
        alert('This project has no images available');
        return;
    }

    try {
        const modal = document.getElementById('imagesViewModal');
        const title = document.getElementById('imagesViewTitle');
        const grid = document.getElementById('imagesViewGrid');

        title.textContent = `${currentResourceProject.name} - Images`;

        const imagesHTML = await Promise.all(project.images.map(async (img) => {
            let imgSrc = img.src || img.path;

            if (imgSrc && imgSrc.startsWith('users/')) {
                const result = await window.electronAPI.readMedia(imgSrc);
                if (result.success && result.data) {
                    imgSrc = result.data;
                }
            }

            return `
                <div class=\"resource-image-item\" onclick=\"openImageFullscreen('${imgSrc}', '${img.title || img.fileName}')\">
                    <img src=\"${imgSrc}\" alt=\"${img.title || img.fileName}\">
                    <p class=\"resource-image-title\">${img.title || img.fileName}</p>
                </div>
            `;
        }));

        grid.innerHTML = imagesHTML.join('');

        closeResourcesModal();
        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading images:', error);
        alert('Error loading images');
    }
}

async function openResourceVideos() {
    if (!currentResourceProject) return;

    const project = currentResourceProject._original;

    // ✅ ARREGLADO: Validar antes de procesar
    if (!project.videos || !Array.isArray(project.videos) || project.videos.length === 0) {
        console.warn('⚠️ This project has no videos');
        alert('This project has no videos available');
        return;
    }

    try {
        const modal = document.getElementById('videosViewModal');
        const title = document.getElementById('videosViewTitle');
        const grid = document.getElementById('videosViewGrid');

        title.textContent = `${currentResourceProject.name} - Videos`;

        const videosHTML = await Promise.all(project.videos.map(async (video) => {
            let videoSrc = video.src || video.path;

            if (videoSrc && videoSrc.startsWith('users/')) {
                const result = await window.electronAPI.readMedia(videoSrc);
                if (result.success && result.data) {
                    videoSrc = result.data;
                }
            }

            return `
                <div class=\"resource-video-item\" onclick=\"playVideo('${videoSrc}', '${video.title || video.fileName}')\">
                    <video src=\"${videoSrc}\" preload=\"metadata\"></video>
                    <p class=\"resource-video-title\">${video.title || video.fileName}</p>
                </div>
            `;
        }));

        grid.innerHTML = videosHTML.join('');

        closeResourcesModal();
        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading videos:', error);
        alert('Error loading videos');
    }
}

async function openResourceFiles() {
    if (!currentResourceProject) return;

    const project = currentResourceProject._original;

    // ✅ ARREGLADO: Validar antes de procesar
    if (!project.extraFiles || !Array.isArray(project.extraFiles) || project.extraFiles.length === 0) {
        console.warn('⚠️ This project has no extra files');
        alert('This project has no files available');
        return;
    }

    console.log('📁 Opening files for project:', {
        projectId: project.id,
        extraFilesCount: project.extraFiles?.length || 0,
        extraFiles: project.extraFiles || []
    });

    try {
        const modal = document.getElementById('filesViewModal');
        const title = document.getElementById('filesViewTitle');
        const list = document.getElementById('filesViewList');

        title.textContent = `${currentResourceProject.name} - Files`;

        let filesHTML = '';

        if (!project.extraFiles || project.extraFiles.length === 0) {
            // No files message
            filesHTML = `
                <div style="text-align: center; padding: 40px 20px; color: rgba(245, 245, 247, 0.6);">
                    <div style="font-size: 48px; margin-bottom: 20px;">📂</div>
                    <h3 style="margin: 0 0 10px 0; color: rgba(245, 245, 247, 0.8); font-size: 18px;">No files available</h3>
                    <p style="margin: 0; font-size: 14px;">This project has no extra files uploaded.</p>
                </div>
            `;
            console.log('✓ No files to show');
        } else {
            // Show files
            filesHTML = project.extraFiles.map((file) => {
                const icon = getFileIcon(file.extension || file.fileName);
                const sizeKB = file.fileSize ? (file.fileSize / 1024).toFixed(2) : '0';

                return `
                    <div class=\"resource-file-item\" onclick=\"downloadFile('${file.src || file.path || ''}', '${file.fileName}')\">
                        <div class=\"resource-file-icon\">${icon}</div>
                        <div class=\"resource-file-info\">
                            <div class=\"resource-file-name\">${file.title || file.fileName}</div>
                            <div class=\"resource-file-meta\">${file.fileName} · ${sizeKB} KB</div>
                        </div>
                        <svg class=\"resource-file-download\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                            <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path>
                            <polyline points=\"7 10 12 15 17 10\"></polyline>
                            <line x1=\"12\" y1=\"15\" x2=\"12\" y2=\"3\"></line>
                        </svg>
                    </div>
                `;
            }).join('');
            console.log(`✓ Showing ${project.extraFiles.length} files`);
        }

        list.innerHTML = filesHTML;

        closeResourcesModal();
        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading files:', error);
        alert('Error loading files');
    }
}

// Cerrar modales de visualización
function closeGanttViewModal() {
    document.getElementById('ganttViewModal').classList.remove('active');
}

function closeImagesViewModal() {
    document.getElementById('imagesViewModal').classList.remove('active');
}

function closeVideosViewModal() {
    document.getElementById('videosViewModal').classList.remove('active');
}

function closeFilesViewModal() {
    document.getElementById('filesViewModal').classList.remove('active');
}

// ==================== METRICS RESOURCE ====================

async function openResourceMetrics() {
    if (!currentResourceProject) return;

    const project = currentResourceProject._original;

    // ✅ Validar si tiene KPIs
    if (!project.kpis) {
        console.warn('⚠️ This project has no metrics data');
        alert('This project has no metrics available');
        return;
    }

    try {
        const modal = document.getElementById('metricsViewModal');
        const title = document.getElementById('metricsViewTitle');
        const subtitle = document.getElementById('metricsViewSubtitle');

        title.textContent = `${currentResourceProject.name}`;
        subtitle.textContent = 'Key Performance Indicators';

        // ✅ KPIs principales
        document.getElementById('metric-totalHours').textContent = project.kpis.totalHoursEstimated || '0';
        document.getElementById('metric-hoursSpent').textContent = project.kpis.hoursSpent || '0';
        document.getElementById('metric-fteSaved').textContent = project.kpis.fteSaved || '0';
        document.getElementById('metric-completion').textContent = `${project.kpis.completion || 0}%`;

        // ✅ Timeline
        document.getElementById('metric-startDate').textContent = formatDate(project.kpis.timeline?.startDate) || '—';
        document.getElementById('metric-targetEnd').textContent = formatDate(project.kpis.timeline?.targetEnd) || '—';
        document.getElementById('metric-currentPhase').textContent = project.kpis.timeline?.currentPhase || '—';

        // ✅ Resources con barras de progreso
        const totalHours = project.kpis.totalHoursEstimated || 1;
        const resources = project.kpis.resources || {};

        document.getElementById('metric-engineerHours').textContent = `${resources.softwareEngineerHours || 0}h`;
        document.getElementById('metric-engineerBar').style.width = `${(resources.softwareEngineerHours / totalHours * 100) || 0}%`;

        document.getElementById('metric-testingHours').textContent = `${resources.testingQAHours || 0}h`;
        document.getElementById('metric-testingBar').style.width = `${(resources.testingQAHours / totalHours * 100) || 0}%`;

        document.getElementById('metric-managementHours').textContent = `${resources.projectManagementHours || 0}h`;
        document.getElementById('metric-managementBar').style.width = `${(resources.projectManagementHours / totalHours * 100) || 0}%`;

        document.getElementById('metric-remainingHours').textContent = `${resources.remainingHours || 0}h`;
        document.getElementById('metric-remainingBar').style.width = `${(resources.remainingHours / totalHours * 100) || 0}%`;

        // ✅ Performance Metrics
        const metrics = project.kpis.metrics || {};

        document.getElementById('metric-tasksCompleted').textContent = metrics.tasksCompleted || 0;
        document.getElementById('metric-totalTasks').textContent = metrics.totalTasks || 0;
        const tasksPercent = metrics.totalTasks ? (metrics.tasksCompleted / metrics.totalTasks * 100) : 0;
        document.getElementById('metric-tasksBar').style.width = `${tasksPercent}%`;

        document.getElementById('metric-milestonesOnTime').textContent = metrics.milestonesOnTime || 0;
        document.getElementById('metric-totalMilestones').textContent = metrics.totalMilestones || 0;
        const milestonesPercent = metrics.totalMilestones ? (metrics.milestonesOnTime / metrics.totalMilestones * 100) : 0;
        document.getElementById('metric-milestonesBar').style.width = `${milestonesPercent}%`;

        document.getElementById('metric-resourceUtilization').textContent = metrics.resourceUtilization || 0;
        document.getElementById('metric-utilizationBar').style.width = `${metrics.resourceUtilization || 0}%`;

        closeResourcesModal();
        modal.classList.add('active');

    } catch (error) {
        console.error('Error loading metrics:', error);
        alert('Error loading project metrics');
    }
}

function closeMetricsViewModal() {
    document.getElementById('metricsViewModal').classList.remove('active');
}

// ==================== MEDIA UTILITIES ====================

function openImageFullscreen(src, title) {
    // Crear modal temporal para imagen fullscreen
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 20px;
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'color: white; font-size: 20px; font-weight: 600;';

    const img = document.createElement('img');
    img.src = src;
    img.alt = title;
    img.style.cssText = 'max-width: 90%; max-height: 70%; border-radius: 12px;';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'resource-btn';
    closeBtn.innerHTML = '✖ Close'; // Antes: '✖ Cerrar'
    closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f5f5f7;
        backdrop-filter: blur(20px);
    `;
    closeBtn.onclick = () => overlay.remove();

    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };

    overlay.appendChild(titleEl);
    overlay.appendChild(img);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
}

function playVideo(src, title) {
    // Crear modal temporal para video player
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.95); z-index: 10001;
        display: flex; align-items: center; justify-content: center;
        flex-direction: column; gap: 20px;
    `;

    const titleEl = document.createElement('h3');
    titleEl.textContent = title;
    titleEl.style.cssText = 'color: white; font-size: 20px; font-weight: 600;';

    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.autoplay = true;
    video.style.cssText = 'max-width: 90%; max-height: 70%; border-radius: 12px;';

    // Agregar event listener para cerrar al hacer click en el video
    video.onclick = (e) => {
        e.stopPropagation(); // Prevenir que el click en el video cierre el modal
    };

    const closeBtn = document.createElement('button');
    closeBtn.className = 'resource-btn';
    closeBtn.innerHTML = '✖ Cerrar';
    closeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.08);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #f5f5f7;
        backdrop-filter: blur(20px);
    `;
    closeBtn.onclick = () => {
        video.pause();
        overlay.remove();
    };

    overlay.onclick = () => {
        video.pause();
        overlay.remove();
    };

    overlay.appendChild(titleEl);
    overlay.appendChild(video);
    overlay.appendChild(closeBtn);
    document.body.appendChild(overlay);
}

async function downloadFile(filePath, fileName) {
    try {
        let fileSrc = filePath;

        if (filePath.startsWith('users/')) {
            const result = await window.electronAPI.readMedia(filePath);
            if (result.success && result.data) {
                fileSrc = result.data;
            }
        }

        const link = document.createElement('a');
        link.href = fileSrc;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('Error downloading file:', error);
        alert('Error downloading file');
    }
}

function getFileIcon(fileName) {
    if (!fileName) return '📄';
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄', 'doc': '📝', 'docx': '📝', 'txt': '📄',
        'xls': '📊', 'xlsx': '📊', 'csv': '📊',
        'ppt': '📈', 'pptx': '📈',
        'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️',
        'mp4': '🎬', 'avi': '🎬', 'mov': '🎬',
        'js': '💻', 'py': '💻', 'java': '💻'
    };
    return icons[ext] || '📎';
}

// Cerrar con ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeResourcesModal();
        closeGanttViewModal();
        closeImagesViewModal();
        closeVideosViewModal();
        closeFilesViewModal();
    }
});

// ==================== EXTRA FILES UTILITY ====================

async function scanExtraFilesDirectory(project) {
    try {
        const extraFilesDir = `users/${project.ownerId}/projects/${project.id}/extra-files/`;
        const result = await window.electronAPI.listDir(extraFilesDir);
        if (result.success && result.files) {
            const files = [];
            for (const fileName of result.files) {
                // Skip directories
                if (fileName.includes('.')) {
                    const fullPath = `${extraFilesDir}${fileName}`;
                    const mediaResult = await window.electronAPI.readMedia(fullPath);
                    if (mediaResult.success) {
                        files.push({
                            src: fullPath,
                            title: fileName,
                            fileName: fileName,
                            fileType: mediaResult.mimeType || 'application/octet-stream',
                            fileSize: 0, // Not available from listDir
                            extension: fileName.split('.').pop().toLowerCase()
                        });
                    }
                }
            }
            return files;
        }
    } catch (error) {
        console.error('Error scanning extra-files directory:', error);
    }
    return [];
}

// ==================== APP INITIALIZATION ====================

function initializeApp() {
    try {
        console.log('🚀 Inicializando aplicación...');

        // Renderizar datos iniciales
        renderProjects();
        renderTeamMembers();
        updateBadges();
        updateFilterButtons();
        updateActiveFiltersDisplay();

        // Configurar observador para cambios en datos
        setupDataObserver();

        console.log('✓ Aplicación inicializada correctamente');
    } catch (error) {
        console.error('❌ Error inicializando aplicación:', error);
    }
}

// ==================== DATA OBSERVER ====================

function setupDataObserver() {
    // ❌ DESACTIVADO: El observador automático causaba loops infinitos y reseteo de página
    // Solo actualizamos cuando el editor guarda cambios explícitamente

    // setInterval(() => {
    //     checkForDataChanges();
    // }, 5000);

    // Listener for immediate data reload when editor saves changes
    window.addEventListener('dataReloaded', () => {
        console.log('📤 Editor saved changes, reloading projects immediately...');
        loadProjectsFromDataManager();
        applyFilters();
        updateBadges();
        renderProjects();
    });

    console.log('👁️ Observador de cambios configurado (solo para eventos del editor)');
}

function checkForDataChanges() {
    try {
        const newProjects = dataManager.getAllProjects();

        // Comparar cantidad de proyectos
        if (newProjects.length !== projects.length) {
            console.log('📊 Cambio detectado en proyectos');
            loadProjectsFromDataManager();
            applyFilters();
            updateBadges();
            return;
        }

        // Comparar cambios en proyectos existentes
        // Usar una comparación más inteligente que evite loops infinitos
        for (let i = 0; i < newProjects.length; i++) {
            const currentOriginal = projects[i]?._original;
            const newProject = newProjects[i];

            // Si no hay proyecto original guardado, skip
            if (!currentOriginal) continue;

            // Comparar solo campos relevantes que realmente indican cambios
            const hasChanged =
                currentOriginal.id !== newProject.id ||
                currentOriginal.title !== newProject.title ||
                currentOriginal.status !== newProject.status ||
                currentOriginal.progress !== newProject.progress ||
                currentOriginal.priority !== newProject.priority ||
                currentOriginal.priorityNumber !== newProject.priorityNumber ||
                currentOriginal.updatedAt !== newProject.updatedAt;

            if (hasChanged) {
                console.log('📝 Proyecto modificado:', newProject.id);
                loadProjectsFromDataManager();
                applyFilters();
                updateBadges();
                return;
            }
        }
    } catch (error) {
        console.error('❌ Error verificando cambios:', error);
    }
}

// ==================== UTILITY FUNCTIONS ====================

function getInitials(name) {
    if (!name) return 'XX';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateString) {
    if (!dateString) return '—';
    try {
        const date = new Date(dateString);
        // Cambio de 'es-MX' a 'en-US'
        return date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
}

function getDeliveryStatus(deliveryDate) {
    if (!deliveryDate) return { class: '', icon: 'calendar' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const delivery = new Date(deliveryDate);
    delivery.setHours(0, 0, 0, 0);

    const diffTime = delivery - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { class: 'urgent', icon: 'alert' };
    } else if (diffDays <= 7) {
        return { class: 'urgent', icon: 'alert' };
    } else if (diffDays <= 30) {
        return { class: 'soon', icon: 'clock' };
    } else {
        return { class: '', icon: 'calendar' };
    }
}

function getDeliveryIcon(type) {
    const icons = {
        alert: '<svg class="delivery-icon" viewBox="0 0 14 14" fill="none"><path d="M7 1L13 12H1L7 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M7 5.5V8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="7" cy="10" r="0.5" fill="currentColor"/></svg>',
        clock: '<svg class="delivery-icon" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/><path d="M7 3.5V7L9.5 9.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
        calendar: '<svg class="delivery-icon" viewBox="0 0 14 14" fill="none"><rect x="2" y="3" width="10" height="9" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 6H12" stroke="currentColor" stroke-width="1.5"/><path d="M5 2V4M9 2V4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };
    return icons[type] || icons.calendar;
}

// ==================== TEAM MEMBERS ====================

function getTeamMembers() {
    const membersMap = {};

    // First, add all registered users from dataManager
    if (dataManager && dataManager.users) {
        dataManager.users.forEach(user => {
            const userName = user.name || user.username;
            if (!membersMap[userName]) {
                membersMap[userName] = {
                    name: userName,
                    total: 0,
                    progress: 0,
                    hold: 0,
                    discovery: 0,
                    completed: 0,
                    blocked: 0
                };
            }
        });
    }

    // Then, overlay project stats on top
    projects.forEach(project => {
        const responsible = project.responsible || 'Sin asignar';
        if (!membersMap[responsible]) {
            // Fallback for cases where responsible doesn't match user data
            membersMap[responsible] = {
                name: responsible,
                total: 0,
                progress: 0,
                hold: 0,
                discovery: 0,
                completed: 0,
                blocked: 0
            };
        }

        membersMap[responsible].total++;
        membersMap[responsible][project.status]++;
        if (project.blocked) {
            membersMap[responsible].blocked++;
        }
    });

    return Object.values(membersMap).sort((a, b) => b.total - a.total);
}

function renderTeamMembers() {
    const teamList = document.getElementById('teamList');
    if (!teamList) return;

    const members = getTeamMembers();

    teamList.innerHTML = members.map(member => `
        <div class="team-member ${activeFilters.responsible === member.name ? 'active' : ''}"
             onclick="toggleResponsibleFilter('${member.name}')">
            <div class="member-avatar">${getInitials(member.name)}</div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-projects">${member.total} project${member.total !== 1 ? 's' : ''} · ${member.blocked} blocked${member.blocked !== 1 ? 's' : ''}</div>
            </div>
        </div>
    `).join('');
}

// ==================== FILTERS ====================

function toggleResponsibleFilter(responsible) {
    if (activeFilters.responsible === responsible) {
        activeFilters.responsible = null;
    } else {
        activeFilters.responsible = responsible;
    }
    applyFilters();
    updateActiveFiltersDisplay();
    renderTeamMembers();
}

function toggleFilter(type, value) {
    if (type === 'status') {
        if (activeFilters.status === value && value !== 'all') {
            activeFilters.status = 'all';
        } else {
            activeFilters.status = value;
        }
    } else if (type === 'block') {
        if (activeFilters.block === value && value !== 'all') {
            activeFilters.block = 'all';
        } else {
            activeFilters.block = value;
        }
    }

    applyFilters();
    updateActiveFiltersDisplay();
    updateFilterButtons();
}

function updateFilterButtons() {
    document.querySelectorAll('[data-filter="status"]').forEach(btn => {
        const value = btn.getAttribute('data-value');
        if (value === activeFilters.status) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    document.querySelectorAll('[data-filter="block"]').forEach(btn => {
        const value = btn.getAttribute('data-value');
        if (value === activeFilters.block) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function updateActiveFiltersDisplay() {
    const container = document.getElementById('activeFilters');
    if (!container) return;

    const chips = [];

    if (activeFilters.status !== 'all') {
        const statusLabel = statusMap[activeFilters.status]?.label || activeFilters.status;
        chips.push(`
            <div class="active-filter-chip" onclick="removeFilter('status')">
                <span>Status: ${statusLabel}</span>
                <span class="chip-close">×</span>
            </div>
        `);
    }

    if (activeFilters.block !== 'all') {
        const blockLabel = activeFilters.block === 'blocked' ? 'With Blockers' : 'Without Blockers';
        chips.push(`
            <div class="active-filter-chip" onclick="removeFilter('block')">
                <span>${blockLabel}</span>
                <span class="chip-close">×</span>
            </div>
        `);
    }

    if (activeFilters.responsible) {
        chips.push(`
            <div class="active-filter-chip" onclick="removeFilter('responsible')">
                <span>${activeFilters.responsible}</span>
                <span class="chip-close">×</span>
            </div>
        `);
    }

    if (activeFilters.search) {
        chips.push(`
            <div class="active-filter-chip" onclick="removeFilter('search')">
                <span>"${activeFilters.search}"</span>
                <span class="chip-close">×</span>
            </div>
        `);
    }

    container.innerHTML = chips.join('');

    const filterContainer = document.getElementById('activeFiltersContainer');
    if (filterContainer) {
        filterContainer.style.display = chips.length > 0 ? 'block' : 'none';
    }
}

function removeFilter(type) {
    if (type === 'status') {
        activeFilters.status = 'all';
    } else if (type === 'block') {
        activeFilters.block = 'all';
    } else if (type === 'responsible') {
        activeFilters.responsible = null;
    } else if (type === 'search') {
        activeFilters.search = '';
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
    }

    applyFilters();
    updateActiveFiltersDisplay();
    updateFilterButtons();
    renderTeamMembers();
}

function clearAllFilters() {
    activeFilters = {
        status: 'all',
        block: 'all',
        responsible: null,
        search: ''
    };
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    applyFilters();
    updateActiveFiltersDisplay();
    updateFilterButtons();
    renderTeamMembers();
}

function applyFilters() {
    filteredProjects = projects.filter(project => {
        if (activeFilters.status !== 'all' && project.status !== activeFilters.status) {
            return false;
        }

        if (activeFilters.block === 'blocked' && !project.blocked) {
            return false;
        }
        if (activeFilters.block === 'unblocked' && project.blocked) {
            return false;
        }

        if (activeFilters.responsible && project.responsible !== activeFilters.responsible) {
            return false;
        }

        if (activeFilters.search) {
            const searchLower = activeFilters.search.toLowerCase();
            return project.name.toLowerCase().includes(searchLower) ||
                project.responsible.toLowerCase().includes(searchLower);
        }

        return true;
    });

    currentPage = 1;
    renderProjects();
    updateBadges();
}

function searchProjects() {
    activeFilters.search = document.getElementById('searchInput')?.value.trim() || '';
    applyFilters();
    updateActiveFiltersDisplay();
}

// ==================== BADGES ====================

function updateBadges() {
    if (!projects.length) return;

    document.getElementById('badge-all').textContent = projects.length;
    document.getElementById('badge-discovery').textContent = projects.filter(p => p.status === 'discovery').length;
    document.getElementById('badge-decision').textContent = projects.filter(p => p.status === 'decision').length;
    document.getElementById('badge-develop').textContent = projects.filter(p => p.status === 'develop').length;
    document.getElementById('badge-pilot').textContent = projects.filter(p => p.status === 'pilot').length;
    document.getElementById('badge-yokotenkai').textContent = projects.filter(p => p.status === 'yokotenkai').length;
    document.getElementById('badge-finished').textContent = projects.filter(p => p.status === 'finished').length;

    document.getElementById('badge-block-all').textContent = projects.length;
    document.getElementById('badge-blocked').textContent = projects.filter(p => p.blocked).length;
    document.getElementById('badge-unblocked').textContent = projects.filter(p => !p.blocked).length;
}

// ==================== TABLE RENDERING ====================

function renderProjects() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const projectsToShow = filteredProjects.slice(start, end);

    if (projectsToShow.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <h3>No projects found</h3> <p>Try adjusting filters or search</p> </div>
                </td>
            </tr>
        `;
        updatePaginationInfo();
        return;
    }

    tbody.innerHTML = projectsToShow.map(project => `
        <tr>
            <td class="col-name">
                <div class="project-name">${project.name}</div>
            </td>
            <td class="col-concept">
                <div class="project-concept">${project._original?.concept || 'No defined concept'}</div>
            </td>
            <td class="col-status">
                <span class="status-badge ${statusMap[project.status]?.class || 'status-discovery'}">
                    ${statusMap[project.status]?.label || project.status}
                </span>
            </td>
            <td class="col-progress">
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                    <span class="progress-text">${project.progress}%</span>
                </div>
            </td>
            <td class="col-update">
                <span class="text-secondary">${formatDate(project.lastUpdate)}</span>
            </td>
            <td class="col-next">
                <span class="text-highlight">${project.nextStep}</span>
            </td>
            <td class="col-delivery">
                ${(() => {
            const status = getDeliveryStatus(project.deliveryDate);
            const icon = getDeliveryIcon(status.icon);
            return `<span class="delivery-date ${status.class}">${icon}${formatDate(project.deliveryDate)}</span>`;
        })()}
            </td>
            <td class="col-responsible">
                <span class="text-highlight">${project.responsible}</span>
            </td>
            <td class="col-blocked">
                <span class="${project.blocked ? 'block-yes' : 'block-no'}">
                    ${project.blocked ? 'Yes' : 'No'} </span>
            </td>
            </td>
            <td class="col-block-desc">
                ${project.blocked ? `
                    <div class="block-description">${project.blockReason}</div>
                ` : '<span class="text-secondary">—</span>'}
            </td>
            <td class="col-block-resp">
                ${project.blocked ? `
                    <div class="block-responsible">${project.blockResponsible}</div>
                ` : '<span class="text-secondary">—</span>'}
            </td>
            <td class="col-resources">
                <button class="btn-resources" onclick="openResourcesModal('${project.id}', event)">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="3" width="12" height="10" rx="2"/>
                        <path d="M2 6h12M6 3v3"/>
                    </svg>
                    View
                </button>
            </td>
        </tr>
    `).join('');

    updatePaginationInfo();
}

function updatePaginationInfo() {
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    const start = filteredProjects.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
    const end = Math.min(currentPage * itemsPerPage, filteredProjects.length);

    const currentPageEl = document.getElementById('currentPage');
    const totalPagesEl = document.getElementById('totalPages');
    const pageInfoEl = document.getElementById('pageInfo');
    const showingEl = document.getElementById('showingProjects');
    const totalEl = document.getElementById('totalProjects');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages || 1;
    if (pageInfoEl) pageInfoEl.textContent = `Showing ${start}-${end} of ${filteredProjects.length} projects`;
    if (showingEl) showingEl.textContent = filteredProjects.length;
    if (totalEl) totalEl.textContent = projects.length;

    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

function nextPage() {
    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderProjects();
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderProjects();
    }
}

// ==================== THEME ====================

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

// ==================== ANALYTICS MODAL ====================

function openAnalytics() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset ALL analytics filters including cross-filters
    activeAnalyticsFilters = {
        responsible: null,
        status: null,
        blocked: null,
        projectId: null,
        crossFilters: {
            responsible: null,
            status: null,
            blocked: null,
            projectId: null
        }
    };

    // Generate dynamic team filters
    generateAnalyticsFilters();

    setTimeout(() => {
        initializeCharts();
    }, 100);
}

function closeAnalytics() {
    const modal = document.getElementById('analyticsModal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';

    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });
    charts = {};
}

function getFilteredAnalyticsProjects() {
    return projects.filter(project => {
        if (activeAnalyticsFilters.responsible && project.responsible !== activeAnalyticsFilters.responsible) {
            return false;
        }
        if (activeAnalyticsFilters.status && project.status !== activeAnalyticsFilters.status) {
            return false;
        }
        if (activeAnalyticsFilters.blocked === true && !project.blocked) {
            return false;
        }
        if (activeAnalyticsFilters.blocked === false && project.blocked) {
            return false;
        }
        return true;
    });
}

// ======================= CROSS-FILTERING SYSTEM =======================

// Main cross-filtering function - handles clicks from any chart and applies filters across all charts
function applyCrossFilter(chartType, clickData) {
    const config = crossFilterConfig[chartType];
    if (!config) {
        console.warn(`No cross-filter config found for chart: ${chartType}`);
        return;
    }

    let filterValue = null;

    // Extract the filter value based on chart type and click data
    if (chartType === 'portfolioStatus') {
        filterValue = config.valueMap[clickData.index];
    } else if (chartType === 'teamWorkload') {
        // For team workload, get the responsible name from the team data
        const teamData = getTeamMembers().slice(0, 5);
        filterValue = teamData[clickData.index]?.name;
    } else if (chartType === 'blockers') {
        filterValue = config.valueMap[clickData.index]; // Index 0 = false, 1 = true
    }

    if (filterValue === undefined) return;

    // Check if we're clicking the same filter again (clear it)
    const currentValue = activeAnalyticsFilters.crossFilters[config.filterType];
    if (currentValue === filterValue) {
        activeAnalyticsFilters.crossFilters[config.filterType] = null;
    } else {
        activeAnalyticsFilters.crossFilters[config.filterType] = filterValue;
    }

    // Update the legacy filters for backward compatibility
    activeAnalyticsFilters[config.filterType] = activeAnalyticsFilters.crossFilters[config.filterType];

    // Update visual indicators and refresh all charts
    updateCrossFilterIndicators();
    updateFilterChips();
    updateCrossFilterChips();
    refreshAllChartsWithCrossFilters();

    console.log(`🎯 Cross-filter applied: ${chartType} -> ${config.filterType}:${filterValue}`);
}

// Clear all cross-filters
function clearAllCrossFilters() {
    activeAnalyticsFilters.crossFilters = {
        responsible: null,
        status: null,
        blocked: null,
        projectId: null
    };

    // Sync legacy filters
    activeAnalyticsFilters.responsible = null;
    activeAnalyticsFilters.status = null;
    activeAnalyticsFilters.blocked = null;

    updateCrossFilterIndicators();
    updateFilterChips();
    updateCrossFilterChips();
    refreshAllChartsWithCrossFilters();

    console.log('🗑️ All cross-filters cleared');
}

// Get projects filtered by cross-filters only (ignoring manual filters)
function getCrossFilteredProjects() {
    return projects.filter(project => {
        // Apply cross-filters
        if (activeAnalyticsFilters.crossFilters.responsible &&
            project.responsible !== activeAnalyticsFilters.crossFilters.responsible) {
            return false;
        }
        if (activeAnalyticsFilters.crossFilters.status &&
            project.status !== activeAnalyticsFilters.crossFilters.status) {
            return false;
        }
        if (activeAnalyticsFilters.crossFilters.blocked !== null &&
            project.blocked !== activeAnalyticsFilters.crossFilters.blocked) {
            return false;
        }
        if (activeAnalyticsFilters.crossFilters.projectId &&
            project.id !== activeAnalyticsFilters.crossFilters.projectId) {
            return false;
        }
        return true;
    });
}

// Refresh all charts with cross-filtering applied
function refreshAllChartsWithCrossFilters() {
    const crossFilteredProjects = getCrossFilteredProjects();

    updateKPIsWithCrossFilters(crossFilteredProjects);
    updateAllChartsWithCrossFilters(crossFilteredProjects);
}

// Update KPIs with cross-filtered data
function updateKPIsWithCrossFilters(filteredProjects = getCrossFilteredProjects()) {
    const activeProjects = filteredProjects.filter(p => p.status !== 'completed').length;
    const riskProjects = filteredProjects.filter(p => {
        if (p.status === 'completed') return false;
        const status = getDeliveryStatus(p.deliveryDate);
        return (status.class === 'urgent' || status.class === 'soon');
    }).length;
    const blockedProjects = filteredProjects.filter(p => p.blocked).length;
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;

    const kpiActive = document.getElementById('kpi-active');
    const kpiRisk = document.getElementById('kpi-risk');
    const kpiBlocked = document.getElementById('kpi-blocked');
    const kpiCompleted = document.getElementById('kpi-completed');

    if (kpiActive) kpiActive.textContent = activeProjects;
    if (kpiRisk) kpiRisk.textContent = riskProjects;
    if (kpiBlocked) kpiBlocked.textContent = blockedProjects;
    if (kpiCompleted) kpiCompleted.textContent = completedProjects;
}

// Update charts with cross-filtered data
function updateAllChartsWithCrossFilters(crossFilteredProjects) {
    const statusCounts = {
        discovery: crossFilteredProjects.filter(p => p.status === 'discovery').length,
        decision: crossFilteredProjects.filter(p => p.status === 'decision').length,
        develop: crossFilteredProjects.filter(p => p.status === 'develop').length,
        pilot: crossFilteredProjects.filter(p => p.status === 'pilot').length,
        yokotenkai: crossFilteredProjects.filter(p => p.status === 'yokotenkai').length,
        finished: crossFilteredProjects.filter(p => p.status === 'finished').length
    };

    // Portfolio Status Chart
    if (charts.portfolioStatus) {
        charts.portfolioStatus.data.datasets[0].data = [
            statusCounts.discovery, statusCounts.decision, statusCounts.develop, statusCounts.pilot, statusCounts.yokotenkai, statusCounts.finished
        ];
        charts.portfolioStatus.update('active');
    }

    // Team Workload Chart - Show only cross-filtered data
    if (charts.teamWorkload) {
        const teamData = getTeamMembers().slice(0, 5);
        const filteredTeamData = teamData.map(member => {
            const memberProjects = crossFilteredProjects.filter(p => p.responsible === member.name);
            return {
                name: member.name,
                progress: memberProjects.filter(p => p.status === 'progress').length,
                hold: memberProjects.filter(p => p.status === 'hold').length,
                discovery: memberProjects.filter(p => p.status === 'discovery').length,
                completed: memberProjects.filter(p => p.status === 'completed').length
            };
        });

        // Update dataset data
        charts.teamWorkload.data.datasets.forEach((dataset, index) => {
            if (index === 0) dataset.data = filteredTeamData.map(m => m.progress);
            else if (index === 1) dataset.data = filteredTeamData.map(m => m.hold);
            else if (index === 2) dataset.data = filteredTeamData.map(m => m.discovery);
            else if (index === 3) dataset.data = filteredTeamData.map(m => m.completed);
        });
        charts.teamWorkload.update('active');
    }

    // Progress Overview Chart - Filter to active projects in cross-filtered data
    if (charts.progressOverview) {
        const progressProjects = crossFilteredProjects
            .filter(p => p.status !== 'completed')
            .sort((a, b) => a.progress - b.progress)
            .slice(0, 10);

        charts.progressOverview.data.labels = progressProjects.map(p => p.name);
        charts.progressOverview.data.datasets[0].data = progressProjects.map(p => p.progress);
        charts.progressOverview.data.datasets[0].backgroundColor = progressProjects.map(p => {
            if (p.progress >= 80) return 'rgba(48, 209, 88, 0.85)';
            if (p.progress >= 50) return 'rgba(102, 126, 234, 0.85)';
            if (p.progress >= 30) return 'rgba(255, 159, 10, 0.85)';
            return 'rgba(255, 69, 58, 0.85)';
        });
        charts.progressOverview.update('active');
    }

    // Blockers Chart
    if (charts.blockers) {
        const blockedCount = crossFilteredProjects.filter(p => p.blocked).length;
        const unblockedCount = crossFilteredProjects.filter(p => !p.blocked).length;
        charts.blockers.data.datasets[0].data = [unblockedCount, blockedCount];
        charts.blockers.update('active');
    }

    // Delivery Timeline and Burndown charts
    if (charts.deliveryTimeline) {
        const deliveryData = getDeliveryTimelineData(crossFilteredProjects);
        charts.deliveryTimeline.data.labels = deliveryData.labels;
        charts.deliveryTimeline.data.datasets[0].data = deliveryData.values;
        charts.deliveryTimeline.update('active');
    }

    if (charts.burndown) {
        const burndownData = getBurndownData(crossFilteredProjects);
        charts.burndown.data.labels = burndownData.labels;
        charts.burndown.data.datasets[0].data = burndownData.ideal;
        charts.burndown.data.datasets[1].data = burndownData.actual;
        charts.burndown.update('active');
    }
}

// Update visual indicators for cross-filters
function updateCrossFilterIndicators() {
    const container = document.getElementById('analyticsFilters');
    if (!container) return;

    // Add or update cross-filter indicator if any filters are active
    const hasActiveCrossFilters = Object.values(activeAnalyticsFilters.crossFilters).some(val => val !== null);

    let crossFilterIndicator = document.getElementById('crossFilterIndicator');
    if (!crossFilterIndicator && hasActiveCrossFilters) {
        crossFilterIndicator = document.createElement('div');
        crossFilterIndicator.id = 'crossFilterIndicator';
        crossFilterIndicator.style.cssText = `
            position: relative;
            padding: 4px 8px;
            margin: 0 8px;
            background: rgba(52, 199, 89, 0.15);
            border: 1px solid rgba(52, 199, 89, 0.3);
            border-radius: 6px;
            font-size: 11px;
            color: rgba(52, 199, 89, 0.9);
            display: flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
        `;
        crossFilterIndicator.onclick = clearAllCrossFilters;

        const icon = document.createElement('svg');
        icon.setAttribute('width', '12');
        icon.setAttribute('height', '12');
        icon.setAttribute('viewBox', '0 0 12 12');
        icon.innerHTML = `
            <path d="M1.5 1.5L10.5 10.5M1.5 10.5L10.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        `;
        crossFilterIndicator.appendChild(icon);

        const text = document.createElement('span');
        text.textContent = 'Active Cross-filters';
        crossFilterIndicator.appendChild(text);

        // Insert after title
        const title = container.querySelector('div');
        if (title && title.nextSibling) {
            container.insertBefore(crossFilterIndicator, title.nextSibling);
        } else {
            container.appendChild(crossFilterIndicator);
        }
    } else if (crossFilterIndicator && !hasActiveCrossFilters) {
        crossFilterIndicator.remove();
    }
}

// Update cross-filter chips (separate from manual filter chips)
function updateCrossFilterChips() {
    document.querySelectorAll('.cross-filter-chip').forEach(chip => chip.remove());

    const container = document.getElementById('analyticsFilters');
    if (!container) return;

    // Find where to insert cross-filter chips (after cross-filter indicator if exists, or after title)
    const crossFilterIndicator = document.getElementById('crossFilterIndicator');
    const insertAfter = crossFilterIndicator || container.querySelector('div');

    if (!insertAfter) return;

    Object.entries(activeAnalyticsFilters.crossFilters).forEach(([filterType, value]) => {
        if (value === null) return;

        let displayText = '';
        let icon = '';

        switch (filterType) {
            case 'responsible':
                displayText = `Resp: ${value}`;
                icon = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 10C2 8.67097 3.34315 8 5 8H7C8.65685 8 10 8.67097 10 10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                break;
            case 'status':
                displayText = `Status: ${statusMap[value]?.label || value}`;
                icon = '<div style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></div>';
                break;
            case 'blocked':
                displayText = value ? 'Blocked' : 'Unblocked';
                icon = value ?
                    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 10H1L6 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' :
                    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                break;
            case 'projectId':
                const project = projects.find(p => p.id === value);
                displayText = project ? `${project.name}` : `Project ${value}`;
                icon = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="3" width="8" height="7" rx="1" stroke="currentColor" stroke-width="1.5"/><path d="M8 1V3M4 1V3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                break;
        }

        const chip = document.createElement('div');
        chip.className = 'cross-filter-chip';
        chip.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            margin: 2px 4px 2px 0;
            background: rgba(255, 69, 58, 0.15);
            border: 1px solid rgba(255, 69, 58, 0.3);
            border-radius: 6px;
            font-size: 11px;
            color: rgba(255, 69, 58, 0.9);
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        chip.innerHTML = `${icon}${displayText}<span style="margin-left: 4px; opacity: 0.7;">×</span>`;
        chip.onclick = () => {
            activeAnalyticsFilters.crossFilters[filterType] = null;
            activeAnalyticsFilters[filterType] = null; // Sync legacy
            updateCrossFilterIndicators();
            updateFilterChips();
            updateCrossFilterChips();
            refreshAllChartsWithCrossFilters();
        };

        insertAfter.insertAdjacentElement('afterend', chip);
    });
}

// Legacy function - updated to work with cross-filters
function updateAnalyticsFilter(filterType, value) {
    // Convert string 'true'/'false' to boolean for blocked filter
    if (filterType === 'blocked' && typeof value === 'string') {
        value = value === 'true';
    }

    if (activeAnalyticsFilters[filterType] === value) {
        // Clear this specific filter
        activeAnalyticsFilters[filterType] = null;
        activeAnalyticsFilters.crossFilters[filterType] = null;
    } else {
        // Set this filter and clear cross-filters
        activeAnalyticsFilters[filterType] = value;
        // Clear cross-filters when manual filter is applied
        activeAnalyticsFilters.crossFilters = {
            responsible: null,
            status: null,
            blocked: null,
            projectId: null
        };
    }

    updateFilterChips();
    updateCrossFilterIndicators();
    updateCrossFilterChips();

    setTimeout(() => {
        const filteredProjects = getFilteredAnalyticsProjects();
        updateKPIsWithCrossFilters(filteredProjects);
        updateAllChartsWithCrossFilters(filteredProjects);
    }, 50);
}

function generateAnalyticsFilters() {
    const container = document.getElementById('analyticsFilters');
    if (!container || !projects.length) return;

    // Get unique responsibles from projects
    const responsibles = [...new Set(projects.map(p => p.responsible))].filter(r => r && r !== 'Unassigned');

    // Build filter HTML
    let html = `
        <div style="font-size: 12px; font-weight: 600; color: rgba(245, 245, 247, 0.6); text-transform: uppercase; letter-spacing: 0.5px; margin-right: 12px; display: flex; align-items: center;">
            Interactive Filters:
        </div>

        `;

    // ... resto de la función generateAnalyticsFilters (se mantiene igual, ya tienes los chips en inglés en el código anterior)
    // Nota: Asegúrate de que los textos de los chips ("In Progress", etc.) en el resto de esta función ya estén en inglés como corregimos antes.

    // ... (Para completar la función, asegúrate de usar la versión del código anterior que ya tenía "In Progress", "Blocked", etc.)

    // Aquí está el resto de generateAnalyticsFilters resumido para contexto:
    responsibles.slice(0, 5).forEach((responsible, index) => {
        const names = responsible.split(' ');
        const displayName = names.length > 1 ? `${names[0].charAt(0)}${names[1].charAt(0)}` : names[0].slice(0, 2);
        html += `
        <div class="filter-chip" data-filter-type="responsible" data-filter-value="${responsible}" onclick="updateAnalyticsFilter('responsible', '${responsible}')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="4.5" r="2.5" stroke="currentColor" stroke-width="1.5"/>
                <path d="M2 12C2 9.79086 3.79086 8 6 8H8C10.2091 8 12 9.79086 12 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            ${displayName}
        </div>`;
    });

    html += `
        <div class="filter-divider"></div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="discovery" onclick="updateAnalyticsFilter('status', 'discovery')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(147, 112, 219, 0.85);"></div>
            Discovery
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="decision" onclick="updateAnalyticsFilter('status', 'decision')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 193, 7, 0.85);"></div>
            Decision
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="develop" onclick="updateAnalyticsFilter('status', 'develop')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(52, 152, 219, 0.85);"></div>
            Develop
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="pilot" onclick="updateAnalyticsFilter('status', 'pilot')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(230, 126, 34, 0.85);"></div>
            Pilot
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="yokotenkai" onclick="updateAnalyticsFilter('status', 'yokotenkai')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(219, 112, 147, 0.85);"></div>
            Yokotenkai
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="finished" onclick="updateAnalyticsFilter('status', 'finished')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(46, 204, 113, 0.85);"></div>
            Finished
        </div>

        <div class="filter-divider"></div>

        <div class="filter-chip" data-filter-type="blocked" data-filter-value="true" onclick="updateAnalyticsFilter('blocked', true)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            Blocked
        </div>
        <div class="filter-chip" data-filter-type="blocked" data-filter-value="false" onclick="updateAnalyticsFilter('blocked', false)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Unblocked
        </div>`;

    container.innerHTML = html;
}

function updateFilterChips() {
    document.querySelectorAll('.filter-chip').forEach(btn => {
        const filterType = btn.getAttribute('data-filter-type');
        const filterValue = btn.getAttribute('data-filter-value');

        if (activeAnalyticsFilters[filterType] === filterValue ||
            (filterType === 'blocked' && activeAnalyticsFilters[filterType] === (filterValue === 'true'))) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

// ==================== CHARTS ====================

function initializeCharts() {
    Object.values(charts).forEach(chart => {
        if (chart) chart.destroy();
    });

    const isDarkMode = !document.body.classList.contains('light-mode');
    const textColor = isDarkMode ? 'rgba(245, 245, 247, 0.8)' : 'rgba(29, 29, 31, 0.8)';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

    updateKPIs();

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 1500,
            easing: 'easeInOutQuart'
        },
        plugins: {
            legend: {
                labels: {
                    color: textColor,
                    font: {
                        size: 12,
                        family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
                        weight: '500'
                    },
                    padding: 16
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: isDarkMode ? 'rgba(18, 18, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                titleColor: isDarkMode ? '#f5f5f7' : '#1d1d1f',
                bodyColor: isDarkMode ? 'rgba(245, 245, 247, 0.8)' : 'rgba(29, 29, 31, 0.8)'
            }
        }
    };

    const filteredProjects = getFilteredAnalyticsProjects();
    const statusCounts = {
        discovery: filteredProjects.filter(p => p.status === 'discovery').length,
        decision: filteredProjects.filter(p => p.status === 'decision').length,
        develop: filteredProjects.filter(p => p.status === 'develop').length,
        pilot: filteredProjects.filter(p => p.status === 'pilot').length,
        yokotenkai: filteredProjects.filter(p => p.status === 'yokotenkai').length,
        finished: filteredProjects.filter(p => p.status === 'finished').length
    };

    // Portfolio Status Chart
    const portfolioStatusCtx = document.getElementById('portfolioStatusChart');
    if (portfolioStatusCtx) {
        charts.portfolioStatus = new Chart(portfolioStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Discovery', 'Decision', 'Develop', 'Pilot', 'Yokotenkai', 'Finished'],
                datasets: [{
                    data: [statusCounts.discovery, statusCounts.decision, statusCounts.develop, statusCounts.pilot, statusCounts.yokotenkai, statusCounts.finished],
                    backgroundColor: [
                        'rgba(157, 0, 255, 0.85)',
                        'rgba(255, 214, 0, 0.85)',
                        'rgba(0, 217, 255, 0.85)',
                        'rgba(255, 107, 0, 0.85)',
                        'rgba(0, 191, 255, 0.85)',
                        'rgba(0, 255, 133, 0.85)'
                    ],
                    borderWidth: 3,
                    borderColor: isDarkMode ? '#000000' : '#ffffff'
                }]
            },
            options: {
                ...commonOptions,
                cutout: '68%',
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        applyCrossFilter('portfolioStatus', { index });
                    }
                }
            }
        });
    }

    // Team Workload Chart
    const teamData = getTeamMembers().slice(0, 5);
    const filteredTeamData = teamData.map(member => {
        const memberProjects = filteredProjects.filter(p => p.responsible === member.name);
        return {
            name: member.name,
            progress: memberProjects.filter(p => p.status === 'progress').length,
            hold: memberProjects.filter(p => p.status === 'hold').length,
            discovery: memberProjects.filter(p => p.status === 'discovery').length,
            completed: memberProjects.filter(p => p.status === 'completed').length
        };
    });

    const teamWorkloadCtx = document.getElementById('teamWorkloadChart');
    if (teamWorkloadCtx) {
        charts.teamWorkload = new Chart(teamWorkloadCtx, {
            type: 'bar',
            data: {
                labels: filteredTeamData.map(m => m.name.split(' ')[0]),
                datasets: [
                    {
                        label: 'In Progress',
                        data: filteredTeamData.map(m => m.progress),
                        backgroundColor: 'rgba(52, 199, 89, 0.85)',
                        borderRadius: 8
                    },
                    {
                        label: 'On Hold',
                        data: filteredTeamData.map(m => m.hold),
                        backgroundColor: 'rgba(255, 159, 10, 0.85)',
                        borderRadius: 8
                    },
                    {
                        label: 'Discovery',
                        data: filteredTeamData.map(m => m.discovery),
                        backgroundColor: 'rgba(191, 90, 242, 0.85)',
                        borderRadius: 8
                    },
                    {
                        label: 'Completed',
                        data: filteredTeamData.map(m => m.completed),
                        backgroundColor: 'rgba(48, 209, 88, 0.85)',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        stacked: true,
                        ticks: { color: textColor }
                    },
                    x: {
                        stacked: true,
                        ticks: { color: textColor }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        applyCrossFilter('teamWorkload', { index });
                    }
                }
            }
        });
    }

    // Progress Overview Chart
    const progressProjects = filteredProjects
        .filter(p => p.status !== 'completed')
        .sort((a, b) => a.progress - b.progress)
        .slice(0, 10);

    const progressCtx = document.getElementById('progressOverviewChart');
    if (progressCtx) {
        charts.progressOverview = new Chart(progressCtx, {
            type: 'bar',
            data: {
                labels: progressProjects.map(p => p.name),
                datasets: [{
                    label: '% Completed',
                    data: progressProjects.map(p => p.progress),
                    backgroundColor: progressProjects.map(p => {
                        if (p.progress >= 80) return 'rgba(48, 209, 88, 0.85)';
                        if (p.progress >= 50) return 'rgba(102, 126, 234, 0.85)';
                        if (p.progress >= 30) return 'rgba(255, 159, 10, 0.85)';
                        return 'rgba(255, 69, 58, 0.85)';
                    }),
                    borderRadius: 6
                }]
            },
            options: {
                ...commonOptions,
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: textColor }
                    },
                    y: {
                        ticks: { color: textColor }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const projectIndex = elements[0].index;
                        const clickedProject = progressProjects[projectIndex];
                        if (clickedProject) {
                            const currentProjectId = activeAnalyticsFilters.crossFilters.projectId;
                            if (currentProjectId === clickedProject.id) {
                                activeAnalyticsFilters.crossFilters.projectId = null;
                            } else {
                                activeAnalyticsFilters.crossFilters.projectId = clickedProject.id;
                            }
                            activeAnalyticsFilters.projectId = activeAnalyticsFilters.crossFilters.projectId;
                            updateCrossFilterIndicators();
                            updateFilterChips();
                            updateCrossFilterChips();
                            refreshAllChartsWithCrossFilters();
                            console.log(`🎯 Project filtered: ${clickedProject.name}`);
                        }
                    }
                }
            }
        });
    }

    // Blockers Chart
    const blockedCount = filteredProjects.filter(p => p.blocked).length;
    const unblockedCount = filteredProjects.filter(p => !p.blocked).length;

    const blockersCtx = document.getElementById('blockersChart');
    if (blockersCtx) {
        charts.blockers = new Chart(blockersCtx, {
            type: 'doughnut',
            data: {
                labels: ['No Blockers', 'Blocked'],
                datasets: [{
                    data: [unblockedCount, blockedCount],
                    backgroundColor: [
                        'rgba(52, 199, 89, 0.85)',
                        'rgba(255, 69, 58, 0.85)'
                    ],
                    borderWidth: 3,
                    borderColor: isDarkMode ? '#000000' : '#ffffff'
                }]
            },
            options: {
                ...commonOptions,
                cutout: '68%',
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        // Index 0 = Unblocked (false), Index 1 = Blocked (true)
                        applyCrossFilter('blockers', { index });
                    }
                }
            }
        });
    }

    // Delivery Timeline Chart
    const deliveryData = getDeliveryTimelineData(filteredProjects);
    const deliveryCtx = document.getElementById('deliveryTimelineChart');
    if (deliveryCtx) {
        charts.deliveryTimeline = new Chart(deliveryCtx, {
            type: 'line',
            data: {
                labels: deliveryData.labels,
                datasets: [{
                    label: 'Projects to Deliver',
                    data: deliveryData.values,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: 'rgba(102, 126, 234, 1)',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            stepSize: 1,
                            callback: function (value) {
                                if (Number.isInteger(value)) {
                                    return value;
                                }
                            }
                        },
                        grid: {
                            color: gridColor,
                            drawBorder: false
                        },
                        title: {
                            display: true,
                            text: 'Number of Projects',
                            color: textColor,
                            font: {
                                size: 12,
                                weight: '600'
                            }
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    ...commonOptions.plugins,
                    tooltip: {
                        ...commonOptions.plugins.tooltip,
                        callbacks: {
                            title: function (context) {
                                return context[0].label;
                            },
                            label: function (context) {
                                const count = context.parsed.y;
                                if (count === 0) {
                                    return 'No scheduled deliveries';
                                } else if (count === 1) {
                                    return '1 project to deliver';
                                } else {
                                    return `${count} projects to deliver`;
                                }
                            },
                            afterLabel: function (context) {
                                const monthLabel = context.label;
                                const count = context.parsed.y;

                                if (count === 0) return '';

                                // Encontrar qué proyectos se entregan en este mes
                                const monthIndex = deliveryData.labels.indexOf(monthLabel);
                                if (monthIndex === -1) return '';

                                const monthData = deliveryData.months[monthIndex];
                                const projectsInMonth = filteredProjects.filter(p => {
                                    if (!p.deliveryDate) return false;
                                    const d = new Date(p.deliveryDate);
                                    return d.getMonth() === monthData.month &&
                                        d.getFullYear() === monthData.year;
                                });

                                // Mostrar máximo 3 proyectos en el tooltip
                                const projectNames = projectsInMonth
                                    .slice(0, 3)
                                    .map(p => `• ${p.name}`);

                                if (projectsInMonth.length > 3) {
                                    projectNames.push(`• ... and ${projectsInMonth.length - 3} more`);
                                }

                                return ['\\nProjects:', ...projectNames];
                            }
                        },
                        padding: 12,
                        displayColors: false
                    },
                    legend: {
                        display: false
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Burndown Chart
    const burndownData = getBurndownData(filteredProjects);
    const burndownCtx = document.getElementById('burndownChart');
    if (burndownCtx) {
        charts.burndown = new Chart(burndownCtx, {
            type: 'line',
            data: {
                labels: burndownData.labels,
                datasets: [
                    {
                        label: 'Target',
                        data: burndownData.ideal,
                        borderColor: 'rgba(134, 134, 139, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    },
                    {
                        label: 'Actual',
                        data: burndownData.actual,
                        borderColor: 'rgba(52, 199, 89, 1)',
                        backgroundColor: 'rgba(52, 199, 89, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...commonOptions,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: textColor }
                    },
                    x: {
                        ticks: { color: textColor }
                    }
                }
            }
        });
    }
}

function updateAllCharts() {
    const filteredProjects = getFilteredAnalyticsProjects();

    // Update Portfolio Status
    if (charts.portfolioStatus) {
        const statusCounts = {
            discovery: filteredProjects.filter(p => p.status === 'discovery').length,
            decision: filteredProjects.filter(p => p.status === 'decision').length,
            develop: filteredProjects.filter(p => p.status === 'develop').length,
            pilot: filteredProjects.filter(p => p.status === 'pilot').length,
            yokotenkai: filteredProjects.filter(p => p.status === 'yokotenkai').length,
            finished: filteredProjects.filter(p => p.status === 'finished').length
        };
        charts.portfolioStatus.data.datasets[0].data = [
            statusCounts.discovery, statusCounts.decision, statusCounts.develop, statusCounts.pilot, statusCounts.yokotenkai, statusCounts.finished
        ];
        charts.portfolioStatus.update('active');
    }

    // Update other charts similarly...
    if (charts.teamWorkload) {
        charts.teamWorkload.update('active');
    }

    if (charts.progressOverview) {
        charts.progressOverview.update('active');
    }

    if (charts.blockers) {
        const blockedCount = filteredProjects.filter(p => p.blocked).length;
        const unblockedCount = filteredProjects.filter(p => !p.blocked).length;
        charts.blockers.data.datasets[0].data = [unblockedCount, blockedCount];
        charts.blockers.update('active');
    }

    if (charts.deliveryTimeline) {
        const deliveryData = getDeliveryTimelineData(filteredProjects);
        charts.deliveryTimeline.data.labels = deliveryData.labels;
        charts.deliveryTimeline.data.datasets[0].data = deliveryData.values;
        charts.deliveryTimeline.update('active');
    }

    if (charts.burndown) {
        const burndownData = getBurndownData(filteredProjects);
        charts.burndown.data.labels = burndownData.labels;
        charts.burndown.data.datasets[0].data = burndownData.ideal;
        charts.burndown.data.datasets[1].data = burndownData.actual;
        charts.burndown.update('active');
    }
}

function updateKPIs() {
    const filteredProjects = getFilteredAnalyticsProjects();

    const activeProjects = filteredProjects.filter(p => p.status !== 'completed').length;
    const riskProjects = filteredProjects.filter(p => {
        if (p.status === 'completed') return false;
        const status = getDeliveryStatus(p.deliveryDate);
        return (status.class === 'urgent' || status.class === 'soon');
    }).length;
    const blockedProjects = filteredProjects.filter(p => p.blocked).length;
    const completedProjects = filteredProjects.filter(p => p.status === 'completed').length;

    const kpiActive = document.getElementById('kpi-active');
    const kpiRisk = document.getElementById('kpi-risk');
    const kpiBlocked = document.getElementById('kpi-blocked');
    const kpiCompleted = document.getElementById('kpi-completed');

    if (kpiActive) kpiActive.textContent = activeProjects;
    if (kpiRisk) kpiRisk.textContent = riskProjects;
    if (kpiBlocked) kpiBlocked.textContent = blockedProjects;
    if (kpiCompleted) kpiCompleted.textContent = completedProjects;
}

function getDeliveryTimelineData(projectsList = projects) {
    const today = new Date();
    const currentMonth = today.getMonth(); // 0-11
    const currentYear = today.getFullYear();

    // Definir el rango: Nov del año actual hasta Mayo del siguiente
    // Si estamos antes de Noviembre, usar Nov del año anterior
    let startYear = currentYear;
    let startMonth = 10; // Noviembre (0-indexed)

    // Si estamos en los primeros meses del año (Ene-Oct),
    // el periodo Nov-May abarca del año anterior al actual
    if (currentMonth < 10) {
        startYear = currentYear - 1;
    }

    const months = [];
    const labels = [];
    // Cambio de nombres de meses a Inglés
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Generar 7 meses: Nov, Dic, Ene, Feb, Mar, Abr, May
    for (let i = 0; i < 7; i++) {
        let month = (startMonth + i) % 12;
        let year = startYear;

        // Si pasamos de Diciembre a Enero, incrementar año
        if (startMonth + i >= 12) {
            year = startYear + 1;
        }

        months.push({ month, year });
        labels.push(`${monthNames[month]} ${year}`);
    }

    // Contar entregas por mes
    const deliveryCounts = new Array(7).fill(0);

    projectsList.forEach(project => {
        if (!project.deliveryDate) return;

        const deliveryDate = new Date(project.deliveryDate);
        const deliveryMonth = deliveryDate.getMonth();
        const deliveryYear = deliveryDate.getFullYear();

        // Buscar en qué mes del rango cae esta entrega
        months.forEach((monthData, index) => {
            if (monthData.month === deliveryMonth && monthData.year === deliveryYear) {
                deliveryCounts[index]++;
            }
        });
    });

    return {
        labels,
        values: deliveryCounts,
        months: months // Útil para debug
    };
}

function getBurndownData(projectsList) {
    // Cambio de nombres de meses a Inglés
    const months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    const totalProjects = projectsList.filter(p => p.status !== 'completed').length;
    const completedByMonth = [0, 3, 7, 12, 15];
    const monthsToComplete = 4;
    const idealRate = totalProjects / monthsToComplete;
    const idealLine = months.map((_, index) => Math.max(0, totalProjects - (idealRate * index)));
    const actualLine = months.map((_, index) => {
        const completed = completedByMonth[index] || 0;
        return Math.max(0, totalProjects - completed);
    });

    return {
        labels: months,
        ideal: idealLine,
        actual: actualLine
    };
}

// ==================== KEYBOARD SHORTCUTS ====================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('analyticsModal');
        if (modal && modal.classList.contains('active')) {
            closeAnalytics();
        } else {
            clearAllFilters();
        }
    } else if (e.key === 'ArrowLeft') {
        previousPage();
    } else if (e.key === 'ArrowRight') {
        nextPage();
    }
});

// ==================== PRESENTATION MODE ====================

function togglePresentationMode() {
    document.body.classList.toggle('presentation-mode');
    const btnText = document.getElementById('presentationBtnText');
    const isPresentation = document.body.classList.contains('presentation-mode');
    if (btnText) {
        btnText.textContent = isPresentation ? 'Exit Presentation Mode' : 'Presentation Mode';
    }
}

// ==================== NAVIGATION ====================

function goToHome() {
    // Navegar al home
    window.location.href = 'index.html';
}

console.log('✓ Project Manager Script Cargado');

// ==================== TEXT TOOLTIP SYSTEM ====================

let currentTooltip = null;
let tooltipTimeout = null;

// Crear el elemento tooltip una sola vez
function createTooltipElement() {
    if (document.getElementById('textTooltip')) {
        return document.getElementById('textTooltip');
    }

    const tooltip = document.createElement('div');
    tooltip.id = 'textTooltip';
    tooltip.className = 'text-tooltip';
    tooltip.innerHTML = '<div class="text-tooltip-content"></div>';
    document.body.appendChild(tooltip);
    return tooltip;
}

// Verificar si un elemento está truncado
function isTextTruncated(element) {
    // Para elementos con -webkit-line-clamp
    if (window.getComputedStyle(element).webkitLineClamp) {
        return element.scrollHeight > element.clientHeight;
    }
    // Para elementos con overflow: hidden y text-overflow: ellipsis
    return element.scrollWidth > element.clientWidth || element.scrollHeight > element.clientHeight;
}

// Mostrar tooltip
function showTooltip(element, text) {
    if (!text || text.trim() === '' || text === '—' || text === 'No defined concept') {
        return;
    }

    // Verificar si el texto está truncado
    if (!isTextTruncated(element)) {
        return;
    }

    const tooltip = createTooltipElement();
    const content = tooltip.querySelector('.text-tooltip-content');
    content.textContent = text;

    // Posicionar el tooltip
    const rect = element.getBoundingClientRect();

    // Mostrar tooltip temporalmente para medir su tamaño
    tooltip.style.opacity = '0';
    tooltip.style.display = 'block';
    const tooltipRect = tooltip.getBoundingClientRect();
    tooltip.style.display = '';
    tooltip.style.opacity = '';

    // Calcular posición (arriba del elemento por defecto, con flecha apuntando hacia abajo)
    let top = rect.top - tooltipRect.height - 12; // 12px de espacio para la flecha
    let left = rect.left;

    // Ajustar si se sale de la pantalla por arriba
    const showBelow = top < 10;
    if (showBelow) {
        top = rect.bottom + 12; // Mostrar abajo si no cabe arriba (flecha apunta hacia arriba)
    }

    // Ajustar si se sale de la pantalla por la izquierda
    if (left < 10) {
        left = 10;
    }

    // Ajustar si se sale de la pantalla por la derecha
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }

    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Calcular posición de la flecha para que apunte al centro del elemento
    const elementCenter = rect.left + (rect.width / 2);
    const tooltipLeft = left;
    const arrowLeft = elementCenter - tooltipLeft;

    // Asegurar que la flecha esté dentro del tooltip (con margen)
    const clampedArrowLeft = Math.max(16, Math.min(arrowLeft, tooltipRect.width - 16));

    // Aplicar posición de la flecha usando CSS variable
    tooltip.style.setProperty('--arrow-left', `${clampedArrowLeft}px`);

    // Si el tooltip está abajo, invertir la flecha
    if (showBelow) {
        tooltip.classList.add('tooltip-below');
    } else {
        tooltip.classList.remove('tooltip-below');
    }

    // Mostrar con delay
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(() => {
        tooltip.classList.add('active');
    }, 300);

    currentTooltip = tooltip;
}

// Ocultar tooltip
function hideTooltip() {
    clearTimeout(tooltipTimeout);
    if (currentTooltip) {
        currentTooltip.classList.remove('active');
        currentTooltip = null;
    }
}

// Inicializar tooltips con event delegation (solo una vez)
function initializeTooltips() {
    const tbody = document.getElementById('projectsBody');
    if (!tbody || tbody.dataset.tooltipsInitialized) return;

    // Marcar como inicializado
    tbody.dataset.tooltipsInitialized = 'true';

    // Usar event delegation en el tbody
    tbody.addEventListener('mouseenter', function (e) {
        const target = e.target;

        // Verificar si el elemento es uno de los que necesita tooltip
        if (target.classList.contains('project-concept') ||
            (target.classList.contains('text-highlight') && target.closest('.col-next')) ||
            target.classList.contains('block-description')) {
            showTooltip(target, target.textContent);
        }
    }, true); // useCapture = true para capturar en fase de captura

    tbody.addEventListener('mouseleave', function (e) {
        const target = e.target;

        // Verificar si el elemento es uno de los que tiene tooltip
        if (target.classList.contains('project-concept') ||
            (target.classList.contains('text-highlight') && target.closest('.col-next')) ||
            target.classList.contains('block-description')) {
            hideTooltip();
        }
    }, true);

    console.log('✓ Tooltips initialized with event delegation');
}

// Llamar initializeTooltips una sola vez cuando la app se inicializa
document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que el tbody exista
    const checkTbody = setInterval(() => {
        const tbody = document.getElementById('projectsBody');
        if (tbody) {
            clearInterval(checkTbody);
            initializeTooltips();
        }
    }, 100);
});
