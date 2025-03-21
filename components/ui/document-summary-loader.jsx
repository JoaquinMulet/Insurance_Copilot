import React, { useState, useEffect } from 'react';
import { FileText, Files } from 'lucide-react';
import { Card, CardContent } from './card.jsx';
import { Skeleton } from './skeleton.jsx';

const DocumentSummaryLoader = ({ mode = 'single' }) => {
  const [activePhrase, setActivePhrase] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Frases para análisis de documentos individuales
  const singleDocPhrases = [
    "Analizando cláusulas de cobertura...",
    "Extrayendo condiciones particulares...",
    "Identificando exclusiones del seguro...",
    "Procesando términos de indemnización...",
    "Evaluando primas y deducibles...",
    "Revisando plazos de carencia...",
    "Analizando coberturas adicionales...",
    "Extrayendo límites de responsabilidad...",
    "Procesando condiciones de renovación..."
  ];
  
  // Frases para comparación de documentos
  const comparisonPhrases = [
    "Comparando coberturas entre documentos...",
    "Analizando diferencias en exclusiones...",
    "Identificando variaciones en deducibles...",
    "Contrastando términos y condiciones...",
    "Evaluando diferencias en primas...",
    "Comparando límites de indemnización...",
    "Analizando ventajas competitivas...",
    "Procesando diferencias en endosos...",
    "Generando tabla comparativa..."
  ];
  
  // Seleccionar las frases adecuadas según el modo
  const analysisPhrases = mode === 'comparison' ? comparisonPhrases : singleDocPhrases;
  
  // Efecto para rotar entre las frases con transición más suave
  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsTransitioning(true);
      
      // Esperar a que la transición de salida termine antes de cambiar la frase
      setTimeout(() => {
        setActivePhrase(current => (current + 1) % analysisPhrases.length);
        
        // Pequeño retraso antes de iniciar la transición de entrada
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 500);
    }, 4000);
    
    return () => clearInterval(intervalId);
  }, [analysisPhrases.length]);

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-6">
          {/* Icono de documento con animación - diferente según el modo */}
          <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-gray-100">
            {mode === 'comparison' ? (
              <Files className="w-8 h-8 text-gray-700" />
            ) : (
              <FileText className="w-8 h-8 text-gray-700" />
            )}
            <div className="absolute inset-0 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin"></div>
          </div>

          {/* Título - diferente según el modo */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-medium text-gray-900">
              {mode === 'comparison' ? 'Comparando documentos' : 'Analizando póliza'}
            </h3>
          </div>

          {/* Indicador de actividad con frase actual */}
          <div className="flex items-center justify-center w-full">
            <div className="h-6 text-center w-full relative">
              <div 
                className={`text-sm text-gray-600 transition-all duration-700 ease-in-out ${
                  isTransitioning ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform-none'
                }`}
              >
                {analysisPhrases[activePhrase]}
              </div>
            </div>
          </div>

          {/* Skeletons para simular contenido cargando 
              Más bloques en modo comparación */}
          <div className="w-full space-y-3">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-4/5 bg-gray-200" />
            <Skeleton className="h-4 w-3/5 bg-gray-200" />
            {mode === 'comparison' && (
              <>
                <Skeleton className="h-4 w-full bg-gray-200" />
                <Skeleton className="h-4 w-2/3 bg-gray-200" />
              </>
            )}
          </div>

          {/* Indicadores de progreso - más indicadores en modo comparación */}
          <div className="w-full flex justify-center space-x-3 py-2">
            {(mode === 'comparison' ? [0, 1, 2, 3] : [0, 1, 2]).map((idx) => (
              <div 
                key={idx} 
                className={`w-2 h-2 rounded-full transition-all duration-500 ${
                  (activePhrase % (mode === 'comparison' ? 4 : 3)) === idx 
                    ? 'bg-gray-700 scale-125' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { DocumentSummaryLoader };