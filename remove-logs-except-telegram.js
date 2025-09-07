#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para eliminar TODOS los logs EXCEPTO los de telegram-notification.service.ts
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

// Archivos a excluir (NO procesar)
const excludeFiles = [
  'remove-logs.js',
  'remove-logs-safe.js',
  'remove-remaining-logs.js',
  'remove-all-logs.js',
  'remove-logs-except-telegram.js',
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'telegram-notification.service.ts' // EXCLUIR este archivo específico
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
 * Elimina logs de un archivo de forma segura (solo líneas completas)
 */
function removeLogsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let newLines = [];
    let fileLogCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Solo eliminar líneas que contengan ÚNICAMENTE logs
      if (
        // Líneas que empiezan y terminan con console.log
        (trimmedLine.startsWith('console.log(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('console.warn(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('console.error(') && trimmedLine.endsWith(';')) ||
        
        // Líneas que empiezan y terminan con this.logger
        (trimmedLine.startsWith('this.logger.log(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('this.logger.warn(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('this.logger.error(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('this.logger.debug(') && trimmedLine.endsWith(';')) ||
        
        // Líneas que empiezan y terminan con Logger
        (trimmedLine.startsWith('Logger.log(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('Logger.warn(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('Logger.error(') && trimmedLine.endsWith(';')) ||
        (trimmedLine.startsWith('Logger.debug(') && trimmedLine.endsWith(';'))
      ) {
        // Esta línea es SOLO un log, eliminarla
        fileLogCount++;
        continue; // No agregar esta línea
      }

      // Mantener todas las demás líneas
      newLines.push(line);
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
  console.log(`${colors.cyan}🧹 Iniciando limpieza de logs (EXCEPTO telegram-notification.service.ts)...${colors.reset}\n`);

  const startTime = Date.now();
  const projectRoot = process.cwd();

  console.log(`${colors.blue}📁 Procesando directorio: ${projectRoot}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  EXCLUYENDO: telegram-notification.service.ts${colors.reset}\n`);

  processDirectory(projectRoot);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.cyan}📊 RESUMEN DE LIMPIEZA:${colors.reset}`);
  console.log(`${colors.green}✅ Archivos procesados: ${processedFiles}${colors.reset}`);
  console.log(`${colors.blue}📁 Total archivos escaneados: ${totalFiles}${colors.reset}`);
  console.log(`${colors.red}🗑️  Logs eliminados: ${removedLogs}${colors.reset}`);
  console.log(`${colors.yellow}⏱️  Tiempo transcurrido: ${duration}s${colors.reset}`);

  if (removedLogs > 0) {
    console.log(`\n${colors.green}🎉 ¡Limpieza completada!${colors.reset}`);
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
