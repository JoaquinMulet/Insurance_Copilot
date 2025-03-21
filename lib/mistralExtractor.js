// mistralExtractor.js
import fs from 'fs';
import { Mistral } from '@mistralai/mistralai';

// Initialize Mistral client
const mistralClient = new Mistral({
  apiKey: process.env.MISTRAL_API_KEY
});

/**
 * Sleep function to wait between retries
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Process PDF with Mistral OCR using official SDK with retry mechanism
 * @param {string} filePath - Path to the PDF file
 * @param {string} fileName - Original filename
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} initialDelay - Initial delay in milliseconds before retry (default: 1000)
 * @returns {Promise<string>} - Extracted content as text
 */
export async function processPDFWithMistral(filePath, fileName, maxRetries = 3, initialDelay = 1000) {
  let retryCount = 0;
  let lastError = null;

  while (retryCount <= maxRetries) {
    try {
      // If this is a retry attempt, log it
      if (retryCount > 0) {
        console.log(`Retry attempt ${retryCount}/${maxRetries} for Mistral OCR processing...`);
      } else {
        console.log('Starting processing with Mistral OCR using official SDK...');
      }
      
      // Read file as buffer
      const fileBuffer = fs.readFileSync(filePath);
      
      console.log('Uploading file to Mistral...');
      // Upload file to Mistral
      const uploadedFile = await mistralClient.files.upload({
        file: {
          fileName: fileName || "document.pdf",
          content: fileBuffer,
        },
        purpose: "ocr"
      });
      
      console.log('File uploaded successfully, ID:', uploadedFile.id);
      
      // Get signed URL
      console.log('Getting signed URL...');
      const signedUrl = await mistralClient.files.getSignedUrl({
        fileId: uploadedFile.id,
      });
      
      console.log('Signed URL obtained correctly');
      
      // Process OCR
      console.log('Processing document OCR...');
      const ocrResponse = await mistralClient.ocr.process({
        model: "mistral-ocr-latest",
        document: {
          type: "document_url",
          documentUrl: signedUrl.url,
        },
        includeImageBase64: true
      });
      
      console.log('OCR completed successfully, processing results...');
      
      // Extract document content
      let content = '';
      if (ocrResponse.pages && Array.isArray(ocrResponse.pages)) {
        // Concatenate all pages content
        content = ocrResponse.pages.map(page => page.markdown || page.text || '').join('\n\n');
        console.log(`Extracted content from ${ocrResponse.pages.length} pages.`);
      } else if (ocrResponse.content) {
        content = ocrResponse.content;
        console.log('Extracted document content.');
      } else {
        throw new Error('Could not extract content from OCR result');
      }
      
      return content;
    } catch (error) {
      lastError = error;
      console.error(`Mistral OCR error (attempt ${retryCount + 1}/${maxRetries + 1}):`, error);
      
      // If we've reached max retries, throw the last error
      if (retryCount >= maxRetries) {
        console.error('Maximum retry attempts reached. Giving up.');
        throw error;
      }
      
      // Calculate delay with exponential backoff (1s, 2s, 4s)
      const delay = initialDelay * Math.pow(2, retryCount);
      console.log(`Waiting ${delay}ms before retry...`);
      await sleep(delay);
      
      // Increment retry counter
      retryCount++;
    }
  }
  
  // This should never be reached due to the throw in the catch block
  // when retries are exhausted, but added as a fallback
  throw lastError || new Error('Failed to process with Mistral OCR after retries');
}