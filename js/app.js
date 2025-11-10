/**
 * Main Application Controller
 * Manages UI flow and coordinates all modules
 */

class MenuChefApp {
    constructor() {
        this.currentTemplate = null;
        this.currentMenuStructure = null;
        this.currentStep = 'upload';

        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.setupEventListeners();
        this.loadSavedTemplates();
        this.showSection('upload');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Upload section
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        const selectFileBtn = document.getElementById('select-file-btn');

        // File selection
        selectFileBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Drag and drop
        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');

            if (e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];
                if (file.type === 'application/pdf') {
                    this.handleFileUpload(file);
                } else {
                    this.showError('Please upload a PDF file');
                }
            }
        });

        // Editor section
        const backToUploadBtn = document.getElementById('back-to-upload-btn');
        const generatePdfBtn = document.getElementById('generate-pdf-btn');
        const refreshPreviewBtn = document.getElementById('refresh-preview-btn');

        backToUploadBtn.addEventListener('click', () => this.showSection('upload'));
        generatePdfBtn.addEventListener('click', () => this.generatePDF());
        refreshPreviewBtn.addEventListener('click', () => this.refreshPreview());

        // Generation section
        const editMoreBtn = document.getElementById('edit-more-btn');
        const downloadPdfBtn = document.getElementById('download-pdf-btn');
        const startOverBtn = document.getElementById('start-over-btn');

        editMoreBtn.addEventListener('click', () => this.showSection('editor'));
        downloadPdfBtn.addEventListener('click', () => this.downloadPDF());
        startOverBtn.addEventListener('click', () => this.startOver());

        // Error modal
        const closeErrorBtn = document.getElementById('close-error-btn');
        const errorModal = document.getElementById('error-modal');

        closeErrorBtn.addEventListener('click', () => {
            errorModal.classList.remove('show');
        });
    }

    /**
     * Handle file upload
     * @param {File} file - PDF file
     */
    async handleFileUpload(file) {
        try {
            this.showSection('analysis');
            this.updateProgress(0, 'Starting...');

            // Parse PDF
            const pdfData = await window.pdfParser.parsePDF(file, (progress, message) => {
                this.updateProgress(progress, message);
            });

            this.updateProgress(85, 'Extracting template...');

            // Extract template
            this.currentTemplate = window.templateExtractor.extractTemplate(pdfData);

            this.updateProgress(90, 'Detecting menu structure...');

            // Detect menu structure
            this.currentMenuStructure = window.menuDetector.detectMenuStructure(this.currentTemplate);

            this.updateProgress(95, 'Saving template...');

            // Save template
            const templateId = window.templateStorage.save({
                name: file.name,
                template: this.currentTemplate,
                menuStructure: this.currentMenuStructure
            });

            this.updateProgress(100, 'Complete!');

            // Wait a moment then show editor
            setTimeout(() => {
                this.showEditor();
            }, 500);

        } catch (error) {
            console.error('Error processing PDF:', error);
            this.showError(error.message);
            this.showSection('upload');
        }
    }

    /**
     * Show editor with current template
     */
    showEditor() {
        window.contentEditor.initialize(this.currentTemplate, this.currentMenuStructure);
        this.refreshPreview();
        this.showSection('editor');
    }

    /**
     * Refresh preview canvas
     */
    async refreshPreview() {
        try {
            const canvas = document.getElementById('preview-canvas');
            const editedContent = window.contentEditor.getEditedContent();

            await window.pdfGenerator.previewOnCanvas(
                this.currentTemplate,
                editedContent,
                canvas
            );
        } catch (error) {
            console.error('Error refreshing preview:', error);
        }
    }

    /**
     * Generate PDF
     */
    async generatePDF() {
        try {
            this.showSection('generation');
            this.updateGenerationStatus('Generating PDF...', 'info');

            const editedContent = window.contentEditor.getEditedContent();

            await window.pdfGenerator.generatePDF(
                this.currentTemplate,
                editedContent
            );

            this.updateGenerationStatus('PDF generated successfully!', 'success');

            const downloadBtn = document.getElementById('download-pdf-btn');
            downloadBtn.disabled = false;

        } catch (error) {
            console.error('Error generating PDF:', error);
            this.updateGenerationStatus(`Error: ${error.message}`, 'error');
        }
    }

    /**
     * Download generated PDF
     */
    downloadPDF() {
        try {
            const filename = this.currentTemplate.fileName.replace('.pdf', '_edited.pdf');
            window.pdfGenerator.downloadPDF(filename);
        } catch (error) {
            console.error('Error downloading PDF:', error);
            this.showError(error.message);
        }
    }

    /**
     * Start over
     */
    startOver() {
        if (confirm('Start over? Any unsaved changes will be lost.')) {
            this.currentTemplate = null;
            this.currentMenuStructure = null;
            window.pdfParser.destroy();

            const fileInput = document.getElementById('file-input');
            fileInput.value = '';

            const downloadBtn = document.getElementById('download-pdf-btn');
            downloadBtn.disabled = true;

            this.loadSavedTemplates();
            this.showSection('upload');
        }
    }

    /**
     * Load and display saved templates
     */
    loadSavedTemplates() {
        const templates = window.templateStorage.list();

        if (templates.length === 0) {
            const templateList = document.getElementById('template-list');
            templateList.style.display = 'none';
            return;
        }

        const templateList = document.getElementById('template-list');
        const container = document.getElementById('templates-container');

        container.innerHTML = '';

        templates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'template-item';
            item.innerHTML = `
                <h4>${this.escapeHtml(template.name)}</h4>
                <p>${new Date(template.timestamp).toLocaleDateString()}</p>
                <p>${template.sections} sections, ${template.pageCount} page(s)</p>
            `;

            item.addEventListener('click', () => {
                this.loadTemplate(template.id);
            });

            container.appendChild(item);
        });

        templateList.style.display = 'block';
    }

    /**
     * Load a saved template
     * @param {string} templateId - Template ID
     */
    loadTemplate(templateId) {
        try {
            const templateData = window.templateStorage.load(templateId);

            if (!templateData) {
                throw new Error('Template not found');
            }

            this.currentTemplate = templateData.template;
            this.currentMenuStructure = templateData.menuStructure;

            this.showEditor();

        } catch (error) {
            console.error('Error loading template:', error);
            this.showError(error.message);
        }
    }

    /**
     * Show a specific section
     * @param {string} sectionName - Section name (upload, analysis, editor, generation)
     */
    showSection(sectionName) {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentStep = sectionName;
    }

    /**
     * Update progress bar
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Status message
     */
    updateProgress(progress, message) {
        const progressFill = document.getElementById('progress-fill');
        const statusText = document.getElementById('analysis-status');

        progressFill.style.width = `${progress}%`;
        statusText.textContent = message;
    }

    /**
     * Update generation status
     * @param {string} message - Status message
     * @param {string} type - Message type (info, success, error)
     */
    updateGenerationStatus(message, type) {
        const statusElement = document.getElementById('generation-status');
        statusElement.textContent = message;
        statusElement.className = `status-message show ${type}`;
    }

    /**
     * Show error modal
     * @param {string} message - Error message
     */
    showError(message) {
        const errorModal = document.getElementById('error-modal');
        const errorMessage = document.getElementById('error-message');

        errorMessage.textContent = message;
        errorModal.classList.add('show');
    }

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.menuChefApp = new MenuChefApp();
    });
} else {
    window.menuChefApp = new MenuChefApp();
}
