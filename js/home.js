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
    
    // Si esta loggeado, mostrar "Mis Proyectos"
    if (dataManager.isLoggedIn()) {
        showMyProjects();
    }
}

// ==================== USER SECTION ====================

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    const user = dataManager.getCurrentUser();
    
    if (user) {
        // Usuario loggeado
        userSection.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">${getInitials(user.name)}</div>
                <span class="user-name">${user.name}</span>
            </div>
            <button class="btn-logout" onclick="handleLogout()">
                Cerrar Sesion
            </button>
        `;
    } else {
        // No loggeado
        userSection.innerHTML = `
            <button class="btn-login" onclick="openLoginModal()">
                Iniciar Sesion
            </button>
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

// ==================== FEATURED PROJECTS ====================

function renderFeaturedProjects(filter = 'all') {
    const grid = document.getElementById('featuredProjectsGrid');
    
    let projects = dataManager.getAllProjects();
    
    if (filter !== 'all') {
        projects = projects.filter(p => p.status === filter);
    }
    
    if (projects.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🔍</div>
                <div class="empty-state-title">No hay proyectos en esta categoria</div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = projects.map(project => createProjectCard(project)).join('');
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
    // Botones de navegación
    const prevBtn = document.getElementById('carouselPrevBtn');
    const nextBtn = document.getElementById('carouselNextBtn');
    
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            carouselPrev();
            resetCarouselAutoplay();
        });
        
        nextBtn.addEventListener('click', () => {
            carouselNext();
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
    
    // Navegación con teclado
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

// Cargar tema al iniciar
loadTheme();

console.log('OK Home.js cargado');

// Escuchar cuando se recargan los datos
window.addEventListener('dataReloaded', () => {
    console.log('🔄 Datos recargados, actualizando UI...');
    initHome();
});