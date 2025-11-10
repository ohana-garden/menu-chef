/**
 * PDF Parser module
 * Handles PDF file loading and extraction of text, images, and styling information
 */

class PDFParser {
    constructor() {
        this.pdfDocument = null;
        this.extractedData = null;
    }

    /**
     * Load and parse a PDF file
     * @param {File} file - PDF file object
     * @param {Function} progressCallback - Progress callback function
     * @returns {Promise<Object>} Extracted PDF data
     */
    async parsePDF(file, progressCallback = null) {
        try {
            // Validate file
            if (!file || file.type !== 'application/pdf') {
                throw new Error('Invalid file type. Please upload a PDF file.');
            }

            if (progressCallback) progressCallback(10, 'Loading PDF...');

            // Read file as ArrayBuffer
            const arrayBuffer = await this.readFileAsArrayBuffer(file);

            if (progressCallback) progressCallback(20, 'Parsing PDF structure...');

            // Load PDF document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            this.pdfDocument = await loadingTask.promise;

            const numPages = this.pdfDocument.numPages;

            if (progressCallback) progressCallback(30, `Extracting content from ${numPages} page(s)...`);

            // Extract data from all pages
            const pages = [];
            for (let pageNum = 1; pageNum <= numPages; pageNum++) {
                const page = await this.pdfDocument.getPage(pageNum);
                const pageData = await this.extractPageData(page, pageNum);
                pages.push(pageData);

                if (progressCallback) {
                    const progress = 30 + (pageNum / numPages) * 50;
                    progressCallback(progress, `Extracted page ${pageNum} of ${numPages}...`);
                }
            }

            this.extractedData = {
                fileName: file.name,
                pageCount: numPages,
                pages
            };

            if (progressCallback) progressCallback(80, 'Extraction complete!');

            return this.extractedData;

        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error(`Failed to parse PDF: ${error.message}`);
        }
    }

    /**
     * Extract all data from a single page
     * @param {PDFPageProxy} page - PDF.js page object
     * @param {number} pageNum - Page number
     * @returns {Promise<Object>} Page data
     */
    async extractPageData(page, pageNum) {
        const viewport = page.getViewport({ scale: 1.0 });

        // Extract text content with positions and styles
        const textContent = await page.getTextContent();
        const textItems = this.processTextItems(textContent.items, viewport);

        // Extract images and graphics
        const operatorList = await page.getOperatorList();
        const images = await this.extractImages(page, operatorList);

        // Get page metadata
        const pageInfo = {
            pageNumber: pageNum,
            width: viewport.width,
            height: viewport.height,
            rotation: viewport.rotation,
            textItems,
            images,
            viewport
        };

        return pageInfo;
    }

    /**
     * Process text items to extract position and styling information
     * @param {Array} items - Text items from PDF
     * @param {Object} viewport - Page viewport
     * @returns {Array} Processed text items
     */
    processTextItems(items, viewport) {
        return items.map((item, index) => {
            const transform = item.transform;
            const x = transform[4];
            const y = viewport.height - transform[5]; // Flip Y coordinate

            // Extract font information
            const fontHeight = Math.abs(transform[3]);
            const fontName = item.fontName || 'unknown';

            return {
                text: item.str,
                x: Math.round(x * 100) / 100,
                y: Math.round(y * 100) / 100,
                width: item.width,
                height: item.height,
                fontSize: Math.round(fontHeight * 100) / 100,
                fontName: fontName,
                transform: transform,
                // Additional properties
                hasEOL: item.hasEOL,
                index: index
            };
        });
    }

    /**
     * Extract images from page
     * @param {PDFPageProxy} page - PDF.js page object
     * @param {Object} operatorList - Operator list
     * @returns {Promise<Array>} Array of image data
     */
    async extractImages(page, operatorList) {
        const images = [];
        const fnArray = operatorList.fnArray;
        const argsArray = operatorList.argsArray;

        for (let i = 0; i < fnArray.length; i++) {
            // Check for image operations (paintImageXObject, etc.)
            if (fnArray[i] === pdfjsLib.OPS.paintImageXObject ||
                fnArray[i] === pdfjsLib.OPS.paintInlineImageXObject ||
                fnArray[i] === pdfjsLib.OPS.paintImageMaskXObject) {

                try {
                    const imageName = argsArray[i][0];
                    // Note: Actual image extraction requires additional work
                    // For now, we just note their presence
                    images.push({
                        name: imageName,
                        type: 'image',
                        operation: fnArray[i]
                    });
                } catch (error) {
                    console.warn('Error extracting image:', error);
                }
            }
        }

        return images;
    }

    /**
     * Render page to canvas for preview
     * @param {number} pageNum - Page number
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} scale - Render scale
     * @returns {Promise<void>}
     */
    async renderPageToCanvas(pageNum, canvas, scale = 1.5) {
        if (!this.pdfDocument) {
            throw new Error('No PDF document loaded');
        }

        const page = await this.pdfDocument.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        const renderContext = {
            canvasContext: context,
            viewport: viewport
        };

        await page.render(renderContext).promise;
    }

    /**
     * Read file as ArrayBuffer
     * @param {File} file - File object
     * @returns {Promise<ArrayBuffer>}
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Get extracted data
     * @returns {Object|null} Extracted data
     */
    getData() {
        return this.extractedData;
    }

    /**
     * Clean up resources
     */
    destroy() {
        if (this.pdfDocument) {
            this.pdfDocument.destroy();
            this.pdfDocument = null;
        }
        this.extractedData = null;
    }
}

// Create global instance
window.pdfParser = new PDFParser();
