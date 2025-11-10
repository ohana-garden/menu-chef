/**
 * Menu Detector module
 * Identifies menu structure: sections, items, descriptions, and prices
 * Uses pattern recognition and spatial analysis
 */

class MenuDetector {
    constructor() {
        this.menuStructure = null;
        this.pricePattern = /[\$€£¥]\s*\d+([.,]\d{2})?|\d+([.,]\d{2})?\s*[\$€£¥]/;
        this.sectionKeywords = [
            'appetizer', 'starter', 'entree', 'main', 'dessert', 'beverage', 'drink',
            'soup', 'salad', 'pasta', 'seafood', 'meat', 'vegetarian', 'special',
            'breakfast', 'lunch', 'dinner', 'sides', 'wine', 'cocktail', 'beer'
        ];
    }

    /**
     * Detect menu structure from template
     * @param {Object} template - Template from TemplateExtractor
     * @returns {Object} Menu structure
     */
    detectMenuStructure(template) {
        this.menuStructure = {
            sections: [],
            metadata: {
                restaurantName: null,
                totalItems: 0,
                priceRange: { min: Infinity, max: -Infinity }
            }
        };

        // Process each page
        template.pages.forEach(page => {
            const pageSections = this.detectPageSections(page);
            this.menuStructure.sections.push(...pageSections);
        });

        // Post-process: merge and clean up sections
        this.cleanupSections();

        // Count total items
        this.menuStructure.metadata.totalItems = this.menuStructure.sections.reduce(
            (sum, section) => sum + section.items.length, 0
        );

        // Detect restaurant name (usually largest text at top)
        this.detectRestaurantName(template.pages[0]);

        return this.menuStructure;
    }

    /**
     * Detect sections on a single page
     * @param {Object} page - Page template
     * @returns {Array} Detected sections
     */
    detectPageSections(page) {
        const sections = [];
        const lines = page.lines;
        const textItems = page.textItems;

        let currentSection = null;
        let currentItem = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineText = line.text.trim();

            if (!lineText) continue;

            // Check if this is a section header
            if (this.isSectionHeader(line, page)) {
                // Save previous section
                if (currentSection && currentSection.items.length > 0) {
                    sections.push(currentSection);
                }

                // Start new section
                currentSection = {
                    name: lineText,
                    items: [],
                    position: { y: line.y },
                    styling: {
                        fontSize: line.avgFontSize,
                        fontName: line.items[0]?.fontName || 'unknown',
                        alignment: this.detectLineAlignment(line, page.width)
                    }
                };
                currentItem = null;
            }
            // Check if this is a menu item (has price)
            else if (this.hasPrice(lineText)) {
                const itemData = this.parseMenuItem(line, page);

                if (currentSection) {
                    currentSection.items.push(itemData);
                } else {
                    // Create a default section if none exists
                    currentSection = {
                        name: 'Menu Items',
                        items: [itemData],
                        position: { y: line.y },
                        styling: {
                            fontSize: line.avgFontSize,
                            fontName: line.items[0]?.fontName || 'unknown',
                            alignment: 'left'
                        }
                    };
                }
                currentItem = itemData;
            }
            // This might be a description for the previous item
            else if (currentItem && line.avgFontSize < currentItem.styling.fontSize) {
                // This is likely a description
                currentItem.description = lineText;
                currentItem.descriptionPosition = { y: line.y };
            }
            // This might be an item name without price on same line
            else if (currentSection && !currentItem) {
                // Check next line for price
                const nextLine = lines[i + 1];
                if (nextLine && this.hasPrice(nextLine.text)) {
                    const itemData = this.parseMenuItemMultiLine(line, nextLine, page);
                    currentSection.items.push(itemData);
                    currentItem = itemData;
                    i++; // Skip next line since we processed it
                }
            }
        }

        // Add last section
        if (currentSection && currentSection.items.length > 0) {
            sections.push(currentSection);
        }

