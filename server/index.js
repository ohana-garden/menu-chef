import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { parseMenu } from './menuParser.js';
import { ChefAgent } from './agents/ChefAgent.js';
import { generatePDF } from './pdfGenerator.js';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create necessary directories
const uploadsDir = path.join(__dirname, '../uploads');
const exportsDir = path.join(__dirname, '../exports');

await fs.mkdir(uploadsDir, { recursive: true });
await fs.mkdir(exportsDir, { recursive: true });

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and images are allowed.'));
    }
  },
});

// Store active sessions in memory
const sessions = new Map();

// Upload endpoint
app.post('/api/upload', upload.single('menu'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileType = req.file.mimetype;

    // Parse the menu
    const menuData = await parseMenu(filePath, fileType);

    // Create session
    const sessionId = uuidv4();
    sessions.set(sessionId, {
      id: sessionId,
      menuData,
      originalFile: filePath,
      conversationHistory: [],
      createdAt: new Date(),
    });

    res.json({
      sessionId,
      menuData,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start conversation endpoint
app.post('/api/conversation/start', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const chef = new ChefAgent();
    const greeting = await chef.greet(session.menuData);

    session.conversationHistory.push({
      role: 'chef',
      content: greeting,
      timestamp: new Date(),
    });

    res.json({ message: greeting });
  } catch (error) {
    console.error('Conversation start error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Continue conversation endpoint
app.post('/api/conversation/continue', async (req, res) => {
  try {
    const { sessionId, stopRequested = false } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (stopRequested) {
      return res.json({ stopped: true });
    }

    const chef = new ChefAgent();
    const response = await chef.continueConversation(
      session.menuData,
      session.conversationHistory
    );

    session.conversationHistory.push(...response.messages);

    if (response.menuUpdated) {
      session.menuData = response.updatedMenu;
    }

    res.json({
      messages: response.messages,
      menuUpdated: response.menuUpdated,
      updatedMenu: response.updatedMenu,
      agentSpawned: response.agentSpawned,
    });
  } catch (error) {
    console.error('Conversation continue error:', error);
    res.status(500).json({ error: error.message });
  }
});

// User message endpoint
app.post('/api/conversation/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    const chef = new ChefAgent();
    const response = await chef.handleUserMessage(
      message,
      session.menuData,
      session.conversationHistory
    );

    session.conversationHistory.push(...response.messages);

    if (response.menuUpdated) {
      session.menuData = response.updatedMenu;
    }

    res.json({
      messages: response.messages,
      menuUpdated: response.menuUpdated,
      updatedMenu: response.updatedMenu,
      agentSpawned: response.agentSpawned,
    });
  } catch (error) {
    console.error('User message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export endpoint
app.post('/api/export', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const exportId = uuidv4();
    const pdfPath = path.join(exportsDir, `${exportId}.pdf`);

    await generatePDF(session.menuData, pdfPath);

    const shareableLink = `/api/export/${exportId}`;

    res.json({ shareableLink, exportId });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve exported PDF
app.get('/api/export/:exportId', async (req, res) => {
  try {
    const { exportId } = req.params;
    const pdfPath = path.join(exportsDir, `${exportId}.pdf`);

    const fileExists = await fs.access(pdfPath).then(() => true).catch(() => false);
    if (!fileExists) {
      return res.status(404).json({ error: 'Export not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="menu-${exportId}.pdf"`);

    const fileBuffer = await fs.readFile(pdfPath);
    res.send(fileBuffer);
  } catch (error) {
    console.error('Export download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
