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
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('?')[0].split('#')[0];
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

    // ==========================================
    // PÁGINAS CON TEMA OSCURO (FORZADO)
    // ==========================================
    const darkThemePages = [
        'video-showcase',
        'portfolio-viewer',
        // Agrega aquí más páginas que necesiten tema oscuro
    ];

    // Obtener preferencia del usuario (localStorage)
    // Asumimos que tu toggle de tema guarda 'dark' o 'light' en 'theme'
    const userTheme = localStorage.getItem('theme') || 'light';

    // Detectar si venimos de una página forzada oscura (Usando sessionStorage para mayor fiabilidad)
    const previousPage = sessionStorage.getItem('lastPage') || '';
    const cameFromForcedDark = darkThemePages.includes(previousPage);
    const isForcedDarkPage = darkThemePages.includes(currentPage);

    // Guardar página actual para la siguiente navegación
    sessionStorage.setItem('lastPage', currentPage);

    // Estado inicial del loader
    let startDark = (userTheme === 'dark') || (userTheme === 'light' && cameFromForcedDark);

    // Si vamos a una página forzada oscura y somos light, empezamos light para el fade (Light -> Dark)
    if (isForcedDarkPage && userTheme === 'light') {
        startDark = false;
    }

    // Aplicar clase inicial INMEDIATAMENTE antes de que renderice
    if (startDark) {
        loader.classList.add('dx-loader-transitioning');
        loader.classList.add('dx-loader-dark');
    } else {
        loader.classList.remove('dx-loader-transitioning');
        loader.classList.remove('dx-loader-dark');
    }

    // Cambiar título según la página actual
    const displayTitle = sectionTitles[currentPage] || sectionTitles['default'];
    titleElement.textContent = displayTitle;

    // ==========================================
    // LÓGICA DE TRANSICIÓN
    // ==========================================

    // CASO 1: Usuario Light -> Entra a Página Forzada Oscura (Fade Light -> Dark)
    if (userTheme === 'light' && isForcedDarkPage) {
        // Esperar 600ms antes de iniciar la transición
        setTimeout(() => {
            loader.classList.add('dx-loader-transitioning');
        }, 600);
    }

    // CASO 2: Usuario Light -> Sale de Página Forzada Oscura a Normal (Fade Dark -> Light)
    else if (userTheme === 'light' && cameFromForcedDark && !isForcedDarkPage) {
        // Ya empezamos con dark (startDark = true)
        // Ahora debemos quitarlo suavemente para que haga fade a blanco
        setTimeout(() => {
            loader.classList.remove('dx-loader-transitioning');
            loader.classList.remove('dx-loader-dark');
        }, 100);
    }

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

    }, 1500);
});