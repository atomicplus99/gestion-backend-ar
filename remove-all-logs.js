#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script AGRESIVO para eliminar TODOS los logs del proyecto
 */

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Extensiones de archivos a procesar
const fileExtensions = ['.ts', '.js', '.tsx', '.jsx'];

// Directorios a excluir
const excludeDirs = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'coverage',
  '.nyc_output'
];

// Archivos a excluir
const excludeFiles = [
  'remove-logs.js',
  'remove-logs-safe.js',
  'remove-remaining-logs.js',
  'remove-all-logs.js',
  'package.json',
  'package-lock.json',
  'yarn.lock'
];

let totalFiles = 0;
let processedFiles = 0;
let removedLogs = 0;

/**
 * Verifica si un directorio debe ser excluido
 */
function shouldExcludeDir(dirName) {
  return excludeDirs.some(excludeDir => 
    dirName === excludeDir || dirName.startsWith('.')
  );
}

/**
 * Verifica si un archivo debe ser excluido
 */
function shouldExcludeFile(fileName) {
  return excludeFiles.some(excludeFile => fileName === excludeFile);
}

/**
 * Verifica si un archivo tiene una extensión válida
 */
function hasValidExtension(fileName) {
  return fileExtensions.some(ext => fileName.endsWith(ext));
}

/**
 * Elimina TODOS los logs de un archivo de forma agresiva
 */
function removeAllLogsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let fileLogCount = 0;

    // Patrones más agresivos para eliminar logs
    const aggressivePatterns = [
      // Eliminar líneas completas que contienen console.log
      /^\s*console\.log\([^)]*\)\s*;?\s*$/gm,
      /^\s*console\.warn\([^)]*\)\s*;?\s*$/gm,
      /^\s*console\.error\([^)]*\)\s*;?\s*$/gm,
      
      // Eliminar console.log dentro de líneas (más agresivo)
      /console\.log\([^)]*\)\s*;?\s*/g,
      /console\.warn\([^)]*\)\s*;?\s*/g,
      /console\.error\([^)]*\)\s*;?\s*/g,
      
      // Eliminar this.logger
      /^\s*this\.logger\.(log|warn|error|debug)\([^)]*\)\s*;?\s*$/gm,
      /this\.logger\.(log|warn|error|debug)\([^)]*\)\s*;?\s*/g,
      
      // Eliminar Logger
      /^\s*Logger\.(log|warn|error|debug)\([^)]*\)\s*;?\s*$/gm,
      /Logger\.(log|warn|error|debug)\([^)]*\)\s*;?\s*/g
    ];

    // Aplicar cada patrón
    aggressivePatterns.forEach(pattern => {
      const matches = newContent.match(pattern);
      if (matches) {
        fileLogCount += matches.length;
        newContent = newContent.replace(pattern, '');
      }
    });

    // Limpiar líneas vacías múltiples
    newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    newContent = newContent.replace(/^\s*\n/gm, '');

    // Si se encontraron logs, escribir el archivo
    if (fileLogCount > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`${colors.green}✅${colors.reset} ${filePath} - ${fileLogCount} logs eliminados`);
      removedLogs += fileLogCount;
    }

    return fileLogCount;
  } catch (error) {
    console.error(`${colors.red}❌${colors.reset} Error procesando ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Procesa un directorio recursivamente
 */
function processDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        if (!shouldExcludeDir(item)) {
          processDirectory(itemPath);
        }
      } else if (stat.isFile()) {
        if (hasValidExtension(item) && !shouldExcludeFile(item)) {
          totalFiles++;
          const logsRemoved = removeAllLogsFromFile(itemPath);
          if (logsRemoved > 0) {
            processedFiles++;
          }
        }
      }
    });
  } catch (error) {
    console.error(`${colors.red}❌${colors.reset} Error accediendo a directorio ${dirPath}: ${error.message}`);
  }
}

/**
 * Función principal
 */
function main() {
  console.log(`${colors.cyan}🧹 Iniciando limpieza AGRESIVA de TODOS los logs...${colors.reset}\n`);

  const startTime = Date.now();
  const projectRoot = process.cwd();

  console.log(`${colors.blue}📁 Procesando directorio: ${projectRoot}${colors.reset}`);
  console.log(`${colors.red}⚠️  MODO AGRESIVO: Eliminando TODOS los logs${colors.reset}\n`);

  processDirectory(projectRoot);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.cyan}📊 RESUMEN DE LIMPIEZA AGRESIVA:${colors.reset}`);
  console.log(`${colors.green}✅ Archivos procesados: ${processedFiles}${colors.reset}`);
  console.log(`${colors.blue}📁 Total archivos escaneados: ${totalFiles}${colors.reset}`);
  console.log(`${colors.red}🗑️  Logs eliminados: ${removedLogs}${colors.reset}`);
  console.log(`${colors.yellow}⏱️  Tiempo transcurrido: ${duration}s${colors.reset}`);

  if (removedLogs > 0) {
    console.log(`\n${colors.green}🎉 ¡Limpieza agresiva completada!${colors.reset}`);
    console.log(`${colors.yellow}💡 Recomendación: Ejecuta 'npm run build' para verificar que no hay errores.${colors.reset}`);
  } else {
    console.log(`\n${colors.blue}ℹ️  No se encontraron logs para eliminar.${colors.reset}`);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { removeAllLogsFromFile, processDirectory };
