// summaryGenerator.js
import { LLMService } from './llmService';
import { processPDFWithMistral } from './mistralExtractor';

// Crear una instancia del servicio LLM
const llmService = new LLMService();

/**
 * Analyze different insurance document sections with LLMService
 * @param {string} content - Extracted PDF content
 * @returns {Promise<Object>} - Analysis results for each section
 */
export async function analyzeInsuranceDocument(content) {
  // Define different queries for each section
  const queries = {
    informacionGeneral: `Analiza detalladamente este documento de seguro e identifica:

1) Tipo específico de documento (póliza, cotización, endoso, etc.)

2) Vigencia del documento (fechas de inicio y fin)

3) Estatus actual (vigente, en renovación, cancelado, etc.)

4) Metadatos básicos (número de póliza/cotización, fecha de emisión, aseguradora)

CONTEXTO: Estoy analizando una Póliza o Cotización de Póliza de seguros con el siguiente contenido:
${content}`,
    
    datosGenerales: `Identifica y extrae todos los datos generales de la póliza:

- Número de póliza o cotización
- Nombre completo de la aseguradora
- Datos completos del contratante/tomador (nombre, dirección, identificación fiscal)
- Datos del asegurado (si es distinto del contratante)
- Datos del beneficiario (si aplica)
- Vigencia exacta (fecha y hora de inicio y término)
- Moneda de la póliza y tipo de cambio aplicable (si corresponde)
- Nombre del intermediario o corredor de seguros
- Forma de pago, periodicidad y fechas de vencimiento
- Prima total y desglose detallado (prima neta, impuestos, recargos, descuentos)

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    materiaAsegurada: `Extrae detalladamente la información sobre la materia asegurada:

- Descripción completa de los bienes asegurados
- Ubicaciones geográficas específicas cubiertas
- Valoraciones y métodos de valoración utilizados
- Categorización de bienes (si aplica)
- Características específicas o distintivas de la materia asegurada
- Identificadores únicos (números de serie, matrículas, referencias catastrales)
- Condiciones especiales para la materia asegurada
- Restricciones de uso o requisitos de mantenimiento

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    coberturas: `Identifica y detalla todas las coberturas incluidas en la póliza:
- Listado completo de coberturas principales
- Descripción detallada de lo que incluye cada cobertura
- Ámbito temporal y territorial de cada cobertura
- Coberturas opcionales contratadas
- Ampliaciones específicas de cobertura
- Condiciones especiales para activación de coberturas
- Categorización de coberturas (básicas, complementarias, opcionales)
- Relaciones o interdependencias entre coberturas

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    limitesYSublimites: `Extrae todos los límites y sublímites establecidos:
- Suma asegurada total y método de valoración
- Límites específicos por ubicación o instalación
- Límites por evento, siniestro o agregado anual
- Sublímites para cada cobertura específica
- Valores máximos asegurados por categoría o ítem
- Indemnizaciones diarias o periódicas (si aplica)
- Cláusulas de reposición de suma asegurada
- Sistemas de ajuste o actualización de límites

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    deduciblesYFranquicias: `Identifica todos los deducibles y franquicias aplicables:
- Deducible general de la póliza
- Deducibles específicos por cobertura o tipo de siniestro
- Deducibles expresados en porcentaje, monto fijo o mixtos
- Mínimos y máximos aplicables a deducibles
- Franquicias y su funcionamiento exacto
- Períodos de carencia para coberturas específicas
- Períodos de espera aplicables (especialmente en lucro cesante)
- Mecanismos de aplicación de deducibles en siniestros múltiples

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    exclusiones: `Identifica y detalla todas las exclusiones presentes en la póliza:
- Exclusiones generales aplicables a toda la póliza
- Exclusiones específicas por cobertura
- Bienes expresamente excluidos
- Actividades o usos excluidos
- Circunstancias o eventos excluidos
- Exclusiones temporales o geográficas
- Exclusiones relacionadas con incumplimiento de garantías
- Exclusiones absolutas vs. exclusiones que pueden cubrirse mediante endoso

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    condiciones: `Detalla todas las condiciones importantes de la póliza:
- Condiciones generales y particulares relevantes
- Cláusulas adicionales específicas
- Garantías o requisitos de seguridad obligatorios
- Cláusulas de cancelación y sus términos
- Procedimientos y plazos para avisos de siniestros
- Obligaciones del asegurado en caso de siniestro
- Procedimientos de ajuste y liquidación
- Cláusulas de infraseguro o sobreseguro
- Jurisdicción aplicable y mecanismos de resolución de conflictos

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`,
    
    anexosYEndosos: `Identifica y detalla todos los anexos y endosos de la póliza:
- Listado completo de endosos incluidos
- Propósito y efecto de cada endoso
- Fecha de emisión de cada endoso
- Modificaciones específicas introducidas por cada endoso
- Detalles completos de bienes asegurados en anexos
- Detalles de ubicaciones cubiertas en anexos
- Beneficiarios designados en documentos anexos
- Cualquier otro documento adjunto o relacionado

CONTEXTO: Estoy analizando un documento PDF de seguros con el siguiente contenido:
${content}`
  };

  console.log('Starting parallel analysis of all sections...');
  
  // Instrucción del sistema para análisis de documentos
  const systemPrompt = "Eres un asistente especializado en análisis de documentos de seguros. Realiza un análisis detallado y preciso del documento proporcionado, identificando toda la información relevante. Proporciona respuestas exhaustivas y bien estructuradas. No omitas ninguna información o seremos los dos despedidos de nuestro trabajo profavor ayudame y haz un buen trabajo";
  
  // Ejecutar todas las consultas en paralelo usando el servicio LLM
  const results = await llmService.processParallelQueries(queries, null, systemPrompt);
  
  console.log('All sections have been analyzed');
  return results;
}

