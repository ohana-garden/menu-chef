/**
 * Storage module for managing templates in localStorage
 * Uses localStorage for simplicity, can be extended to IndexedDB for larger files
 */

class TemplateStorage {
    constructor() {
        this.storageKey = 'menuChefTemplates';
        this.templates = this.loadAll();
    }

    /**
     * Save a template to storage
     * @param {Object} template - Template object with metadata and extracted data
     * @returns {string} Template ID
     */
    save(template) {
        const id = template.id || this.generateId();
        const timestamp = Date.now();

        const templateData = {
            id,
            timestamp,
            name: template.name || `Menu Template ${new Date(timestamp).toLocaleDateString()}`,
            ...template
        };

        this.templates[id] = templateData;
        this.persist();

        return id;
    }

    /**
     * Load a template by ID
     * @param {string} id - Template ID
     * @returns {Object|null} Template object or null if not found
     */
    load(id) {
        return this.templates[id] || null;
    }

    /**
     * Load all templates
     * @returns {Object} All templates keyed by ID
     */
    loadAll() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.error('Error loading templates:', error);
            return {};
        }
    }

    /**
     * Delete a template
     * @param {string} id - Template ID
     * @returns {boolean} Success status
     */
    delete(id) {
        if (this.templates[id]) {
            delete this.templates[id];
            this.persist();
            return true;
        }
        return false;
    }

    /**
     * Get list of all templates with basic metadata
     * @returns {Array} Array of template metadata
     */
    list() {
        return Object.values(this.templates).map(template => ({
            id: template.id,
            name: template.name,
            timestamp: template.timestamp,
            pageCount: template.pages?.length || 0,
            sections: template.menuStructure?.sections?.length || 0
        }));
    }

    /**
     * Persist templates to localStorage
     */
    persist() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.templates));
        } catch (error) {
            console.error('Error saving templates:', error);
            // Check if it's a quota exceeded error
            if (error.name === 'QuotaExceededError') {
                throw new Error('Storage quota exceeded. Please delete some templates.');
            }
            throw error;
        }
    }

    /**
     * Generate a unique ID for a template
     * @returns {string} Unique ID
     */
    generateId() {
        return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clear all templates
     */
    clearAll() {
        this.templates = {};
        this.persist();
    }

    /**
     * Get storage usage information
     * @returns {Object} Storage usage stats
     */
    getStorageInfo() {
        const jsonString = JSON.stringify(this.templates);
        const bytes = new Blob([jsonString]).size;
        const kb = (bytes / 1024).toFixed(2);
        const mb = (bytes / (1024 * 1024)).toFixed(2);

        return {
            bytes,
            kb,
            mb,
            templateCount: Object.keys(this.templates).length
        };
    }
}

// Create global instance
window.templateStorage = new TemplateStorage();
