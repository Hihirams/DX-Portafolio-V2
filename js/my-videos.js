// ============================================
// MY-VIDEOS.JS - My Videos Dashboard Logic
// ============================================

// ==================== MOCK DATA ====================
// Temporary data until backend structure is ready
const MOCK_VIDEOS = [
    {
        id: 'v1',
        title: 'Industrial Automation Demo',
        description: 'Demonstration of the new robotic arm integration in the assembly line.',
        uploadDate: '2026-01-25',
        duration: '3:45',
        thumbnail: 'assets/video-thumb-1.jpg', // Placeholder, handles error gracefully
        videoUrl: '#'
    },
    {
        id: 'v2',
        title: 'AI Vision System Test',
        description: 'Testing the new computer vision capabilities for defect detection.',
        uploadDate: '2026-01-22',
        duration: '1:20',
        thumbnail: 'assets/video-thumb-2.jpg',
        videoUrl: '#'
    },
    {
        id: 'v3',
        title: 'Q1 Progress Report',
        description: 'Video summary of the first quarter achievements and milestones.',
        uploadDate: '2026-01-15',
        duration: '5:00',
        thumbnail: 'assets/video-thumb-3.jpg',
        videoUrl: '#'
    },
    {
        id: 'v4',
        title: 'Safety Training',
        description: 'Mandatory safety protocol updates for all plant personnel.',
        uploadDate: '2026-01-10',
        duration: '12:30',
        thumbnail: 'assets/video-thumb-4.jpg',
        videoUrl: '#'
    }
];

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
    // In the future this should come from dataManager
    return MOCK_VIDEOS;
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
    // Create a unique gradient for placeholder if no thumbnail
    const gradients = [
        'linear-gradient(135deg, #FF6B6B, #556270)',
        'linear-gradient(135deg, #4ECDC4, #556270)',
        'linear-gradient(135deg, #C7F464, #556270)',
        'linear-gradient(135deg, #2C3E50, #FD746C)'
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];

    return `
        <div class="glass-panel bento-card bento-card--small" onclick="viewVideo('${video.id}')">
            
            <button class="bento-card__edit" onclick="event.stopPropagation(); editVideo('${video.id}')" title="Edit video">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
            </button>
            
            <div class="bento-card__video-preview" style="background: ${randomGradient};">
                <!-- If we had a real URL we would put a video tag here or an img -->
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
    // Placeholder for edit functionality
    alert(`Edit video feature coming soon!\nVideo ID: ${videoId}`);
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

// ==================== VIDEO ACTIONS ====================

function viewVideo(videoId) {
    // In a real app this would open a video modal or page
    alert(`Play video: ${videoId}\n(Video player integration coming soon)`);
}

function uploadNewVideo() {
    alert('Video upload feature coming soon!');
}

function handleLogout() {
    if (typeof dataManager.logout === 'function') {
        dataManager.logout();
    } else {
        localStorage.removeItem('currentUser');
    }
    window.location.href = 'index.html';
}
