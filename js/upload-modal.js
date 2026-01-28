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

function submitVideoUpload() {
    // Mock submission - existing "backend" logic would go here
    const title = document.getElementById('videoTitle').value;
    const fileInput = document.getElementById('videoFileInput');

    if (!fileInput.files[0] || !title) {
        alert('Please select a video and provide a title.');
        return;
    }

    // Simulate upload delay
    const btn = document.querySelector('.btn-upload-submit');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Uploading...';
    btn.disabled = true;

    setTimeout(() => {
        alert('Video uploaded successfully!');
        closeUploadModal();
        btn.innerHTML = originalText;
        btn.disabled = false;

        // Here you would typically trigger a refresh of the video grid
        if (window.location.href.includes('my-videos.html')) {
            window.location.reload(); // Simple refresh for mock
        }
    }, 1500);
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
