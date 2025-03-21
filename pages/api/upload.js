// pages/api/upload.js
import { IncomingForm } from 'formidable';
import fs from 'fs';
import { processSingleDocument } from '../../lib/summaryGenerator';
import { compareMultipleDocuments } from '../../lib/comparisonGenerator';
import { getAuth } from '@clerk/nextjs/server';
import { withAuthAndAuthorizationFormData } from '../../lib/withAuth';

export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * Main API handler for file uploads and processing
 * @param {Object} req - HTTP request object
 * @param {Object} res - HTTP response object
 * @returns {Promise<void>}
 */
async function handler(req, res) {
  try {
    // Get userId using Clerk's getAuth helper
    const { userId } = getAuth(req);
    
    // This check is redundant if using withAuthFormData, but added for extra safety
    if (!userId) {
      return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión para usar esta funcionalidad.' });
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse form with formidable
    const form = new IncomingForm({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
      keepExtensions: true,
    });

    // Process form with proper error handling
    let fields, files;
    try {
      [fields, files] = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) return reject(err);
          resolve([fields, files]);
        });
      });
    } catch (error) {
      console.error('Error parsing form:', error);
      return res.status(400).json({
        error: 'Error al procesar el formulario',
        details: error.message
      });
    }

    // Check if it's single analysis or comparison
    const mode = fields.mode ? fields.mode[0] : 'single';

    // For single document analysis
    if (mode === 'single') {
      // Check if a PDF file was uploaded
      if (!files.pdf) {
        return res.status(400).json({ error: 'No PDF file provided' });
      }

      // In formidable v3, files.pdf might be an array
      const primaryFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;

      // Check MIME type (if available)
      if (primaryFile.mimetype && primaryFile.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'File must be a PDF' });
      }

      console.log('File received:', primaryFile.originalFilename, '- Size:', (primaryFile.size / 1024 / 1024).toFixed(2), 'MB');
      console.log('User ID:', userId); // Log user ID for audit

      try {
        // Process single document
        const result = await processSingleDocument(primaryFile);
        
        // Delete temporary file
        try {
          fs.unlinkSync(primaryFile.filepath);
        } catch (unlinkError) {
          console.error('Error deleting temporary file:', unlinkError);
          // Continue execution, this is not critical
        }
        
        // Return final summary to client
        return res.status(200).json({ text: result.finalSummary });
      } catch (error) {
        console.error('Error processing file:', error);
        return res.status(500).json({ 
          error: 'Error processing single document',
          details: error.message
        });
      }
    }
    
    // For document comparison
    else if (mode === 'comparison') {
      // Collect all PDF files for comparison
      const pdfFiles = [];
      
      // Process main PDF file
      if (files.pdf) {
        const mainFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
        if (mainFile.mimetype && mainFile.mimetype === 'application/pdf') {
          pdfFiles.push(mainFile);
        }
      }
      
      // Process secondary PDF files (pdf_2, pdf_3, pdf_4)
      for (let i = 2; i <= 4; i++) {
        const fileKey = `pdf_${i}`;
        if (files[fileKey]) {
          const secondaryFile = Array.isArray(files[fileKey]) ? files[fileKey][0] : files[fileKey];
          if (secondaryFile.mimetype && secondaryFile.mimetype === 'application/pdf') {
            pdfFiles.push(secondaryFile);
          }
        }
      }
      
      // Check if we have at least 2 PDF files for comparison
      if (pdfFiles.length < 2) {
        return res.status(400).json({ 
          error: 'Document comparison requires at least 2 valid PDF files',
          details: `Received ${pdfFiles.length} valid PDF files`
        });
      }
      
      try {
        // Process comparison
        console.log(`Starting comparison of ${pdfFiles.length} documents...`);
        console.log('User ID:', userId); // Log user ID for audit
        
        const comparisonResult = await compareMultipleDocuments(pdfFiles);
        
        // Delete temporary files
        pdfFiles.forEach(file => {
          try {
            fs.unlinkSync(file.filepath);
          } catch (error) {
            console.error(`Error deleting temporary file ${file.originalFilename}:`, error);
            // Continue execution, this is not critical
          }
        });
        
        // Return comparison result to client
        return res.status(200).json({ 
          text: comparisonResult.comparison,
          documentCount: pdfFiles.length,
          filenames: pdfFiles.map(file => file.originalFilename || 'Document')
        });
      } catch (error) {
        console.error('Error in document comparison:', error);
        return res.status(500).json({ 
          error: 'Error processing document comparison',
          details: error.message
        });
      }
    }
    
    // Invalid mode
    else {
      return res.status(400).json({ error: 'Invalid mode. Must be either "single" or "comparison"' });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Check if this is an authentication error from Clerk
    if (error.message && error.message.includes('Clerk')) {
      return res.status(401).json({ 
        error: 'Error de autenticación',
        details: 'Su sesión ha expirado. Por favor, inicie sesión nuevamente.'
      });
    }
    
    // More descriptive error messages based on error type
    let errorMessage = 'Internal server error';
    let errorDetails = error.message;
    
    // Detect specific errors
    if (error.message && (error.message.includes('Mistral') || error.message.includes('OCR'))) {
      errorMessage = 'Error processing PDF with Mistral OCR';
      errorDetails = error.message;
    } else if (error.message && (error.message.includes('OpenRouter') || error.message.includes('OpenAI') || error.message.includes('completions'))) {
      errorMessage = 'Error analyzing document with OpenRouter';
      errorDetails = error.message;
    }
    
    return res.status(500).json({ 
      error: errorMessage,
      details: errorDetails
    });
  }
}

// Export the handler wrapped with authentication
export default withAuthAndAuthorizationFormData(handler);