/**
 * Perform complementary searches to find missing information
 * @param {string} content - Extracted PDF content
 * @param {Object} extractedInfo - Results from primary analysis
 * @returns {Promise<string>} - Combined secondary search results
 */
export async function performParallelSearches(content, extractedInfo) {
  console.log('Starting complementary parallel searches...');
  
  // Define different approaches for complementary searches
  const searchQueries = {
    datosFaltantes: `CONTEXTO IMPORTANTE:
    Documento Original:
    <Original> ${content} </Original>
    
    Datos extraidos sobre el documento:
    <Extracción>
    Información General:
    "${extractedInfo.informacionGeneral}"
    
    Datos Generales:
    "${extractedInfo.datosGenerales}"
    </Extracción>
    
    TAREA:
    Identifica cualquier información importante sobre datos generales o metadatos del documento que NO haya sido capturada en la extracción inicial.`,
    
    coberturasYLimites: `CONTEXTO IMPORTANTE:
    Documento Original:
    <Original> ${content} </Original>
    
    Datos extraidos sobre el documento:
    <Extracción>
    Coberturas:
    "${extractedInfo.coberturas}"
    
    Límites y Sublímites:
    "${extractedInfo.limitesYSublimites}"
    </Extracción>
    
    TAREA:
    Identifica cualquier información importante sobre coberturas y límites que NO haya sido capturada en la extracción inicial.`,
    
    exclusionesYCondiciones: `CONTEXTO IMPORTANTE:
    Documento Original:
    <Original> ${content} </Original>
    
    Datos extraidos sobre el documento:
    <Extracción>
    Exclusiones:
    "${extractedInfo.exclusiones}"
    
    Condiciones:
    "${extractedInfo.condiciones}"
    </Extracción>
    
    TAREA:
    Identifica cualquier información importante sobre exclusiones y condiciones que NO haya sido capturada en la extracción inicial.`,
    
    anexosYOtros: `CONTEXTO IMPORTANTE:
    Documento Original:
    <Original> ${content} </Original>
    
    Datos extraidos sobre el documento:
    <Extracción>
    Materia Asegurada:
    "${extractedInfo.materiaAsegurada}"
    
    Anexos y Endosos:
    "${extractedInfo.anexosYEndosos}"
    
    Deducibles y Franquicias:
    "${extractedInfo.deduciblesYFranquicias}"
    </Extracción>
    
    TAREA:
    Identifica cualquier información importante sobre materia asegurada, anexos, endosos, deducibles o franquicias que NO haya sido capturada en la extracción inicial.`
  };
  
  // Instrucción del sistema para búsquedas complementarias
  const systemPrompt = "Eres un asistente especializado en análisis de documentos de seguros. Tu tarea es identificar información que haya podido quedar fuera del análisis inicial. Sé preciso y conciso en tu respuesta.";
  
  // Ejecutar todas las búsquedas en paralelo
  const searchResults = await llmService.processParallelQueries(searchQueries, null, systemPrompt);
  
  // Combinar todos los resultados
  const combinedResults = Object.values(searchResults).join("\n\n");
  console.log('All complementary searches completed');
  return combinedResults;
}

/**
 * Verify information and generate summaries
 * @param {string} content - Extracted PDF content
 * @param {Object} extractedInfo - Results from primary analysis
 * @param {string} secondarySearch - Results from secondary analysis
 * @returns {Promise<Object>} - Verification results and final summary
 */
