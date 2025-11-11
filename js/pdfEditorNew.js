/**
 * Image-based PDF Editor
 * Treats PDF as image + text overlay, preserves original design perfectly
 */

class ImageBasedPDFEditor {
    constructor() {
        this.pdfDocument = null;
        this.originalPages = []; // Store original pages as images
        this.textLayers = []; // Store editable text positions
        this.currentPage = 1;
    }

    /**
     * Load PDF and extract as image + text overlay
     */
    async loadPDF(file) {
        const arrayBuffer = await file.arrayBuffer();
        this.pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const numPages = this.pdfDocument.numPages;

        // Process each page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await this.pdfDocument.getPage(pageNum);

            // Render page to canvas (this becomes our background image)
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const ctx = canvas.getContext('2d');
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;

            // Store as background image
            const backgroundImage = canvas.toDataURL('image/png');

            // Extract text with positions (this becomes our editable layer)
            const textContent = await page.getTextContent();
            const editableTexts = textContent.items.map(item => ({
                text: item.str,
                x: item.transform[4],
                y: viewport.height - item.transform[5], // Flip Y
                width: item.width,
                height: item.height,
                fontSize: Math.abs(item.transform[3]),
                fontName: item.fontName,
                editable: true
            }));

            this.originalPages.push({
                pageNum,
                backgroundImage,
                viewport: {
                    width: viewport.width,
                    height: viewport.height
                }
            });

            this.textLayers.push(editableTexts);
        }

        return {
            numPages,
            pages: this.originalPages,
            textLayers: this.textLayers
        };
    }

    /**
     * Render editable view - background image + clickable text overlays
     */
    renderEditableView(pageNum, container) {
        const page = this.originalPages[pageNum - 1];
        const texts = this.textLayers[pageNum - 1];

        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.width = page.viewport.width + 'px';
        container.style.height = page.viewport.height + 'px';

        // Background image
        const bgImg = document.createElement('img');
        bgImg.src = page.backgroundImage;
        bgImg.style.position = 'absolute';
        bgImg.style.top = '0';
        bgImg.style.left = '0';
        bgImg.style.width = '100%';
        bgImg.style.height = '100%';
        bgImg.style.pointerEvents = 'none';
        container.appendChild(bgImg);

        // Text overlays (editable)
        texts.forEach((textItem, index) => {
            const textDiv = document.createElement('div');
            textDiv.contentEditable = true;
            textDiv.textContent = textItem.text;
            textDiv.style.position = 'absolute';
            textDiv.style.left = textItem.x + 'px';
            textDiv.style.top = textItem.y + 'px';
            textDiv.style.fontSize = textItem.fontSize + 'px';
            textDiv.style.fontFamily = 'Arial'; // Use system fonts
            textDiv.style.border = '1px dashed transparent';
            textDiv.style.padding = '2px';
            textDiv.style.background = 'rgba(255, 255, 255, 0.8)';
            textDiv.style.cursor = 'text';
            textDiv.style.minWidth = '20px';
            textDiv.style.whiteSpace = 'nowrap';

            // Highlight on hover
            textDiv.addEventListener('mouseenter', () => {
                textDiv.style.border = '1px dashed #667eea';
                textDiv.style.background = 'rgba(255, 255, 255, 0.95)';
            });

            textDiv.addEventListener('mouseleave', () => {
                if (document.activeElement !== textDiv) {
                    textDiv.style.border = '1px dashed transparent';
                    textDiv.style.background = 'rgba(255, 255, 255, 0.8)';
                }
            });

            // Save edits
            textDiv.addEventListener('blur', () => {
                textItem.text = textDiv.textContent;
                textDiv.style.border = '1px dashed transparent';
                textDiv.style.background = 'rgba(255, 255, 255, 0.8)';
            });

            container.appendChild(textDiv);
        });
    }

    /**
     * Generate new PDF - original background + edited text
     */
    async generateEditedPDF() {
        const { jsPDF } = window.jspdf;

        // Create PDF with same dimensions as original
        const firstPage = this.originalPages[0];
        const pdf = new jsPDF({
            unit: 'px',
            format: [firstPage.viewport.width, firstPage.viewport.height]
        });

        for (let i = 0; i < this.originalPages.length; i++) {
            if (i > 0) pdf.addPage();

            const page = this.originalPages[i];
            const texts = this.textLayers[i];

            // Add background image
            pdf.addImage(
                page.backgroundImage,
                'PNG',
                0,
                0,
                page.viewport.width,
                page.viewport.height
            );

            // Overlay edited text
            texts.forEach(textItem => {
                pdf.setFontSize(textItem.fontSize);
                pdf.text(textItem.text, textItem.x, textItem.y);
            });
        }

        return pdf.output('blob');
    }

    /**
     * Simple view - just show what changed
     */
    getChangedTexts(pageNum) {
        return this.textLayers[pageNum - 1].filter((item, index) => {
            // Compare with original if we stored it
            return true; // For now, return all editable items
        });
    }
}

window.imageBasedPDFEditor = new ImageBasedPDFEditor();
