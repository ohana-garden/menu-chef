/**
 * PDF Generator module
 * Generates new PDF with updated content while preserving original design
 */

class PDFGenerator {
    constructor() {
        this.template = null;
        this.menuStructure = null;
        this.generatedPDF = null;
    }

    /**
     * Generate PDF from template and edited content
     * @param {Object} template - Original template
     * @param {Object} editedContent - Edited menu structure
     * @returns {Promise<Blob>} Generated PDF blob
     */
    async generatePDF(template, editedContent) {
        this.template = template;
        this.menuStructure = editedContent;

        const { jsPDF } = window.jspdf;

        // Get first page dimensions (in points, 72 points = 1 inch)
        const firstPage = template.pages[0];
        const pageWidth = firstPage.width;
        const pageHeight = firstPage.height;

        // Create PDF with same dimensions as original
        const pdf = new jsPDF({
            orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
            unit: 'pt',
            format: [pageWidth, pageHeight]
        });

        // Render content to PDF
        await this.renderContentToPDF(pdf, pageWidth, pageHeight);

        // Generate blob
        this.generatedPDF = pdf.output('blob');

        return this.generatedPDF;
    }

    /**
     * Render content to PDF
     * @param {jsPDF} pdf - jsPDF instance
     * @param {number} pageWidth - Page width
     * @param {number} pageHeight - Page height
     */
    async renderContentToPDF(pdf, pageWidth, pageHeight) {
        const firstPage = this.template.pages[0];
        const margins = this.template.layoutConstraints.margins;

        let currentY = margins.top + 40;

        // Render restaurant name if available
        if (this.menuStructure.metadata.restaurantName) {
            const restaurantNameStyle = firstPage.styledElements.headers[0];
            if (restaurantNameStyle) {
                pdf.setFontSize(restaurantNameStyle.fontSize * 1.2);
                pdf.setFont('helvetica', 'bold');
                const textWidth = pdf.getTextWidth(this.menuStructure.metadata.restaurantName);
                const centerX = (pageWidth - textWidth) / 2;
                pdf.text(this.menuStructure.metadata.restaurantName, centerX, currentY);
                currentY += restaurantNameStyle.fontSize * 2;
            }
        }

        // Render each section
        for (const section of this.menuStructure.sections) {
            currentY = await this.renderSection(pdf, section, currentY, pageWidth, pageHeight, margins);
        }
    }

    /**
     * Render a section to PDF
     * @param {jsPDF} pdf - jsPDF instance
     * @param {Object} section - Section object
     * @param {number} startY - Starting Y position
     * @param {number} pageWidth - Page width
     * @param {number} pageHeight - Page height
     * @param {Object} margins - Page margins
     * @returns {Promise<number>} New Y position
     */
    async renderSection(pdf, section, startY, pageWidth, pageHeight, margins) {
        let currentY = startY + 30;

        // Check if we need a new page
        if (currentY > pageHeight - margins.bottom - 100) {
            pdf.addPage();
            currentY = margins.top + 40;
        }

        // Render section header
        const sectionStyle = section.styling;
        pdf.setFontSize(sectionStyle.fontSize || 16);
        pdf.setFont('helvetica', 'bold');

        if (sectionStyle.alignment === 'center') {
            const textWidth = pdf.getTextWidth(section.name);
            const centerX = (pageWidth - textWidth) / 2;
            pdf.text(section.name, centerX, currentY);
        } else {
            pdf.text(section.name, margins.left, currentY);
        }

        currentY += (sectionStyle.fontSize || 16) + 15;

        // Render items
        for (const item of section.items) {
            // Check if we need a new page
            if (currentY > pageHeight - margins.bottom - 80) {
                pdf.addPage();
                currentY = margins.top + 40;
            }

            currentY = this.renderMenuItem(pdf, item, currentY, pageWidth, margins);
        }

        return currentY;
    }

    /**
     * Render a menu item to PDF
     * @param {jsPDF} pdf - jsPDF instance
     * @param {Object} item - Menu item object
     * @param {number} startY - Starting Y position
     * @param {number} pageWidth - Page width
     * @param {Object} margins - Page margins
     * @returns {number} New Y position
     */
    renderMenuItem(pdf, item, startY, pageWidth, margins) {
        let currentY = startY;
        const itemStyle = item.styling;
        const nameSize = itemStyle.fontSize || 12;
        const descSize = (itemStyle.fontSize || 12) * 0.85;

        const leftMargin = margins.left;
        const rightMargin = pageWidth - margins.right;
        const maxTextWidth = rightMargin - leftMargin - 60; // Reserve space for price

        // Render item name and price on same line
        pdf.setFontSize(nameSize);
        pdf.setFont('helvetica', 'bold');

        // Handle text overflow for item name
        let itemName = item.name;
        let nameWidth = pdf.getTextWidth(itemName);

        // If name is too long, truncate with ellipsis
        if (nameWidth > maxTextWidth) {
            while (nameWidth > maxTextWidth && itemName.length > 3) {
                itemName = itemName.slice(0, -1);
                nameWidth = pdf.getTextWidth(itemName + '...');
            }
            itemName += '...';
        }

        pdf.text(itemName, leftMargin, currentY);

        // Render price (right-aligned)
        if (item.price) {
            pdf.setFont('helvetica', 'normal');
            const priceWidth = pdf.getTextWidth(item.price);
            pdf.text(item.price, rightMargin - priceWidth, currentY);
        }

        currentY += nameSize + 5;

        // Render description if present
        if (item.description && item.description.trim()) {
            pdf.setFontSize(descSize);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(100, 100, 100); // Gray color

            // Split description into lines that fit
            const descLines = pdf.splitTextToSize(item.description, maxTextWidth + 40);

            // Limit to 3 lines to prevent overflow
            const maxLines = 3;
            const linesToRender = descLines.slice(0, maxLines);

            linesToRender.forEach((line, index) => {
                let lineText = line;
                // If this is the last line and there are more lines, add ellipsis
                if (index === maxLines - 1 && descLines.length > maxLines) {
                    lineText = line.slice(0, -3) + '...';
                }
                pdf.text(lineText, leftMargin, currentY);
                currentY += descSize + 3;
            });

            pdf.setTextColor(0, 0, 0); // Reset to black
        }

        currentY += 12; // Space between items

        return currentY;
    }

