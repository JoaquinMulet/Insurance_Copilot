// pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Shield, 
  ArrowRight, 
  Clock, 
  Search, 
  Lock, 
  Copy,
  FileCheck,
  HelpCircle,
  Info,
  ChevronDown,
  Briefcase,
  LogIn
} from 'lucide-react';

import { marked } from 'marked';
import { SignedIn, SignedOut, UserButton, useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { FileUpload } from '../components/ui/file-upload.jsx';
import { useToast } from '../components/ui/use-toast.js';
import { Toaster } from '../components/ui/toaster.jsx';
import { DocumentSummaryLoader } from '../components/ui/document-summary-loader.jsx';

export default function Home() {
  // Estados principales
  const [files, setFiles] = useState({
    primary: null,
    secondary: null
  });
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [response, setResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isGeneratingDocx, setIsGeneratingDocx] = useState(false);
  const [analysisMode, setAnalysisMode] = useState('single'); // single, comparison
  const [showHelp, setShowHelp] = useState(false);
  const { toast } = useToast();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  
  // Manejar cambio de archivo principal
  const handlePrimaryFileChange = (selectedFile) => {
    setFiles({...files, primary: selectedFile});
    setStatus('idle');
    setErrorMessage('');
    toast({
      title: "Archivo seleccionado",
      description: `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`,
    });
  };
  
  // Manejar cambio de archivo secundario (para comparación)
  const handleSecondaryFileChange = (selectedFile) => {
    setFiles({...files, secondary: selectedFile});
    toast({
      title: "Archivo secundario seleccionado",
      description: `${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)`,
    });
  };
  
  // Resetear archivos
  const resetFiles = () => {
    setFiles({primary: null, secondary: null});
    setStatus('idle');
    setResponse(null);
    setErrorMessage('');
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!files.primary) return;
    
    setStatus('uploading');
    setErrorMessage('');
    
    const formData = new FormData();
    formData.append('pdf', files.primary);
    
    // Replace this block in your handleSubmit function
    if (analysisMode === 'comparison' && files.secondary) {
      formData.append('pdf_2', files.secondary);
      formData.append('mode', 'comparison');
    } else {
      formData.append('mode', 'single');
    }
    
    try {
      // Notificamos al usuario que el proceso puede tardar
      toast({
        title: "Procesando documento",
        description: "Este proceso puede tardar varios minutos dependiendo del tamaño del documento.",
        duration: 10000, // Mostrar por 10 segundos
      });
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      // Manejo de respuestas no autorizadas (401)
      if (res.status === 401) {
        toast({
          title: "Sesión caducada",
          description: "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
          variant: "destructive",
        });
        // Redirigir al inicio de sesión
        router.push('/signin');
        return;
      }
      
      // Registramos información de la respuesta para depuración
      console.log('Respuesta del servidor:', {
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries([...res.headers.entries()]),
      });
      
      if (!res.ok) {
        let errorData;
        try {
          errorData = await res.json();
        } catch (e) {
          // Si no podemos parsear como JSON, intentamos obtener el texto
          const errorText = await res.text();
          console.error('Error no-JSON recibido:', errorText);
          throw new Error(`Error HTTP ${res.status}: ${errorText.substring(0, 100)}...`);
        }
        throw new Error(errorData.error || `Error HTTP: ${res.status}`);
      }
      
      // Verificamos el tipo de contenido de la respuesta
      const contentType = res.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Si no es JSON, manejamos como texto
        const text = await res.text();
        console.log('Respuesta no-JSON recibida:', text.substring(0, 100) + '...');
        data = { message: 'Procesamiento exitoso', text };
      }
      
      setResponse(data);
      setStatus('success');
      
      toast({
        title: analysisMode === 'comparison' ? "Comparación generada" : "Análisis generado",
        description: "Los documentos han sido procesados correctamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al enviar archivos:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Error al procesar los documentos');
      
      toast({
        title: "Error",
        description: error.message || 'Error al procesar los documentos',
        variant: "destructive",
      });
    }
  };
  
  // Descargar documento en formato DOCX
  // Fixed handleDownloadDocx function
const handleDownloadDocx = async () => {
  try {
    setIsGeneratingDocx(true);
    
    // Declare the markdownContent variable
    let markdownContent = '';
    
    if (Array.isArray(response) && response.length > 0 && response[0].text) {
      markdownContent = response[0].text;
    } else if (response && response.text) {
      markdownContent = response.text;
    } else if (response && typeof response === 'object') {
      // Intentamos convertir el objeto a texto markdown
      try {
        markdownContent = `# Resultado del análisis\n\n`;
        Object.entries(response).forEach(([key, value]) => {
          if (typeof value === 'string') {
            markdownContent += `## ${key}\n\n${value}\n\n`;
          } else if (value !== null && typeof value === 'object') {
            markdownContent += `## ${key}\n\n${JSON.stringify(value, null, 2)}\n\n`;
          }
        });
      } catch (e) {
        console.error('Error al convertir respuesta a markdown:', e);
        throw new Error('No se pudo convertir la respuesta a un formato descargable');
      }
    } else {
      throw new Error('No se encontró contenido para descargar');
    }
    
    // Llamar a la API para generar el documento DOCX
    const res = await fetch('/api/generate-docx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ markdownContent }),
    });
    
    // Manejo de respuestas no autorizadas (401)
    if (res.status === 401) {
      toast({
        title: "Sesión caducada",
        description: "Su sesión ha expirado. Por favor, inicie sesión nuevamente.",
        variant: "destructive",
      });
      // Redirigir al inicio de sesión
      router.push('/signin');
      return;
    }
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Error al generar el documento DOCX');
    }
    
    // Obtener el blob del documento
    const blob = await res.blob();
    
    // Crear un enlace temporal para descargar el archivo
    const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Obtener el nombre del archivo de los headers de respuesta
      const contentDisposition = res.headers.get('content-disposition');
      let fileName = analysisMode === 'comparison' ? 'comparacion_polizas.docx' : 'analisis_poliza.docx';
      
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?([^"]*)"?/);
        if (fileNameMatch && fileNameMatch[1]) {
          fileName = fileNameMatch[1];
        }
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Documento generado",
        description: "El documento ha sido generado y descargado correctamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al generar el documento DOCX:', error);
      toast({
        title: "Error",
        description: error.message || 'Error al generar el documento DOCX',
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDocx(false);
    }
  };
  
  // Descargar documento en formato Markdown
  const handleDownloadMarkdown = () => {
    try {
      // Determinar el contenido markdown según la estructura de la respuesta
      let markdownContent = '';
      let fileName = analysisMode === 'comparison' ? 'comparacion_polizas.md' : 'analisis_poliza.md';
      
      if (Array.isArray(response) && response.length > 0 && response[0].text) {
        markdownContent = response[0].text;
        
        // Intentar extraer un título para el nombre del archivo
        const titleMatch = markdownContent.match(/\*\*(.*?)\*\*/);
        if (titleMatch && titleMatch[1]) {
          const cleanTitle = titleMatch[1]
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '_')
            .toLowerCase()
            .substring(0, 50);
          
          if (cleanTitle) {
            fileName = `${analysisMode === 'comparison' ? 'comparacion' : 'analisis'}_${cleanTitle}.md`;
          }
        }
      } else if (response && response.text) {
        markdownContent = response.text;
      } else {
        throw new Error('No se encontró contenido para descargar');
      }
      
      // Crear un blob con el contenido markdown
      const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
      
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Markdown descargado",
        description: "El documento ha sido descargado correctamente.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error al descargar el markdown:', error);
      toast({
        title: "Error",
        description: error.message || 'Error al descargar el archivo Markdown',
        variant: "destructive",
      });
    }
  };
  
  if (!isLoaded) {
    // Muestra un estado de carga mientras Clerk se inicializa
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Shield className="w-12 h-12 text-slate-300 mb-4" />
          <h1 className="text-xl font-medium text-slate-400">Cargando...</h1>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Head>
        <title>Insurance Copilot | Análisis de Pólizas</title>
        <meta name="description" content="Análisis y comparación de pólizas y cotizaciones de seguros" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header con diseño financiero */}
      <header className="w-full bg-slate-800 text-white shadow-md">
        <div className="container mx-auto py-4 px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center cursor-pointer">
              <div className="bg-slate-700 p-2 rounded mr-3">
                <Shield className="w-5 h-5 text-slate-200" />
              </div>
              <div>
                <h1 className="text-xl font-medium tracking-tight">Insurance Copilot</h1>
              </div>
            </Link>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowHelp(!showHelp)}
                className="text-sm bg-slate-700 hover:bg-slate-600 transition-colors px-3 py-1.5 rounded-md flex items-center"
              >
                <Info className="w-4 h-4 mr-1.5" />
                <span>Acerca de la herramienta</span>
              </button>
              
              {/* Componente de autenticación de Clerk */}
              <SignedOut>
                <Button
                  asChild
                  className="text-sm bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  <Link href="/signin">
                    <LogIn className="w-4 h-4 mr-1.5" />
                    <span>Iniciar sesión</span>
                  </Link>
                </Button>
              </SignedOut>
              
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      userButtonPopoverFooter: "hidden",
                      userButtonPopoverCard: "p-0",
                      userButtonPopoverPowerButton: "hidden",
                      userButtonPopoverBadge: "hidden",
                      userButtonAvatarBox: "w-8 h-8",
                      userButtonTrigger: "bg-slate-700 hover:bg-slate-600 p-1 rounded-full"
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-8 px-6 flex-grow">
        {/* Panel informativo condicional */}
        {showHelp && (
          <div className="mb-8 bg-slate-100 p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-medium text-slate-800">Cómo utilizar Insurance Copilot</h3>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-slate-500 hover:text-slate-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-slate-200 p-2 rounded-full mr-3">
                    <FileText className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Análisis de documento único</p>
                    <p className="text-slate-600">Extrae automáticamente coberturas, exclusiones, condiciones y detalles clave de una póliza o cotización de seguros.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-slate-200 p-2 rounded-full mr-3">
                    <Copy className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Comparación de documentos</p>
                    <p className="text-slate-600">Identifica diferencias entre dos pólizas o cotizaciones, destacando cambios en coberturas, primas y condiciones.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-slate-200 p-2 rounded-full mr-3">
                    <Lock className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Seguridad y privacidad</p>
                    <p className="text-slate-600">Todos los archivos se procesan de forma segura y no se almacenan permanentemente en nuestros servidores.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-slate-200 p-2 rounded-full mr-3">
                    <Download className="w-4 h-4 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Exportación flexible</p>
                    <p className="text-slate-600">Descarga los resultados en formato DOCX para uso profesional o Markdown para edición posterior.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Interfaz de usuario según estado de autenticación */}
        <SignedIn>
          {/* Tarjeta principal de análisis - Solo para usuarios autenticados */}
          <Card className="max-w-4xl mx-auto shadow-md border border-slate-200 overflow-hidden bg-white">
            <div className="h-1 bg-slate-700"></div>
            
            {/* Cabecera y selector de modo */}
            <CardHeader className="pb-4 pt-6 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-800 mb-1">Análisis de documentos de seguros</CardTitle>
                  <CardDescription className="text-slate-500">
                    Procese sus documentos para obtener un análisis estructurado y profesional
                  </CardDescription>
                </div>

                <div className="mt-4 sm:mt-0 relative">
                  <div className="flex p-1 bg-slate-100 rounded-md">
                    <button
                      onClick={() => setAnalysisMode('single')}
                      disabled={status === 'uploading'}
                      className={`text-sm px-3 py-1.5 rounded ${
                        analysisMode === 'single' 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-800'
                      } ${status === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Documento único
                    </button>
                    <button
                      onClick={() => setAnalysisMode('comparison')}
                      disabled={status === 'uploading'}
                      className={`text-sm px-3 py-1.5 rounded ${
                        analysisMode === 'comparison' 
                          ? 'bg-white text-slate-800 shadow-sm' 
                          : 'text-slate-600 hover:text-slate-800'
                      } ${status === 'uploading' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Comparación
                    </button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            {/* Contenido principal */}
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {status !== 'uploading' && (
                  <div className="space-y-6">
                    {/* Documento principal */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-slate-700 flex items-center">
                          <FileText className="w-4 h-4 mr-2 text-slate-600" />
                          {analysisMode === 'comparison' ? "Documento principal" : "Documento a analizar"}
                        </h3>
                        {files.primary && (
                          <button 
                            type="button"
                            onClick={() => setFiles({...files, primary: null})}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                      <div className="bg-slate-50 p-6 rounded-md border border-slate-200">
                        <FileUpload 
                          value={files.primary}
                          onChange={handlePrimaryFileChange}
                          disabled={status === 'uploading'}
                          maxSize={10}
                          accept=".pdf"
                          message={files.primary ? `${files.primary.name} (${(files.primary.size / (1024 * 1024)).toFixed(2)} MB)` : "Arrastra un archivo PDF o haz clic para seleccionar"}
                        />
                      </div>
                    </div>
                    
                    {/* Documento secundario (solo en modo comparación) */}
                    {analysisMode === 'comparison' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-slate-700 flex items-center">
                            <FileText className="w-4 h-4 mr-2 text-slate-600" />
                            Documento secundario (para comparar)
                          </h3>
                          {files.secondary && (
                            <button 
                              type="button"
                              onClick={() => setFiles({...files, secondary: null})}
                              className="text-xs text-slate-500 hover:text-slate-700"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                        <div className="bg-slate-50 p-6 rounded-md border border-slate-200">
                          <FileUpload 
                            value={files.secondary}
                            onChange={handleSecondaryFileChange}
                            disabled={status === 'uploading'}
                            maxSize={10}
                            accept=".pdf"
                            message={files.secondary ? `${files.secondary.name} (${(files.secondary.size / (1024 * 1024)).toFixed(2)} MB)` : "Arrastra un archivo PDF o haz clic para seleccionar"}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Información de seguridad y botón de envío */}
                    <div className="flex flex-col sm:flex-row items-center justify-between pt-2">
                      <div className="text-xs text-slate-500 flex items-center mb-4 sm:mb-0">
                        <Lock className="w-3.5 h-3.5 mr-1.5" />
                        <span>Procesamiento seguro y confidencial</span>
                      </div>
                      <Button
                        type="submit"
                        disabled={!files.primary || (analysisMode === 'comparison' && !files.secondary) || status === 'uploading'}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center px-5"
                      >
                        {status === 'uploading' ? (
                          <span className="flex items-center">
                            <span className="animate-spin mr-2">
                              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            </span>
                            Procesando...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Search className="w-4 h-4 mr-2" />
                            {analysisMode === 'comparison' ? 'Comparar documentos' : 'Analizar documento'}
                          </span>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Loader de análisis */}
                {status === 'uploading' && (
                  <div className="py-8">
                    <DocumentSummaryLoader mode={analysisMode} />
                  </div>
                )}
              </form>
              
              {/* Mensaje de éxito */}
              {status === 'success' && (
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <div className="rounded-md bg-green-50 p-4 mb-6 flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-medium text-green-800">Análisis completado</h3>
                      <p className="text-sm text-green-700 mt-1">
                        {analysisMode === 'comparison' 
                          ? 'Los documentos han sido comparados exitosamente.' 
                          : 'El documento ha sido analizado exitosamente.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Resultado del análisis */}
              {status === 'success' && (
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <div className="rounded-md border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-700 flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-slate-600" />
                        {analysisMode === 'comparison' ? 'Resultado de la comparación' : 'Resultado del análisis'}
                      </h3>
                      {(Array.isArray(response) && response.length > 0 && response[0].text) || 
                       (response && response.text) ? (
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center text-xs border-slate-200 hover:bg-slate-50"
                            onClick={handleDownloadMarkdown}
                          >
                            <Download className="w-3 h-3 mr-1 text-slate-600" />
                            MD
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex items-center text-xs border-slate-200 hover:bg-slate-50"
                            onClick={handleDownloadDocx}
                            disabled={isGeneratingDocx}
                          >
                            {isGeneratingDocx ? (
                              <span className="flex items-center">
                                <span className="animate-spin mr-1">
                                  <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                </span>
                                Generando...
                              </span>
                            ) : (
                              <>
                                <Download className="w-3 h-3 mr-1 text-slate-600" />
                                DOCX
                              </>
                            )}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    
                    <div className="p-5 bg-white">
                      {response ? (
                        Array.isArray(response) && response.length > 0 && response[0].text ? (
                          <div className="prose prose-slate prose-sm max-w-none bg-white p-4 rounded-md">
                            <div dangerouslySetInnerHTML={{ __html: marked(response[0].text) }} />
                          </div>
                        ) : response.text ? (
                          <div className="prose prose-slate prose-sm max-w-none bg-white p-4 rounded-md">
                            <div dangerouslySetInnerHTML={{ __html: marked(response.text) }} />
                          </div>
                        ) : (
                          <pre className="text-xs whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200 max-h-96 overflow-auto">
                            {JSON.stringify(response, null, 2)}
                          </pre>
                        )
                      ) : (
                        <div className="text-slate-500 text-sm">No hay datos disponibles</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Mensaje de error */}
              {status === 'error' && (
                <div className="border-t border-slate-100 pt-6 mt-4">
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <h3 className="text-sm font-medium text-red-800">Error en el análisis</h3>
                        <p className="text-sm text-red-700 mt-1">
                          {errorMessage || 'No se pudieron procesar los documentos. Por favor intente de nuevo.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </SignedIn>

        {/* Pantalla de acceso restringido - Solo para usuarios no autenticados */}
        <SignedOut>
          <div className="max-w-4xl mx-auto">
            <Card className="border border-slate-200 shadow-md">
              <div className="h-1 bg-slate-700"></div>
              <CardHeader className="pb-4 pt-6">
                <CardTitle className="text-xl text-slate-800 mb-1">Acceso restringido</CardTitle>
                <CardDescription className="text-slate-500">
                  Para utilizar la herramienta de análisis de documentos, es necesario iniciar sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center justify-center py-10 px-6 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="mb-6 p-4 bg-slate-100 rounded-full">
                    <Lock className="w-10 h-10 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-800 mb-3">Área protegida</h3>
                  <p className="text-center text-slate-600 mb-6 max-w-md">
                    Esta herramienta está disponible exclusivamente para usuarios registrados. 
                    Por favor, inicie sesión para acceder a todas las funcionalidades de análisis 
                    y comparación de documentos.
                  </p>
                  <Button asChild className="bg-slate-800 hover:bg-slate-700 w-full max-w-xs">
                    <Link href="/signin" className="flex items-center justify-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Iniciar sesión
                    </Link>
                  </Button>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Beneficios del registro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start p-4 bg-white rounded-lg border border-slate-200">
                      <div className="bg-slate-100 p-2 rounded-full mr-3">
                        <FileCheck className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Análisis completo</p>
                        <p className="text-slate-600 text-sm">Acceso a todas las capacidades de análisis y extracción de información de documentos.</p>
                      </div>
                    </div>
                    <div className="flex items-start p-4 bg-white rounded-lg border border-slate-200">
                      <div className="bg-slate-100 p-2 rounded-full mr-3">
                        <Shield className="w-4 h-4 text-slate-700" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800 text-sm">Seguridad de datos</p>
                        <p className="text-slate-600 text-sm">Sus documentos son procesados con los más altos estándares de seguridad y confidencialidad.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </SignedOut>
      </main>
          
      {/* Footer minimalista */}
      <footer className="border-t border-slate-200 bg-white mt-auto">
        <div className="container mx-auto py-3 px-4 md:py-4 md:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-2 md:mb-0">
              <Shield className="w-4 h-4 text-slate-400 mr-2" />
              <span className="text-xs md:text-sm text-slate-600">Insurance Copilot</span>
            </div>
            <div className="flex flex-wrap justify-center md:justify-end space-x-4 md:space-x-6 text-xs md:text-sm text-slate-500">
              <a href="#" className="hover:text-slate-800 transition-colors">Soporte</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-slate-800 transition-colors">Términos</a>
              <span>&copy; {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}