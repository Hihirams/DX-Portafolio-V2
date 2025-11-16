// ============================================
// HOME.JS - Logica de la pagina principal
// ============================================

let currentFilter = 'all';

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('OK Datos cargados, inicializando Home...');
    initHome();
});

function initHome() {
    updateUserSection();
    renderStatsOverview();
    initFeaturedCarousel(); // Inicializar carrusel
    renderFeaturedProjects();
    renderTeamGrid();
    setupSearch();
    setupFilters();
    setupAllProjectsCarousel(); // Configurar carrusel de todos los proyectos
    
    // Si esta loggeado, mostrar "Mis Proyectos"
    if (dataManager.isLoggedIn()) {
        showMyProjects();
    }
}

// ==================== USER SECTION ====================

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    const user = dataManager.getCurrentUser();

    // ✅ Botón de tema (siempre visible)
    const themeButton = `
        <button class=\"theme-toggle-header\" onclick=\"toggleTheme()\" aria-label=\"Cambiar tema\">
            <svg class=\"sun-icon\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\">
                <circle cx=\"12\" cy=\"12\" r=\"5\"></circle>
                <line x1=\"12\" y1=\"1\" x2=\"12\" y2=\"3\"></line>
                <line x1=\"12\" y1=\"21\" x2=\"12\" y2=\"23\"></line>
                <line x1=\"4.22\" y1=\"4.22\" x2=\"5.64\" y2=\"5.64\"></line>
                <line x1=\"18.36\" y1=\"18.36\" x2=\"19.78\" y2=\"19.78\"></line>
                <line x1=\"1\" y1=\"12\" x2=\"3\" y2=\"12\"></line>
                <line x1=\"21\" y1=\"12\" x2=\"23\" y2=\"12\"></line>
                <line x1=\"4.22\" y1=\"19.78\" x2=\"5.64\" y2=\"18.36\"></line>
                <line x1=\"18.36\" y1=\"5.64\" x2=\"19.78\" y2=\"4.22\"></line>
            </svg>
            <svg class=\"moon-icon\" viewBox=\"0 0 24 24\" fill=\"currentColor\">
                <path d=\"M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\"></path>
            </svg>
        </button>
    `;

    if (user) {
        // Usuario loggeado - ✅ Botón de tema AL FINAL
        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${getInitials(user.name)}</div>
                <span class="user-name">${user.name}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">
                Cerrar Sesión
            </button>
            ${themeButton}
        `;
    } else {
        // No loggeado - ✅ Botón de tema AL FINAL
        userSection.innerHTML = `
            <button class="btn-login" onclick="openLoginModal()">
                Login
            </button>
            ${themeButton}
        `;
    }
}

function getInitials(name) {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ==================== STATS OVERVIEW ====================

function renderStatsOverview() {
  const statsOverview = document.getElementById('statsOverview');
  const stats = dataManager.getStats();

  statsOverview.innerHTML = `
    <div class="stat-card">
      <div class="stat-number">${stats.totalProjects}</div>
      <div class="stat-label">Proyectos Totales</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.inProgress}</div>
      <div class="stat-label">En Progreso</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.hold}</div>
      <div class="stat-label">En Hold</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.discovery}</div>
      <div class="stat-label">En Discovery</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${stats.completed}</div>
      <div class="stat-label">Terminados</div>
    </div>
  `;
}

// ==================== MY PROJECTS ====================

function showMyProjects() {
    const section = document.getElementById('myProjectsSection');
    const grid = document.getElementById('myProjectsGrid');

    section.style.display = 'block';

    const myProjects = (typeof dataManager.getMyProjects === 'function')
      ? dataManager.getMyProjects()
      : (dataManager.getProjectsByUser
          ? dataManager.getProjectsByUser(dataManager.getCurrentUser()?.id)
          : []);
    
    if (myProjects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📂</div>
                <div class="empty-state-title">No tienes proyectos aun</div>
                <div class="empty-state-description">
                    Crea tu primer proyecto para empezar
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = myProjects.map(project => createProjectCard(project, true)).join('');
}


// ==================== ALL PROJECTS CAROUSEL ====================

// Estado del carrusel de todos los proyectos
let allProjectsCarouselState = {
    scrollPosition: 0,
    scrollStep: 300,
    currentFilter: 'all'
};

// Función para randomizar array (Fisher-Yates shuffle)
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ALGORITMO INTELIGENTE: Las tarjetas "piensan" y buscan su espacio
function arrangeProjectCardsIntelligently(projects) {
    // RANDOMIZAR el orden para tener variedad visual
    const sortedProjects = shuffleArray(projects);
    
    // Grid virtual: 2 filas, columnas infinitas
    const grid = [];
    const ROWS = 2;
    let maxCol = 0;
    
    // Inicializar grid con columnas suficientes
    for (let i = 0; i < 100; i++) {
        grid[i] = Array(ROWS).fill(0);
    }
    
    const placement = [];
    
    sortedProjects.forEach((project, index) => {
        let cols, rows, size;
        
        // Determinar tamaño basado en importancia o alternar
        // Tarjetas importantes (featured) son más grandes
        if (project.featured || index % 7 === 0) {
            size = 'large';
            cols = 2; rows = 2;
        } else if (index % 5 === 0) {
            size = 'tall';
            cols = 1; rows = 2;
        } else if (index % 4 === 0) {
            size = 'wide';
            cols = 2; rows = 1;
        } else {
            size = 'small';
            cols = 1; rows = 1;
        }
        
        // Buscar primer espacio disponible
        let placed = false;
        for (let col = 0; col < 100 && !placed; col++) {
            for (let row = 0; row <= ROWS - rows && !placed; row++) {
                // Verificar si cabe aquí
                let canPlace = true;
                for (let c = 0; c < cols; c++) {
                    for (let r = 0; r < rows; r++) {
                        if (grid[col + c][row + r] !== 0) {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }
                
                if (canPlace) {
                    // ¡Encontré mi espacio! Me coloco aquí
                    for (let c = 0; c < cols; c++) {
                        for (let r = 0; r < rows; r++) {
                            grid[col + c][row + r] = project.id;
                        }
                    }
                    placement.push({ 
                        ...project, 
                        col: col + 1, 
                        row: row + 1,
                        size: size,
                        cols: cols,
                        rows: rows
                    });
                    maxCol = Math.max(maxCol, col + cols);
                    placed = true;
                }
            }
        }
    });
    
    return placement;
}

// Función para crear una tarjeta del carrusel
function createCarouselProjectCard(project) {
    const statusConfig = dataManager.getStatusConfig(project.status);
    const owner = dataManager.getUserById(project.ownerId);
    const ownerName = owner ? owner.name : 'Desconocido';
    
    // Color de fondo basado en el status
    const bgGradient = `linear-gradient(135deg, ${statusConfig.color}20, ${statusConfig.color}40)`;
    
    return `
        <div class="carousel-project-card carousel-card--${project.size}" 
             style="grid-column: ${project.col} / span ${project.cols}; grid-row: ${project.row} / span ${project.rows};"
             onclick="viewProject('${project.id}')">
            <div class="carousel-card__background" style="background: ${bgGradient};"></div>
            <div class="carousel-card__content">
                <div class="carousel-card__header">
                    <div class="carousel-card__icon">${project.icon}</div>
                    <div class="carousel-card__badge ${statusConfig.badgeClass}">
                        ${statusConfig.badge}
                    </div>
                </div>
                <h3 class="carousel-card__title">${project.title}</h3>
                <p class="carousel-card__description">${project.currentPhase || 'Sin fase definida'}</p>
                <div class="carousel-card__footer">
                    <div class="carousel-card__progress">
                        <div class="carousel-progress-header">
                            <span class="carousel-progress-label">Progreso</span>
                            <span class="carousel-progress-percentage">${project.progress}%</span>
                        </div>
                        <div class="carousel-progress-bar">
                            <div class="carousel-progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                    </div>
                    <div class="carousel-card__owner">
                        <div class="carousel-owner-avatar">${getInitials(ownerName)}</div>
                        <span class="carousel-owner-name">${ownerName}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función principal para renderizar proyectos destacados con carrusel
