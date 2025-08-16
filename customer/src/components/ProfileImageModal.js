import React from 'react';
import { Upload } from 'react-feather';

import '../styles/ProfileImageModal.css';

export default function ProfilePictureModal({
  show,
  onClose,
  profileImageUrl,
  getInitials,
  fileInputRef,
  handleFileSelect,
  selectedFile,
  previewUrl,
  resetFileSelection,
  handleUploadProfilePicture,
  handleDeleteProfilePicture,
  isUploading
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-picture-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h5>Profile Picture</h5>
        </div>
        
        <div className="modal-body">
          {/* Current Profile Picture */}
          <div className="current-picture-section">
            <h6>Current Picture</h6>
            <div 
              className="current-profile-picture"
              style={{
                backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!profileImageUrl && (
                <span className="initials">{getInitials()}</span>
              )}
            </div>
          </div>

          {/* Upload New Picture */}
          <div className="upload-section">
            <h6>Upload New Picture</h6>
            <div className="upload-area">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="file-input"
                style={{ display: 'none' }}
              />
              
              {!selectedFile ? (
                <div 
                  className="upload-placeholder"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={32} />
                  <p>Click to select an image</p>
                  <small>Supports: JPG, JPEG and PNG (Max: 5MB)</small>
                </div>
              ) : (
                <div className="preview-section">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  <button 
                    className="btn btn-outline-secondary btn-sm mt-2"
                    onClick={resetFileSelection}
                  >
                    Choose Different Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <div className="d-flex gap-2 w-100">
            {selectedFile && (
              <button 
                className="btn btn-primary"
                onClick={handleUploadProfilePicture}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Picture'}
              </button>
            )}
            
            <div className="btn-container">
              {profileImageUrl && (
                <button 
                  className="btn btn-outline-danger"
                  onClick={handleDeleteProfilePicture}
                >
                  Delete Current Picture
                </button>
              )}
              
              <button 
                className="btn btn-outline-secondary ms-auto cancel-btn"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
