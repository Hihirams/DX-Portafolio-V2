// ============================================
// MY-PROJECTS.JS - My Projects Dashboard Logic
// ============================================

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Data loaded, initializing My Projects Dashboard...');
    initMyProjectsDashboard();
});

function initMyProjectsDashboard() {
    updateUserSection();
    renderProjectStats();
    renderMyProjectsGrid();
    setupSearch();
    setupTheme();
}

// ==================== USER SECTION ====================

function updateUserSection() {
    const userSection = document.getElementById('userSection');
    if (!userSection) return;

    const user = dataManager.getCurrentUser();

    if (user) {
        userSection.innerHTML = `
            <div class="island-nav-divider"></div>
            <div class="user-dropdown-wrapper">
                <div class="user-info">
                    <div class="user-avatar">${getInitials(user.name)}</div>
                    <span class="user-name">${user.name}</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="opacity: 0.5;">
                        <path d="M6 9l6 6 6-6"/>
                    </svg>
                </div>
                <div class="user-dropdown-menu">
                    <button class="user-dropdown-item" onclick="navigateToMyVideos()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        My Videos
                    </button>
                    <button class="user-dropdown-item active" onclick="navigateToMyProjects()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                        My Projects
                    </button>
                    <button class="user-dropdown-item" onclick="navigateToMyProfile()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        My Profile
                    </button>
                    <button class="user-dropdown-item" onclick="navigateToHelp()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                        Help & Support
                    </button>
                    <div class="user-dropdown-divider"></div>
                    <button class="user-dropdown-item logout-item" onclick="handleLogout()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16,17 21,12 16,7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Log Out
                    </button>
                </div>
            </div>
        `;
    } else {
        // Not logged in - redirect to home
        window.location.href = 'index.html';
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

// ==================== STATS ====================

function renderProjectStats() {
    const user = dataManager.getCurrentUser();
    if (!user) return;

    const myProjects = getMyProjects();
    const activeProjects = myProjects.filter(p => !['released', 'finished'].includes(p.status)).length;
    const completedProjects = myProjects.filter(p => ['released', 'finished'].includes(p.status)).length;

    // Calculate average progress
    const avgProgress = myProjects.length > 0
        ? Math.round(myProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / myProjects.length)
        : 0;

    // Update header subtitle
    const subtitle = document.querySelector('.my-projects-subtitle');
    if (subtitle) {
        subtitle.innerHTML = `You have <strong>${activeProjects} active project${activeProjects !== 1 ? 's' : ''}</strong> and <strong>${completedProjects} completed</strong>. Average progress: <strong>${avgProgress}%</strong>`;
    }

    // Update date
    const dateEl = document.querySelector('.my-projects-date');
    if (dateEl) {
        const now = new Date();
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    }

    // Update greeting
    const titleEl = document.querySelector('.my-projects-title');
    if (titleEl) {
        const hour = new Date().getHours();
        let greeting = 'Good Morning';
        if (hour >= 12 && hour < 18) greeting = 'Good Afternoon';
        else if (hour >= 18) greeting = 'Good Evening';

        const firstName = user.name.split(' ')[0];
        titleEl.textContent = `${greeting}, ${firstName}`;
    }
}

// ==================== PROJECTS GRID ====================

function getMyProjects() {
    const user = dataManager.getCurrentUser();
    if (!user) return [];

    // Try different methods to get user's projects
    if (typeof dataManager.getMyProjects === 'function') {
        return dataManager.getMyProjects();
    }

    if (typeof dataManager.getProjectsByUser === 'function') {
        return dataManager.getProjectsByUser(user.id);
    }

    // Fallback: filter all projects by owner
    const allProjects = dataManager.getAllProjects();
    return allProjects.filter(p => p.ownerId === user.id);
}

function renderMyProjectsGrid() {
    const grid = document.getElementById('myProjectsGrid');
    if (!grid) return;

    const myProjects = getMyProjects();

    if (myProjects.length === 0) {
        grid.innerHTML = `
            <div class="my-projects-empty">
                <div class="my-projects-empty__icon">📁</div>
                <h3 class="my-projects-empty__title">No projects yet</h3>
                <p class="my-projects-empty__description">Create your first project to get started</p>
                <button class="btn-new-project" onclick="createNewProject()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    New Project
                </button>
            </div>
        `;
        return;
    }

    // Arrange projects with intelligent sizing
    const arrangedProjects = arrangeProjectsInBento(myProjects);

    // Render cards
    let html = arrangedProjects.map(project => createBentoCard(project)).join('');

    // Add "Create New" card at the end
    html += `
        <div class="glass-panel bento-card bento-card--small bento-card--add" onclick="createNewProject()">
            <div class="bento-card--add__icon">+</div>
            <span class="bento-card--add__text">Create New Project</span>
        </div>
    `;

    grid.innerHTML = html;
}

function arrangeProjectsInBento(projects) {
    // Sort by progress/importance
    const sorted = [...projects].sort((a, b) => {
        // Featured projects first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // Then by progress (higher first)
        return (b.progress || 0) - (a.progress || 0);
    });

    // Assign sizes based on position and project properties
    return sorted.map((project, index) => {
        let size = 'small';

        if (index === 0 && projects.length > 2) {
            // First project is large
            size = 'large';
        } else if (project.featured) {
            size = 'wide';
        } else if (index % 5 === 2) {
            size = 'tall';
        } else if (index % 7 === 3) {
            size = 'wide';
        }

        return { ...project, _bentoSize: size };
    });
}

function createBentoCard(project) {
    const statusConfig = dataManager.getStatusConfig(project.status);
    const owner = dataManager.getUserById(project.ownerId);
    const ownerName = owner ? owner.name : 'Unknown';
    const user = dataManager.getCurrentUser();
    const canEdit = user && project.ownerId === user.id;

    const sizeClass = `bento-card--${project._bentoSize || 'small'}`;
    const glowClass = getGlowClass(project.status);

    return `
        <div class="glass-panel bento-card ${sizeClass}" onclick="viewProject('${project.id}')">
            ${project._bentoSize === 'large' ? `<div class="bento-card__glow ${glowClass}"></div>` : ''}
            
            ${canEdit ? `
                <button class="bento-card__edit" onclick="event.stopPropagation(); editProject('${project.id}')" title="Edit project">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            ` : ''}
            
            <div class="bento-card__header">
                <div class="bento-card__icon bento-card__icon--${project.status}">
                    ${project.icon || '📋'}
                </div>
                <span class="bento-card__status bento-card__status--${project.status}">
                    ${statusConfig.badge}
                </span>
            </div>
            
            <div class="bento-card__body">
                <h3 class="bento-card__title">${project.priorityNumber ? project.priorityNumber + '. ' : ''}${project.title}</h3>
                <p class="bento-card__description">${project.currentPhase || project.description || 'No description'}</p>
                
                <div class="bento-card__progress">
                    <div class="bento-card__progress-header">
                        <span class="bento-card__progress-label">Progress</span>
                        <span class="bento-card__progress-value">${project.progress || 0}%</span>
                    </div>
                    <div class="bento-card__progress-bar">
                        <div class="bento-card__progress-fill" style="width: ${project.progress || 0}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="bento-card__footer">
                <div class="bento-card__team">
                    <div class="bento-card__avatar">${getInitials(ownerName)}</div>
                </div>
                ${project.targetDate ? `
                    <span class="bento-card__due">Due ${formatDueDate(project.targetDate)}</span>
                ` : ''}
            </div>
        </div>
    `;
}

function getGlowClass(status) {
    const glowMap = {
        'discovery': 'bento-card__glow--purple',
        'decision': 'bento-card__glow--orange',
        'develop': 'bento-card__glow--blue',
        'pilot': 'bento-card__glow--orange',
        'yokotenkai': 'bento-card__glow--purple',
        'released': 'bento-card__glow--green',
        'finished': 'bento-card__glow--green'
    };
    return glowMap[status] || 'bento-card__glow--blue';
}

function formatDueDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays <= 7) return `in ${diffDays} days`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ==================== SEARCH ====================

function setupSearch() {
    const searchInput = document.getElementById('projectSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterProjects(query);
    });
}