function renderFeaturedProjects(filter = 'all') {
    allProjectsCarouselState.currentFilter = filter;
    
    let projects = dataManager.getAllProjects();
    
    // Aplicar filtro
    if (filter !== 'all') {
        projects = projects.filter(p => p.status === filter);
    }
    
    const track = document.getElementById('allProjectsCarouselTrack');
    
    if (projects.length === 0) {
        track.innerHTML = `
            <div class="empty-state" style="grid-column: 1; grid-row: 1 / span 2; padding: 40px; text-align: center;">
                <div class="empty-state-icon">📁</div>
                <div class="empty-state-title">No hay proyectos en esta categoría</div>
            </div>
        `;
        updateAllProjectsCarousel();
        return;
    }
    
    // Arranjar las tarjetas inteligentemente
    const arrangedProjects = arrangeProjectCardsIntelligently(projects);
    
    // Renderizar
    track.innerHTML = arrangedProjects.map(project => createCarouselProjectCard(project)).join('');
    
    // Resetear posición y actualizar controles
    allProjectsCarouselState.scrollPosition = 0;
    updateAllProjectsCarousel();
}

// Actualizar el carrusel (scroll y botones)
function updateAllProjectsCarousel() {
    const track = document.getElementById('allProjectsCarouselTrack');
    const viewport = document.querySelector('.all-projects-carousel-viewport');
    const leftArrow = document.getElementById('allProjectsCarouselLeft');
    const rightArrow = document.getElementById('allProjectsCarouselRight');
    
    if (!track || !viewport) return;
    
    const maxScroll = Math.max(0, track.scrollWidth - viewport.offsetWidth);
    
    allProjectsCarouselState.scrollPosition = Math.max(0, Math.min(allProjectsCarouselState.scrollPosition, maxScroll));
    track.style.transform = `translateX(-${allProjectsCarouselState.scrollPosition}px)`;
    
    if (leftArrow) leftArrow.disabled = allProjectsCarouselState.scrollPosition <= 0;
    if (rightArrow) rightArrow.disabled = allProjectsCarouselState.scrollPosition >= maxScroll - 1;
}

