import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  async generarReporteAsistencia(alumno: any, asistencias: any[]): Promise<string> {
    try {
      this.logger.log(`📄 Generando PDF para alumno: ${alumno.nombres} ${alumno.apellidos}`);

      // Crear directorio de reportes si no existe
      const reportsDir = path.join(process.cwd(), 'reports');
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      // Generar HTML del reporte
      const htmlContent = this.generarHtmlReporte(alumno, asistencias);

      // Generar PDF usando Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      // Nombre del archivo PDF
      const fileName = `reporte_asistencia_${alumno.dni}_${Date.now()}.pdf`;
      const filePath = path.join(reportsDir, fileName);

      // Generar PDF
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      await browser.close();

      this.logger.log(`✅ PDF generado exitosamente: ${filePath}`);
      return filePath;

    } catch (error) {
      this.logger.error(`❌ Error generando PDF: ${error.message}`);
      throw error;
    }
  }

  private generarHtmlReporte(alumno: any, asistencias: any[]): string {
    const fechaActual = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Calcular estadísticas
    const totalDias = asistencias.length;
    const puntual = asistencias.filter(a => a.estado_asistencia === 'PUNTUAL').length;
    const tardanza = asistencias.filter(a => a.estado_asistencia === 'TARDANZA').length;
    const ausente = asistencias.filter(a => a.estado_asistencia === 'AUSENTE').length;
    const justificado = asistencias.filter(a => a.estado_asistencia === 'JUSTIFICADO').length;
    const anulado = asistencias.filter(a => a.estado_asistencia === 'ANULADO').length;

    const porcentajeAsistencia = totalDias > 0 ? Math.round(((puntual + tardanza) / totalDias) * 100) : 0;

    // Determinar estado general
    let estadoGeneral = '';
    let colorEstado = '';
    if (porcentajeAsistencia >= 90) {
      estadoGeneral = 'EXCELENTE';
      colorEstado = '#28a745';
    } else if (porcentajeAsistencia >= 80) {
      estadoGeneral = 'BUENO';
      colorEstado = '#17a2b8';
    } else if (porcentajeAsistencia >= 70) {
      estadoGeneral = 'REGULAR';
      colorEstado = '#ffc107';
    } else {
      estadoGeneral = 'NECESITA MEJORAR';
      colorEstado = '#dc3545';
    }

    // Generar tabla de asistencias
    const tablaAsistencias = asistencias.map(asistencia => {
      const fecha = new Date(asistencia.fecha).toLocaleDateString('es-ES');
      const hora = new Date(asistencia.fecha).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const estado = asistencia.estado_asistencia;
      const colorEstado = this.obtenerColorEstado(estado);
      
      return `
        <tr>
          <td>${fecha}</td>
          <td>${hora}</td>
          <td style="color: ${colorEstado}; font-weight: bold;">${estado}</td>
        </tr>
      `;
    }).join('');

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Asistencia - ${alumno.nombres} ${alumno.apellidos}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2c3e50;
            margin: 0;
            font-size: 24px;
            font-weight: bold;
        }
        .header h2 {
            color: #34495e;
            margin: 10px 0 0 0;
            font-size: 16px;
            font-weight: normal;
        }
        .header h3 {
            color: #7f8c8d;
            margin: 5px 0 0 0;
            font-size: 14px;
            font-weight: normal;
        }
        .info-section {
            margin-bottom: 30px;
        }
        .info-section h3 {
            color: #2c3e50;
            border-bottom: 1px solid #bdc3c7;
            padding-bottom: 8px;
            margin-bottom: 15px;
            font-size: 16px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 4px;
            border-left: 3px solid #2c3e50;
        }
        .info-item strong {
            color: #2c3e50;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        .stat-card {
            background: #34495e;
            color: white;
            padding: 15px;
            border-radius: 4px;
            text-align: center;
        }
        .stat-card h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .stat-card .number {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .estado-general {
            text-align: center;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            background: ${colorEstado}15;
            border: 1px solid ${colorEstado};
        }
        .estado-general h3 {
            color: ${colorEstado};
            margin: 0 0 10px 0;
        }
        .estado-general .porcentaje {
            font-size: 36px;
            font-weight: bold;
            color: ${colorEstado};
            margin: 0;
        }
        .tabla-container {
            margin-top: 30px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #bdc3c7;
        }
        th {
            background-color: #2c3e50;
            color: white;
            font-weight: bold;
        }
        tr:hover {
            background-color: #f8f9fa;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #7f8c8d;
            font-size: 12px;
            border-top: 1px solid #bdc3c7;
            padding-top: 20px;
        }
        .logo {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 REPORTE DE ASISTENCIA</h1>
            <h2>Sistema de Control de Asistencia</h2>
            <h3>Institución Educativa Pública "Andrés de los Reyes"</h3>
            <p>Generado el ${fechaActual}</p>
        </div>

        <div class="info-section">
            <h3>👤 INFORMACIÓN DEL ALUMNO</h3>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Nombre completo:</strong><br>
                    ${alumno.nombres} ${alumno.apellidos}
                </div>
                <div class="info-item">
                    <strong>Código estudiantil:</strong><br>
                    ${alumno.codigo}
                </div>
                <div class="info-item">
                    <strong>DNI:</strong><br>
                    ${alumno.dni}
                </div>
                <div class="info-item">
                    <strong>Nivel educativo:</strong><br>
                    ${alumno.nivel}
                </div>
                <div class="info-item">
                    <strong>Grado y sección:</strong><br>
                    ${alumno.grado}° ${alumno.seccion}
                </div>
            </div>
        </div>

        <div class="estado-general">
            <h3>📈 ESTADO GENERAL DE ASISTENCIA</h3>
            <p class="porcentaje">${porcentajeAsistencia}%</p>
            <h3>${estadoGeneral}</h3>
        </div>

        <div class="info-section">
            <h3>📊 ESTADÍSTICAS DETALLADAS</h3>
            <div class="stats-grid">
                <div class="stat-card">
                    <h4>Total de días</h4>
                    <p class="number">${totalDias}</p>
                </div>
                <div class="stat-card">
                    <h4>Puntual</h4>
                    <p class="number">${puntual}</p>
                </div>
                <div class="stat-card">
                    <h4>Tardanza</h4>
                    <p class="number">${tardanza}</p>
                </div>
                <div class="stat-card">
                    <h4>Ausente</h4>
                    <p class="number">${ausente}</p>
                </div>
                <div class="stat-card">
                    <h4>Justificado</h4>
                    <p class="number">${justificado}</p>
                </div>
                <div class="stat-card">
                    <h4>Anulado</h4>
                    <p class="number">${anulado}</p>
                </div>
            </div>
        </div>

        <div class="tabla-container">
            <h3>📅 REGISTRO DETALLADO DE ASISTENCIAS</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hora</th>
                        <th>Estado</th>
                    </tr>
                </thead>
                <tbody>
                    ${tablaAsistencias}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <div class="logo">🏫 I.E.P. "Andrés de los Reyes"</div>
            <p>Sistema de Gestión Académica - Reporte generado automáticamente</p>
            <p>Este documento es confidencial y está destinado únicamente al apoderado del alumno.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'PUNTUAL': return '#28a745';
      case 'TARDANZA': return '#ffc107';
      case 'AUSENTE': return '#dc3545';
      case 'JUSTIFICADO': return '#17a2b8';
      case 'ANULADO': return '#6c757d';
      default: return '#6c757d';
    }
  }
}
