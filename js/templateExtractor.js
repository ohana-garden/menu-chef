/**
 * Template Extractor module
 * Processes parsed PDF data to extract template information including:
 * - Font styles, sizes, colors
 * - Layout patterns and spacing
 * - Position maps for text elements
 */

class TemplateExtractor {
    constructor() {
        this.template = null;
    }

    /**
     * Extract template from parsed PDF data
     * @param {Object} pdfData - Parsed PDF data from PDFParser
     * @returns {Object} Template object
     */
    extractTemplate(pdfData) {
        this.template = {
            fileName: pdfData.fileName,
            pageCount: pdfData.pageCount,
            pages: [],
            fontMap: {},
            colorScheme: {},
            layoutConstraints: {}
        };

        // Process each page
        for (const pageData of pdfData.pages) {
            const pageTemplate = this.extractPageTemplate(pageData);
            this.template.pages.push(pageTemplate);
        }

        // Analyze overall font usage
        this.template.fontMap = this.analyzeFonts(this.template.pages);

        // Detect layout patterns
        this.template.layoutConstraints = this.detectLayoutPatterns(this.template.pages);

        return this.template;
    }

    /**
     * Extract template information from a single page
     * @param {Object} pageData - Page data from PDFParser
     * @returns {Object} Page template
     */
    extractPageTemplate(pageData) {
        const textItems = pageData.textItems;

        // Group text items by vertical position (lines)
        const lines = this.groupIntoLines(textItems);

        // Analyze text styling
        const styledElements = this.analyzeTextStyling(textItems);

        // Detect horizontal alignment patterns
        const alignments = this.detectAlignments(textItems, pageData.width);

        return {
            pageNumber: pageData.pageNumber,
            width: pageData.width,
            height: pageData.height,
            textItems: textItems,
            lines: lines,
            styledElements: styledElements,
            alignments: alignments,
            images: pageData.images || []
        };
    }

    /**
     * Group text items into lines based on vertical position
     * @param {Array} textItems - Text items
     * @returns {Array} Lines of text
     */
    groupIntoLines(textItems) {
        if (!textItems || textItems.length === 0) return [];

        // Sort by Y position first, then X position
        const sorted = [...textItems].sort((a, b) => {
            const yDiff = a.y - b.y;
            if (Math.abs(yDiff) < 5) { // Same line threshold
                return a.x - b.x;
            }
            return yDiff;
        });

        const lines = [];
        let currentLine = { y: sorted[0].y, items: [sorted[0]] };

        for (let i = 1; i < sorted.length; i++) {
            const item = sorted[i];
            const yDiff = Math.abs(item.y - currentLine.y);

            if (yDiff < 5) { // Same line
                currentLine.items.push(item);
            } else { // New line
                lines.push(currentLine);
                currentLine = { y: item.y, items: [item] };
            }
        }
        lines.push(currentLine);

        // Combine text items in each line
        return lines.map(line => ({
            y: line.y,
            text: line.items.map(item => item.text).join(' '),
            items: line.items,
            minX: Math.min(...line.items.map(item => item.x)),
            maxX: Math.max(...line.items.map(item => item.x + item.width)),
            avgFontSize: line.items.reduce((sum, item) => sum + item.fontSize, 0) / line.items.length
        }));
    }

    /**
     * Analyze text styling to detect patterns
     * @param {Array} textItems - Text items
     * @returns {Object} Styled elements by category
     */
    analyzeTextStyling(textItems) {
        const fontSizes = textItems.map(item => item.fontSize);
        const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
        const maxFontSize = Math.max(...fontSizes);
        const minFontSize = Math.min(...fontSizes);

        // Categorize text by size
        const headers = [];
        const body = [];
        const small = [];

        textItems.forEach(item => {
            if (item.fontSize >= maxFontSize * 0.9) {
                headers.push(item);
            } else if (item.fontSize >= avgFontSize * 0.8) {
                body.push(item);
            } else {
                small.push(item);
            }
        });

        return {
            headers,
            body,
            small,
            fontSizeStats: {
                avg: avgFontSize,
                max: maxFontSize,
                min: minFontSize
            }
        };
    }

    /**
     * Detect text alignment patterns
     * @param {Array} textItems - Text items
     * @param {number} pageWidth - Page width
     * @returns {Object} Alignment information
     */
    detectAlignments(textItems, pageWidth) {
        const leftAligned = [];
        const centerAligned = [];
        const rightAligned = [];

        const leftMargin = pageWidth * 0.15;
        const rightMargin = pageWidth * 0.85;
        const centerStart = pageWidth * 0.4;
        const centerEnd = pageWidth * 0.6;

        textItems.forEach(item => {
            if (item.x < leftMargin) {
                leftAligned.push(item);
            } else if (item.x > rightMargin) {
                rightAligned.push(item);
            } else if (item.x >= centerStart && item.x <= centerEnd) {
                centerAligned.push(item);
            }
        });

        return {
            left: leftAligned,
            center: centerAligned,
            right: rightAligned
        };
    }

    /**
     * Analyze font usage across all pages
     * @param {Array} pages - Page templates
     * @returns {Object} Font map
     */
    analyzeFonts(pages) {
        const fontUsage = {};

        pages.forEach(page => {
            page.textItems.forEach(item => {
                const key = `${item.fontName}_${item.fontSize}`;
                if (!fontUsage[key]) {
                    fontUsage[key] = {
                        fontName: item.fontName,
                        fontSize: item.fontSize,
                        count: 0,
                        examples: []
                    };
                }
                fontUsage[key].count++;
                if (fontUsage[key].examples.length < 3) {
                    fontUsage[key].examples.push(item.text);
                }
            });
        });

        return fontUsage;
    }

    /**
     * Detect layout patterns and constraints
     * @param {Array} pages - Page templates
     * @returns {Object} Layout constraints
     */
    detectLayoutPatterns(pages) {
        const constraints = {
            margins: { top: 0, right: 0, bottom: 0, left: 0 },
            spacing: { line: 0, section: 0 },
            columns: 1
        };

        if (pages.length === 0) return constraints;

        const firstPage = pages[0];

        // Detect margins
        const textItems = firstPage.textItems;
        if (textItems.length > 0) {
            constraints.margins.left = Math.min(...textItems.map(item => item.x));
            constraints.margins.top = Math.min(...textItems.map(item => item.y));
            constraints.margins.right = firstPage.width - Math.max(...textItems.map(item => item.x + item.width));
            constraints.margins.bottom = firstPage.height - Math.max(...textItems.map(item => item.y + item.height));
        }

        // Detect line spacing
        const lines = firstPage.lines;
        if (lines.length > 1) {
            const spacings = [];
            for (let i = 1; i < lines.length; i++) {
                spacings.push(lines[i].y - lines[i - 1].y);
            }
            constraints.spacing.line = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        }

        return constraints;
    }

    /**
     * Get the extracted template
     * @returns {Object|null} Template object
     */
    getTemplate() {
        return this.template;
    }
}

// Create global instance
window.templateExtractor = new TemplateExtractor();
