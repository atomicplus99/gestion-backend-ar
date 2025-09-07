#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script mejorado para eliminar logs del proyecto de forma segura
 * Solo elimina líneas completas que contienen logs, no logs dentro de strings
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

// Patrones de logs a eliminar (solo líneas completas)
const logPatterns = [
  // Líneas que solo contienen console.log, console.warn, console.error
  /^\s*console\.(log|warn|error)\s*\([^)]*\)\s*;?\s*$/gm,
  
  // Líneas que solo contienen this.logger.log, this.logger.warn, etc.
  /^\s*this\.logger\.(log|warn|error|debug)\s*\([^)]*\)\s*;?\s*$/gm,
  
  // Líneas que solo contienen Logger.log, Logger.warn, etc.
  /^\s*Logger\.(log|warn|error|debug)\s*\([^)]*\)\s*;?\s*$/gm,
  
  // Líneas que contienen solo console.log con template literals simples
  /^\s*console\.(log|warn|error)\s*\(`[^`]*`\)\s*;?\s*$/gm,
  
  // Líneas que contienen solo this.logger con template literals simples
  /^\s*this\.logger\.(log|warn|error|debug)\s*\(`[^`]*`\)\s*;?\s*$/gm
];

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
 * Elimina logs de un archivo de forma segura
 */
function removeLogsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let newLines = [];
    let fileLogCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let shouldRemove = false;

      // Verificar si la línea coincide con algún patrón de log
      for (const pattern of logPatterns) {
        if (pattern.test(line)) {
          shouldRemove = true;
          fileLogCount++;
          break;
        }
      }

      if (!shouldRemove) {
        newLines.push(line);
      }
    }

    // Si se encontraron logs, escribir el archivo
    if (fileLogCount > 0) {
      const newContent = newLines.join('\n');
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
          const logsRemoved = removeLogsFromFile(itemPath);
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
  console.log(`${colors.cyan}🧹 Iniciando limpieza SEGURA de logs del proyecto...${colors.reset}\n`);

  const startTime = Date.now();
  const projectRoot = process.cwd();

  console.log(`${colors.blue}📁 Procesando directorio: ${projectRoot}${colors.reset}`);
  console.log(`${colors.yellow}🔍 Patrones a eliminar (solo líneas completas):${colors.reset}`);
  console.log(`   - console.log(), console.warn(), console.error()`);
  console.log(`   - this.logger.log(), this.logger.warn(), this.logger.error(), this.logger.debug()`);
  console.log(`   - Logger.log(), Logger.warn(), Logger.error(), Logger.debug()`);
  console.log(`${colors.yellow}📄 Extensiones: ${fileExtensions.join(', ')}${colors.reset}`);
  console.log(`${colors.magenta}⚠️  Solo se eliminan líneas completas que contienen logs${colors.reset}\n`);

  processDirectory(projectRoot);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.cyan}📊 RESUMEN DE LIMPIEZA SEGURA:${colors.reset}`);
  console.log(`${colors.green}✅ Archivos procesados: ${processedFiles}${colors.reset}`);
  console.log(`${colors.blue}📁 Total archivos escaneados: ${totalFiles}${colors.reset}`);
  console.log(`${colors.red}🗑️  Logs eliminados: ${removedLogs}${colors.reset}`);
  console.log(`${colors.yellow}⏱️  Tiempo transcurrido: ${duration}s${colors.reset}`);

  if (removedLogs > 0) {
    console.log(`\n${colors.green}🎉 ¡Limpieza segura completada exitosamente!${colors.reset}`);
    console.log(`${colors.yellow}💡 Recomendación: Ejecuta 'npm run build' para verificar que no hay errores.${colors.reset}`);
  } else {
    console.log(`\n${colors.blue}ℹ️  No se encontraron logs para eliminar.${colors.reset}`);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { removeLogsFromFile, processDirectory };