    /**
     * Preview the generated PDF on canvas
     * @param {Object} template - Template object
     * @param {Object} editedContent - Edited content
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @returns {Promise<void>}
     */
    async previewOnCanvas(template, editedContent, canvas) {
        this.template = template;
        this.menuStructure = editedContent;

        const ctx = canvas.getContext('2d');
        const firstPage = template.pages[0];

        // Set canvas size
        const scale = 2; // Higher resolution
        canvas.width = firstPage.width * scale;
        canvas.height = firstPage.height * scale;
        canvas.style.width = firstPage.width + 'px';
        canvas.style.height = firstPage.height + 'px';

        ctx.scale(scale, scale);

        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, firstPage.width, firstPage.height);

        const margins = template.layoutConstraints.margins;
        let currentY = margins.top + 40;

        // Render restaurant name
        if (editedContent.metadata.restaurantName) {
            const restaurantNameStyle = firstPage.styledElements.headers[0];
            if (restaurantNameStyle) {
                ctx.font = `bold ${restaurantNameStyle.fontSize * 1.2}px Arial`;
                ctx.fillStyle = 'black';
                ctx.textAlign = 'center';
                ctx.fillText(editedContent.metadata.restaurantName, firstPage.width / 2, currentY);
                currentY += restaurantNameStyle.fontSize * 2;
            }
        }

        ctx.textAlign = 'left';

        // Render sections
        for (const section of editedContent.sections) {
            currentY = this.renderSectionToCanvas(ctx, section, currentY, firstPage.width, margins);

            // Stop if we run out of space (simplified for preview)
            if (currentY > firstPage.height - margins.bottom) {
                break;
            }
        }
    }

    /**
     * Render section to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} section - Section object
     * @param {number} startY - Starting Y position
     * @param {number} pageWidth - Page width
     * @param {Object} margins - Margins
     * @returns {number} New Y position
     */
    renderSectionToCanvas(ctx, section, startY, pageWidth, margins) {
        let currentY = startY + 30;
        const sectionStyle = section.styling;

        // Section header
        ctx.font = `bold ${sectionStyle.fontSize || 16}px Arial`;
        ctx.fillStyle = 'black';

        if (sectionStyle.alignment === 'center') {
            ctx.textAlign = 'center';
            ctx.fillText(section.name, pageWidth / 2, currentY);
            ctx.textAlign = 'left';
        } else {
            ctx.fillText(section.name, margins.left, currentY);
        }

        currentY += (sectionStyle.fontSize || 16) + 15;

        // Items
        for (const item of section.items) {
            if (currentY > 800) break; // Simplified overflow handling

            currentY = this.renderMenuItemToCanvas(ctx, item, currentY, pageWidth, margins);
        }

        return currentY;
    }

    /**
     * Render menu item to canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {Object} item - Menu item
     * @param {number} startY - Starting Y position
     * @param {number} pageWidth - Page width
     * @param {Object} margins - Margins
     * @returns {number} New Y position
     */
    renderMenuItemToCanvas(ctx, item, startY, pageWidth, margins) {
        let currentY = startY;
        const itemStyle = item.styling;
        const nameSize = itemStyle.fontSize || 12;
        const descSize = nameSize * 0.85;

        const leftMargin = margins.left;
        const rightMargin = pageWidth - margins.right;

        // Item name
        ctx.font = `bold ${nameSize}px Arial`;
        ctx.fillStyle = 'black';
        ctx.fillText(item.name, leftMargin, currentY);

        // Price (right-aligned)
        if (item.price) {
            ctx.font = `${nameSize}px Arial`;
            const priceWidth = ctx.measureText(item.price).width;
            ctx.fillText(item.price, rightMargin - priceWidth, currentY);
        }

        currentY += nameSize + 5;

        // Description
        if (item.description && item.description.trim()) {
            ctx.font = `${descSize}px Arial`;
            ctx.fillStyle = '#666';

            const maxWidth = rightMargin - leftMargin - 40;
            const words = item.description.split(' ');
            let line = '';
            let lineCount = 0;
            const maxLines = 3;

            for (const word of words) {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);

                if (metrics.width > maxWidth && line) {
                    ctx.fillText(line, leftMargin, currentY);
                    currentY += descSize + 3;
                    line = word + ' ';
                    lineCount++;

                    if (lineCount >= maxLines) {
                        break;
                    }
                } else {
                    line = testLine;
                }
            }

            if (line && lineCount < maxLines) {
                ctx.fillText(line, leftMargin, currentY);
                currentY += descSize + 3;
            }

            ctx.fillStyle = 'black';
        }

        currentY += 12;

        return currentY;
    }

    /**
     * Download the generated PDF
     * @param {string} filename - Filename for download
     */
    downloadPDF(filename = 'menu.pdf') {
        if (!this.generatedPDF) {
            throw new Error('No PDF generated yet');
        }

        const url = URL.createObjectURL(this.generatedPDF);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get generated PDF blob
     * @returns {Blob|null} PDF blob
     */
    getPDFBlob() {
        return this.generatedPDF;
    }
}

// Create global instance
window.pdfGenerator = new PDFGenerator();
