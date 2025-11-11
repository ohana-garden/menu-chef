import React, { useState } from 'react';
import './FileUpload.css';

function FileUpload({ onFileUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG)');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append('menu', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onFileUploaded(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="file-upload">
      <h2>Upload Menu</h2>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {uploading ? (
          <div className="upload-status">
            <div className="spinner"></div>
            <p>Uploading and analyzing menu...</p>
          </div>
        ) : (
          <>
            <div className="upload-icon">📄</div>
            <p className="upload-text">Drag & drop your menu here</p>
            <p className="upload-subtext">or</p>
            <label className="upload-button">
              Choose File
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/jpg"
                onChange={handleChange}
                disabled={uploading}
              />
            </label>
            <p className="upload-hint">PDF or Image (JPG, PNG) • Max 10MB</p>
          </>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="upload-info">
        <h3>How it works:</h3>
        <ol>
          <li>Upload your restaurant menu (PDF or image)</li>
          <li>AI agents analyze and discuss improvements</li>
          <li>Watch your menu transform in real-time</li>
          <li>Export to a print-ready PDF</li>
        </ol>
      </div>
    </div>
  );
}

export default FileUpload;
