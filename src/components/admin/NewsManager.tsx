import React, { useState, useEffect } from 'react';
import { createNewsPost, deleteNewsPost, fetchNewsPosts, uploadNewsImage, type NewsPost } from '../../lib/supabase';
import '../../windows/AdminWindow.css';
import '../admin/NewsManager.css';

export const NewsManager: React.FC = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Form State
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const loadPosts = async () => {
        setLoading(true);
        const data = await fetchNewsPosts();
        setPosts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    // Stats calculation
    const totalPosts = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // Convert FileList to Array
            setImageFiles(Array.from(e.target.files));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSubmitting(true);
        setError('');

        const uploadedUrls: string[] = [];

        // Upload images if any
        if (imageFiles.length > 0) {
            try {
                // Upload all files in parallel
                const uploadPromises = imageFiles.map(file => uploadNewsImage(file));
                const results = await Promise.all(uploadPromises);

                // Filter out nulls and collect valid URLs
                results.forEach(url => {
                    if (url) uploadedUrls.push(url);
                });

                if (uploadedUrls.length !== imageFiles.length) {
                    setError('Warning: Some images failed to upload.');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to upload images.');
                setSubmitting(false);
                return;
            }
        }

        const newPost = {
            title: title.trim(),
            content: content.trim(),
            // Ensure we save the first image as legacy image_url for safety
            image_url: uploadedUrls.length > 0 ? uploadedUrls[0] : undefined,
            image_urls: uploadedUrls,
        };

        const result = await createNewsPost(newPost);

        if (result) {
            // Success
            setTitle('');
            setContent('');
            setImageFiles([]);
            // Reset file input manually
            const fileInput = document.getElementById('news-file-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            setPosts(prev => [result, ...prev]);
        } else {
            setError('Failed to publish post.');
        }

        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this transmission?')) return;

        const success = await deleteNewsPost(id);
        if (success) {
            setPosts(prev => prev.filter(p => p.id !== id));
        } else {
            alert('Failed to delete post.');
        }
    };

    return (
        <div className="admin-news-manager">
            {/* Dashboard Stats */}
            <div className="admin-stats-bar">
                <div className="stat-item">
                    <span className="stat-label">Total Posts</span>
                    <span className="stat-value">{totalPosts}</span>
                </div>
                <div className="stat-item">
                    <span className="stat-label">Total Likes</span>
                    <span className="stat-value">{totalLikes}</span>
                </div>
            </div>

            <div className="admin-content-split">
                {/* LEFT: Editor Panel */}
                <div className="admin-editor-panel">
                    <h3 className="admin-panel-title">Post Editor</h3>
                    <form onSubmit={handleSubmit} className="admin-form">
                        <div className="admin-form-group">
                            <label>Headline</label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="input-98"
                                placeholder="Enter headline..."
                                required
                            />
                        </div>

                        <div className="admin-form-group">
                            <label>Images (Optional - Select Multiple)</label>
                            <input
                                id="news-file-input"
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="input-98"
                            />
                            {imageFiles.length > 0 && (
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                    Selected: {imageFiles.length} file(s)
                                </div>
                            )}
                        </div>

                        <div className="admin-form-group">
                            <label>Content</label>
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                className="input-98 admin-textarea"
                                rows={8}
                                placeholder="Article content..."
                                required
                            />
                        </div>

                        {error && <span className="admin-error">{error}</span>}

                        <button
                            type="submit"
                            className="btn-98 btn-98-primary"
                            disabled={submitting}
                            style={{ width: '100%', marginTop: '8px' }}
                        >
                            {submitting ? 'Publishing...' : 'Publish Article'}
                        </button>
                    </form>
                </div>

                {/* RIGHT: Logs Panel */}
                <div className="admin-logs-panel">
                    <h3 className="admin-panel-title">Posted Articles</h3>
                    {loading ? (
                        <div className="admin-loading">Loading...</div>
                    ) : posts.length === 0 ? (
                        <div className="admin-empty">No posts yet.</div>
                    ) : (
                        <div className="admin-logs-list">
                            {posts.map(post => (
                                <div key={post.id} className="admin-log-item">
                                    {post.image_url ? (
                                        <img src={post.image_url} className="log-thumb" alt="" />
                                    ) : (
                                        <div className="log-thumb" style={{ background: '#eee' }}></div>
                                    )}
                                    <span className="log-date">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="log-title">{post.title}</span>
                                    <span className="log-meta">❤️ {post.likes}</span>

                                    <button
                                        className="btn-98 btn-danger btn-sm"
                                        style={{ marginLeft: 'auto' }}
                                        onClick={() => handleDelete(post.id)}
                                    >
                                        Del
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
