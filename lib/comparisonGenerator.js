// comparisonGenerator.js
import fs from 'fs';
import { processSingleDocument } from './summaryGenerator';
import { LLMService } from './llmService';

// Crear una instancia del servicio LLM
const llmService = new LLMService();

/**
 * Compare multiple insurance documents
 * @param {Array} files - Array of file objects from formidable (2-4 files)
 * @returns {Promise<Object>} - Comparison results
 */
export async function compareMultipleDocuments(files) {
  if (!Array.isArray(files) || files.length < 2 || files.length > 4) {
    throw new Error('Document comparison requires 2-4 PDF files');
  }
  
  console.log(`Starting comparison of ${files.length} documents...`);
  
  // Process all documents in parallel, indicating they're for comparison
  const documentPromises = files.map(file => processSingleDocument(file, true));
  const processedDocuments = await Promise.all(documentPromises);
  
  // Extract complete information for comparison
  const documentInfo = processedDocuments.map((doc, index) => ({
    id: `doc${index + 1}`,
    filename: files[index].originalFilename || `Document ${index + 1}`,
    completeInfo: doc.completeInfo || "Error: Complete information not available"
  }));
  
  console.log('All documents processed, generating comparison...');
  
  // Get current formatted date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Generate document comparison query
  const comparisonQuery = `
  TAREA: COMPARACIÓN DE DOCUMENTOS DE SEGUROS
  
  Has recibido ${documentInfo.length} documentos de seguros para comparar. A continuación se presenta la información completa extraída de cada documento:
  
  ${documentInfo.map(doc => `
  DOCUMENTO: ${doc.filename}
  ${doc.completeInfo}
  `).join('\n\n')}
  
  INSTRUCCIONES PARA LA COMPARACIÓN:
  
  1. Realiza un análisis comparativo detallado de los documentos presentados, identificando:
     - Similitudes clave en coberturas, condiciones y términos
     - Diferencias significativas en límites, exclusiones y deducibles
     - Ventajas y desventajas relativas de cada documento
  
  2. Organiza la comparación por categorías:
     - Datos generales y tipo de documento
     - Coberturas y límites
     - Exclusiones y condiciones
     - Deducibles y franquicias
     - Cualquier otra categoría relevante
  
  3. Utiliza tablas para presentar comparaciones directas de valores numéricos o características específicas.
  
  4. Incluye un análisis final con recomendaciones sobre qué documento ofrece mejores condiciones según diferentes criterios (precio, amplitud de cobertura, menos exclusiones, etc.)
  
  5. Formato del informe:
     - Título: "INFORME COMPARATIVO DE DOCUMENTOS DE SEGUROS"
     - Incluye una introducción que mencione los documentos comparados
     - Organiza el contenido en secciones claramente diferenciadas
     - Concluye con un resumen de los hallazgos clave y recomendaciones
     - Firma como "Insurance Copilot - Análisis Comparativo Automatizado"
  
  Fecha del informe: ${formattedDate}.
  `;
  
  try {
    // Instrucción del sistema específica para comparación
    const systemPrompt = "Eres un experto en seguros especializado en análisis comparativos. Tu objetivo es crear un informe detallado que compare varios documentos de seguros, destacando similitudes, diferencias y ofreciendo recomendaciones claras.";
    
    // Usar LLMService para generar la comparación
    // Podemos usar un modelo más potente para esta tarea compleja
    const comparison = await llmService.getStreamingResponse(
      comparisonQuery,
      "google/gemini-2.0-flash-001:floor",  // Opcional: usar un modelo más potente para comparaciones
      systemPrompt
    );
    
    console.log('Comparison generated successfully');
    
    return {
      documentInfo,
      comparison
    };
  } catch (error) {
    console.error('Error generating comparison:', error);
    throw new Error(`Error generating comparison: ${error.message}`);
  }
}