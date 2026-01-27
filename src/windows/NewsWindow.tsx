import React, { useState, useEffect } from 'react';
import { fetchNewsPosts, likeNewsPost, type NewsPost } from '../lib/supabase';
import { CommentsSection } from '../components/news/CommentsSection';
import './NewsWindow.css';

export const NewsWindow: React.FC = () => {
    const [posts, setPosts] = useState<NewsPost[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPosts = async () => {
        setLoading(true);
        const data = await fetchNewsPosts();
        setPosts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadPosts();
        // Poll for updates every 30s
        const interval = setInterval(loadPosts, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleLike = async (post: NewsPost) => {
        // Optimistic update
        setPosts(prev => prev.map(p =>
            p.id === post.id ? { ...p, likes: p.likes + 1 } : p
        ));

        await likeNewsPost(post.id, post.likes);
    };

    return (
        <div className="news-window">
            <div className="news-header-bar">
                <span className="blink">● LIVE TRANSMISSION</span>
                <span>VRANOV_NEWS_V1.0</span>
            </div>

            <div className="news-feed">
                {loading && posts.length === 0 ? (
                    <div className="news-loading pixel-text">SEARCHING_SIGNAL...</div>
                ) : posts.length === 0 ? (
                    <div className="news-empty pixel-text">NO SIGNAL DETECTED.</div>
                ) : (
                    posts.map(post => (
                        <article key={post.id} className="news-card">
                            <div className="news-card-header">
                                <span className="news-id">ID: {post.id.slice(0, 8)}</span>
                                <span className="news-date">
                                    {new Date(post.created_at).toLocaleString()}
                                </span>
                            </div>

                            {post.image_url && (
                                <div className="news-image-container">
                                    <img src={post.image_url} alt={post.title} className="news-image" loading="lazy" />
                                    <div className="scanline-overlay"></div>
                                </div>
                            )}

                            <div className="news-content">
                                <h2 className="news-title">{post.title}</h2>
                                <p className="news-body">{post.content}</p>
                            </div>

                            <div className="news-footer">
                                <button
                                    className="btn-98 news-like-btn"
                                    onClick={() => handleLike(post)}
                                >
                                    ❤️ {post.likes}
                                </button>
                                <span className="news-share">SHARE.EXE</span>
                            </div>

                            <CommentsSection postId={post.id} />
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};
