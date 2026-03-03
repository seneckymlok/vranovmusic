import React, { useState } from 'react';
import { useArchive } from '../../context/ArchiveContext';
import type { ArchiveFolder } from '../../types';
import './ArchiveManager.css';

type ArchiveCategory = 'photos' | 'videos' | 'flyers';

interface FolderFormData {
    name: string;
    description: string;
    category: ArchiveCategory;
    eventDate: string;
}

const emptyFolderForm: FolderFormData = {
    name: '',
    description: '',
    category: 'photos',
    eventDate: '',
};

export const ArchiveManager: React.FC = () => {
    const {
        folders,
        loading,
        error,
        addFolder,
        updateFolder,
        deleteFolder,
        uploadPhoto,
        deletePhoto,
        getPhotosByFolder,
        refreshArchive,
    } = useArchive();

    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [showFolderForm, setShowFolderForm] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [folderFormData, setFolderFormData] = useState<FolderFormData>(emptyFolderForm);
    const [folderFormError, setFolderFormError] = useState('');
    const [isSubmittingFolder, setIsSubmittingFolder] = useState(false);

    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [dragOver, setDragOver] = useState(false);

    // Folder form handlers
    const handleFolderFormChange = (field: keyof FolderFormData, value: string) => {
        setFolderFormData(prev => ({ ...prev, [field]: value }));
        setFolderFormError('');
    };

    const validateFolderForm = (): boolean => {
        if (!folderFormData.name.trim()) {
            setFolderFormError('Folder name is required');
            return false;
        }
        return true;
    };

    const handleFolderSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateFolderForm()) return;

        setIsSubmittingFolder(true);
        try {
            if (editingFolderId) {
                await updateFolder(editingFolderId, {
                    name: folderFormData.name.trim(),
                    description: folderFormData.description.trim() || undefined,
                    category: folderFormData.category,
                    eventDate: folderFormData.eventDate || undefined,
                });
            } else {
                const newFolder = await addFolder({
                    name: folderFormData.name.trim(),
                    description: folderFormData.description.trim() || undefined,
                    category: folderFormData.category,
                    eventDate: folderFormData.eventDate || undefined,
                });
                setSelectedFolder(newFolder.id);
            }

            setFolderFormData(emptyFolderForm);
            setEditingFolderId(null);
            setShowFolderForm(false);
        } catch (err) {
            setFolderFormError(err instanceof Error ? err.message : 'Failed to save folder');
        } finally {
            setIsSubmittingFolder(false);
        }
    };

    const handleEditFolder = (folder: ArchiveFolder) => {
        setEditingFolderId(folder.id);
        setFolderFormData({
            name: folder.name,
            description: folder.description || '',
            category: folder.category,
            eventDate: folder.eventDate || '',
        });
        setShowFolderForm(true);
    };

    const handleDeleteFolder = async (id: string) => {
        const folder = folders.find(f => f.id === id);
        const photoCount = getPhotosByFolder(id).length;

        const confirmMsg = photoCount > 0
            ? `Delete "${folder?.name}"? This will also delete ${photoCount} photo(s).`
            : `Delete "${folder?.name}"?`;

        if (window.confirm(confirmMsg)) {
            try {
                await deleteFolder(id);
                if (selectedFolder === id) {
                    setSelectedFolder(null);
                }
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete folder');
            }
        }
    };

    const handleCancelFolderForm = () => {
        setFolderFormData(emptyFolderForm);
        setEditingFolderId(null);
        setShowFolderForm(false);
        setFolderFormError('');
    };

    // Photo upload handlers
    const handleFileSelect = async (files: FileList | null) => {
        if (!files || !selectedFolder) return;

        setUploadingPhotos(true);
        const fileArray = Array.from(files);

        try {
            for (let i = 0; i < fileArray.length; i++) {
                const file = fileArray[i];
                const fileName = file.name;

                setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));

                const photoData = {
                    title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
                    description: undefined,
                    photoDate: undefined,
                    displayOrder: getPhotosByFolder(selectedFolder).length + i,
                };

                await uploadPhoto(selectedFolder, file, photoData);

                setUploadProgress(prev => ({ ...prev, [fileName]: 100 }));
            }

            // Clear progress after a delay
            setTimeout(() => {
                setUploadProgress({});
            }, 2000);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to upload photo');
        } finally {
            setUploadingPhotos(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    // Photo management
    const handleDeletePhoto = async (photoId: string) => {
        if (window.confirm('Delete this photo?')) {
            try {
                await deletePhoto(photoId);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete photo');
            }
        }
    };

    const selectedFolderData = folders.find(f => f.id === selectedFolder);
    const folderPhotos = selectedFolder ? getPhotosByFolder(selectedFolder) : [];

    return (
        <div className="archive-manager">
            {/* Header */}
            <div className="archive-manager-header">
                <h3 className="pixel-text">📁 ARCHIVE MANAGER</h3>
                <div className="archive-header-actions">
                    <button
                        className="btn-98 btn-98-primary"
                        onClick={() => setShowFolderForm(!showFolderForm)}
                        disabled={loading}
                    >
                        ➕ New Folder
                    </button>
                    <button className="btn-98" onClick={refreshArchive} disabled={loading}>
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    ⚠️ {error}
                </div>
            )}

            {/* Folder Form */}
            {showFolderForm && (
                <div className="folder-form-container">
                    <h4 className="pixel-text">{editingFolderId ? '✏️ EDIT FOLDER' : '➕ CREATE FOLDER'}</h4>
                    <form onSubmit={handleFolderSubmit} className="admin-form">
                        <div className="admin-form-row">
                            <div className="admin-form-group">
                                <label>Folder Name *</label>
                                <input
                                    type="text"
                                    value={folderFormData.name}
                                    onChange={(e) => handleFolderFormChange('name', e.target.value)}
                                    placeholder="e.g., Summer Tour 2025"
                                    className="admin-input"
                                    autoFocus
                                />
                            </div>
                            <div className="admin-form-group">
                                <label>Category *</label>
                                <select
                                    value={folderFormData.category}
                                    onChange={(e) => handleFolderFormChange('category', e.target.value as ArchiveCategory)}
                                    className="admin-input"
                                >
                                    <option value="photos">📷 Photos</option>
                                    <option value="videos">🎬 Videos</option>
                                    <option value="flyers">🎨 Flyers</option>
                                </select>
                            </div>
                            <div className="admin-form-group">
                                <label>Event Date</label>
                                <input
                                    type="date"
                                    value={folderFormData.eventDate}
                                    onChange={(e) => handleFolderFormChange('eventDate', e.target.value)}
                                    className="admin-input"
                                />
                            </div>
                        </div>
                        <div className="admin-form-row">
                            <div className="admin-form-group admin-form-group-full">
                                <label>Description</label>
                                <textarea
                                    value={folderFormData.description}
                                    onChange={(e) => handleFolderFormChange('description', e.target.value)}
                                    placeholder="Optional description..."
                                    className="admin-input admin-textarea"
                                    rows={2}
                                />
                            </div>
                        </div>
                        {folderFormError && <span className="admin-error">{folderFormError}</span>}
                        <div className="admin-form-actions">
                            <button
                                type="submit"
                                className="btn-98 btn-98-primary"
                                disabled={isSubmittingFolder}
                            >
                                {isSubmittingFolder ? '⏳ Saving...' : editingFolderId ? '💾 Update' : '➕ Create'}
                            </button>
                            <button
                                type="button"
                                className="btn-98"
                                onClick={handleCancelFolderForm}
                            >
                                ✖️ Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Folders List */}
            <div className="folders-section">
                <h4 className="pixel-text">📂 FOLDERS ({folders.length})</h4>
                {loading ? (
                    <div className="archive-loading">Loading...</div>
                ) : folders.length === 0 ? (
                    <div className="archive-empty">No folders yet. Create your first folder above!</div>
                ) : (
                    <div className="folders-grid">
                        {folders.map((folder) => {
                            const photoCount = getPhotosByFolder(folder.id).length;
                            const folderPhotosData = getPhotosByFolder(folder.id);
                            const previewPhoto = folderPhotosData[0];

                            return (
                                <div
                                    key={folder.id}
                                    className={`folder-card ${selectedFolder === folder.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedFolder(folder.id)}
                                >
                                    <div className="folder-preview">
                                        {previewPhoto?.thumbnailUrl ? (
                                            <img src={previewPhoto.thumbnailUrl} alt={folder.name} />
                                        ) : (
                                            <div className="folder-icon">
                                                {folder.category === 'photos' && '📷'}
                                                {folder.category === 'videos' && '🎬'}
                                                {folder.category === 'flyers' && '🎨'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="folder-info">
                                        <span className="folder-name">{folder.name}</span>
                                        <span className="folder-meta">{photoCount} items</span>
                                    </div>
                                    <div className="folder-actions">
                                        <button
                                            className="btn-98 btn-sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEditFolder(folder);
                                            }}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-98 btn-sm btn-danger"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFolder(folder.id);
                                            }}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Photo Upload Section */}
            {selectedFolder && (
                <div className="photos-section">
                    <div className="photos-header">
                        <h4 className="pixel-text">
                            📸 {selectedFolderData?.name} ({folderPhotos.length} photos)
                        </h4>
                    </div>

                    {/* Upload Dropzone */}
                    <div
                        className={`photo-dropzone ${dragOver ? 'drag-over' : ''} ${uploadingPhotos ? 'uploading' : ''}`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        {uploadingPhotos ? (
                            <div className="upload-progress">
                                <span className="pixel-text">⏳ Uploading...</span>
                                {Object.entries(uploadProgress).map(([fileName, progress]) => (
                                    <div key={fileName} className="progress-item">
                                        <span>{fileName}</span>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    id="photo-upload"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e.target.files)}
                                    style={{ display: 'none' }}
                                />
                                <label htmlFor="photo-upload" className="dropzone-label">
                                    <div className="dropzone-icon">📤</div>
                                    <div className="dropzone-text">
                                        <span className="pixel-text">Drag & Drop Photos</span>
                                        <span className="dropzone-subtext">or click to browse</span>
                                    </div>
                                </label>
                            </>
                        )}
                    </div>

                    {/* Photos Grid */}
                    {folderPhotos.length > 0 && (
                        <div className="photos-grid">
                            {folderPhotos.map((photo) => (
                                <div key={photo.id} className="photo-card">
                                    <div className="photo-preview">
                                        <img src={photo.thumbnailUrl || photo.url} alt={photo.title} />
                                    </div>
                                    <div className="photo-info">
                                        <span className="photo-title">{photo.title}</span>
                                        {photo.photoDate && (
                                            <span className="photo-date">
                                                {new Date(photo.photoDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="photo-actions">
                                        <button
                                            className="btn-98 btn-sm btn-danger"
                                            onClick={() => handleDeletePhoto(photo.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {!selectedFolder && !showFolderForm && folders.length > 0 && (
                <div className="archive-placeholder">
                    <span className="pixel-text text-gray">← Select a folder to manage photos</span>
                </div>
            )}
        </div>
    );
};