function filterProjects(query) {
    const cards = document.querySelectorAll('.bento-card:not(.bento-card--add)');

    cards.forEach(card => {
        const title = card.querySelector('.bento-card__title')?.textContent.toLowerCase() || '';
        const description = card.querySelector('.bento-card__description')?.textContent.toLowerCase() || '';

        if (!query || title.includes(query) || description.includes(query)) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

// ==================== THEME ====================

function setupTheme() {
    // Check saved theme preference
    const savedTheme = localStorage.getItem('dx-theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('dx-theme', isLight ? 'light' : 'dark');
}

// ==================== NAVIGATION ====================

function navigateToMyVideos() {
    window.location.href = 'video-showcase.html';
}

function navigateToMyProjects() {
    // Already on this page
    window.location.href = 'my-projects.html';
}

function navigateToMyProfile() {
    const currentUser = dataManager.getCurrentUser();
    if (currentUser) {
        window.location.href = `portfolio-viewer.html?userId=${currentUser.id}`;
    }
}

function navigateToHelp() {
    alert('Help & Support feature coming soon!\n\nFor assistance, contact the DX Team.');
}

function goHome() {
    window.location.href = 'index.html';
}

function openGeneralPortfolio() {
    window.location.href = 'portfolio-viewer.html';
}

function openProjectManager() {
    window.location.href = 'project-manager.html';
}

function openVideoShowcase() {
    window.location.href = 'video-showcase.html';
}

// ==================== PROJECT ACTIONS ====================

function viewProject(projectId) {
    window.location.href = `project-manager.html?projectId=${projectId}`;
}

function editProject(projectId) {
    localStorage.setItem('editorMode', 'edit');
    localStorage.setItem('editingProjectId', projectId);
    window.location.href = 'portfolio-editor.html';
}

function createNewProject() {
    localStorage.setItem('editorMode', 'new');
    window.location.href = 'portfolio-editor.html';
}

// ==================== LOGOUT ====================

function handleLogout() {
    if (typeof dataManager.logout === 'function') {
        dataManager.logout();
    } else {
        localStorage.removeItem('currentUser');
    }
    window.location.href = 'index.html';
}
