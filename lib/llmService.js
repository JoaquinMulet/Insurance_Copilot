// llmService.js
import { OpenAI } from 'openai';

/**
 * Clase para gestionar todas las interacciones con modelos de lenguaje a través de OpenRouter
 */
export class LLMService {
  /**
   * Constructor de la clase LLMService
   * @param {Object} config - Configuración para el cliente de OpenRouter
   */
  constructor(config = {}) {
    // Configuración por defecto de OpenRouter
    this.config = {
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      ...config
    };

    // Añadir headers opcionales si están definidos
    if (process.env.SITE_URL || process.env.SITE_NAME) {
      this.config.defaultHeaders = {};
      
      if (process.env.SITE_URL) {
        this.config.defaultHeaders['HTTP-Referer'] = process.env.SITE_URL;
      }
      
      if (process.env.SITE_NAME) {
        this.config.defaultHeaders['X-Title'] = process.env.SITE_NAME;
      }
    }

    // Inicializar cliente OpenRouter
    this.client = new OpenAI(this.config);
    
    // Modelo por defecto
    this.defaultModel = "google/gemini-2.0-flash-001:floor";
    
    // Gemini tiene alta capacidad de contexto (2M tokens) - no necesitamos limitar
  }

  /**
   * Obtener respuesta completa usando streaming para evitar truncamiento
   * @param {string} prompt - Consulta a enviar al modelo
   * @param {string} model - Modelo a utilizar (opcional)
   * @param {Array} systemPrompt - Instrucción del sistema (opcional)
   * @returns {Promise<string>} - Respuesta completa del modelo
   */
  async getStreamingResponse(prompt, model = null, systemPrompt = null) {
    const modelToUse = model || this.defaultModel;
    
    // Preparar mensajes
    const messages = [];
    
    // Añadir mensaje del sistema si existe
    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt
      });
    }
    
    // Añadir mensaje del usuario
    messages.push({
      role: "user",
      content: prompt
    });
    
    // Realizar solicitud con streaming
    try {
      const stream = await this.client.chat.completions.create({
        model: modelToUse,
        messages: messages,
        stream: true,
        max_tokens: 8192, // Configuración generosa para respuestas largas sin truncar
      });
      
      // Recolectar todas las partes de la respuesta
      let fullResponse = '';
      for await (const chunk of stream) {
        if (chunk.choices[0]?.delta?.content) {
          fullResponse += chunk.choices[0].delta.content;
        }
      }
      
      return fullResponse;
    } catch (error) {
      console.error(`Error en solicitud streaming a modelo ${modelToUse}:`, error);
      throw error;
    }
  }

  /**
   * Realizar consultas paralelas y combinar resultados
   * @param {Object} queries - Objeto con nombres de consultas y sus prompts
   * @param {string} model - Modelo a utilizar (opcional)
   * @param {string} systemPrompt - Instrucción del sistema (opcional)
   * @returns {Promise<Object>} - Objeto con resultados para cada consulta
   */
  async processParallelQueries(queries, model = null, systemPrompt = null) {
    const modelToUse = model || this.defaultModel;
    
    // Iniciar todas las consultas en paralelo
    const promises = {};
    for (const [queryName, prompt] of Object.entries(queries)) {
      console.log(`Iniciando consulta: ${queryName}`);
      promises[queryName] = this.getStreamingResponse(prompt, modelToUse, systemPrompt);
    }
    
    // Esperar a que todas las promesas se resuelvan
    const results = {};
    for (const [queryName, promise] of Object.entries(promises)) {
      try {
        console.log(`Esperando resultados de: ${queryName}`);
        results[queryName] = await promise;
        console.log(`Consulta ${queryName} completada correctamente`);
      } catch (error) {
        console.error(`Error en consulta ${queryName}:`, error);
        results[queryName] = `Error en esta consulta: ${error.message}`;
      }
    }
    
    return results;
  }

  /**
   * Método de utilidad para debug de tamaño de contenido
   * @param {string} content - Contenido a verificar
   * @returns {number} - Tamaño aproximado en tokens
   */
  estimateTokenCount(content) {
    if (!content) return 0;
    // Estimación simple: ~4 caracteres por token en promedio
    return Math.ceil(content.length / 4);
  }
}