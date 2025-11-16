// ============================================
// PROJECT MANAGER - Sistema dinámico con DataManager
// ============================================

let projects = [];
let filteredProjects = [];
let currentPage = 1;
const itemsPerPage = 10;
let charts = {};

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
        valueMap: ['progress', 'hold', 'discovery', 'completed']
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
    'in-progress': { label: 'En Progreso', class: 'status-progress' },
    'progress': { label: 'En Progreso', class: 'status-progress' },
    'hold': { label: 'En Hold', class: 'status-hold' },
    'discovery': { label: 'Discovery', class: 'status-discovery' },
    'completed': { label: 'Completado', class: 'status-completed' },
    'paused': { label: 'Pausado', class: 'status-hold' }
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
            name: p.title,
            status: normalizeStatus(p.status),
            progress: p.progress || 0,
            lastUpdate: p.updatedAt || new Date().toISOString(),
            nextStep: p.currentPhase || 'Por definir',
            deliveryDate: p.targetDate || new Date().toISOString(),
            responsible: dataManager.getUserById(p.ownerId)?.name || 'Sin asignar',
            ownerId: p.ownerId,
            blocked: p.blockers?.type === 'warning' || p.blockers?.type === 'error' ? true : false,
            blockReason: p.blockers?.message || 'Sin bloqueos',
            blockResponsible: 'Sistema',
            // Preservar datos originales
            _original: p
        }));
        
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
    if (statusLower.includes('progress')) return 'progress';
    if (statusLower.includes('hold')) return 'hold';
    if (statusLower.includes('discovery')) return 'discovery';
    if (statusLower.includes('completed')) return 'completed';
    return 'discovery';
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
    // Simular observador de cambios (verificar cada 2 segundos)
    setInterval(() => {
        checkForDataChanges();
    }, 2000);
    
    console.log('👁️ Observador de cambios activado');
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
        for (let i = 0; i < newProjects.length; i++) {
            if (JSON.stringify(newProjects[i]) !== JSON.stringify(projects[i]?._original)) {
                console.log('📝 Proyecto modificado:', newProjects[i].id);
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
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
                <div class="member-projects">${member.total} proyecto${member.total !== 1 ? 's' : ''} · ${member.blocked} bloqueado${member.blocked !== 1 ? 's' : ''}</div>
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
                <span>Estado: ${statusLabel}</span>
                <span class="chip-close">×</span>
            </div>
        `);
    }

    if (activeFilters.block !== 'all') {
        const blockLabel = activeFilters.block === 'blocked' ? 'Con Bloqueos' : 'Sin Bloqueos';
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
    document.getElementById('badge-progress').textContent = projects.filter(p => p.status === 'progress').length;
    document.getElementById('badge-hold').textContent = projects.filter(p => p.status === 'hold').length;
    document.getElementById('badge-discovery').textContent = projects.filter(p => p.status === 'discovery').length;
    document.getElementById('badge-completed').textContent = projects.filter(p => p.status === 'completed').length;

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
                        <h3>No se encontraron proyectos</h3>
                        <p>Intenta ajustar los filtros o búsqueda</p>
                    </div>
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
                    ${project.blocked ? 'Sí' : 'No'}
                </span>
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
    if (pageInfoEl) pageInfoEl.textContent = `Mostrando ${start}-${end} de ${filteredProjects.length} proyectos`;
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
        progress: crossFilteredProjects.filter(p => p.status === 'progress').length,
        hold: crossFilteredProjects.filter(p => p.status === 'hold').length,
        discovery: crossFilteredProjects.filter(p => p.status === 'discovery').length,
        completed: crossFilteredProjects.filter(p => p.status === 'completed').length
    };

    // Portfolio Status Chart
    if (charts.portfolioStatus) {
        charts.portfolioStatus.data.datasets[0].data = [
            statusCounts.progress, statusCounts.hold, statusCounts.discovery, statusCounts.completed
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
        text.textContent = 'Cross-filters activos';
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
                displayText = `Estado: ${statusMap[value]?.label || value}`;
                icon = '<div style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></div>';
                break;
            case 'blocked':
                displayText = value ? 'Bloqueados' : 'Sin Bloqueos';
                icon = value ?
                    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L11 10H1L6 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' :
                    '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                break;
            case 'projectId':
                const project = projects.find(p => p.id === value);
                displayText = project ? `${project.name}` : `Proyecto ${value}`;
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
    const responsibles = [...new Set(projects.map(p => p.responsible))].filter(r => r && r !== 'Sin asignar');

    // Build filter HTML
    let html = `
        <div style="font-size: 12px; font-weight: 600; color: rgba(245, 245, 247, 0.6); text-transform: uppercase; letter-spacing: 0.5px; margin-right: 12px; display: flex; align-items: center;">
            Filtros Interactivos:
        </div>

        <!-- Team Filters -->`;

    responsibles.slice(0, 5).forEach((responsible, index) => {
        const names = responsible.split(' ');
        const displayName = names.length > 1 ? `${names[0].charAt(0)}${names[1].charAt(0)}` : names[0].slice(0,2);
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

        <!-- Status Filters -->
        <div class="filter-chip" data-filter-type="status" data-filter-value="progress" onclick="updateAnalyticsFilter('status', 'progress')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(52, 199, 89, 0.85);"></div>
            En Progreso
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="hold" onclick="updateAnalyticsFilter('status', 'hold')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(255, 159, 10, 0.85);"></div>
            En Hold
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="discovery" onclick="updateAnalyticsFilter('status', 'discovery')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(191, 90, 242, 0.85);"></div>
            Discovery
        </div>
        <div class="filter-chip" data-filter-type="status" data-filter-value="completed" onclick="updateAnalyticsFilter('status', 'completed')">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(48, 209, 88, 0.85);"></div>
            Completados
        </div>

        <div class="filter-divider"></div>

        <!-- Blocker Filters -->
        <div class="filter-chip" data-filter-type="blocked" data-filter-value="true" onclick="updateAnalyticsFilter('blocked', true)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1L13 12H1L7 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
            Bloqueados
        </div>
        <div class="filter-chip" data-filter-type="blocked" data-filter-value="false" onclick="updateAnalyticsFilter('blocked', false)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Sin Bloqueos
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
        progress: filteredProjects.filter(p => p.status === 'progress').length,
        hold: filteredProjects.filter(p => p.status === 'hold').length,
        discovery: filteredProjects.filter(p => p.status === 'discovery').length,
        completed: filteredProjects.filter(p => p.status === 'completed').length
    };

    // Portfolio Status Chart
    const portfolioStatusCtx = document.getElementById('portfolioStatusChart');
    if (portfolioStatusCtx) {
        charts.portfolioStatus = new Chart(portfolioStatusCtx, {
            type: 'doughnut',
            data: {
                labels: ['En Progreso', 'En Hold', 'Discovery', 'Completados'],
                datasets: [{
                    data: [statusCounts.progress, statusCounts.hold, statusCounts.discovery, statusCounts.completed],
                    backgroundColor: [
                        'rgba(52, 199, 89, 0.85)',
                        'rgba(255, 159, 10, 0.85)',
                        'rgba(191, 90, 242, 0.85)',
                        'rgba(48, 209, 88, 0.85)'
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
                        label: 'En Progreso',
                        data: filteredTeamData.map(m => m.progress),
                        backgroundColor: 'rgba(52, 199, 89, 0.85)',
                        borderRadius: 8
                    },
                    {
                        label: 'En Hold',
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
                        label: 'Completados',
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
                    label: '% Completado',
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
                labels: ['Sin Bloqueos', 'Bloqueados'],
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
                    label: 'Entregas Programadas',
                    data: deliveryData.values,
                    borderColor: 'rgba(102, 126, 234, 1)',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
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
                        label: 'Objetivo',
                        data: burndownData.ideal,
                        borderColor: 'rgba(134, 134, 139, 0.5)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    },
                    {
                        label: 'Real',
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
            progress: filteredProjects.filter(p => p.status === 'progress').length,
            hold: filteredProjects.filter(p => p.status === 'hold').length,
            discovery: filteredProjects.filter(p => p.status === 'discovery').length,
            completed: filteredProjects.filter(p => p.status === 'completed').length
        };
        charts.portfolioStatus.data.datasets[0].data = [
            statusCounts.progress, statusCounts.hold, statusCounts.discovery, statusCounts.completed
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
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const monthlyData = {};

    projectsList.forEach(project => {
        const deliveryDate = new Date(project.deliveryDate);
        if (deliveryDate >= today) {
            const monthYear = `${months[deliveryDate.getMonth()]} ${deliveryDate.getFullYear()}`;
            monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
        }
    });

    const labels = [];
    const values = [];
    for (let i = 0; i < 6; i++) {
        const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthYear = `${months[date.getMonth()]} ${date.getFullYear()}`;
        labels.push(monthYear);
        values.push(monthlyData[monthYear] || 0);
    }

    return { labels, values };
}

function getBurndownData(projectsList) {
    const months = ['Nov', 'Dic', 'Ene', 'Feb', 'Mar'];
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
        btnText.textContent = isPresentation ? 'Salir de Presentación' : 'Modo Presentación';
    }
}

// ==================== NAVIGATION ====================

function goToHome() {
    // Navegar al home
    window.location.href = 'index.html';
}

console.log('✓ Project Manager Script Cargado');
