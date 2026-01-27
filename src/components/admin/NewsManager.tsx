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
    const [imageFile, setImageFile] = useState<File | null>(null);

    const loadPosts = async () => {
        setLoading(true);
        const data = await fetchNewsPosts();
        setPosts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPosts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSubmitting(true);
        setError('');

        let uploadedImageUrl: string | undefined = undefined;

        if (imageFile) {
            const url = await uploadNewsImage(imageFile);
            if (url) {
                uploadedImageUrl = url;
            } else {
                setError('Failed to upload image.');
                setSubmitting(false);
                return;
            }
        }

        const newPost = {
            title: title.trim(),
            content: content.trim(),
            image_url: uploadedImageUrl,
        };

        const result = await createNewsPost(newPost);

        if (result) {
            // Success
            setTitle('');
            setContent('');
            setImageFile(null);
            // Reset file input manually if needed, or rely on state
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
            {/* Create Post Form */}
            <div className="admin-form-container">
                <h3 className="pixel-text">📡 NEW TRANSMISSION</h3>
                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="admin-form-group">
                        <label>Headline *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="admin-input"
                            placeholder="BREAKING NEWS..."
                            required
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Attach Image (Optional)</label>
                        <input
                            id="news-file-input"
                            type="file"
                            accept="image/*"
                            onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
                            className="admin-input"
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Content *</label>
                        <textarea
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="admin-input admin-textarea"
                            rows={4}
                            placeholder="Write your message here..."
                            required
                        />
                    </div>

                    {error && <span className="admin-error">{error}</span>}

                    <div className="admin-form-actions">
                        <button
                            type="submit"
                            className="btn-98 btn-98-primary"
                            disabled={submitting}
                        >
                            {submitting ? 'SENDING...' : '📣 PUBLISH'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Posts List */}
            <div className="admin-shows-list">
                <h3 className="pixel-text">🗄️ TRANSMISSION LOGS ({posts.length})</h3>
                {loading ? (
                    <div className="admin-loading">Loading feeds...</div>
                ) : posts.length === 0 ? (
                    <div className="admin-empty">No transmissions found. Start broadcasting!</div>
                ) : (
                    <div className="news-admin-list">
                        {posts.map(post => (
                            <div key={post.id} className="news-admin-item">
                                <div className="news-admin-header">
                                    <span className="news-admin-date">
                                        {new Date(post.created_at).toLocaleDateString()}
                                    </span>
                                    <span className="news-admin-likes">❤️ {post.likes}</span>
                                </div>
                                <h4 className="news-admin-title">{post.title}</h4>
                                <div className="news-admin-preview">
                                    {post.image_url && <span className="news-has-image">🖼️</span>}
                                    {post.content.substring(0, 60)}...
                                </div>
                                <button
                                    className="btn-98 btn-danger btn-sm news-delete-btn"
                                    onClick={() => handleDelete(post.id)}
                                >
                                    🗑️ DELETE
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
