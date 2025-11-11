import React, { useState, useRef } from 'react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import MenuPreview from './components/MenuPreview';
import Controls from './components/Controls';
import './App.css';

function App() {
  const [sessionId, setSessionId] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [conversationStarted, setConversationStarted] = useState(false);
  const [stopRequested, setStopRequested] = useState(false);
  const chatRef = useRef(null);

  const handleFileUploaded = async (uploadResponse) => {
    setSessionId(uploadResponse.sessionId);
    setMenuData(uploadResponse.menuData);
    setConversationStarted(false);
    setStopRequested(false);

    // Auto-start conversation
    setTimeout(async () => {
      await startConversation(uploadResponse.sessionId);
    }, 500);
  };

  const startConversation = async (sid) => {
    try {
      const response = await fetch('/api/conversation/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid || sessionId }),
      });

      const data = await response.json();

      if (chatRef.current) {
        chatRef.current.addMessage({
          role: 'chef',
          content: data.message,
          timestamp: new Date(),
        });
      }

      setConversationStarted(true);

      // Continue conversation automatically
      setTimeout(() => {
        continueConversation(sid || sessionId);
      }, 2000);
    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  };

  const continueConversation = async (sid) => {
    if (stopRequested) return;

    try {
      const response = await fetch('/api/conversation/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid || sessionId,
          stopRequested,
        }),
      });

      const data = await response.json();

      if (data.stopped) return;

      if (data.messages && chatRef.current) {
        data.messages.forEach(msg => {
          chatRef.current.addMessage(msg);
        });
      }

      if (data.menuUpdated && data.updatedMenu) {
        setMenuData(data.updatedMenu);
      }

      if (data.agentSpawned && chatRef.current) {
        chatRef.current.notifyAgentSpawned(data.agentSpawned);
      }

      // Continue conversation
      if (!stopRequested) {
        setTimeout(() => {
          continueConversation(sid || sessionId);
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to continue conversation:', error);
    }
  };

  const handleUserMessage = async (message) => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });

      const data = await response.json();

      if (data.messages && chatRef.current) {
        data.messages.forEach(msg => {
          chatRef.current.addMessage(msg);
        });
      }

      if (data.menuUpdated && data.updatedMenu) {
        setMenuData(data.updatedMenu);
      }

      if (data.agentSpawned && chatRef.current) {
        chatRef.current.notifyAgentSpawned(data.agentSpawned);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleStop = () => {
    setStopRequested(true);
  };

  const handleExport = async () => {
    if (!sessionId) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.shareableLink) {
        const fullUrl = `${window.location.origin}${data.shareableLink}`;
        window.open(fullUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Menu Chef</h1>
        <p>AI-Powered Restaurant Menu Builder</p>
      </header>

      <div className="app-content">
        <div className="left-panel">
          {!sessionId ? (
            <FileUpload onFileUploaded={handleFileUploaded} />
          ) : (
            <ChatInterface
              ref={chatRef}
              onSendMessage={handleUserMessage}
              disabled={stopRequested}
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
            disabled={!sessionId}
            stopped={stopRequested}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
