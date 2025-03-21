// pages/api/generate-docx.js
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDocx from 'remark-docx';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { getAuth } from '@clerk/nextjs/server';
import { withAuthAndAuthorizationFormData } from '../../lib/withAuth';

async function generateDocxHandler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Get markdownContent from request body
    const { markdownContent } = req.body;

    if (!markdownContent) {
      return res.status(400).json({ error: 'No se proporcionó contenido markdown' });
    }

    // Obtener ID del usuario desde la autenticación (ya verificada por el middleware)
    const auth = getAuth(req);
    const userId = auth.userId;
    
    console.log('Generando DOCX para usuario ID:', userId); // Log user ID for audit

    // Extract title for filename
    let fileName = 'documento_procesado.docx';
    const titleMatch = markdownContent.match(/\*\*(.*?)\*\*/);
    if (titleMatch && titleMatch[1]) {
      // Clean the title for use as filename
      const cleanTitle = titleMatch[1]
        .replace(/[^\w\s-]/g, '')  // Remove special characters
        .replace(/\s+/g, '_')      // Replace spaces with underscores
        .toLowerCase()
        .substring(0, 50);         // Limit length
      
      if (cleanTitle) {
        fileName = `${cleanTitle}.docx`;
      }
    }

    // Configure remark-docx processor with options to preserve line breaks and tables
    const processor = unified()
      .use(remarkParse, {
        // Configuration to preserve line breaks
        commonmark: true,
        gfm: true
      })
      .use(remarkGfm) // Support for tables and other GitHub Flavored Markdown features
      .use(remarkBreaks) // Plugin to convert line breaks to <br>
      .use(remarkDocx, { 
        output: 'buffer',
        title: 'Documento Procesado',
        subject: 'Documento generado desde markdown',
        creator: 'Secure Document Processor',
        keywords: 'documento, markdown, procesado',
        description: 'Documento generado automáticamente desde contenido markdown',
        lastModifiedBy: 'Secure Document Processor',
        revision: 1,
        styles: {
          paragraphStyles: [
            {
              id: 'Normal',
              name: 'Normal',
              basedOn: 'Normal',
              next: 'Normal',
              quickFormat: true,
              run: {
                size: 24, // 12pt
                font: 'Calibri',
              },
              paragraph: {
                spacing: {
                  line: 360, // 1.5 lines
                  after: 160, // Space after paragraph
                },
              },
            },
            {
              id: 'Heading1',
              name: 'Heading 1',
              basedOn: 'Normal',
              next: 'Normal',
              quickFormat: true,
              run: {
                size: 32, // 16pt
                bold: true,
                color: '2C3E50',
                font: 'Calibri',
              },
              paragraph: {
                spacing: {
                  before: 240, // Space before
                  after: 120, // Space after
                },
              },
            },
            {
              id: 'Heading2',
              name: 'Heading 2',
              basedOn: 'Normal',
              next: 'Normal',
              quickFormat: true,
              run: {
                size: 28, // 14pt
                bold: true,
                color: '2C3E50',
                font: 'Calibri',
              },
              paragraph: {
                spacing: {
                  before: 240,
                  after: 120,
                },
              },
            },
            {
              id: 'TableHeader',
              name: 'Table Header',
              basedOn: 'Normal',
              next: 'Normal',
              quickFormat: true,
              run: {
                bold: true,
                font: 'Calibri',
                size: 24, // 12pt
              },
              paragraph: {
                spacing: {
                  before: 80,
                  after: 80,
                },
                alignment: 'center',
              },
            },
            {
              id: 'TableCell',
              name: 'Table Cell',
              basedOn: 'Normal',
              next: 'Normal',
              quickFormat: true,
              run: {
                font: 'Calibri',
                size: 24, // 12pt
              },
              paragraph: {
                spacing: {
                  before: 80,
                  after: 80,
                },
              },
            },
          ],
        },
      });

    // Process markdown content and get DOCX document buffer
    const doc = await processor.process(markdownContent);
    const docxBuffer = await doc.result;

    // Configure headers for file download
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    // Send document as response
    res.send(docxBuffer);

  } catch (error) {
    console.error('Error generating DOCX document:', error);
    
    res.status(500).json({ 
      error: 'Error al generar el documento DOCX',
      message: error.message || 'Se produjo un error inesperado'
    });
  }
}

// Export the handler with the correct middleware
// Note: Since we're receiving JSON data, not FormData, we should use the standard withAuthAndAuthorization instead
export default withAuthAndAuthorizationFormData(generateDocxHandler);