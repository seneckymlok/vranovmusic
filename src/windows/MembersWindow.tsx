import React, { useState } from 'react';
import { members } from '../data/members';
import type { Member } from '../types';
import './MembersWindow.css';

export const MembersWindow: React.FC = () => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const handleMemberClick = (member: Member) => {
        setSelectedMember(selectedMember?.id === member.id ? null : member);
    };

    return (
        <div className="members-window">
            {/* Photo Grid */}
            <div className="members-grid">
                {members.map(member => (
                    <button
                        key={member.id}
                        className={`member-card ${selectedMember?.id === member.id ? 'selected' : ''}`}
                        onClick={() => handleMemberClick(member)}
                    >
                        {/* Photo */}
                        <div className="member-photo">
                            {member.photo ? (
                                <img
                                    src={member.photo}
                                    alt={member.name}
                                    className="member-photo-img"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="member-photo-placeholder">
                                    <span>{member.name.charAt(0)}</span>
                                </div>
                            )}
                            <div className="scanlines" />
                        </div>

                        {/* Hover overlay (desktop) */}
                        <div className="member-overlay">
                            <span className="member-overlay-name pixel-text">{member.name}</span>
                            <span className="member-overlay-role">{member.role}</span>
                        </div>

                        {/* Tap info (mobile) - shown when selected */}
                        {selectedMember?.id === member.id && (
                            <div className="member-mobile-info">
                                <span className="member-mobile-name pixel-text">{member.name}</span>
                                <span className="member-mobile-role">{member.role}</span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* Selected Member Links Panel */}
            {selectedMember && (
                <div className="member-links-panel">
                    <div className="member-links-header">
                        <span className="member-links-name pixel-text">{selectedMember.name}</span>
                        <span className="member-links-role">{selectedMember.role}</span>
                    </div>
                    <div className="member-links-buttons">
                        {selectedMember.links?.instagram && (
                            <a
                                href={selectedMember.links.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="member-link-btn instagram"
                            >
                                📷 Instagram
                            </a>
                        )}
                        {selectedMember.links?.spotify && (
                            <a
                                href={selectedMember.links.spotify}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="member-link-btn spotify"
                            >
                                🎵 Spotify
                            </a>
                        )}
                        {selectedMember.links?.appleMusic && (
                            <a
                                href={selectedMember.links.appleMusic}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="member-link-btn apple-music"
                            >
                                🍎 Apple Music
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* Status Bar */}
            <div className="members-status">
                <span>{members.length} artists loaded</span>
            </div>
        </div>
    );
};
