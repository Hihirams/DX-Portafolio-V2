# Portfolio DX - Build Portable

## 📦 Cómo crear el ejecutable portable

### Requisitos previos
Necesitas tener instalado Node.js en una PC con permisos de administrador (solo para crear el build, luego es portable).

### Pasos para compilar

1. **Instalar dependencias** (primera vez solamente):
```bash
npm install
```

2. **Compilar el ejecutable portable**:
```bash
npm run build:portable
```

3. **El ejecutable estará en**:
```
dist/PortfolioDX-Portable.exe
```

### 📁 Estructura para distribución

Una vez compilado, copia estos archivos/carpetas a la ubicación compartida:

```
\\servidor\PortfolioDX\
├── PortfolioDX-Portable.exe    ← El ejecutable generado
├── users\                       ← Carpeta de datos de usuarios
├── data\                        ← Carpeta de configuración
└── assets\                      ← Recursos (logos, etc.)
```

### 🚀 Uso

Los usuarios solo necesitan:
1. Navegar a la carpeta compartida
2. Doble clic en `PortfolioDX-Portable.exe`
3. Login con sus credenciales

**Importante:** Todos los cambios se guardan en la misma carpeta compartida, por lo que las actualizaciones son visibles para todos en tiempo real.

### 🔐 Usuarios de prueba

- **Usuario:** hiram.gonzalez | **Contraseña:** demo123
- **Usuario:** sandra.santos | **Contraseña:** demo123
- **Usuario:** miguel.coronado | **Contraseña:** demo123
- **Usuario:** brayan.rocha | **Contraseña:** demo123

### 🛠️ Desarrollo

Para trabajar en modo desarrollo:
```bash
npm start
```

Con DevTools abierto:
```bash
npm run dev
```

### 📝 Notas

- El ejecutable es portable: no requiere instalación
- Funciona sin permisos de administrador
- Los datos se guardan en la misma carpeta donde está el .exe
- Compatible con carpetas compartidas en red