        return sections;
    }

    /**
     * Check if a line is a section header
     * @param {Object} line - Line object
     * @param {Object} page - Page object
     * @returns {boolean}
     */
    isSectionHeader(line, page) {
        const text = line.text.toLowerCase().trim();

        // Check font size (headers are usually larger)
        const isLargerFont = line.avgFontSize > page.styledElements.fontSizeStats.avg * 1.2;

        // Check if it contains section keywords
        const hasKeyword = this.sectionKeywords.some(keyword => text.includes(keyword));

        // Check if it's short (headers are usually short)
        const isShort = line.text.length < 50;

        // Check if it doesn't have a price
        const noPrice = !this.hasPrice(line.text);

        // A line is a section header if it meets most criteria
        return (isLargerFont && isShort && noPrice) || (hasKeyword && isShort && noPrice);
    }

    /**
     * Check if text contains a price
     * @param {string} text - Text to check
     * @returns {boolean}
     */
    hasPrice(text) {
        return this.pricePattern.test(text);
    }

    /**
     * Extract price from text
     * @param {string} text - Text containing price
     * @returns {string|null} Extracted price
     */
    extractPrice(text) {
        const match = text.match(this.pricePattern);
        return match ? match[0].trim() : null;
    }

    /**
     * Parse a menu item from a line
     * @param {Object} line - Line object
     * @param {Object} page - Page object
     * @returns {Object} Menu item data
     */
    parseMenuItem(line, page) {
        const text = line.text;
        const price = this.extractPrice(text);
        const priceValue = this.parsePriceValue(price);

        // Update price range
        if (priceValue !== null) {
            this.menuStructure.metadata.priceRange.min = Math.min(
                this.menuStructure.metadata.priceRange.min, priceValue
            );
            this.menuStructure.metadata.priceRange.max = Math.max(
                this.menuStructure.metadata.priceRange.max, priceValue
            );
        }

        // Remove price from text to get item name
        const name = text.replace(this.pricePattern, '').trim();

        return {
            name: name,
            description: '',
            price: price,
            position: { y: line.y, x: line.minX },
            pricePosition: this.findPricePosition(line, price),
            styling: {
                fontSize: line.avgFontSize,
                fontName: line.items[0]?.fontName || 'unknown',
                alignment: this.detectLineAlignment(line, page.width)
            }
        };
    }

    /**
     * Parse menu item that spans multiple lines
     * @param {Object} nameLine - Line with item name
     * @param {Object} priceLine - Line with price
     * @param {Object} page - Page object
     * @returns {Object} Menu item data
     */
    parseMenuItemMultiLine(nameLine, priceLine, page) {
        const price = this.extractPrice(priceLine.text);
        const priceValue = this.parsePriceValue(price);

        if (priceValue !== null) {
            this.menuStructure.metadata.priceRange.min = Math.min(
                this.menuStructure.metadata.priceRange.min, priceValue
            );
            this.menuStructure.metadata.priceRange.max = Math.max(
                this.menuStructure.metadata.priceRange.max, priceValue
            );
        }

        return {
            name: nameLine.text.trim(),
            description: '',
            price: price,
            position: { y: nameLine.y, x: nameLine.minX },
            pricePosition: { y: priceLine.y, x: priceLine.minX },
            styling: {
                fontSize: nameLine.avgFontSize,
                fontName: nameLine.items[0]?.fontName || 'unknown',
                alignment: this.detectLineAlignment(nameLine, page.width)
            }
        };
    }

    /**
     * Find the X position of the price in a line
     * @param {Object} line - Line object
     * @param {string} price - Price string
     * @returns {Object} Position
     */
    findPricePosition(line, price) {
        // Find the rightmost item (usually the price)
        const rightmostItem = line.items.reduce((max, item) =>
            item.x > max.x ? item : max, line.items[0]
        );

        return { y: line.y, x: rightmostItem.x };
    }

    /**
     * Parse price value as number
     * @param {string} priceStr - Price string
     * @returns {number|null} Price value
     */
    parsePriceValue(priceStr) {
        if (!priceStr) return null;
        const numStr = priceStr.replace(/[^\d.,]/g, '').replace(',', '.');
        const value = parseFloat(numStr);
        return isNaN(value) ? null : value;
    }

    /**
     * Detect line alignment
     * @param {Object} line - Line object
     * @param {number} pageWidth - Page width
     * @returns {string} Alignment (left, center, right)
     */
    detectLineAlignment(line, pageWidth) {
        const centerX = pageWidth / 2;
        const lineCenter = (line.minX + line.maxX) / 2;

        if (line.minX < pageWidth * 0.15) {
            return 'left';
        } else if (Math.abs(lineCenter - centerX) < pageWidth * 0.1) {
            return 'center';
        } else if (line.maxX > pageWidth * 0.85) {
            return 'right';
        }

        return 'left';
    }

    /**
     * Clean up and merge sections
     */
    cleanupSections() {
        // Remove duplicate or empty sections
        this.menuStructure.sections = this.menuStructure.sections.filter(
            section => section.items.length > 0
        );

        // If no sections detected, create a default one
        if (this.menuStructure.sections.length === 0) {
            this.menuStructure.sections.push({
                name: 'Menu',
                items: [],
                position: { y: 0 },
                styling: {
                    fontSize: 12,
                    fontName: 'unknown',
                    alignment: 'left'
                }
            });
        }
    }

    /**
     * Detect restaurant name from first page
     * @param {Object} firstPage - First page template
     */
    detectRestaurantName(firstPage) {
        if (!firstPage || !firstPage.styledElements.headers.length) return;

        // Restaurant name is usually the largest text at the top
        const headers = firstPage.styledElements.headers;
        const topHeader = headers.reduce((top, header) =>
            header.y < top.y ? header : top, headers[0]
        );

        this.menuStructure.metadata.restaurantName = topHeader.text.trim();
    }

    /**
     * Get detected menu structure
     * @returns {Object} Menu structure
     */
    getMenuStructure() {
        return this.menuStructure;
    }
}

// Create global instance
window.menuDetector = new MenuDetector();
