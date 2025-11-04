# 🚀 GUÍA RÁPIDA - Portfolio DX

## ⚡ Instalación en 3 pasos

### 1️⃣ Instalar Node.js (si no lo tienes)
Descarga e instala desde: https://nodejs.org/
- Elige la versión LTS (recomendada)
- Instala con opciones por defecto

### 2️⃣ Compilar el ejecutable
Abre una terminal (CMD o PowerShell) en esta carpeta y ejecuta:

**Opción A - Script automático:**
```
BUILD.bat
```

**Opción B - Manual:**
```
npm install
npm run build:portable
```

### 3️⃣ Distribuir
El ejecutable estará en: `dist\PortfolioDX-Portable.exe`

Copia a la carpeta compartida:
```
\\servidor\PortfolioDX\
├── PortfolioDX-Portable.exe    ← Copia este archivo
├── users\                       ← Crea esta carpeta vacía
├── data\                        ← Copia esta carpeta con users.json
└── assets\                      ← Copia esta carpeta (opcional, para logos)
```

## 🎯 Uso diario

Los usuarios solo necesitan:
1. Abrir la carpeta compartida
2. Doble clic en `PortfolioDX-Portable.exe`
3. Login con sus credenciales

## 🔐 Usuarios de prueba

| Usuario | Contraseña |
|---------|-----------|
| hiram.gonzalez | demo123 |
| sandra.santos | demo123 |
| miguel.coronado | demo123 |
| brayan.rocha | demo123 |

## 📝 Agregar nuevos usuarios

Edita el archivo `data\users.json` y agrega:
```json
{
  "id": "nuevo.usuario",
  "username": "nuevo.usuario",
  "password": "contraseña123",
  "name": "Nombre Completo",
  "role": "Rol en DX",
  "email": "email@dx.com",
  "avatar": null,
  "createdAt": "2025-11-03T00:00:00.000Z"
}
```

## ❓ Problemas comunes

**Error: "Node.js no encontrado"**
- Instala Node.js desde nodejs.org
- Reinicia la terminal después de instalar

**Error en npm install**
- Ejecuta: `npm cache clean --force`
- Intenta de nuevo: `npm install`

**El .exe no inicia**
- Verifica que las carpetas `users/` y `data/` existan
- Revisa que `data/users.json` tenga contenido válido

## 🆘 Soporte

Contacta al equipo DX para ayuda adicional.
