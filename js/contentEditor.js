/**
 * Content Editor module
 * Handles the UI for editing menu content
 */

class ContentEditor {
    constructor() {
        this.template = null;
        this.menuStructure = null;
        this.editedContent = null;
        this.formContainer = null;
    }

    /**
     * Initialize editor with template and menu structure
     * @param {Object} template - Template object
     * @param {Object} menuStructure - Menu structure object
     */
    initialize(template, menuStructure) {
        console.log('ContentEditor.initialize called');
        console.log('Template:', template);
        console.log('Menu structure:', menuStructure);

        try {
            this.template = template;
            this.menuStructure = JSON.parse(JSON.stringify(menuStructure)); // Deep clone
            this.editedContent = this.menuStructure;
            this.formContainer = document.getElementById('editor-form');

            if (!this.formContainer) {
                throw new Error('editor-form element not found in DOM');
            }

            console.log('About to render editor form...');
            this.render();
            console.log('Editor form rendered successfully');
        } catch (error) {
            console.error('Error in ContentEditor.initialize:', error);
            throw error;
        }
    }

    /**
     * Render the editor form
     */
    render() {
        console.log('ContentEditor.render called');

        if (!this.formContainer) {
            console.error('formContainer is null, cannot render');
            return;
        }

        try {
            this.formContainer.innerHTML = '';

            // Render restaurant name if available
            if (this.menuStructure && this.menuStructure.metadata && this.menuStructure.metadata.restaurantName) {
                console.log('Rendering restaurant name');
                this.renderRestaurantName();
            }

            // Render each section
            if (this.editedContent && this.editedContent.sections) {
                console.log('Rendering sections:', this.editedContent.sections.length);
                this.editedContent.sections.forEach((section, sectionIndex) => {
                    this.renderSection(section, sectionIndex);
                });
            } else {
                console.error('No sections to render');
            }

            // Add new section button
            console.log('Adding new section button');
            this.renderAddSectionButton();

            console.log('Render complete');
        } catch (error) {
            console.error('Error in render:', error);
            throw error;
        }
    }

    /**
     * Render restaurant name editor
     */
    renderRestaurantName() {
        const nameGroup = document.createElement('div');
        nameGroup.className = 'section-group';
        nameGroup.innerHTML = `
            <h3>Restaurant Name</h3>
            <div class="form-group">
                <input
                    type="text"
                    id="restaurant-name"
                    value="${this.escapeHtml(this.menuStructure.metadata.restaurantName)}"
                    placeholder="Restaurant Name"
                />
            </div>
        `;

        this.formContainer.appendChild(nameGroup);

        // Add event listener
        const input = nameGroup.querySelector('#restaurant-name');
        input.addEventListener('input', (e) => {
            this.editedContent.metadata.restaurantName = e.target.value;
        });
    }

    /**
     * Render a section
     * @param {Object} section - Section object
     * @param {number} sectionIndex - Section index
     */
    renderSection(section, sectionIndex) {
        const sectionGroup = document.createElement('div');
        sectionGroup.className = 'section-group';
        sectionGroup.dataset.sectionIndex = sectionIndex;

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'menu-item-header';
        sectionHeader.innerHTML = `
            <h3 contenteditable="true" class="section-name-editable">${this.escapeHtml(section.name)}</h3>
            <div class="item-actions">
                <button class="btn btn-small btn-secondary move-section-up" ${sectionIndex === 0 ? 'disabled' : ''}>↑</button>
                <button class="btn btn-small btn-secondary move-section-down" ${sectionIndex === this.editedContent.sections.length - 1 ? 'disabled' : ''}>↓</button>
                <button class="btn btn-small delete-section" style="background: #e74c3c; color: white;">Delete Section</button>
            </div>
        `;

        sectionGroup.appendChild(sectionHeader);

        // Add event listeners for section header
        const nameElement = sectionHeader.querySelector('.section-name-editable');
        nameElement.addEventListener('blur', (e) => {
            this.editedContent.sections[sectionIndex].name = e.target.textContent.trim();
        });

        const moveUpBtn = sectionHeader.querySelector('.move-section-up');
        moveUpBtn?.addEventListener('click', () => this.moveSection(sectionIndex, -1));

        const moveDownBtn = sectionHeader.querySelector('.move-section-down');
        moveDownBtn?.addEventListener('click', () => this.moveSection(sectionIndex, 1));

        const deleteBtn = sectionHeader.querySelector('.delete-section');
        deleteBtn.addEventListener('click', () => this.deleteSection(sectionIndex));

        // Render items in section
        section.items.forEach((item, itemIndex) => {
            const itemElement = this.renderMenuItem(item, sectionIndex, itemIndex);
            sectionGroup.appendChild(itemElement);
        });

        // Add item button
        const addItemBtn = document.createElement('button');
        addItemBtn.className = 'btn btn-secondary add-item-btn';
        addItemBtn.textContent = '+ Add Item';
        addItemBtn.addEventListener('click', () => this.addItem(sectionIndex));
        sectionGroup.appendChild(addItemBtn);

        this.formContainer.appendChild(sectionGroup);
    }

