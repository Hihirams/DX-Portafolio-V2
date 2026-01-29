/**
 * UPLOAD VIDEO MODAL
 * Shared functionality for video uploads
 */

// HTML Structure for the modal
const uploadModalHTML = `
<div id="uploadModal" class="modal upload-modal">
    <div class="modal-content upload-modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Upload New Video</h3>
            <button class="modal-close" onclick="closeUploadModal()">&times;</button>
        </div>
        <div class="modal-body upload-modal-body">
            <div class="upload-container">
                <!-- Left Side: File Upload & Preview -->
                <div class="upload-left-panel">
                    <div id="dropZone" class="upload-drop-zone">
                        <input type="file" id="videoFileInput" accept="video/*" hidden>
                        <div class="upload-placeholder" id="uploadPlaceholder">
                            <div class="upload-icon-circle">
                                <svg viewBox="0 0 24 24" fill="none" class="upload-icon">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <polyline points="17 8 12 3 7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <h4>Drag & Drop Video</h4>
                            <p>or <span class="browse-link" onclick="document.getElementById('videoFileInput').click()">browse files</span></p>
                            <span class="file-limits">MP4, WebM up to 500MB</span>
                        </div>
                        <div class="video-preview-container" id="videoPreviewContainer" style="display: none;">
                            <video id="videoPreviewPlayer" controls class="video-preview-player"></video>
                            <button class="remove-video-btn" onclick="removeVideoFile()">
                                <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Right Side: Meta Data -->
                <div class="upload-right-panel">
                    <div class="form-group">
                        <label for="videoTitle">Video Title</label>
                        <input type="text" id="videoTitle" class="glass-input" placeholder="e.g. Robot Innovation Line">
                    </div>

                    <div class="form-group">
                        <label for="videoDescription">Description</label>
                        <textarea id="videoDescription" class="glass-input glass-textarea" placeholder="Describe the video content..."></textarea>
                    </div>

                    <div class="form-group">
                        <label for="videoTags">Tags</label>
                        <div class="tags-input-container class-input">
                            <div class="tags-list" id="tagsList"></div>
                            <input type="text" id="videoTagsInput" class="glass-input-transparent" placeholder="Add tags (Enter to add)">
                        </div>
                        <p class="input-hint">Press Enter to add tags like 'Innovation', 'IoT', 'Process'</p>
                    </div>

                    <div class="upload-actions">
                        <button class="btn-delete-video" id="deleteVideoBtn" onclick="deleteCurrentVideo()" style="display: none;">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 8px;">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            Delete
                        </button>
                        <button class="btn-cancel" onclick="closeUploadModal()">Cancel</button>
                        <button class="btn-upload-submit" onclick="submitVideoUpload()">
                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 8px;">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Upload Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

// Inject Modal into DOM
function injectUploadModal() {
    if (!document.getElementById('uploadModal')) {
        document.body.insertAdjacentHTML('beforeend', uploadModalHTML);
        setupUploadListeners();
    }
}

// Open Modal
let currentEditingId = null;

function openUploadVideoModal(videoData = null) {
    injectUploadModal();
    const modal = document.getElementById('uploadModal');

    // Reset form first
    resetUploadForm();

    if (videoData) {
        // EDIT MODE
        currentEditingId = videoData.id;
        document.querySelector('.modal-title').textContent = 'Edit Video';
        document.getElementById('videoTitle').value = videoData.title || '';
        document.getElementById('videoDescription').value = videoData.description || '';

        // Handle Tags
        if (videoData.tags && Array.isArray(videoData.tags)) {
            videoData.tags.forEach(tag => addTag(tag));
        }

        // Handle Preview (Thumbnail/Video)
        if (videoData.thumbnail || videoData.videoUrl) {
            const previewContainer = document.getElementById('videoPreviewContainer');
            const placeholder = document.getElementById('uploadPlaceholder');
            const videoPlayer = document.getElementById('videoPreviewPlayer');

            placeholder.style.display = 'none';
            previewContainer.style.display = 'block';

            if (videoData.videoUrl && videoData.videoUrl !== '#') {
                videoPlayer.src = videoData.videoUrl;
            } else if (videoData.thumbnail) {
                videoPlayer.poster = videoData.thumbnail;
            }
        }

        // Update Button Text
        const submitBtn = document.querySelector('.btn-upload-submit');
        submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 8px;">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
            </svg>
            Save Changes
        `;
        submitBtn.onclick = () => saveVideoChanges();

        // Show Delete Button in Edit Mode
        const deleteBtn = document.getElementById('deleteVideoBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'flex';
        }

    } else {
        // UPLOAD MODE
        currentEditingId = null;
        document.querySelector('.modal-title').textContent = 'Upload New Video';

        // Reset Button
        const submitBtn = document.querySelector('.btn-upload-submit');
        submitBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="margin-right: 8px;">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            Upload Video
        `;
        submitBtn.onclick = () => submitVideoUpload();

        // Hide Delete Button in Upload Mode
        const deleteBtn = document.getElementById('deleteVideoBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }

    modal.classList.add('active');

    // Add blur effect to main content
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (mainContent) {
        mainContent.style.filter = 'blur(5px)';
        mainContent.style.transition = 'filter 0.3s ease';
    }

    document.body.style.overflow = 'hidden';
}

// Close Modal
function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Remove blur effect
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (mainContent) {
        mainContent.style.filter = 'none';
    }

    document.body.style.overflow = '';
}

// Global binding
window.openUploadVideoModal = openUploadVideoModal;
window.closeUploadModal = closeUploadModal;

// Setup Listeners for Drag & Drop and Inputs
function setupUploadListeners() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('videoFileInput');
    const tagsInput = document.getElementById('videoTagsInput');

    // Drag & Drop
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('highlight');
    }

    function unhighlight(e) {
        dropZone.classList.remove('highlight');
    }

    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFiles, false);

    // Tags Input
    tagsInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim();
            if (tag) {
                addTag(tag);
                this.value = '';
            }
        }
    });
}

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles({ target: { files: files } });
}

function handleFiles(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
        showVideoPreview(file);
    } else {
        alert('Please select a valid video file.');
    }
}

function showVideoPreview(file) {
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('videoPreviewContainer');
    const videoPlayer = document.getElementById('videoPreviewPlayer');
    const titleInput = document.getElementById('videoTitle');

    placeholder.style.display = 'none';
    previewContainer.style.display = 'block';

    const objectURL = URL.createObjectURL(file);
    videoPlayer.src = objectURL;

    // Auto-fill title with filename without extension if empty
    if (!titleInput.value) {
        titleInput.value = file.name.replace(/\.[^/.]+$/, "");
    }
}

function removeVideoFile() {
    const placeholder = document.getElementById('uploadPlaceholder');
    const previewContainer = document.getElementById('videoPreviewContainer');
    const videoPlayer = document.getElementById('videoPreviewPlayer');
    const fileInput = document.getElementById('videoFileInput');

    videoPlayer.pause();
    videoPlayer.src = '';
    fileInput.value = ''; // Reset input

    previewContainer.style.display = 'none';
    placeholder.style.display = 'flex';
}

// Tag Management
let currentTags = [];

function addTag(tag) {
    if (currentTags.includes(tag)) return;
    currentTags.push(tag);
    renderTags();
}

function removeTag(tag) {
    currentTags = currentTags.filter(t => t !== tag);
    renderTags();
}

function renderTags() {
    const tagsList = document.getElementById('tagsList');
    tagsList.innerHTML = currentTags.map(tag => `
        <span class="tag-chip">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">&times;</span>
        </span>
    `).join('');
}

function resetUploadForm() {
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDescription').value = '';
    document.getElementById('videoTagsInput').value = '';
    currentTags = [];
    renderTags();
    removeVideoFile();
}

async function submitVideoUpload() {
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const fileInput = document.getElementById('videoFileInput');
    const file = fileInput.files[0];

    if (!file || !title) {
        alert('Please select a video and provide a title.');
        return;
    }

    // Preparar UI
    const btn = document.querySelector('.btn-upload-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = `
        <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span>
        Uploading...
    `;
    btn.disabled = true;

    try {
        // 1. Leer archivo como Base64
        const videoDataPromise = new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
        });

        const videoBase64 = await videoDataPromise;

        // 2. Generar miniatura (Thumbnail)
        // En una implementación real, dispararíamos un canvas para capturar un frame del video
        // Por ahora, usaremos el mismo video o un placeholder (el sistema espera thumbnailData)
        const thumbnailData = await captureVideoFrame(videoBase64);

        // 3. Obtener duración del video
        const duration = await getVideoDuration(videoBase64);

        // 4. Preparar datos para DataManager
        const videoData = {
            title: title,
            description: description,
            tags: currentTags,
            duration: duration,
            videoData: videoBase64,
            thumbnailData: thumbnailData
        };

        // 5. Enviar a DataManager
        const result = await dataManager.addVideo(videoData);

        if (result) {
            alert('Video uploaded successfully!');
            closeUploadModal();

            // Recargar datos en la página actual
            if (window.location.href.includes('video-showcase.html')) {
                // Si estamos en Showcase, recargar carruseles
                if (typeof renderInnovationCarousel === 'function') {
                    // Esperar un momento para asegurar que el FS se actualizó
                    setTimeout(() => window.location.reload(), 500);
                }
            } else if (window.location.href.includes('my-videos.html')) {
                window.location.reload();
            }
        } else {
            throw new Error('Failed to save video');
        }

    } catch (error) {
        console.error('❌ Upload error:', error);
        alert('Error uploading video: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Helpers para multimedia
async function captureVideoFrame(videoSrc) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = videoSrc;
        video.muted = true;
        video.preload = 'auto'; // Asegurar carga
        video.currentTime = 1; // Capturar en el segundo 1

        video.onloadeddata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            console.log('📸 Thumbnail captured successfully');
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        video.onerror = () => {
            console.warn('⚠️ No se pudo capturar frame del video');
            resolve('');
        };

        // Timeout de seguridad
        setTimeout(() => resolve(''), 3000);
    });
}

async function getVideoDuration(videoSrc) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.src = videoSrc;
        video.onloadedmetadata = () => {
            const minutes = Math.floor(video.duration / 60);
            const seconds = Math.floor(video.duration % 60);
            resolve(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        };
        video.onerror = () => resolve('0:00');
    });
}

function saveVideoChanges() {
    const title = document.getElementById('videoTitle').value;
    if (!title) {
        alert('Please provide a video title.');
        return;
    }

    // Simulate save delay
    const btn = document.querySelector('.btn-upload-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Saving...';
    btn.disabled = true;

    setTimeout(() => {
        alert(`Changes saved for video ID: ${currentEditingId}`);
        closeUploadModal();
        btn.innerHTML = originalText;
        btn.disabled = false;

        // Here you would typically refresh the grid
        if (window.location.href.includes('my-videos.html')) {
            window.location.reload(); // Simple refresh for mock
        }
    }, 1000);
}

// Close on outside click
document.addEventListener('click', function (event) {
    const modal = document.getElementById('uploadModal');
    if (modal && event.target === modal) {
        closeUploadModal();
    }
});

// Delete current video
async function deleteCurrentVideo() {
    if (!currentEditingId) {
        console.error('No video ID to delete');
        return;
    }

    // Confirm deletion
    const confirmDelete = confirm('Are you sure you want to delete this video? This action cannot be undone.');
    if (!confirmDelete) return;

    const btn = document.getElementById('deleteVideoBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = `
        <span class="spinner-small" style="display:inline-block; width:12px; height:12px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 1s linear infinite; margin-right:8px;"></span>
        Deleting...
    `;
    btn.disabled = true;

    try {
        const result = await dataManager.deleteVideo(currentEditingId);

        if (result) {
            alert('Video deleted successfully!');
            closeUploadModal();

            // Refresh the page to show updated list
            if (window.location.href.includes('my-videos.html')) {
                window.location.reload();
            } else if (window.location.href.includes('video-showcase.html')) {
                window.location.reload();
            }
        } else {
            alert('Error deleting video. Please try again.');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error deleting video:', error);
        alert('Error deleting video: ' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Make deleteCurrentVideo globally available
window.deleteCurrentVideo = deleteCurrentVideo;