export async function parallelProcessing(content, extractedInfo, secondarySearch) {
  console.log('Starting verification and summary generation in parallel...');
  
  // Get current formatted date
  const currentDate = new Date();
  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  // Define all processing tasks
  const processingQueries = {
    verification: `Contenido PDF Original:
    <Original> ${content.substring(0, 50000)}... </Original>
    
    CONSULTA ORIGINAL DEL USUARIO:
    'Resume este PDF'
    
    INFORMACIÓN EXTRAÍDA:
    <Extraído>
    Búsqueda Complementaria:
    ${secondarySearch}
    
    Información General:
    ${extractedInfo.informacionGeneral}
    
    Datos Generales:
    ${extractedInfo.datosGenerales}
    
    Materia Asegurada:
    ${extractedInfo.materiaAsegurada}
    
    coberturas:
    ${extractedInfo.coberturas}
    
    Límites y Sublímites
    ${extractedInfo.limitesYSublimites}
    
    Deducibles y Franquicias:
    ${extractedInfo.deduciblesYFranquicias}
    
    Exclusiones:
    ${extractedInfo.exclusiones}
    
    Condiciones
    ${extractedInfo.condiciones}
    
    ANEXOS Y ENDOSOS:
    ${extractedInfo.anexosYEndosos}
    </Extraído>
    
    TAREA:
    Realiza una verificación exhaustiva de la información encontrada:
    
    1. ¿Se ha respondido directamente a la consulta del usuario? ¿Completamente o parcialmente?
    2. ¿Existe alguna inconsistencia o contradicción en la información encontrada?
    3. ¿Quedaron aspectos de la consulta sin responder? ¿Cuáles?
    4. ¿La información encontrada es suficiente y clara para responder al usuario?
    5. ¿Hay información en las secciones temáticas que complementa o contradice la extracción dirigida?
    
    Proporciona un análisis detallado de la calidad y completitud de la información.
    
    Separalo en dos partes 1) Análisis de Verificación y 2) Análisis de Completitud.`,
    
    finalSummaryPart1: `INFORMACIÓN EXTRAÍDA (PARTE 1):
    <Extraído>
    Información General:
    ${extractedInfo.informacionGeneral}
    
    Datos Generales:
    ${extractedInfo.datosGenerales}
    
    Materia Asegurada:
    ${extractedInfo.materiaAsegurada}
    
    coberturas:
    ${extractedInfo.coberturas}
    </Extraído>
    
    TAREA:
    Genera la primera parte de un resumen para un informe de seguros con toda esta información. El formato debe ser profesional y detallado. Incluirá una parte inicial clara analizando la información general, los datos generales, la materia asegurada y las coberturas.
    
    No incluyas introducción ni conclusión ya que esto es solo la primera parte del resumen completo.`,
    
    finalSummaryPart2: `INFORMACIÓN EXTRAÍDA (PARTE 2):
    <Extraído>
    Límites y Sublímites
    ${extractedInfo.limitesYSublimites}
    
    Deducibles y Franquicias:
    ${extractedInfo.deduciblesYFranquicias}
    
    Exclusiones:
    ${extractedInfo.exclusiones}
    
    Condiciones
    ${extractedInfo.condiciones}
    
    ANEXOS Y ENDOSOS:
    ${extractedInfo.anexosYEndosos}
    
    Búsqueda Complementaria:
    ${secondarySearch}
    </Extraído>
    
    TAREA:
    Genera la segunda parte de un resumen para un informe de seguros con toda esta información. El formato debe ser profesional y detallado. Incluirá información sobre límites, deducibles, exclusiones, condiciones y anexos.
    
    No incluyas introducción ya que esto es la continuación de la primera parte.`
  };
  
  // Instrucción del sistema para verificación y resumen
  const systemPrompt = "Eres un asistente especializado en análisis de documentos de seguros. Tu tarea es verificar y resumir de manera profesional toda la información extraída del documento.";
  
  // Iniciar todas las tareas en paralelo
  const results = await llmService.processParallelQueries(processingQueries, null, systemPrompt);
  
  // Combinar las partes del resumen
  const combinedSummary = `${results.finalSummaryPart1}\n\n${results.finalSummaryPart2}`;
  
  // Generar resumen final usando las partes procesadas
  const finalSummaryQuery = `
  VERIFICACIÓN:
  ${results.verification}
  
  RESUMEN COMBINADO:
  ${combinedSummary}
  
  TAREA:
  Por favor genera un informe completo con toda la información como corresponde, en formato de informe firmado:

  Tu Respuesta debe comenzar por **INFORME DE [Tipo de Documento] - [Nombre del Asegurado]** ...

  Tu respuesta debe terminar con:
  ___________________________
    Firma,
    **Insurance Copilot**
    (*Análisis Automatizado de Pólizas*)*.

  Sobre el informe:
  
  Formato y estilo:
  - Utiliza un estilo profesional pero accesible
  - Mantén la consistencia en tiempo verbal, terminología y formato
  - Evita el exceso de jerga técnica sin las explicaciones correspondientes
  - Prioriza la claridad sobre la complejidad
  - Utiliza un lenguaje preciso y directo

  Uso específico de formatos:
  - Tablas: Úsalas como elemento para organizar datos comparativos, estadísticas, criterios de evaluación, cronogramas y categorizaciones. 
  - Párrafos: Empléalos para desarrollar argumentos, proporcionar contexto, explicar conceptos complejos y presentar análisis detallados.
  - Bullet points: Limita su uso a listas breves de elementos simples, requisitos específicos o puntos de acción.
  - Numeración: Reserva este formato para procedimientos secuenciales, pasos de un proceso o jerarquías de prioridad.

  Debes incluir TODOS los puntos relevantes, sin omitir información o dar información parcial.
  
  Fecha del informe: ${formattedDate}.
  `;
  
  try {
    // Usar instrucción del sistema específica para el resumen final
    const finalSystemPrompt = "Eres un experto en seguros generando informes profesionales. Crea un informe completo, bien estructurado y exhaustivo con toda la información proporcionada.";
    
    // Generar resumen final
    const finalSummary = await llmService.getStreamingResponse(finalSummaryQuery, null, finalSystemPrompt);
    console.log('Final summary generated successfully');
    
    return {
      verification: results.verification,
      finalSummary: cleanFinalSummary(finalSummary)
    };
  } catch (error) {
    console.error('Error in final summary generation:', error);
    return {
      verification: results.verification,
      finalSummary: "Error in final summary generation: " + error.message
    };
  }
}

