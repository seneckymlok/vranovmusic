import React, { useState, useEffect } from 'react';
import { fetchNewsPosts, likeNewsPost, type NewsPost } from '../lib/supabase';
import { CommentsSection } from '../components/news/CommentsSection';
import { ImageGallery } from '../components/news/ImageGallery';
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
                <div className="news-header-title">
                    <span>📰</span>
                    <span>BREAKING NEWS</span>
                </div>
                <div className="news-header-date">
                    {new Date().toLocaleDateString()}
                </div>
            </div>

            <div className="news-feed">
                {loading && posts.length === 0 ? (
                    <div className="news-loading">Updating feeds...</div>
                ) : posts.length === 0 ? (
                    <div className="news-empty">No headlines available.</div>
                ) : (
                    posts.map((post) => (
                        <article key={post.id} className="news-card">
                            <div className="news-card-header">
                                <span>{post.title}</span>
                                <span>{new Date(post.created_at).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>

                            {/* Images */}
                            <ImageGallery
                                images={post.image_urls || (post.image_url ? [post.image_url] : [])}
                                altText={post.title}
                            />

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
                            </div>

                            <CommentsSection postId={post.id} />
                        </article>
                    ))
                )}
            </div>
        </div>
    );
};