// Configurar eventos del carrusel
function setupAllProjectsCarousel() {
    const leftArrow = document.getElementById('allProjectsCarouselLeft');
    const rightArrow = document.getElementById('allProjectsCarouselRight');
    
    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            allProjectsCarouselState.scrollPosition -= allProjectsCarouselState.scrollStep;
            updateAllProjectsCarousel();
        });
    }
    
    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            allProjectsCarouselState.scrollPosition += allProjectsCarouselState.scrollStep;
            updateAllProjectsCarousel();
        });
    }
    
    window.addEventListener('resize', () => {
        setTimeout(updateAllProjectsCarousel, 100);
    });
}


// ==================== FEATURED CAROUSEL ====================

let carouselState = {
    currentSlide: 0,
    autoplayInterval: null,
    autoplayDelay: 5000,
    featuredProjects: []
};

function initFeaturedCarousel() {
    // Obtener proyectos destacados
    const allProjects = dataManager.getAllProjects();
    carouselState.featuredProjects = allProjects.filter(p => p.featured === true).slice(0, 5);
    
    // Si no hay proyectos destacados, ocultar el carrusel
    if (carouselState.featuredProjects.length === 0) {
        document.getElementById('featuredCarouselWrapper').style.display = 'none';
        return;
    }
    
    // Mostrar el carrusel
    document.getElementById('featuredCarouselWrapper').style.display = 'block';
    
    // Renderizar el carrusel
    renderCarousel();
    renderCarouselIndicators();
    setupCarouselEventListeners();
    startCarouselAutoplay();
}