/**
 * Clean final summary text by removing any preamble
 * @param {string} text - Raw final summary text
 * @returns {string} - Cleaned summary text
 */
function cleanFinalSummary(text) {
  const startIndex = text.indexOf("**INFORME");
  if (startIndex !== -1) {
    return text.substring(startIndex);
  }
  return text;
}

/**
 * Format the extracted information for comparison
 * @param {Object} extractedInfo - Results from primary analysis
 * @param {string} secondarySearch - Results from secondary search
 * @returns {string} - Formatted complete information
 */
function formatExtractedInfoForComparison(extractedInfo, secondarySearch) {
  return `INFORMACIÓN EXTRAÍDA:
<Extraído>
Búsqueda Complementaria:
${secondarySearch}

Información General:
${extractedInfo.informacionGeneral}

Datos Generales:
${extractedInfo.datosGenerales}

Materia Asegurada:
${extractedInfo.materiaAsegurada}

Coberturas:
${extractedInfo.coberturas}

Límites y Sublímites:
${extractedInfo.limitesYSublimites}

Deducibles y Franquicias:
${extractedInfo.deduciblesYFranquicias}

Exclusiones:
${extractedInfo.exclusiones}

Condiciones:
${extractedInfo.condiciones}

ANEXOS Y ENDOSOS:
${extractedInfo.anexosYEndosos}
</Extraído>`;
}

/**
 * Process a single PDF document and generate summary or detailed info
 * @param {Object} file - File object from formidable
 * @param {boolean} forComparison - Whether the processing is for comparison (true) or single summary (false)
 * @returns {Promise<Object>} - Processing results
 */
export async function processSingleDocument(file, forComparison = false) {
  console.log('Processing single document:', file.originalFilename);
  
  // Process PDF with Mistral OCR
  const content = await processPDFWithMistral(
    file.filepath, 
    file.originalFilename || "document.pdf"
  );
  
  // Start main analysis
  const extractedInfo = await analyzeInsuranceDocument(content);
  
  // Perform complementary searches
  const secondarySearch = await performParallelSearches(content, extractedInfo);
  
  // If this is for comparison, return all the extracted information
  if (forComparison) {
    return {
      content,
      extractedInfo,
      secondarySearch,
      // Format the complete information for comparison use
      completeInfo: formatExtractedInfoForComparison(extractedInfo, secondarySearch)
    };
  }
  
  // Otherwise, process verification and generate summary as usual
  const processResults = await parallelProcessing(content, extractedInfo, secondarySearch);
  
  return {
    content,
    extractedInfo,
    secondarySearch,
    finalSummary: processResults.finalSummary
  };
}