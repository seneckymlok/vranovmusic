import React, { useState } from 'react';
import { socialLinks, bookingEmail } from '../data/links';
import './ConnectWindow.css';

export const ConnectWindow: React.FC = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In real implementation, would send to backend
        setSent(true);
        setTimeout(() => setSent(false), 3000);
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <div className="connect-window">
            {/* Social Links */}
            <div className="socials-section">
                <h3 className="section-title pixel-text">🌐 SOCIALS</h3>
                <div className="socials-grid">
                    {socialLinks.map(link => (
                        <a
                            key={link.name}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="social-btn"
                        >
                            <span className="social-icon">{link.icon}</span>
                            <span className="social-name">{link.name}</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* Booking Info */}
            <div className="booking-section">
                <h3 className="section-title pixel-text">📧 BOOKING</h3>
                <div className="booking-card">
                    <p>For booking inquiries, collabs, and business:</p>
                    <a href={`mailto:${bookingEmail}`} className="booking-email text-green">
                        {bookingEmail}
                    </a>
                </div>
            </div>

            {/* Contact Form */}
            <div className="contact-section">
                <h3 className="section-title pixel-text">💬 DROP A MESSAGE</h3>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Name:</label>
                        <input
                            type="text"
                            className="input-98"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            className="input-98"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Message:</label>
                        <textarea
                            className="input-98"
                            rows={3}
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="btn-98 btn-98-primary">
                            SEND
                        </button>
                        {sent && <span className="form-success text-green">✓ Message sent!</span>}
                    </div>
                </form>
            </div>

            {/* Status */}
            <div className="connect-status">
                <span>Online • Middle Europe Continent</span>
            </div>
        </div>
    );
};
