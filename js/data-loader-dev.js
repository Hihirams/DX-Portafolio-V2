// ============================================
// DATA LOADER DEV - Carga datos sin Electron (Desarrollo)
// Simula el API de Electron para desarrollo local
// ============================================

/**
 * API simulada de Electron para desarrollo
 * Permite cargar datos desde archivos JSON sin necesidad de compilar
 */
window.electronAPI = {
    /**
     * Lee un archivo JSON
     */
    readJSON: async (filePath) => {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                return {
                    success: false,
                    error: `Archivo no encontrado: ${filePath}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                data: data
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Escribe un archivo JSON
     */
    writeJSON: async (filePath, data) => {
        try {
            // En modo desarrollo, solo simulamos la escritura
            console.log(`📝 [DEV] Simulando escritura a ${filePath}:`, data);
            
            // Guardar en localStorage como backup
            const key = `data_${filePath.replace(/[/\\]/g, '_')}`;
            localStorage.setItem(key, JSON.stringify(data));
            
            return {
                success: true,
                message: 'Datos guardados en localStorage (simulación)'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    },

    /**
     * Verifica si un archivo existe
     */
    fileExists: async (filePath) => {
        try {
            const response = await fetch(filePath, { method: 'HEAD' });
            return {
                exists: response.ok,
                path: filePath
            };
        } catch (error) {
            return {
                exists: false,
                path: filePath
            };
        }
    },

    /**
     * Lista archivos en un directorio
     */
    listDir: async (dirPath) => {
        // En desarrollo, retornamos una lista simulada
        // Esto es una limitación del navegador
        console.warn(`📂 [DEV] listDir no está completamente soportado en navegador para ${dirPath}`);
        
        // Intentar hacer fetch a un endpoint si existe
        try {
            const response = await fetch(`/api/listdir?path=${encodeURIComponent(dirPath)}`);
            if (response.ok) {
                const data = await response.json();
                return {
                    success: true,
                    files: data.files || []
                };
            }
        } catch (error) {
            console.log('Servidor no disponible, retornando lista vacía');
        }
        
        return {
            success: false,
            files: [],
            error: 'listDir no soportado en navegador'
        };
    }
};

/**
 * Sistema de recarga en vivo (polling)
 * Detecta cambios en projects.json y recarga automáticamente
 */
class DataWatcher {
    constructor() {
        this.lastETag = null;
        this.pollingInterval = 3000; // Verificar cada 3 segundos
        this.isWatching = false;
    }

    /**
     * Inicia el monitoreo de cambios en data/projects.json
     */
    start() {
        if (this.isWatching) return;
        this.isWatching = true;
        
        console.log('👀 Iniciando monitoreo de cambios en desarrollo...');
        
        // Polling para detectar cambios
        this.interval = setInterval(async () => {
            await this.checkForChanges();
        }, this.pollingInterval);
    }

    /**
     * Detiene el monitoreo
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
        }
        this.isWatching = false;
    }

    /**
     * Verifica si projects.json ha cambiado
     */
    async checkForChanges() {
        try {
            const response = await fetch('data/projects.json', { cache: 'no-store' });
            
            if (!response.ok) return;
            
            const eTag = response.headers.get('etag') || 
                        response.headers.get('last-modified') ||
                        new Date().getTime().toString();
            
            if (this.lastETag === null) {
                this.lastETag = eTag;
                return;
            }

            if (eTag !== this.lastETag) {
                console.log('🔄 ¡Cambios detectados en projects.json!');
                this.lastETag = eTag;
                
                // Recargar datos
                await dataManager.loadAllData();
                
                // Notificar a la UI
                window.dispatchEvent(new Event('dataReloaded'));
                
                // Mostrar notificación visual
                this.showReloadNotification();
            }
        } catch (error) {
            // Silenciar errores de red
        }
    }

    /**
     * Muestra notificación de recarga
     */
    showReloadNotification() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        `;
        notification.textContent = '✅ Datos actualizados en vivo';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Crear instancia global del watcher
const dataWatcher = new DataWatcher();

// ============================================
// INICIALIZACIÓN
// ============================================

console.log('✅ Data Loader DEV iniciado');
console.log('📡 Cargando datos desde archivos JSON locales...');

// 🔴 MONITOREO DE CAMBIOS DESACTIVADO
// dataWatcher.start();
// Para activar hot-reload, descomenta la línea anterior

// Evento personalizado para indicar que el API de Electron está listo
const apiReadyEvent = new Event('electronAPIReady');
window.dispatchEvent(apiReadyEvent);
