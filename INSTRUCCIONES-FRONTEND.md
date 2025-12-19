# ⚠️ INSTRUCCIONES IMPORTANTES PARA EL FRONTEND

## Estructura Correcta de Carpetas

Cuando compiles las aplicaciones Angular y las copies al servidor, los archivos deben quedar **directamente** en las carpetas `frontend/admin/` y `frontend/scanner/`, **NO en una subcarpeta `browser/`**.

### ❌ ESTRUCTURA INCORRECTA

```
C:\Apps\gestion-backend-ar\
├── frontend/
│   ├── admin/
│   │   └── browser/          ← ❌ MAL - No debe existir esta carpeta
│   │       ├── index.html
│   │       ├── main-*.js
│   │       └── ...
│   └── scanner/
│       └── browser/          ← ❌ MAL
│           ├── index.html
│           └── ...
```

### ✅ ESTRUCTURA CORRECTA

```
C:\Apps\gestion-backend-ar\
├── frontend/
│   ├── admin/
│   │   ├── index.html        ← ✅ BIEN - Directamente aquí
│   │   ├── main-*.js
│   │   ├── styles-*.css
│   │   ├── polyfills-*.js
│   │   └── assets/
│   └── scanner/
│       ├── index.html        ← ✅ BIEN - Directamente aquí
│       ├── main-*.js
│       └── assets/
```

## Cómo Copiar Correctamente

Cuando Angular compila tu aplicación, crea esta estructura:

```
dist/
└── nombre-proyecto/
    └── browser/              ← Esta es la carpeta que contiene los archivos
        ├── index.html
        ├── main-*.js
        └── ...
```

**Debes copiar el CONTENIDO de la carpeta `browser/`**, no la carpeta en sí.

### PowerShell (Recomendado)

```powershell
# Panel Admin
xcopy /s /e "ruta-local\dist\admin-panel\browser\*" "C:\Apps\gestion-backend-ar\frontend\admin\"

# Scanner
xcopy /s /e "ruta-local\dist\scanner-app\browser\*" "C:\Apps\gestion-backend-ar\frontend\scanner\"
```

### Via RDP

1. Abrir la carpeta `dist/nombre-proyecto/browser/`
2. Seleccionar **TODO el contenido** (Ctrl+A)
3. Copiar (Ctrl+C)
4. Pegar en `C:\Apps\gestion-backend-ar\frontend\admin\` (NO crear subcarpeta)

## Verificación

Después de copiar, verifica que estos archivos existan:

```powershell
# Debe existir:
C:\Apps\gestion-backend-ar\frontend\admin\index.html

# NO debe existir:
C:\Apps\gestion-backend-ar\frontend\admin\browser\index.html
```

Si existe la carpeta `browser/`, **mueve** su contenido un nivel arriba y elimina la carpeta `browser/`:

```powershell
# En PowerShell
cd C:\Apps\gestion-backend-ar\frontend\admin
Move-Item -Path "browser\*" -Destination "." -Force
Remove-Item -Path "browser" -Recurse -Force
```

## Configuración del Backend

El backend está configurado para servir desde:

- `/panel` → `frontend/admin/index.html`
- `/scanner` → `frontend/scanner/index.html`

Si los archivos no están en la ubicación correcta, el servidor devolverá error 404.
