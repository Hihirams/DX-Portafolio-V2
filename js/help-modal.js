/**
 * HELP & SUPPORT MODAL
 * Shared functionality for all pages
 */

// HTML Structure for the modal
const helpModalHTML = `
<div id="helpModal" class="modal help-modal">
    <div class="modal-content help-modal-content">
        <div class="modal-header">
            <h3 class="modal-title">Help & Support</h3>
            <button class="modal-close" onclick="closeHelpModal()">&times;</button>
        </div>
        <div class="modal-body help-modal-body">
            <div class="help-section">
                <div class="help-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <h4>Need Assistance?</h4>
                <p>If you're experiencing issues or have questions about the Portfolio DX platform, our team is here to help.</p>
            </div>

            <div class="contact-options">
                <div class="contact-card">
                    <div class="contact-icon">📧</div>
                    <div class="contact-info">
                        <h5>Email Support</h5>
                        <p>dx-support@example.com</p>
                        <a href="mailto:dx-support@example.com" class="contact-link">Send Email</a>
                    </div>
                </div>
                <div class="contact-card">
                    <div class="contact-icon">💬</div>
                    <div class="contact-info">
                        <h5>Teams Channel</h5>
                        <p>DX Innovation Zone</p>
                        <a href="#" class="contact-link">Open Teams</a>
                    </div>
                </div>
            </div>

            <div class="help-footer">
                <p>Version 2.0.0 | QE DX-INN</p>
            </div>
        </div>
    </div>
</div>
`;

// Inject Modal into DOM
function injectHelpModal() {
    if (!document.getElementById('helpModal')) {
        document.body.insertAdjacentHTML('beforeend', helpModalHTML);
    }
}

// Open Modal
function openHelpModal() {
    injectHelpModal(); // Ensure it exists
    const modal = document.getElementById('helpModal');

    // Slight delay to allow display:flex to apply before opacity transition if needed
    modal.classList.add('active');

    // Add blur effect to main content if it exists
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (mainContent) {
        mainContent.style.filter = 'blur(5px)';
        mainContent.style.transition = 'filter 0.3s ease';
    }

    document.body.style.overflow = 'hidden'; // Prevent scrolling
}

// Close Modal
function closeHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.classList.remove('active');
    }

    // Remove blur effect
    const mainContent = document.querySelector('.main-content') || document.querySelector('main');
    if (mainContent) {
        mainContent.style.filter = 'none';
    }

    document.body.style.overflow = ''; // Restore scrolling
}

// Global binding for the dropdown menu
window.navigateToHelp = openHelpModal;

// Close on outside click
document.addEventListener('click', function (event) {
    const modal = document.getElementById('helpModal');
    if (modal && event.target === modal) {
        closeHelpModal();
    }
});

// Close on Escape key
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeHelpModal();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    injectHelpModal();
});
