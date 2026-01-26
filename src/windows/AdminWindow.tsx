import React, { useState } from 'react';
import { useShows } from '../context/ShowsContext';
import { ArchiveManager } from '../components/admin/ArchiveManager';
import type { Show } from '../types';
import './AdminWindow.css';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'vranov2026';

type AdminTab = 'shows' | 'archive';

interface ShowFormData {
    date: string;
    time: string;
    venue: string;
    city: string;
    country: string;
    ticketUrl: string;
    flyerImage: string;
    description: string;
    isPast: boolean;
}

const emptyForm: ShowFormData = {
    date: '',
    time: '',
    venue: '',
    city: '',
    country: 'SK',
    ticketUrl: '',
    flyerImage: '',
    description: '',
    isPast: false,
};

export const AdminWindow: React.FC = () => {
    const { shows, loading, error, addShow, updateShow, deleteShow, refreshShows } = useShows();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');
    const [activeTab, setActiveTab] = useState<AdminTab>('shows');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<ShowFormData>(emptyForm);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('❌ Incorrect password');
        }
    };

    const handleFormChange = (field: keyof ShowFormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFormError('');
    };

    const validateForm = (): boolean => {
        if (!formData.date) {
            setFormError('Date is required');
            return false;
        }
        if (!formData.venue.trim()) {
            setFormError('Venue is required');
            return false;
        }
        if (!formData.city.trim()) {
            setFormError('City is required');
            return false;
        }
        if (!formData.country.trim()) {
            setFormError('Country is required');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const showData = {
                date: formData.date,
                time: formData.time || undefined,
                venue: formData.venue.trim().toUpperCase(),
                city: formData.city.trim(),
                country: formData.country.trim().toUpperCase(),
                ticketUrl: formData.ticketUrl.trim() || undefined,
                flyerImage: formData.flyerImage.trim() || undefined,
                description: formData.description.trim() || undefined,
                isPast: formData.isPast,
            };

            if (editingId) {
                await updateShow(editingId, showData);
            } else {
                await addShow(showData);
            }

            setFormData(emptyForm);
            setEditingId(null);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Failed to save show');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (show: Show) => {
        setEditingId(show.id);
        setFormData({
            date: show.date,
            time: show.time || '',
            venue: show.venue,
            city: show.city,
            country: show.country,
            ticketUrl: show.ticketUrl || '',
            flyerImage: show.flyerImage || '',
            description: show.description || '',
            isPast: show.isPast || false,
        });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this show?')) {
            try {
                await deleteShow(id);
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Failed to delete show');
            }
        }
    };

    const handleCancel = () => {
        setFormData(emptyForm);
        setEditingId(null);
        setFormError('');
    };

    // Login screen
    if (!isAuthenticated) {
        return (
            <div className="admin-window">
                <div className="admin-login">
                    <div className="admin-login-icon">🔐</div>
                    <h2 className="pixel-text">ADMIN ACCESS</h2>
                    <form onSubmit={handleLogin} className="admin-login-form">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password..."
                            className="admin-input"
                            autoFocus
                        />
                        <button type="submit" className="btn-98 btn-98-primary">
                            LOGIN
                        </button>
                    </form>
                    {authError && <span className="admin-error">{authError}</span>}
                </div>
            </div>
        );
    }

    // Admin panel
    return (
        <div className="admin-window">
            {/* Header with Tabs */}
            <div className="admin-header">
                <div className="admin-tabs">
                    <button
                        className={`admin-tab ${activeTab === 'shows' ? 'active' : ''}`}
                        onClick={() => setActiveTab('shows')}
                    >
                        📋 SHOWS
                    </button>
                    <button
                        className={`admin-tab ${activeTab === 'archive' ? 'active' : ''}`}
                        onClick={() => setActiveTab('archive')}
                    >
                        📁 ARCHIVE
                    </button>
                </div>
                <div className="admin-header-actions">
                    <button className="btn-98" onClick={refreshShows} disabled={loading}>
                        {loading ? '⏳' : '🔄'} Refresh
                    </button>
                    <button className="btn-98" onClick={() => setIsAuthenticated(false)}>
                        🚪 Logout
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-alert admin-alert-error">
                    ⚠️ {error}
                </div>
            )}

            {/* Tab Content */}
            {activeTab === 'shows' ? (
                <>
                    {/* Form */}
                    <div className="admin-form-container">
                        <h3 className="pixel-text">{editingId ? '✏️ EDIT SHOW' : '➕ ADD NEW SHOW'}</h3>
                        <form onSubmit={handleSubmit} className="admin-form">
                            <div className="admin-form-row">
                                <div className="admin-form-group">
                                    <label>Date *</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleFormChange('date', e.target.value)}
                                        className="admin-input"
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => handleFormChange('time', e.target.value)}
                                        className="admin-input"
                                    />
                                </div>
                                <div className="admin-form-group admin-form-group-checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.isPast}
                                            onChange={(e) => handleFormChange('isPast', e.target.checked)}
                                        />
                                        Past Event
                                    </label>
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group admin-form-group-venue">
                                    <label>Venue *</label>
                                    <input
                                        type="text"
                                        value={formData.venue}
                                        onChange={(e) => handleFormChange('venue', e.target.value)}
                                        placeholder="e.g., FUGA"
                                        className="admin-input"
                                    />
                                </div>
                                <div className="admin-form-group">
                                    <label>City *</label>
                                    <input
                                        type="text"
                                        value={formData.city}
                                        onChange={(e) => handleFormChange('city', e.target.value)}
                                        placeholder="e.g., Bratislava"
                                        className="admin-input"
                                    />
                                </div>
                                <div className="admin-form-group admin-form-group-country">
                                    <label>Country *</label>
                                    <input
                                        type="text"
                                        value={formData.country}
                                        onChange={(e) => handleFormChange('country', e.target.value)}
                                        placeholder="SK"
                                        className="admin-input"
                                        maxLength={3}
                                    />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group admin-form-group-full">
                                    <label>Ticket URL (GoOut, TooToot, etc.)</label>
                                    <input
                                        type="url"
                                        value={formData.ticketUrl}
                                        onChange={(e) => handleFormChange('ticketUrl', e.target.value)}
                                        placeholder="https://goout.net/sk/..."
                                        className="admin-input"
                                    />
                                </div>
                            </div>

                            <div className="admin-form-row">
                                <div className="admin-form-group admin-form-group-full">
                                    <label>Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleFormChange('description', e.target.value)}
                                        placeholder="Optional notes about the show..."
                                        className="admin-input admin-textarea"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {formError && <span className="admin-error">{formError}</span>}

                            <div className="admin-form-actions">
                                <button
                                    type="submit"
                                    className="btn-98 btn-98-primary"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Add Show'}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        className="btn-98"
                                        onClick={handleCancel}
                                    >
                                        ✖️ Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Shows List */}
                    <div className="admin-shows-list">
                        <h3 className="pixel-text">📅 ALL SHOWS ({shows.length})</h3>
                        {loading ? (
                            <div className="admin-loading">Loading...</div>
                        ) : shows.length === 0 ? (
                            <div className="admin-empty">No shows yet. Add your first show above!</div>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Venue</th>
                                        <th>Location</th>
                                        <th>Tickets</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shows
                                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                        .map((show) => (
                                            <tr key={show.id} className={show.isPast ? 'row-past' : ''}>
                                                <td>
                                                    {new Date(show.date).toLocaleDateString('sk-SK')}
                                                    {show.time && <span className="show-time"> {show.time}</span>}
                                                </td>
                                                <td className="venue-cell">{show.venue}</td>
                                                <td>{show.city}, {show.country}</td>
                                                <td>
                                                    {show.ticketUrl && show.ticketUrl !== '#' ? (
                                                        <a
                                                            href={show.ticketUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ticket-link"
                                                        >
                                                            🎫 Link
                                                        </a>
                                                    ) : (
                                                        <span className="no-tickets">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${show.isPast ? 'status-past' : 'status-upcoming'}`}>
                                                        {show.isPast ? 'PAST' : 'UPCOMING'}
                                                    </span>
                                                </td>
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-98 btn-sm"
                                                        onClick={() => handleEdit(show)}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        className="btn-98 btn-sm btn-danger"
                                                        onClick={() => handleDelete(show.id)}
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            ) : (
                <ArchiveManager />
            )}
        </div>
    );
};