    /**
     * Render a menu item
     * @param {Object} item - Menu item object
     * @param {number} sectionIndex - Section index
     * @param {number} itemIndex - Item index
     * @returns {HTMLElement} Item element
     */
    renderMenuItem(item, sectionIndex, itemIndex) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'menu-item';
        itemDiv.dataset.sectionIndex = sectionIndex;
        itemDiv.dataset.itemIndex = itemIndex;

        itemDiv.innerHTML = `
            <div class="menu-item-header">
                <h4>Item ${itemIndex + 1}</h4>
                <div class="item-actions">
                    <button class="btn btn-small btn-secondary move-item-up" ${itemIndex === 0 ? 'disabled' : ''}>↑</button>
                    <button class="btn btn-small btn-secondary move-item-down" ${itemIndex === this.editedContent.sections[sectionIndex].items.length - 1 ? 'disabled' : ''}>↓</button>
                    <button class="btn btn-small delete-item" style="background: #e74c3c; color: white;">×</button>
                </div>
            </div>
            <div class="form-group">
                <label>Name</label>
                <input
                    type="text"
                    class="item-name"
                    value="${this.escapeHtml(item.name)}"
                    placeholder="Item name"
                    data-original-length="${item.name.length}"
                />
                <div class="char-counter">
                    <span class="current-count">${item.name.length}</span> /
                    <span class="recommended-count">${item.name.length}</span> characters
                </div>
            </div>
            <div class="form-group">
                <label>Description</label>
                <textarea
                    class="item-description"
                    placeholder="Item description"
                    data-original-length="${item.description.length}"
                >${this.escapeHtml(item.description)}</textarea>
                <div class="char-counter">
                    <span class="current-count">${item.description.length}</span> /
                    <span class="recommended-count">${item.description.length || 100}</span> characters
                </div>
            </div>
            <div class="form-group">
                <label>Price</label>
                <input
                    type="text"
                    class="item-price"
                    value="${this.escapeHtml(item.price || '')}"
                    placeholder="$0.00"
                />
            </div>
        `;

        // Add event listeners
        const nameInput = itemDiv.querySelector('.item-name');
        const descInput = itemDiv.querySelector('.item-description');
        const priceInput = itemDiv.querySelector('.item-price');

        nameInput.addEventListener('input', (e) => {
            this.updateItem(sectionIndex, itemIndex, 'name', e.target.value);
            this.updateCharCounter(e.target);
        });

        descInput.addEventListener('input', (e) => {
            this.updateItem(sectionIndex, itemIndex, 'description', e.target.value);
            this.updateCharCounter(e.target);
        });

        priceInput.addEventListener('input', (e) => {
            this.updateItem(sectionIndex, itemIndex, 'price', e.target.value);
        });

        // Move and delete buttons
        const moveUpBtn = itemDiv.querySelector('.move-item-up');
        moveUpBtn?.addEventListener('click', () => this.moveItem(sectionIndex, itemIndex, -1));

        const moveDownBtn = itemDiv.querySelector('.move-item-down');
        moveDownBtn?.addEventListener('click', () => this.moveItem(sectionIndex, itemIndex, 1));

        const deleteBtn = itemDiv.querySelector('.delete-item');
        deleteBtn.addEventListener('click', () => this.deleteItem(sectionIndex, itemIndex));

