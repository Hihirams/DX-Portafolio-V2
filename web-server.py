#!/usr/bin/env python3
"""
Servidor Web para Portafolio DX
================================
Permite acceder al portafolio desde cualquier dispositivo en la red corporativa.

Uso: python web-server.py
     Luego abre la URL mostrada en cualquier navegador de tu red.
"""

import http.server
import socketserver
import os
import sys
import socket
import json
import urllib.parse
from pathlib import Path

# Configuración
PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

def get_local_ip():
    """Obtiene la IP local de la máquina"""
    try:
        # Crear socket temporal para detectar IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado con CORS y API de listado de directorios"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Agregar headers CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Manejar preflight CORS"""
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        """Manejar peticiones GET con soporte para API de listado"""
        parsed_path = urllib.parse.urlparse(self.path)
        
        # API para listar directorios (requerida por el portafolio)
        if parsed_path.path == '/api/listdir':
            self.handle_listdir(parsed_path.query)
            return
        
        # Servir archivos normalmente
        super().do_GET()
    
    def handle_listdir(self, query):
        """API para listar archivos en un directorio"""
        try:
            params = urllib.parse.parse_qs(query)
            rel_path = params.get('path', [''])[0]
            
            # Seguridad: evitar acceso fuera del directorio
            full_path = os.path.normpath(os.path.join(DIRECTORY, rel_path))
            if not full_path.startswith(DIRECTORY):
                self.send_error(403, "Acceso denegado")
                return
            
            if not os.path.isdir(full_path):
                self.send_error(404, "Directorio no encontrado")
                return
            
            # Listar archivos
            files = [f for f in os.listdir(full_path) if not f.startswith('.')]
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'files': files}).encode())
            
        except Exception as e:
            self.send_error(500, str(e))
    
    def log_message(self, format, *args):
        """Log con formato personalizado"""
        print(f"  [REQUEST] {self.address_string()} - {args[0]}")

def main():
    local_ip = get_local_ip()
    
    print("""
+================================================================+
|                                                                |
|           SERVIDOR WEB - PORTAFOLIO DX                         |
|                                                                |
+================================================================+
|                                                                |
|   PARA TI (local):                                             |
|       http://localhost:{port}                                  |
|                                                                |
|   PARA TU EQUIPO (red corporativa):                            |
|       http://{ip}:{port}                                       |
|                                                                |
|   Comparte esta URL con cualquier persona en tu red            |
|                                                                |
+----------------------------------------------------------------+
|   Directorio: {directory}
|   Puerto: {port}                                               |
|   Para detener: Presiona Ctrl+C                                |
+================================================================+
""".format(port=PORT, ip=local_ip, directory=DIRECTORY[:40]))

    # Configurar para reintentar si el puerto está en uso
    socketserver.TCPServer.allow_reuse_address = True
    
    try:
        with socketserver.TCPServer(("0.0.0.0", PORT), CORSRequestHandler) as httpd:
            print(f"  [OK] Servidor iniciado correctamente en puerto {PORT}")
            print(f"  --> Abre: http://{local_ip}:{PORT}")
            print("")
            print("  Esperando conexiones...")
            print("  " + "-" * 50)
            httpd.serve_forever()
    except OSError as e:
        if e.errno == 10048:  # Puerto en uso (Windows)
            print(f"\n  [ERROR] El puerto {PORT} ya está en uso.")
            print(f"  [TIP] Intenta cerrar otros programas o cambia el puerto.")
        else:
            print(f"\n  [ERROR] {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n  [STOP] Servidor detenido")
        sys.exit(0)

if __name__ == "__main__":
    main()
