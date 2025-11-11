import React from 'react';
import './Controls.css';

function Controls({ onStop, onExport, disabled, stopped }) {
  return (
    <div className="controls">
      <div className="controls-header">
        <h2>Controls</h2>
      </div>

      <div className="controls-body">
        <div className="control-section">
          <h3>Conversation</h3>
          <button
            className="control-button stop-button"
            onClick={onStop}
            disabled={disabled || stopped}
          >
            {stopped ? '⏸️ Stopped' : '⏸️ Stop Conversation'}
          </button>
          <p className="control-hint">
            {stopped
              ? 'Conversation has been stopped'
              : 'Pause the AI agent conversation'}
          </p>
        </div>

        <div className="control-section">
          <h3>Export</h3>
          <button
            className="control-button export-button"
            onClick={onExport}
            disabled={disabled}
          >
            📥 Export PDF
          </button>
          <p className="control-hint">
            Download print-ready PDF
          </p>
        </div>

        <div className="control-info">
          <h3>About</h3>
          <div className="info-content">
            <p>
              <strong>Menu Chef</strong> uses AI agents to analyze and improve your restaurant menu.
            </p>
            <p>
              The Chef Agent coordinates with dynamically generated specialists
              to provide context-specific recommendations.
            </p>
            <ul>
              <li>Real-time visual updates</li>
              <li>Interrupt anytime with your input</li>
              <li>Print-ready export</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Controls;
