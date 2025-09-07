#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script para eliminar los logs restantes que no fueron capturados
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

// Archivos específicos que tienen logs restantes
const filesToClean = [
  'src/main.ts',
  'src/entities/turno/turno.service.ts',
  'src/entities/turno/turno.controller.ts',
  'src/entities/telegram/telegram.controller.ts',
  'src/entities/justificacion/use-cases/update-estado-justificacion.usecase.ts'
];

let totalLogsRemoved = 0;

/**
 * Elimina logs específicos de un archivo
 */
function cleanSpecificFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`${colors.yellow}⚠️${colors.reset} Archivo no encontrado: ${filePath}`);
      return 0;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let newLines = [];
    let logsRemoved = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let newLine = line;

      // Eliminar console.log específicos
      if (line.includes('console.log(')) {
        // Si la línea solo contiene console.log, eliminarla completamente
        if (line.trim().startsWith('console.log(') && line.trim().endsWith(';')) {
          newLine = '';
          logsRemoved++;
        } else {
          // Si hay más código en la línea, intentar eliminar solo el console.log
          newLine = line.replace(/console\.log\([^)]*\)\s*;?\s*/g, '');
          if (newLine !== line) {
            logsRemoved++;
          }
        }
      }

      // Eliminar console.error específicos
      if (line.includes('console.error(')) {
        if (line.trim().startsWith('console.error(') && line.trim().endsWith(';')) {
          newLine = '';
          logsRemoved++;
        } else {
          newLine = line.replace(/console\.error\([^)]*\)\s*;?\s*/g, '');
          if (newLine !== line) {
            logsRemoved++;
          }
        }
      }

      // Eliminar console.warn específicos
      if (line.includes('console.warn(')) {
        if (line.trim().startsWith('console.warn(') && line.trim().endsWith(';')) {
          newLine = '';
          logsRemoved++;
        } else {
          newLine = line.replace(/console\.warn\([^)]*\)\s*;?\s*/g, '');
          if (newLine !== line) {
            logsRemoved++;
          }
        }
      }

      if (newLine.trim() !== '') {
        newLines.push(newLine);
      }
    }

    if (logsRemoved > 0) {
      const newContent = newLines.join('\n');
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`${colors.green}✅${colors.reset} ${filePath} - ${logsRemoved} logs eliminados`);
    }

    return logsRemoved;
  } catch (error) {
    console.error(`${colors.red}❌${colors.reset} Error procesando ${filePath}: ${error.message}`);
    return 0;
  }
}

/**
 * Función principal
 */
function main() {
  console.log(`${colors.cyan}🧹 Limpiando logs restantes en archivos específicos...${colors.reset}\n`);

  const startTime = Date.now();

  filesToClean.forEach(filePath => {
    const logsRemoved = cleanSpecificFile(filePath);
    totalLogsRemoved += logsRemoved;
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${colors.cyan}📊 RESUMEN DE LIMPIEZA ADICIONAL:${colors.reset}`);
  console.log(`${colors.red}🗑️  Logs adicionales eliminados: ${totalLogsRemoved}${colors.reset}`);
  console.log(`${colors.yellow}⏱️  Tiempo transcurrido: ${duration}s${colors.reset}`);

  if (totalLogsRemoved > 0) {
    console.log(`\n${colors.green}🎉 ¡Limpieza adicional completada!${colors.reset}`);
  } else {
    console.log(`\n${colors.blue}ℹ️  No se encontraron logs adicionales para eliminar.${colors.reset}`);
  }
}

// Ejecutar el script
if (require.main === module) {
  main();
}

module.exports = { cleanSpecificFile };
