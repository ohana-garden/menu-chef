# Menu Chef - AI-Powered Menu Builder with Agent Zero

Restaurant menu builder using Agent Zero framework for dynamic, context-aware AI agent generation following the Shoghi architecture.

## Overview

Menu Chef is a web application that uses Agent Zero's multi-agent framework to analyze and improve restaurant menus. The system features a Chef Agent that dynamically generates context-specific specialist agents based on the menu's unique characteristics.

## Key Features

- **Dynamic Agent Generation (Shoghi Architecture)**: Chef Agent spawns context-specific specialists on demand
- **Agent Zero Integration**: Runs in Docker containers with full system capabilities
- **Real-time Visual Regeneration**: See menu changes applied instantly
- **Interactive Conversation**: Interrupt and redirect AI agents at any time
- **Print-ready Export**: Generate PDFs suitable for commercial printing
- **Browser-based Parsing**: PDF and image support with OCR (Tesseract.js)

## Architecture

### Shoghi Principle

- **NO predetermined agent templates** - Each specialist is generated with full context
- **Context-specific agents** - e.g., "Design agent for upscale Italian restaurant with cluttered layout"
- **Full context passing** - Every agent receives menu state, conversation history, user goals
- **Adaptive coordination** - Agents negotiate and adapt based on conversation

### Agent Zero Framework

- **Docker-based execution**: Isolated environment for AI agents
- **Prompt-guided**: All agent behavior defined in `prompts/` folder
- **Hierarchical agents**: Chef spawns specialists, specialists report back
- **Dynamic tool creation**: Agents write their own code as needed

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Anthropic API key

### Setup

1. Clone and setup:
```bash
git clone <repository-url>
cd menu-chef
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

2. Start with Docker Compose:
```bash
docker-compose up --build
```

3. Access:
- Frontend: http://localhost:3000
- Agent Zero: http://localhost:50001

### Local Development (without Docker)

1. Install dependencies:
```bash
npm install
```

2. Start Agent Zero:
```bash
docker run -p 50001:80 -e ANTHROPIC_API_KEY=your_key agent0ai/agent-zero
```

3. Start frontend:
```bash
npm run dev
```

## Usage

1. **Upload Menu**: Drag & drop PDF/image
2. **Watch Agent Zero**: Chef analyzes and spawns specialists
3. **Interact**: Type messages to redirect conversation
4. **See Updates**: Menu preview updates in real-time
5. **Export**: Download print-ready PDF

## Project Structure

```
menu-chef/
├── docker-compose.yml         # Docker orchestration
├── Dockerfile.frontend        # Frontend container
├── nginx.conf                 # Nginx config
├── prompts/
│   ├── chef.system.md         # Chef Agent prompt
│   └── specialist.template.md # Specialist template
├── src/
│   ├── components/            # React components
│   ├── services/
│   │   ├── agentZeroClient.js # Agent Zero API
│   │   ├── menuParser.js      # Browser parsing
│   │   └── pdfExport.js       # PDF generation
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Technologies

- **Frontend**: React 18, Vite 5
- **AI Framework**: Agent Zero (Docker)
- **AI Model**: Anthropic Claude Sonnet 4
- **PDF Processing**: pdfjs-dist (browser)
- **OCR**: Tesseract.js (browser)
- **PDF Generation**: jsPDF
- **Container**: Docker, Docker Compose, Nginx

## Docker Commands

```bash
# Start
docker-compose up

# Build and start
docker-compose up --build

# Stop
docker-compose down

# Logs
docker-compose logs -f agent-zero

# Restart service
docker-compose restart agent-zero
```

## Troubleshooting

**Agent Zero not responding:**
- Check container: `docker ps`
- Check logs: `docker-compose logs agent-zero`
- Verify ANTHROPIC_API_KEY in .env

**Menu parsing fails:**
- Valid PDF or JPG/PNG only
- Max 10MB file size

## License

MIT