function renderCarousel() {
    const container = document.getElementById('featuredCarouselContainer');
    const { featuredProjects } = carouselState;
    
    container.innerHTML = featuredProjects.map((project, index) => {
        const statusConfig = dataManager.getStatusConfig(project.status);
        const owner = dataManager.getUserById(project.ownerId);
        const ownerName = owner ? owner.name : 'Desconocido';
        
        return `
            <div class="featured-project-card ${index === 0 ? 'active' : ''}" data-index="${index}">
                <div class="featured-badge">
                    <span class="badge-icon">🌟</span>
                    <span>Proyecto Destacado</span>
                </div>
                <div class="featured-status-badge status-${project.status}">
                    <span class="status-dot"></span>
                    ${statusConfig.badge}
                </div>
                <div class="featured-content">
                    <div class="featured-project-icon">${project.icon}</div>
                    <h3 class="featured-project-title">${project.title}</h3>
                    <p class="featured-project-description">${project.description || project.currentPhase}</p>
                    <div class="featured-project-meta">
                        <div class="featured-meta-item">
                            <span class="featured-meta-label">Fase:</span>
                            <span class="featured-meta-value">${project.currentPhase || 'N/A'}</span>
                        </div>
                        <div class="featured-meta-item">
                            <span class="featured-meta-label">Líder:</span>
                            <span class="featured-meta-value">${ownerName}</span>
                        </div>
                    </div>
                    <div class="featured-progress-section">
                        <div class="featured-progress-header">
                            <span class="featured-progress-label">Progreso general</span>
                            <span class="featured-progress-percentage">${project.progress}%</span>
                        </div>
                        <div class="featured-progress-bar">
                            <div class="featured-progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                    </div>
                    <button class="featured-view-btn" onclick="viewProject('${project.id}')">
                        Ver Detalles
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    updateCarouselView();
}

function renderCarouselIndicators() {
    const container = document.getElementById('carouselIndicators');
    const { featuredProjects } = carouselState;
    
    container.innerHTML = featuredProjects.map((_, index) => `
        <button class="carousel-indicator ${index === 0 ? 'active' : ''}" 
                data-index="${index}" 
                aria-label="Ir a proyecto ${index + 1}">
        </button>
    `).join('');
}

function setupCarouselEventListeners() {
    // Botones de navegaciÃ³n
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            carouselNext();
            resetCarouselAutoplay();
        });
        
        nextBtn.addEventListener('click', () => {
            carouselPrev();
            resetCarouselAutoplay();
        });
    }
    
    // Indicadores
    const indicators = document.querySelectorAll('.carousel-indicator');
    indicators.forEach(indicator => {
        indicator.addEventListener('click', (e) => {
            const index = parseInt(e.target.dataset.index);
            goToCarouselSlide(index);
            resetCarouselAutoplay();
        });
    });
    
    // Pausar autoplay al pasar el mouse
    const carouselContainer = document.getElementById('featuredCarouselContainer');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', stopCarouselAutoplay);
        carouselContainer.addEventListener('mouseleave', startCarouselAutoplay);
    }
    
    // NavegaciÃ³n con teclado
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            carouselPrev();
            resetCarouselAutoplay();
        } else if (e.key === 'ArrowRight') {
            carouselNext();
            resetCarouselAutoplay();
        }
    });
}

function updateCarouselView() {
    const cards = document.querySelectorAll('.featured-project-card');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const { currentSlide, featuredProjects } = carouselState;
    
    cards.forEach((card, index) => {
        card.classList.remove('active', 'prev', 'next');
        
        if (index === currentSlide) {
            card.classList.add('active');
        } else if (index === (currentSlide - 1 + featuredProjects.length) % featuredProjects.length) {
            card.classList.add('prev');
        } else if (index === (currentSlide + 1) % featuredProjects.length) {
            card.classList.add('next');
        }
    });
    
    indicators.forEach((indicator, index) => {
        indicator.classList.toggle('active', index === currentSlide);
    });
}

function carouselNext() {
    const { featuredProjects } = carouselState;
    carouselState.currentSlide = (carouselState.currentSlide + 1) % featuredProjects.length;
    updateCarouselView();
}

function carouselPrev() {
    const { featuredProjects } = carouselState;
    carouselState.currentSlide = (carouselState.currentSlide - 1 + featuredProjects.length) % featuredProjects.length;
    updateCarouselView();
}

function goToCarouselSlide(index) {
    carouselState.currentSlide = index;
    updateCarouselView();
}

function startCarouselAutoplay() {
    if (carouselState.featuredProjects.length <= 1) return;
    
    stopCarouselAutoplay(); // Limpiar cualquier intervalo existente
    carouselState.autoplayInterval = setInterval(() => {
        carouselNext();
    }, carouselState.autoplayDelay);
}

function stopCarouselAutoplay() {
    if (carouselState.autoplayInterval) {
        clearInterval(carouselState.autoplayInterval);
        carouselState.autoplayInterval = null;
    }
}

function resetCarouselAutoplay() {
    stopCarouselAutoplay();
    startCarouselAutoplay();
}

function createProjectCard(project, showEditButton = false) {
    const statusConfig = dataManager.getStatusConfig(project.status);
    const owner = dataManager.getUserById(project.ownerId);
    const ownerName = owner ? owner.name : 'Desconocido';
    const currentUser = dataManager.getCurrentUser();
    const canEdit = currentUser && project.ownerId === currentUser.id;
    
    return `
        <div class="project-card" onclick="viewProject('${project.id}')">
            <div class="project-card-header">
                <div class="project-icon">${project.icon}</div>
                <div style="display: flex; gap: 8px; align-items: center;">
                    ${canEdit ? `
                        <button class="btn-edit-mini" onclick="event.stopPropagation(); editProject('${project.id}')" title="Editar proyecto">
                            ✏️
                        </button>
                    ` : ''}
                    <div class="project-badge ${statusConfig.badgeClass}">${statusConfig.badge}</div>
                </div>
            </div>
            <h4 class="project-card-title">${project.title}</h4>
            <p class="project-card-phase">${project.currentPhase || 'Sin fase definida'}</p>
            <div class="project-card-footer">
                <div class="project-progress">
                    <div class="progress-label">${project.progress}% completado</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                <div class="project-owner">
                    <div class="owner-avatar">${getInitials(ownerName)}</div>
                </div>
            </div>
        </div>
    `;
}

// ==================== TEAM GRID ====================

function renderTeamGrid() {
    const grid = document.getElementById('teamGrid');
    const users = dataManager.users;
    
    grid.innerHTML = users.map(user => {
        const stats = dataManager.getUserStats(user.id);
        
        return `
            <div class="team-card" onclick="viewUserPortfolio('${user.id}')">
                <div class="team-avatar">${getInitials(user.name)}</div>
                <h4 class="team-name">${user.name}</h4>
                <p class="team-role">${user.role}</p>
                <div class="team-stats">
                    <div class="team-stat">
                        <div class="team-stat-number">${stats.totalProjects}</div>
                        <div class="team-stat-label">Proyectos</div>
                    </div>
                    <div class="team-stat">
                        <div class="team-stat-number">${stats.avgProgress}%</div>
                        <div class="team-stat-label">Progreso</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== FILTERS ====================

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            
            // Agregar active al clickeado
            btn.classList.add('active');
            
            // Filtrar proyectos
            const filter = btn.dataset.filter;
            currentFilter = filter;
            renderFeaturedProjects(filter);
        });
    });
}

