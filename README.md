# 🍽️ Menu Chef - Restaurant Menu PDF Template Generator

A powerful web application that extracts design templates from restaurant menu PDFs and regenerates new menus with updated content while preserving the original design.

## ✨ Features

### 1. PDF Upload & Analysis
- Drag-and-drop or file picker upload
- Extracts all text with positions, fonts, sizes, and styling information
- Identifies and extracts background images, logos, and decorative elements
- Detects menu structure: headers, sections, item names, descriptions, and prices
- Uses spatial clustering to identify sections and relationships

### 2. Template Storage
- Saves extracted templates to browser localStorage
- Includes position maps, font specifications, color schemes, and layout rules
- View and manage saved templates
- Quick reload of previously processed menus

### 3. Content Editor Interface
- Organized form display by detected sections (appetizers, mains, desserts, etc.)
- Edit menu items: name, description, and price
- Add/remove items within sections
- Character count indicators based on original spacing
- Real-time preview of changes
- Reorder sections and items

### 4. PDF Generation
- Maps edited content back to template positions
- Preserves all fonts, colors, and sizes from original
- Handles overflow with smart font scaling
- Maintains background elements and decorative assets
- Exports as print-optimized PDF
- One-click download

## 🚀 Getting Started

### Installation

No installation required! This is a fully client-side application.

Simply open `index.html` in a modern web browser:

```bash
# Using Python's built-in server
python -m http.server 8000

# Or using Node.js http-server
npx http-server

# Then open http://localhost:8000 in your browser
```

### Usage

1. **Upload a Menu PDF**
   - Click "Select File" or drag and drop a restaurant menu PDF
   - The app will automatically parse and analyze the PDF

2. **Wait for Analysis**
   - The app extracts text, fonts, colors, and layout information
   - Menu structure is detected (sections, items, prices)
   - Template is saved automatically

3. **Edit Content**
   - Use the form interface to edit menu items
   - Add or remove items and sections
   - Reorder content as needed
   - Click "Refresh Preview" to see changes

4. **Generate New PDF**
   - Click "Generate PDF" when ready
   - Wait for processing
   - Download your newly generated menu

5. **Reuse Templates**
   - Previously uploaded templates appear on the home screen
   - Click any saved template to edit it again

## 🏗️ Technical Architecture

### Core Technologies
- **PDF.js** - PDF parsing and text extraction
- **jsPDF** - PDF generation
- **HTML5 Canvas** - Preview rendering
- **localStorage** - Template storage
- **Vanilla JavaScript** - No framework dependencies

### Module Structure

```
js/
├── app.js              # Main application controller
├── pdfParser.js        # PDF parsing using PDF.js
├── templateExtractor.js # Template extraction logic
├── menuDetector.js     # Menu structure detection
├── contentEditor.js    # Content editing interface
├── pdfGenerator.js     # PDF generation
└── storage.js          # localStorage management
```

### Key Algorithms

#### Menu Detection
The menu detection algorithm identifies:
- **Price patterns**: Right-aligned numbers with currency symbols ($, €, £, ¥)
- **Section headers**: Larger text without prices (Appetizers, Mains, etc.)
- **Menu items**: Text with associated prices
- **Descriptions**: Smaller text below item names
- **Spatial relationships**: Using Y-coordinates to group related elements

#### Template Extraction
- Groups text items into lines based on vertical position
- Analyzes font usage and styling patterns
- Detects alignment patterns (left, center, right)
- Calculates margins and spacing rules
- Maps layout constraints

#### PDF Generation
- Preserves original font sizes and styles
- Maintains spatial relationships
- Handles text overflow with smart scaling
- Respects original margins and spacing
- Generates print-ready output (300dpi)

## 🎯 Project Structure

```
menu-chef/
├── index.html           # Main HTML file
├── css/
│   └── styles.css       # Application styles
├── js/
│   ├── app.js           # Main application controller
│   ├── pdfParser.js     # PDF parsing
│   ├── templateExtractor.js  # Template extraction
│   ├── menuDetector.js  # Menu detection
│   ├── contentEditor.js # Content editor
│   ├── pdfGenerator.js  # PDF generation
│   └── storage.js       # Storage management
├── test-assets/         # Sample PDFs for testing
└── README.md            # This file
```

## 🔧 Development

### Testing
Place test PDF files in the `test-assets/` directory and upload them through the interface.

### Browser Compatibility
- Chrome/Edge (recommended)
- Firefox
- Safari
- Requires ES6+ support

### Known Limitations
- Complex multi-column layouts may not be perfectly preserved
- Image extraction is basic (placeholder for images)
- Font matching uses system fonts (exact fonts may not be available)
- Maximum PDF size depends on browser memory limits
- localStorage has size limitations (~5-10MB)

## 🛠️ Error Handling

The application includes comprehensive error handling:
- PDF validation on upload
- Graceful handling of malformed PDFs
- Content overflow warnings
- Storage quota exceeded detection
- Clear error messages throughout

## 📝 Future Enhancements

- [ ] Add support for more complex layouts
- [ ] Improve image extraction and embedding
- [ ] Add font customization options
- [ ] Support for multi-page menus
- [ ] Export to other formats (PNG, JPG)
- [ ] Cloud storage integration
- [ ] Template marketplace
- [ ] Advanced styling options

## 🤝 Contributing

This is a demonstration project. Feel free to fork and enhance!

## 📄 License

MIT License - Feel free to use and modify as needed.

## 🎓 Learning Resources

This project demonstrates:
- PDF manipulation in the browser
- Canvas API usage
- Client-side data processing
- Spatial analysis algorithms
- Pattern recognition
- Modern web development practices

---

Built with ❤️ for restaurant owners and menu designers
