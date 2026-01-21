import React, { useState } from 'react';
import { useShows } from '../context/ShowsContext';
import './ShowsWindow.css';

const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
        day: date.getDate().toString().padStart(2, '0'),
        month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
        year: date.getFullYear(),
        full: date.toLocaleDateString('sk-SK'),
    };
};

export const ShowsWindow: React.FC = () => {
    const [showPast, setShowPast] = useState(false);
    const { shows, loading, getUpcomingShows, getPastShows } = useShows();

    const upcomingShows = getUpcomingShows();
    const pastShows = getPastShows();
    const displayedShows = showPast ? pastShows : upcomingShows;

    return (
        <div className="shows-window">
            {/* Header */}
            <div className="shows-header">
                <h2 className="pixel-text">
                    {showPast ? '📜 PAST SHOWS' : '🎤 UPCOMING SHOWS'}
                </h2>
                <button
                    className="btn-98"
                    onClick={() => setShowPast(!showPast)}
                >
                    {showPast ? 'Show Upcoming' : 'Show Past'}
                </button>
            </div>

            {/* Shows List */}
            <div className="shows-list">
                {loading ? (
                    <div className="shows-empty">
                        <span className="pixel-text text-gray">⏳ Loading shows...</span>
                    </div>
                ) : displayedShows.length === 0 ? (
                    <div className="shows-empty">
                        <span className="pixel-text text-gray">
                            {showPast ? 'No past shows recorded.' : 'No upcoming shows scheduled.'}
                        </span>
                    </div>
                ) : (
                    displayedShows.map(show => {
                        const date = formatDate(show.date);
                        return (
                            <div key={show.id} className="show-item">
                                {/* Date Block */}
                                <div className="show-date">
                                    <span className="show-date-day pixel-text">{date.day}</span>
                                    <span className="show-date-month">{date.month}</span>
                                    <span className="show-date-year">{date.year}</span>
                                </div>

                                {/* Venue Info */}
                                <div className="show-info">
                                    <span className="show-venue pixel-text">{show.venue}</span>
                                    <span className="show-location">
                                        📍 {show.city}, {show.country}
                                    </span>
                                </div>

                                {/* Ticket Button */}
                                {show.ticketUrl && !show.isPast && (
                                    <a
                                        href={show.ticketUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="show-ticket btn-98 btn-98-primary"
                                    >
                                        GET TICKETS
                                    </a>
                                )}
                                {show.isPast && (
                                    <span className="show-past-badge">PAST</span>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Mini Calendar */}
            <div className="shows-calendar">
                <div className="calendar-header">
                    <span className="pixel-text">JANUARY 2026</span>
                </div>
                <div className="calendar-grid">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <span key={day} className="calendar-day-label">{day}</span>
                    ))}
                    {/* Simplified calendar - just showing structure */}
                    {[...Array(31)].map((_, i) => {
                        const day = i + 1;
                        const hasShow = upcomingShows.some(s => {
                            const showDate = new Date(s.date);
                            return showDate.getDate() === day && showDate.getMonth() === 0;
                        });
                        return (
                            <span
                                key={i}
                                className={`calendar-day ${hasShow ? 'has-show' : ''}`}
                            >
                                {day}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Status */}
            <div className="shows-status">
                <span>{shows.length} events total</span>
            </div>
        </div>
    );
};