// ==================== SEARCH ====================

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchInput || !searchResults) {
        console.warn('⚠️ Elementos de búsqueda no encontrados');
        return;
    }

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.style.display = 'none';
            return;
        }

        const projects = dataManager.searchProjects(query);
        const users = dataManager.users.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase())
        );

        if (projects.length === 0 && users.length === 0) {
            searchResults.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🔍</div>
                    <div class="empty-state-title">No se encontraron resultados</div>
                </div>
            `;
            searchResults.style.display = 'block';
            return;
        }

        let html = '';

        if (projects.length > 0) {
            html += '<h4 style="margin-bottom: 15px; color: var(--text-primary);">Proyectos</h4>';
            projects.forEach(project => {
                html += `
                    <div class="search-result-item" onclick="viewProject('${project.id}')">
                        <div class="search-result-title">${project.icon} ${project.title}</div>
                        <div class="search-result-meta">${project.currentPhase.substring(0, 80)}...</div>
                    </div>
                `;
            });
        }

        if (users.length > 0) {
            html += '<h4 style="margin: 20px 0 15px; color: var(--text-primary);">Personas</h4>';
            users.forEach(user => {
                html += `
                    <div class="search-result-item" onclick="viewUserPortfolio('${user.id}')">
                        <div class="search-result-title">👤 ${user.name}</div>
                        <div class="search-result-meta">${user.role}</div>
                    </div>
                `;
            });
        }

        searchResults.innerHTML = html;
        searchResults.style.display = 'block';
    });

    // Cerrar resultados al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
        }
    });

    // Cerrar al presionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.style.display = 'none';
            searchInput.blur();
        }
    });
}

// ==================== NAVIGATION ====================

function viewProject(projectId) {
    // Guardar el ID del proyecto en localStorage
    localStorage.setItem('viewingProjectId', projectId);
    
    // Redirigir al visor de portafolio
    window.location.href = 'portfolio-viewer.html';
}

function viewUserPortfolio(userId) {
    // Guardar el ID del usuario en localStorage
    localStorage.setItem('viewingUserId', userId);
    
    // Redirigir al visor de portafolio
    window.location.href = 'portfolio-viewer.html';
}

function editProject(projectId) {
    if (!dataManager.isLoggedIn()) {
        alert('Debes iniciar sesion para editar un proyecto');
        openLoginModal();
        return;
    }
    
    // Verificar permisos
    if (!dataManager.canEditProject(projectId)) {
        alert('No tienes permisos para editar este proyecto');
        return;
    }
    
    // Configurar modo edicion
    localStorage.setItem('editorMode', 'edit');
    localStorage.setItem('editingProjectId', projectId);
    
    // Redirigir al editor
    window.location.href = 'portfolio-editor.html';
}

function createNewProject() {
    if (!dataManager.isLoggedIn()) {
        alert('Debes iniciar sesion para crear un proyecto');
        openLoginModal();
        return;
    }
    
    // Redirigir al editor con modo "nuevo"
    localStorage.setItem('editorMode', 'new');
    localStorage.removeItem('editingProjectId');
    window.location.href = 'portfolio-editor.html';
}

// ==================== LOGIN/LOGOUT ====================

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Focus en el input de usuario
    setTimeout(() => {
        document.getElementById('username').focus();
    }, 100);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Limpiar formulario
    document.getElementById('loginForm').reset();
    document.getElementById('loginError').style.display = 'none';
}

async function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('loginError');

  const res = await dataManager.login(username, password);
  if (res.success) {
    closeLoginModal();
    updateUserSection();
    showMyProjects();
    errorDiv.style.display = 'none';
  } else {
    errorDiv.textContent = res.message || 'Usuario o contraseña incorrectos';
    errorDiv.style.display = 'block';
  }
}


function handleLogout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        dataManager.logout();
        
        // Actualizar la UI
        updateUserSection();
        document.getElementById('myProjectsSection').style.display = 'none';
        
        // Re-renderizar proyectos destacados para ocultar botones de edicion
        renderFeaturedProjects(currentFilter);
        
        console.log('OK Sesion cerrada');
    }
}

function showWelcomeMessage(userName) {
    // Crear elemento de notificacion
    const notification = document.createElement('div');
    notification.className = 'welcome-notification';
    notification.innerHTML = `
        <div class="welcome-content">
            <span class="welcome-icon">👋</span>
            <span class="welcome-text">¡Bienvenido, ${userName.split(' ')[0]}!</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Mostrar con animacion
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Ocultar despues de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ==================== MODAL HELPERS ====================

// Cerrar modal al hacer clic fuera
document.getElementById('loginModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeLoginModal();
    }
});

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

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

