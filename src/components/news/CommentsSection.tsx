import React, { useState } from 'react';
import { fetchComments, createComment, type NewsComment } from '../../lib/supabase';
import '../../windows/NewsWindow.css';

interface CommentsSectionProps {
    postId: string;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId }) => {
    const [comments, setComments] = useState<NewsComment[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState(() => localStorage.getItem('vranov_callsign') || '');
    const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);

    const loadComments = async () => {
        setLoading(true);
        const data = await fetchComments(postId);
        setComments(data);
        setLoading(false);
    };

    const handleToggle = () => {
        if (!isOpen) loadComments();
        setIsOpen(!isOpen);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!authorName) {
            setIsNamePromptOpen(true);
            return;
        }

        if (!newComment.trim()) return;

        const result = await createComment({
            post_id: postId,
            author_name: authorName,
            content: newComment.trim(),
        });

        if (result) {
            setComments(prev => [...prev, result]);
            setNewComment('');
        }
    };

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (authorName.trim()) {
            localStorage.setItem('vranov_callsign', authorName.trim());
            setIsNamePromptOpen(false);
            // Auto submit comment if ready
            if (newComment.trim()) handleSubmit(e);
        }
    };

    return (
        <div className="news-comments-section">
            <button className="btn-98 btn-sm comment-toggle-btn" onClick={handleToggle}>
                {isOpen ? '🔼 HIDE REPLIES' : `🔽 REPLIES ${comments.length > 0 ? `(${comments.length})` : ''}`}
            </button>

            {isOpen && (
                <div className="comments-container">
                    {loading ? (
                        <div className="comments-loading">Loading data...</div>
                    ) : (
                        <div className="comments-list">
                            {comments.map(c => (
                                <div key={c.id} className="comment-item">
                                    <div className="comment-header">
                                        <span className="comment-author">{c.author_name}</span>
                                        <span className="comment-time">{new Date(c.created_at).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="comment-body">{c.content}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Comment Form */}
                    <form onSubmit={handleSubmit} className="comment-form">
                        <input
                            type="text"
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            placeholder="Type a reply..."
                            className="comment-input"
                        />
                        <button type="submit" className="btn-98 btn-sm">SEND</button>
                    </form>

                    {/* Identity Prompt Modal (Inline) */}
                    {isNamePromptOpen && (
                        <div className="identity-modal-overlay">
                            <div className="identity-modal window-border">
                                <div className="identity-header">IDENTIFY YOURSELF</div>
                                <form onSubmit={handleNameSubmit} className="identity-form">
                                    <label>CALLSIGN:</label>
                                    <input
                                        type="text"
                                        value={authorName}
                                        onChange={e => setAuthorName(e.target.value)}
                                        className="identity-input"
                                        autoFocus
                                        placeholder="e.g. USER_01"
                                    />
                                    <button type="submit" className="btn-98 btn-block">CONFIRM</button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
