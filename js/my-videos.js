// ============================================
// MY-VIDEOS.JS - My Videos Dashboard Logic
// ============================================

// La data ahora se obtiene de DataManager
function getMyVideos() {
    if (window.dataManager) {
        return dataManager.getMyVideos();
    }
    return [];
}

// ==================== INIT ====================

document.addEventListener('dataLoaded', () => {
    console.log('✅ Data loaded, initializing My Videos Dashboard...');
    initMyVideosDashboard();
});

function initMyVideosDashboard() {
    updateUserSection();
    renderVideoStats();
    renderMyVideosGrid();
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
                    <button class="user-dropdown-item active" onclick="navigateToMyVideos()">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="23 7 16 12 23 17 23 7"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                        </svg>
                        My Videos
                    </button>
                    <button class="user-dropdown-item" onclick="navigateToMyProjects()">
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
    if (!name) return '??';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// ==================== STATS ====================

function renderVideoStats() {
    const user = dataManager.getCurrentUser();
    if (!user) return;

    // Use mock videos for now
    const myVideos = getMyVideos();
    const videoCount = myVideos.length;

    // Update header subtitle
    const subtitle = document.querySelector('.my-videos-subtitle');
    if (subtitle) {
        subtitle.innerHTML = `You have <strong>${videoCount} uploaded video${videoCount !== 1 ? 's' : ''}</strong> available in your library.`;
    }

    // Update date
    const dateEl = document.querySelector('.my-videos-date');
    if (dateEl) {
        const now = new Date();
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
    }

    // Update greeting
    const titleEl = document.querySelector('.my-videos-title'); // Was .my-projects-title
    if (titleEl) {
        // Assuming the class name might be reused or updated in HTML
        // Let's stick to the class name used in HTML generation
    }
}

// ==================== VIDEOS GRID ====================

function getMyVideos() {
    return dataManager.getMyVideos();
}

function renderMyVideosGrid() {
    const grid = document.getElementById('myVideosGrid');
    if (!grid) return;

    const myVideos = getMyVideos();

    if (myVideos.length === 0) {
        grid.innerHTML = `
            <div class="my-videos-empty">
                <div class="my-videos-empty__icon">🎥</div>
                <h3 class="my-videos-empty__title">No videos yet</h3>
                <p class="my-videos-empty__description">Upload your first video to get started sharing your work</p>
                <button class="btn-new-video" onclick="uploadNewVideo()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Upload Video
                </button>
            </div>
        `;
        return;
    }

    // Render cards
    let html = myVideos.map(video => createVideoCard(video)).join('');

    // Add "Upload New" card at the end
    html += `
        <div class="glass-panel bento-card bento-card--small bento-card--add" onclick="uploadNewVideo()">
            <div class="bento-card--add__icon">+</div>
            <span class="bento-card--add__text">Upload New Video</span>
        </div>
    `;

    grid.innerHTML = html;
}

function createVideoCard(video) {
    console.log(`[RENDER] Creando card para: ${video.title}`);
    console.log('[RENDER] thumbnailBase64 existe:', !!video.thumbnailBase64);
    console.log('[RENDER] thumbnail path:', video.thumbnail);

    // Create a unique gradient for placeholder if no thumbnail
    const gradients = [
        'linear-gradient(135deg, #4573a5, #1c1c1e)',
        'linear-gradient(135deg, #b0955d, #1c1c1e)',
        'linear-gradient(135deg, #1d1d1f, #4573a5)',
        'linear-gradient(135deg, #1c1c1e, #b0955d)'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    // Si el video tiene thumbnail real, no mostramos el fondo de degradado
    const thumbSrc = video.thumbnailBase64 || video.thumbnail || '';
    if (thumbSrc) {
        console.log('[RENDER] thumbSrc a usar:', `${thumbSrc.substring(0, 50)}...`);
    } else {
        console.log('[RENDER] thumbSrc a usar: (vacio)');
    }
    const hasThumb = thumbSrc && thumbSrc !== '#';
    const previewStyle = hasThumb ? 'background: #000;' : `background: ${randomGradient};`;

    return `
        <div class="glass-panel bento-card bento-card--small" onclick="viewVideo('${video.id}')">
            
            <button class="bento-card__edit" onclick="event.stopPropagation(); editVideo('${video.id}')" title="Edit video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            
            <div class="bento-card__video-preview" style="${previewStyle}">
                <img src="${thumbSrc}" alt="" class="bento-card__thumb-img" onerror="this.style.display='none'">
                <div class="bento-card__play-overlay">
                    <div class="bento-card__play-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                </div>
            </div>
            
            <div class="bento-card__body">
                <h3 class="bento-card__title">${video.title}</h3>
                <p class="bento-card__description">${video.description}</p>
            </div>
            
            <div class="bento-card__footer">
                <span class="bento-card__date">${formatDate(video.uploadDate)}</span>
                <span class="bento-card__duration">${video.duration}</span>
            </div>
        </div>
    `;
}

function editVideo(videoId) {
    const video = dataManager.getVideoById(videoId);
    if (video) {
        openUploadVideoModal(video);
    } else {
        console.error('Video not found:', videoId);
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ==================== SEARCH ====================

function setupSearch() {
    const searchInput = document.getElementById('videoSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        filterVideos(query);
    });
}

function filterVideos(query) {
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
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// ==================== NAVIGATION ====================

function navigateToMyVideos() {
    window.location.reload();
}

function navigateToMyProjects() {
    window.location.href = 'my-projects.html';
}

function navigateToMyProfile() {
    const currentUser = dataManager.getCurrentUser();
    if (currentUser) {
        window.location.href = `portfolio-viewer.html?userId=${currentUser.id}`;
    }
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

// ==================== VIDEO ACTIONS ====================

function viewVideo(videoId) {
    const video = dataManager.getVideoById(videoId);
    if (video && video.videoUrl) {
        openVideoPlayer(video.videoUrl);
    } else {
        alert(`Video not found or URL missing for: ${videoId}`);
    }
}

function openVideoPlayer(url) {
    let modal = document.getElementById('videoModal');
    if (!modal) {
        injectVideoModal();
        modal = document.getElementById('videoModal');
    }

    const player = document.getElementById('videoPlayer');
    player.src = url;
    modal.classList.add('active');
    player.play().catch(e => console.error('Error playing video:', e));
}

function injectVideoModal() {
    // Usar la misma estructura que video-showcase.html para consistencia
    const modalHtml = `
        <div class="video-modal" id="videoModal">
            <button class="modal-close-netflix" onclick="closeVideoModal()">
                <span class="material-icons">close</span>
            </button>
            <div class="video-player-container">
                <video id="videoPlayer" controls autoplay></video>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Inyectar estilos para el modal tipo "Netflix"
    if (!document.getElementById('video-modal-styles')) {
        const style = document.createElement('style');
        style.id = 'video-modal-styles';
        style.textContent = `
            .video-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                z-index: 3000;
                justify-content: center;
                align-items: center;
                backdrop-filter: blur(10px);
            }
            .video-modal.active { display: flex; }
            .video-player-container {
                width: 90%;
                max-width: 1200px;
                aspect-ratio: 16/9;
                background: #000;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 20px 50px rgba(0,0,0,0.5);
            }
            .video-player-container video {
                width: 100%;
                height: 100%;
                display: block;
            }
            .modal-close-netflix {
                position: absolute;
                top: 30px;
                right: 30px;
                background: none;
                border: none;
                color: #fff;
                cursor: pointer;
                z-index: 3001;
                padding: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.3s ease;
            }
            .modal-close-netflix:hover { transform: scale(1.2); }
            .modal-close-netflix .material-icons { font-size: 36px; }
        `;
        document.head.appendChild(style);
    }

    // Asegurar que Material Icons esté disponible
    if (!document.querySelector('link[href*="Material+Icons"]')) {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }
}

window.closeVideoModal = function () {
    const modal = document.getElementById('videoModal');
    const player = document.getElementById('videoPlayer');
    if (modal) modal.classList.remove('active');
    if (player) {
        player.pause();
        player.src = '';
    }
}

function uploadNewVideo() {
    openUploadVideoModal();
}

function handleLogout() {
    if (typeof dataManager.logout === 'function') {
        dataManager.logout();
    } else {
        localStorage.removeItem('currentUser');
    }
    window.location.href = 'index.html';
}