// ==================== HEADER AUTO-HIDE ====================

let lastScrollTop = 0;
const scrollThreshold = 10; // Sensibilidad del scroll

window.addEventListener('scroll', () => {
    const header = document.querySelector('.main-header');
    const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Evitar cambios en scrolls pequeños
    if (Math.abs(currentScroll - lastScrollTop) < scrollThreshold) {
        return;
    }

    if (currentScroll > lastScrollTop && currentScroll > 100) {
        // Scroll hacia abajo - ocultar header
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scroll hacia arriba - mostrar header
        header.style.transform = 'translateY(0)';
    }

    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
});

// ==================== PORTAFOLIO GENERAL ====================

function openGeneralPortfolio() {
    // Limpiar cualquier filtro previo
    localStorage.removeItem('viewingUserId');
    localStorage.removeItem('viewingProjectId');

    console.log('📊 Abriendo portafolio general (todos los proyectos)');

    // Redirigir al visor sin parámetros = mostrar todos los proyectos
    window.location.href = 'portfolio-viewer.html';
}

// ==================== PROJECT MANAGER ====================

function openProjectManager() {
    console.log('📈 Abriendo Project Manager - Vista ejecutiva');
    
    // Redirigir al Project Manager
    window.location.href = 'project-manager.html';
}

// Cargar tema al iniciar
loadTheme();

console.log('OK Home.js cargado');

// Escuchar cuando se recargan los datos
window.addEventListener('dataReloaded', () => {
    console.log('📤 Datos recargados, actualizando UI...');
    initHome();
});
