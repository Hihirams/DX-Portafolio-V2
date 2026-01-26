// js/loader.js
document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById('dx-loader-overlay');
    const statusText = document.getElementById('dx-loader-status');
    const titleElement = document.querySelector('.dx-loader-title');

    // Si no existen, salimos para evitar errores
    if (!loader || !statusText || !titleElement) return;

    // ==========================================
    // DETECTAR PÁGINA ACTUAL POR ARCHIVO HTML
    // ==========================================
    // Normalizamos a minúsculas para evitar problemas de mayúsculas/minúsculas
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('?')[0].split('#')[0]; // Limpiar query params y hash
    const currentPage = filename.replace('.html', '').toLowerCase() || 'index';

    const sectionTitles = {
        'index': 'Digital Transformation',
        'video-showcase': 'Video Showcase',
        'project-manager': 'Project Overview',
        'portfolio-viewer': 'Portfolio DX',
        'portfolio-editor': 'Portfolio Editor',
        'portfolio': 'Portfolio',
        'contact': 'Contact Us',
        'team': 'Our Team',
        'blog': 'Blog',
        'careers': 'Careers',
        'projects': 'Our Projects',
        'default': 'Digital Transformation'
    };

    // Cambiar título según la página actual
    const displayTitle = sectionTitles[currentPage] || sectionTitles['default'];
    titleElement.textContent = displayTitle;

    // ==========================================
    // MENSAJES DE ESTADO
    // ==========================================
    const messages = [
        'Initializing System',
        'Loading Assets',
        'Configuring Environment',
        'Secure Connection Established'
    ];

    let step = 0;

    // Cambiar texto cada 800ms
    const textInterval = setInterval(() => {
        step++;
        if (step < messages.length) {
            statusText.innerText = messages[step];
        }
    }, 800);

    // ==========================================
    // FINALIZAR CARGA
    // ==========================================
    setTimeout(() => {
        clearInterval(textInterval);
        statusText.innerText = 'Ready';

        // Añadir clase para desvanecer
        loader.classList.add('loader-hidden');

        // Eliminar el loader del DOM después de la animación
        setTimeout(() => {
            loader.remove();
        }, 1000);

    }, 1500); // 4 segundos de carga
});