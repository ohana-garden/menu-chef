import React, { useState, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import MenuPreview from './components/MenuPreview';
import Controls from './components/Controls';
import { parseMenuFile } from './services/menuParser';
import agentZeroClient from './services/agentZeroClient';
import { generateMenuPDF } from './services/pdfExport';
import './App.css';

function App() {
  const [menuData, setMenuData] = useState(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatRef = useRef(null);

  const handleFileSelected = async (file) => {
    try {
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: 'Parsing menu... Please wait.',
          timestamp: new Date(),
        });
      }

      // Parse menu in browser
      const parsedMenu = await parseMenuFile(file);
      setMenuData(parsedMenu);
      setConversationStarted(false);
      setStopRequested(false);

      // Auto-start conversation with Chef Agent
      setTimeout(() => {
        startChefAgent(parsedMenu);
      }, 500);
    } catch (error) {
      console.error('Menu parsing error:', error);
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: `Error parsing menu: ${error.message}`,
          timestamp: new Date(),
        });
      }
    }
  };

  const startChefAgent = async (parsedMenu) => {
    try {
      setIsProcessing(true);

      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: 'Initializing Chef Agent with Agent Zero...',
          timestamp: new Date(),
        });
      }

      const response = await agentZeroClient.startChefAgent(parsedMenu);
      const parsed = agentZeroClient.parseAgentResponse(response);

      if (chatRef.current && parsed.messages.length > 0) {
        parsed.messages.forEach(msg => chatRef.current.addMessage(msg));
      }

      if (parsed.agentSpawned && chatRef.current) {
        chatRef.current.notifyAgentSpawned(parsed.agentSpawned);
      }

      setConversationStarted(true);

      // Continue conversation automatically
      setTimeout(() => {
        if (!stopRequested) {
          continueConversation();
        }
      }, 3000);
    } catch (error) {
      console.error('Chef agent initialization error:', error);
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: `Error starting Chef Agent: ${error.message}. Make sure Agent Zero container is running (docker-compose up).`,
          timestamp: new Date(),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const continueConversation = async () => {
    if (stopRequested || isProcessing) return;

    try {
      setIsProcessing(true);

      const response = await agentZeroClient.continueConversation();
      const parsed = agentZeroClient.parseAgentResponse(response);

      if (chatRef.current && parsed.messages.length > 0) {
        parsed.messages.forEach(msg => chatRef.current.addMessage(msg));
      }

      if (parsed.agentSpawned && chatRef.current) {
        chatRef.current.notifyAgentSpawned(parsed.agentSpawned);
      }

      // Check if menu changes were proposed
      if (parsed.changeProposed && parsed.changes) {
        const updatedMenu = applyMenuChanges(menuData, parsed.changes);
        setMenuData(updatedMenu);

        if (chatRef.current) {
          chatRef.current.addMessage({
            role: 'system',
            content: '✅ Menu updated with agreed changes',
            timestamp: new Date(),
          });
        }
      }

      // Continue conversation if not stopped
      if (!stopRequested) {
        setTimeout(() => continueConversation(), 4000);
      }
    } catch (error) {
      console.error('Conversation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyMenuChanges = (currentMenu, changes) => {
    // Deep copy
    const updated = JSON.parse(JSON.stringify(currentMenu));

    // Apply changes from Agent Zero
    for (const change of changes) {
      try {
        if (change.type === 'modify' && change.target && change.newValue) {
          if (change.target.includes('item')) {
            const itemName = change.target.replace('item:', '').trim();
            const item = updated.structure.items.find(i =>
              i.name.toLowerCase().includes(itemName.toLowerCase())
            );
            if (item) {
              if (change.newValue.name) item.name = change.newValue.name;
              if (change.newValue.description) item.description = change.newValue.description;
              if (change.newValue.price) item.prices = [parseFloat(change.newValue.price)];
            }
          }
        }
      } catch (e) {
        console.error('Error applying change:', change, e);
      }
    }

    return updated;
  };

  const handleUserMessage = async (message) => {
    if (!menuData) return;

    try {
      setIsProcessing(true);

      const response = await agentZeroClient.handleUserInput(message, menuData);
      const parsed = agentZeroClient.parseAgentResponse(response);

      if (chatRef.current && parsed.messages.length > 0) {
        parsed.messages.forEach(msg => chatRef.current.addMessage(msg));
      }

      if (parsed.agentSpawned && chatRef.current) {
        chatRef.current.notifyAgentSpawned(parsed.agentSpawned);
      }

      if (parsed.changeProposed && parsed.changes) {
        const updatedMenu = applyMenuChanges(menuData, parsed.changes);
        setMenuData(updatedMenu);

        if (chatRef.current) {
          chatRef.current.addMessage({
            role: 'system',
            content: '✅ Menu updated based on your input',
            timestamp: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('User message error:', error);
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: `Error: ${error.message}`,
          timestamp: new Date(),
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStop = () => {
    setStopRequested(true);
    if (chatRef.current) {
      chatRef.current.addMessage({
        role: 'system',
        content: '⏸️ Conversation stopped by user',
        timestamp: new Date(),
      });
    }
  };

  const handleExport = async () => {
    if (!menuData) return;

    try {
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: 'Generating print-ready PDF...',
          timestamp: new Date(),
        });
      }

      const pdfBlob = await generateMenuPDF(menuData);
      const url = URL.createObjectURL(pdfBlob);

      // Download the PDF
      const link = document.createElement('a');
      link.href = url;
      link.download = `menu-${Date.now()}.pdf`;
      link.click();

      URL.revokeObjectURL(url);

      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: '✅ PDF exported successfully',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'system',
          content: `Export failed: ${error.message}`,
          timestamp: new Date(),
        });
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Menu Chef</h1>
        <p>AI-Powered Menu Builder with Agent Zero</p>
      </header>

      <div className="app-content">
        <div className="left-panel">
          {!menuData ? (
            <FileUpload onFileSelected={handleFileSelected} />
          ) : (
            <ChatInterface
              ref={chatRef}
              onSendMessage={handleUserMessage}
              disabled={stopRequested || isProcessing}
            />
          )}
        </div>

        <div className="center-panel">
          {menuData ? (
            <MenuPreview menuData={menuData} />
          ) : (
            <div className="preview-placeholder">
              <p>Upload a menu to get started</p>
            </div>
          )}
        </div>

        <div className="right-panel">
          <Controls
            onStop={handleStop}
            onExport={handleExport}
            disabled={!menuData}
            stopped={stopRequested}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
