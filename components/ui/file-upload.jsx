import React from 'react';
import { Upload, File, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils.jsx';
import { Label } from '../../components/ui/label';

export function FileUpload({ 
  className, 
  value, 
  onChange,
  disabled,
  fileTypes = ".pdf",
  maxSize = 10, // in MB
}) {
  const fileInputRef = React.useRef(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files?.length) {
      const file = files[0];
      if (validateFile(file)) {
        onChange(file);
      }
    }
  };

  const validateFile = (file) => {
    // Check if it's a PDF
    if (!file.type.includes('pdf')) {
      alert('Por favor, selecciona un archivo PDF.');
      return false;
    }
    
    // Check file size (convert to MB)
    const fileSize = file.size / (1024 * 1024);
    if (fileSize > maxSize) {
      alert(`El archivo es demasiado grande. El tamaño máximo es ${maxSize}MB.`);
      return false;
    }
    
    return true;
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      onChange(file);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2 w-full">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-gray-300 bg-gray-50",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-gray-100",
          className
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={fileTypes}
          onChange={handleChange}
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center justify-center space-y-3 text-center p-6">
          {value ? (
            <>
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-700">{value.name}</p>
                <p className="text-xs text-gray-500">
                  {(value.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="h-6 w-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-700">
                  <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF (MAX. {maxSize}MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      
      {value && (
        <p className="text-xs text-gray-500 mt-1">
          Haz clic nuevamente para cambiar el archivo
        </p>
      )}
    </div>
  );
}