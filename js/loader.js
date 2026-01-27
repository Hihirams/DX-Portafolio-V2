// js/loader.js
// ==========================================
// LOADER CON TRANSICIONES DE TEMA
// ==========================================
// Comportamiento:
// - Loader blanco en tema blanco (páginas normales)
// - Loader negro en tema negro
// - Transición gradiente blanco→negro cuando se va a página forzada oscura
// - Transición gradiente negro→blanco cuando se sale de página forzada oscura

document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById('dx-loader-overlay');
    const statusText = document.getElementById('dx-loader-status');
    const titleElement = document.querySelector('.dx-loader-title');

    // Si no existen, salimos para evitar errores
    if (!loader || !statusText || !titleElement) return;

    // ==========================================
    // CONFIGURACIÓN
    // ==========================================

    // Páginas que SIEMPRE usan tema oscuro (independiente de preferencia del usuario)
    // Solo video-showcase es forzada oscura
    const forcedDarkPages = [
        'video-showcase',
        // Agrega aquí más páginas si necesitas que sean siempre oscuras
    ];

    // Títulos para cada página
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
    // DETECTAR PÁGINA ACTUAL
    // ==========================================
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('?')[0].split('#')[0];
    const currentPage = filename.replace('.html', '').toLowerCase() || 'index';

    // ==========================================
    // OBTENER ESTADOS
    // ==========================================

    // Preferencia del usuario (del toggle de tema)
    const userTheme = localStorage.getItem('theme') || 'light';

    // Información de la navegación anterior
    const previousPageData = sessionStorage.getItem('loaderPageData');
    let previousEffectiveTheme = userTheme; // Por defecto usamos el tema del usuario

    if (previousPageData) {
        try {
            const data = JSON.parse(previousPageData);
            previousEffectiveTheme = data.effectiveTheme || userTheme;
        } catch (e) {
            console.warn('Error parsing previous page data:', e);
        }
    }

    // ¿Esta página es forzada oscura?
    const isCurrentPageForcedDark = forcedDarkPages.includes(currentPage);

    // Calcular el tema EFECTIVO de esta página
    // (forzado oscuro > preferencia del usuario)
    const currentEffectiveTheme = isCurrentPageForcedDark ? 'dark' : userTheme;

    // Debug logging (activar si hay problemas)
    console.log('🎨 Loader:', {
        currentPage,
        userTheme,
        isCurrentPageForcedDark,
        previousEffectiveTheme,
        currentEffectiveTheme,
        transition: previousEffectiveTheme !== currentEffectiveTheme
            ? `${previousEffectiveTheme} → ${currentEffectiveTheme}`
            : 'none'
    });

    // Guardar el estado actual para la próxima navegación
    sessionStorage.setItem('loaderPageData', JSON.stringify({
        page: currentPage,
        effectiveTheme: currentEffectiveTheme,
        timestamp: Date.now()
    }));


    // ==========================================
    // DETERMINAR TIPO DE TRANSICIÓN
    // ==========================================

    // Tipos de escenario:
    // 1. SAME: Ambos temas iguales (sin transición)
    // 2. LIGHT_TO_DARK: Transición de claro a oscuro
    // 3. DARK_TO_LIGHT: Transición de oscuro a claro

    let transitionType = 'SAME';

    if (previousEffectiveTheme === 'light' && currentEffectiveTheme === 'dark') {
        transitionType = 'LIGHT_TO_DARK';
    } else if (previousEffectiveTheme === 'dark' && currentEffectiveTheme === 'light') {
        transitionType = 'DARK_TO_LIGHT';
    }

    // Debug logging (descomente para debug)
    // console.log('🎨 Loader Debug:', {
    //     currentPage,
    //     userTheme,
    //     isCurrentPageForcedDark,
    //     previousEffectiveTheme,
    //     currentEffectiveTheme,
    //     transitionType
    // });

    // ==========================================
    // APLICAR ESTADO INICIAL DEL LOADER
    // ==========================================

    // Removemos cualquier clase residual
    loader.classList.remove('dx-loader-dark', 'dx-loader-transitioning');

    switch (transitionType) {
        case 'LIGHT_TO_DARK':
            // Empezamos en CLARO, luego transicionamos a OSCURO
            // El loader ya está claro por defecto (CSS base)
            break;

        case 'DARK_TO_LIGHT':
            // Empezamos en OSCURO, luego transicionamos a CLARO
            loader.classList.add('dx-loader-dark');
            break;

        case 'SAME':
        default:
            // Sin transición, aplicar el tema final directamente
            if (currentEffectiveTheme === 'dark') {
                loader.classList.add('dx-loader-dark');
            }
            break;
    }

    // Cambiar título según la página actual
    const displayTitle = sectionTitles[currentPage] || sectionTitles['default'];
    titleElement.textContent = displayTitle;

    // ==========================================
    // EJECUTAR TRANSICIÓN (si aplica)
    // ==========================================

    // Pequeño delay para que el estado inicial se renderice primero
    requestAnimationFrame(() => {
        setTimeout(() => {
            if (transitionType === 'LIGHT_TO_DARK') {
                // Añadir clase oscura para activar la transición CSS
                loader.classList.add('dx-loader-dark');
            } else if (transitionType === 'DARK_TO_LIGHT') {
                // Quitar clase oscura para activar la transición CSS
                loader.classList.remove('dx-loader-dark');
            }
        }, 100); // Pequeño delay para asegurar que el estado inicial se renderizó
    });

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

    // Cambiar texto cada 350ms (más rápido para mejor UX)
    const textInterval = setInterval(() => {
        step++;
        if (step < messages.length) {
            statusText.innerText = messages[step];
        }
    }, 350);

    // ==========================================
    // FINALIZAR CARGA
    // ==========================================
    const loaderDuration = 1500; // Duración total del loader

    setTimeout(() => {
        clearInterval(textInterval);
        statusText.innerText = 'Ready';

        // Añadir clase para desvanecer
        loader.classList.add('loader-hidden');

        // Eliminar el loader del DOM después de la animación
        setTimeout(() => {
            loader.remove();
        }, 800); // Matching CSS transition duration

    }, loaderDuration);
});