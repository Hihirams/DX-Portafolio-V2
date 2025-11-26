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
    renderOrgChart(); // Renderizar organigrama dinámico
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
    <div class="stat-card" onclick="scrollToAllProjects('all')">
      <div class="stat-number">${stats.totalProjects}</div>
      <div class="stat-label">Total Projects</div>
    </div>
    <div class="stat-card" onclick="scrollToAllProjects('in-progress')">
      <div class="stat-number">${stats.inProgress}</div>
      <div class="stat-label">In Progress</div>
    </div>
    <div class="stat-card" onclick="scrollToAllProjects('hold')">
      <div class="stat-number">${stats.hold}</div>
      <div class="stat-label">On Hold</div>
    </div>
    <div class="stat-card" onclick="scrollToAllProjects('discovery')">
      <div class="stat-number">${stats.discovery}</div>
      <div class="stat-label">Discovery</div>
    </div>
    <div class="stat-card" onclick="scrollToAllProjects('completed')">
      <div class="stat-number">${stats.completed}</div>
      <div class="stat-label">Finished</div>
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
                <h3 class="carousel-card__title">${project.priorityNumber ? project.priorityNumber + ". " : ""}${project.title}</h3>
                <p class="carousel-card__description">${project.currentPhase || 'Sin fase definida'}</p>
                <div class="carousel-card__footer">
                    <div class="carousel-card__progress">
                        <div class="carousel-progress-header">
                            <span class="carousel-progress-label">Overall Progress</span>
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

//
// ==================================================================
// ==================== ¡AQUÍ ESTÁ LA MODIFICACIÓN! =================
// ==================================================================
//
// He cambiado la estructura HTML que genera esta función
// para que coincida con lo que pediste en el CSS.
//
function renderCarousel() {
    const container = document.getElementById('featuredCarouselContainer');
    const { featuredProjects } = carouselState;
    
    container.innerHTML = featuredProjects.map((project, index) => {
        const statusConfig = dataManager.getStatusConfig(project.status);
        const owner = dataManager.getUserById(project.ownerId);
        const ownerName = owner ? owner.name : 'Desconocido';
        
        // **** ESTA ES LA ESTRUCTURA HTML MODIFICADA ****
        // 1. Quité el <div> "featured-content" que envolvía todo.
        // 2. Agregué el nuevo <div> "featured-title-wrapper".
        // 3. Moví el título y el estado dentro del "featured-title-wrapper".
        // 4. Moví el icono para que esté antes del "featured-title-wrapper".
        // 5. La insignia "featured-badge" se queda, pero el CSS la ocultará.
        
        return `
            <div class="featured-project-card ${index === 0 ? 'active' : ''}" data-index="${index}">
                
                <div class="featured-badge">
                    <span class="badge-icon">🌟</span>
                    <span>Proyecto Destacado</span>
                </div>
                
                <div class="featured-project-icon">${project.icon}</div>

                <div class="featured-title-wrapper">
                    <h3 class="featured-project-title">${project.priorityNumber ? project.priorityNumber + ". " : ""}${project.title}</h3>
                    <div class="featured-status-badge status-${project.status}">
                        <span class="status-dot"></span>
                        ${statusConfig.badge}
                    </div>
                </div>

                <p class="featured-project-description">${project.description || project.currentPhase}</p>
                
                <div class="featured-project-meta">
                    <div class="featured-meta-item">
                        <span class="featured-meta-label">Phase:</span>
                        <span class="featured-meta-value">${project.currentPhase || 'N/A'}</span>
                    </div>
                    <div class="featured-meta-item">
                        <span class="featured-meta-label">Leader:</span>
                        <span class="featured-meta-value">${ownerName}</span>
                    </div>
                </div>
                
                <div class="featured-progress-section">
                    <div class="featured-progress-header">
                        <span class="featured-progress-label">Overall progress</span>
                        <span class="featured-progress-percentage">${project.progress}%</span>
                    </div>
                    <div class="featured-progress-bar">
                        <div class="featured-progress-fill" style="width: ${project.progress}%"></div>
                    </div>
                </div>
                
                <button class="featured-view-btn" onclick="viewProject('${project.id}')">
                    View Details
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 3L11 8L6 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                
            </div>
        `;
    }).join('');
    
    updateCarouselView();
}
//
// ==================================================================
// ================== ¡FIN DE LA MODIFICACIÓN! ======================
// ==================================================================
//

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
            <h4 class="project-card-title">${project.priorityNumber ? project.priorityNumber + ". " : ""}${project.title}</h4>
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

// ==================== ORGANIGRAMA DINÁMICO ====================

