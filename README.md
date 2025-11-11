# Menu Chef

AI-powered restaurant menu builder with dynamic agent generation.

## Overview

Menu Chef is a single-page React application that uses AI agents to analyze and improve restaurant menus. The system features a Chef Agent that dynamically generates context-specific specialist agents based on the menu's unique characteristics and needs.

## Key Features

- **Dynamic Agent Generation**: Chef Agent spawns context-specific specialists on demand, not predetermined templates
- **Real-time Visual Regeneration**: See menu changes applied instantly
- **Interactive Conversation**: Interrupt and redirect AI agents at any time
- **Print-ready Export**: Generate shareable PDFs suitable for commercial printing
- **Rich Context Analysis**: Deep understanding of cuisine type, pricing, target audience, and problems

## Architecture (Shoghi Principle)

The system follows the Shoghi architecture:

- **NO predetermined agent templates** - Each specialist is generated with full context for the specific task
- **Context-specific agents** - e.g., "Design agent for upscale Italian restaurant with cluttered layout" instead of generic "design agent"
- **Full context passing** - Every agent receives: current menu state, conversation history, user goals, identified problems
- **Adaptive coordination** - Agents negotiate and adapt based on conversation flow

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Anthropic API key:
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

3. Start the application:
```bash
npm run dev
```

This will start:
- Backend server on port 3001
- Frontend dev server on port 3000

## Usage

1. Upload a menu (PDF or image)
2. Watch as the Chef Agent analyzes your menu
3. Chef spawns specialist agents as needed based on identified issues
4. Interrupt the conversation anytime with your input
5. See visual updates after each agreed change
6. Export to print-ready PDF when satisfied

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Project Structure

```
menu-chef/
├── server/
│   ├── index.js              # Express server
│   ├── menuParser.js         # Menu parsing & context extraction
│   ├── pdfGenerator.js       # PDF export functionality
│   └── agents/
│       └── ChefAgent.js      # Dynamic agent generation
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx    # Menu upload component
│   │   ├── ChatInterface.jsx # Agent conversation UI
│   │   ├── MenuPreview.jsx   # Visual menu regeneration
│   │   └── Controls.jsx      # Stop/export controls
│   ├── test/                 # Test files
│   ├── App.jsx               # Main application
│   └── main.jsx              # Entry point
├── package.json
└── vite.config.js
```

## API Endpoints

- `POST /api/upload` - Upload menu file
- `POST /api/conversation/start` - Start AI conversation
- `POST /api/conversation/continue` - Continue conversation
- `POST /api/conversation/message` - Send user message
- `POST /api/export` - Export to PDF
- `GET /api/export/:exportId` - Download exported PDF

## Technologies

- **Frontend**: React, Vite
- **Backend**: Node.js, Express
- **AI**: Anthropic Claude Sonnet 4
- **PDF Processing**: pdf-parse, jsPDF
- **OCR**: Tesseract.js
- **Testing**: Vitest, Testing Library

## License

MIT
