import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import './ChatInterface.css';

const ChatInterface = forwardRef(({ onSendMessage, disabled }, ref) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    addMessage: (message) => {
      setMessages(prev => [...prev, message]);
    },
    notifyAgentSpawned: (agentInfo) => {
      setMessages(prev => [...prev, {
        role: 'system',
        content: `🤖 New specialist agent spawned: ${agentInfo.type}`,
        subtext: `Context: ${agentInfo.context}`,
        timestamp: new Date(),
      }]);
    },
  }));

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || disabled) return;

    const userMessage = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    onSendMessage(inputValue);
    setInputValue('');
  };

  const getRoleDisplay = (message) => {
    if (message.role === 'chef') return '👨‍🍳 Chef Agent';
    if (message.role === 'specialist') return `🔧 ${message.agentType || 'Specialist'}`;
    if (message.role === 'user') return '💬 You';
    if (message.role === 'system') return '⚙️ System';
    return message.role;
  };

  const getRoleClass = (role) => {
    if (role === 'chef') return 'message-chef';
    if (role === 'specialist') return 'message-specialist';
    if (role === 'user') return 'message-user';
    if (role === 'system') return 'message-system';
    return 'message-default';
  };

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>Conversation</h2>
        {disabled && <span className="chat-status">Stopped</span>}
      </div>

      <div className="messages-container" ref={messagesContainerRef}>
        {messages.length === 0 ? (
          <div className="messages-placeholder">
            <p>Conversation will appear here...</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className={`message ${getRoleClass(message.role)}`}>
              <div className="message-header">
                <span className="message-role">{getRoleDisplay(message)}</span>
                <span className="message-time">
                  {message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : ''}
                </span>
              </div>
              <div className="message-content">
                {message.content}
                {message.subtext && (
                  <div className="message-subtext">{message.subtext}</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={disabled ? 'Conversation stopped' : 'Type your message...'}
          disabled={disabled}
          className="chat-input"
        />
        <button type="submit" disabled={disabled || !inputValue.trim()} className="chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
});

ChatInterface.displayName = 'ChatInterface';

export default ChatInterface;