function renderOrgChart() {
    const orgChart = document.getElementById('orgChart');
    const users = dataManager.users;

    // Filtrar solo usuarios con hierarchyLevel definido
    const hierarchyUsers = users.filter(u => u.hierarchyLevel);

    // Agrupar usuarios por nivel jerárquico
    const usersByLevel = {};
    hierarchyUsers.forEach(user => {
        const level = user.hierarchyLevel;
        if (!usersByLevel[level]) {
            usersByLevel[level] = [];
        }
        usersByLevel[level].push(user);
    });

    // Obtener niveles ordenados (1, 2, 3, ...)
    const levels = Object.keys(usersByLevel).sort((a, b) => a - b);

    // Generar HTML del organigrama
    let html = '';

    levels.forEach(level => {
        const levelUsers = usersByLevel[level];

        html += `<div class="org-level level-${level}">`;

        levelUsers.forEach(user => {
            html += `
                <div class="org-node" onclick="viewUserPortfolio('${user.id}')">
                    <div class="org-avatar">${getInitials(user.name)}</div>
                    <div class="org-info">
                        <div class="org-name">${user.name}</div>
                        <div class="org-role">${user.role}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
    });

    orgChart.innerHTML = html;
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
            html += '<h4 style="margin-bottom: 15px; color: var(--text-primary);">Projects</h4>';
            projects.forEach(project => {
                html += `
                    <div class="search-result-item" onclick="viewProject('${project.id}')">
                        <div class="search-result-title">${project.priorityNumber ? project.priorityNumber + ". " : ""}${project.icon} ${project.title}</div>
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
    // Crear el modal si no existe
    let modalOverlay = document.getElementById('loginModalOverlay');

    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.id = 'loginModalOverlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="login-modal" onclick="event.stopPropagation()">
                <button class="modal-close-btn" onclick="closeLoginModal()">×</button>

                <div class="login-modal-header">
                    <h2 class="login-modal-title">Login</h2>
                    <p class="login-modal-subtitle">Enter your credentials to continue.</p>
                </div>

                <div class="login-modal-body">
                    <form id="loginForm" onsubmit="handleLogin(event)">
                        <div id="loginError" class="form-error" style="display: none;"></div>

                        <div class="form-group">
                            <label for="username">Username</label>
                            <div class="form-input-wrapper">
                                <svg class="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    placeholder="Your username"
                                    required
                                    autocomplete="username"
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <div class="form-input-wrapper">
                                <svg class="form-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Your Password"
                                    required
                                    autocomplete="current-password"
                                >
                            </div>
                        </div>

                        <button type="submit" class="btn-submit">Login</button>
                    </form>

                    <div class="login-hint">
                        <p><strong>Usuario:</strong> firstname.lastname</p>
                        <p><strong>Contraseña:</strong> demo123</p>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // Cerrar al hacer click fuera del modal
        modalOverlay.addEventListener('click', closeLoginModal);
    }

    // Mostrar modal
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);

    document.body.style.overflow = 'hidden';

    // Focus en el input de usuario
    setTimeout(() => {
        const usernameInput = document.getElementById('username');
        if (usernameInput) usernameInput.focus();
    }, 400);
}

function closeLoginModal() {
    const modalOverlay = document.getElementById('loginModalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';

        // Limpiar formulario después de la animación
        setTimeout(() => {
            const form = document.getElementById('loginForm');
            if (form) form.reset();
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) errorDiv.style.display = 'none';
        }, 300);
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    console.log('🔐 Intentando login...');
    
    // Obtener los valores directamente del formulario
    const form = event.target;
    const usernameInput = form.querySelector('#username');
    const passwordInput = form.querySelector('#password');
    const errorDiv = document.getElementById('loginError');
    
    if (!usernameInput || !passwordInput) {
        console.error('❌ No se encontraron los inputs del formulario');
        return;
    }
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    console.log('📝 Username:', username ? '✓' : '✗');
    console.log('📝 Password:', password ? '✓' : '✗');
    
    if (!username || !password) {
        errorDiv.textContent = 'Por favor, completa todos los campos';
        errorDiv.style.display = 'block';
        return;
    }
    
    try {
        const res = await dataManager.login(username, password);
        
        if (res.success) {
            console.log('✅ Login exitoso');
            closeLoginModal();
            updateUserSection();
            showMyProjects();
            errorDiv.style.display = 'none';
            
            // Mostrar mensaje de bienvenida
            const user = dataManager.getCurrentUser();
            if (user) {
                showWelcomeMessage(user.name);
            }
        } else {
            console.log('❌ Login fallido:', res.message);
            errorDiv.textContent = res.message || 'Usuario o contraseña incorrectos';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Error en login:', error);
        errorDiv.textContent = 'Error al iniciar sesión. Intenta de nuevo.';
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

// Cerrar modal con ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
    }
});

// ==================== SCROLL TO ALL PROJECTS ====================

function scrollToAllProjects(filter) {
    // Obtener la sección de All Projects
    const allProjectsSection = document.querySelector('.featured-section-full-width');

    if (!allProjectsSection) return;

    // Calcular posición con offset para el header
    const headerHeight = 80;
    const elementPosition = allProjectsSection.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

    // Scroll suave
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    // Esperar a que termine el scroll, luego aplicar filtro
    setTimeout(() => {
        applyFilter(filter);
    }, 600);
}

// ==================== APPLY FILTER ====================

function applyFilter(filter) {
    // Find and activate the correct filter button
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    // Update current filter and render projects
    currentFilter = filter;
    renderFeaturedProjects(filter);
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