        return itemDiv;
    }

    /**
     * Update character counter
     * @param {HTMLInputElement} input - Input element
     */
    updateCharCounter(input) {
        const counter = input.parentElement.querySelector('.char-counter');
        if (!counter) return;

        const currentCount = counter.querySelector('.current-count');
        const recommendedCount = counter.querySelector('.recommended-count');

        const current = input.value.length;
        const recommended = parseInt(input.dataset.originalLength) || 100;

        currentCount.textContent = current;

        // Color code based on overflow
        if (current > recommended * 1.5) {
            counter.className = 'char-counter error';
        } else if (current > recommended * 1.2) {
            counter.className = 'char-counter warning';
        } else {
            counter.className = 'char-counter';
        }
    }

    /**
     * Render add section button
     */
    renderAddSectionButton() {
        const addSectionBtn = document.createElement('button');
        addSectionBtn.className = 'btn btn-primary add-item-btn';
        addSectionBtn.textContent = '+ Add Section';
        addSectionBtn.style.marginTop = '20px';
        addSectionBtn.addEventListener('click', () => this.addSection());
        this.formContainer.appendChild(addSectionBtn);
    }

    /**
     * Update an item field
     * @param {number} sectionIndex - Section index
     * @param {number} itemIndex - Item index
     * @param {string} field - Field name
     * @param {any} value - New value
     */
    updateItem(sectionIndex, itemIndex, field, value) {
        this.editedContent.sections[sectionIndex].items[itemIndex][field] = value;
    }

    /**
     * Add a new item to a section
     * @param {number} sectionIndex - Section index
     */
    addItem(sectionIndex) {
        const section = this.editedContent.sections[sectionIndex];
        const newItem = {
            name: 'New Item',
            description: '',
            price: '$0.00',
            position: { y: 0, x: 0 },
            pricePosition: { y: 0, x: 0 },
            styling: section.items[0]?.styling || {
                fontSize: 12,
                fontName: 'unknown',
                alignment: 'left'
            }
        };

        section.items.push(newItem);
        this.render();
    }

    /**
     * Delete an item
     * @param {number} sectionIndex - Section index
     * @param {number} itemIndex - Item index
     */
    deleteItem(sectionIndex, itemIndex) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.editedContent.sections[sectionIndex].items.splice(itemIndex, 1);
            this.render();
        }
    }

    /**
     * Move an item up or down
     * @param {number} sectionIndex - Section index
     * @param {number} itemIndex - Item index
     * @param {number} direction - Direction (-1 for up, 1 for down)
     */
    moveItem(sectionIndex, itemIndex, direction) {
        const items = this.editedContent.sections[sectionIndex].items;
        const newIndex = itemIndex + direction;

        if (newIndex >= 0 && newIndex < items.length) {
            [items[itemIndex], items[newIndex]] = [items[newIndex], items[itemIndex]];
            this.render();
        }
    }

    /**
     * Add a new section
     */
    addSection() {
        const newSection = {
            name: 'New Section',
            items: [],
            position: { y: 0 },
            styling: {
                fontSize: 14,
                fontName: 'unknown',
                alignment: 'left'
            }
        };

        this.editedContent.sections.push(newSection);
        this.render();
    }

    /**
     * Delete a section
     * @param {number} sectionIndex - Section index
     */
    deleteSection(sectionIndex) {
        if (confirm('Are you sure you want to delete this entire section?')) {
            this.editedContent.sections.splice(sectionIndex, 1);
            this.render();
        }
    }

    /**
     * Move a section up or down
     * @param {number} sectionIndex - Section index
     * @param {number} direction - Direction (-1 for up, 1 for down)
     */
    moveSection(sectionIndex, direction) {
        const sections = this.editedContent.sections;
        const newIndex = sectionIndex + direction;

        if (newIndex >= 0 && newIndex < sections.length) {
            [sections[sectionIndex], sections[newIndex]] = [sections[newIndex], sections[sectionIndex]];
            this.render();
        }
    }

    /**
     * Get edited content
     * @returns {Object} Edited menu structure
     */
    getEditedContent() {
        return this.editedContent;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create global instance
window.contentEditor = new ContentEditor();
