import React, { useState } from 'react';
import { members, getMembersByCategory } from '../data/members';
import type { Member } from '../types';
import './MembersWindow.css';

type Category = 'spitters' | 'producers' | 'crew';

const TABS: { id: Category; label: string }[] = [
    { id: 'spitters', label: 'SPITTERS' },
    { id: 'producers', label: 'PRODUCERS' },
    { id: 'crew', label: 'CREW' },
];

export const MembersWindow: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Category>('spitters');
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);

    const currentMembers = getMembersByCategory(activeTab);

    return (
        <div className="members-window">
            {/* Tabs */}
            <div className="members-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`members-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedMember(null);
                        }}
                    >
                        <span className="pixel-text">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Member Grid */}
            <div className="members-grid">
                {currentMembers.map(member => (
                    <button
                        key={member.id}
                        className={`member-card ${selectedMember?.id === member.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMember(
                            selectedMember?.id === member.id ? null : member
                        )}
                    >
                        <div className="member-photo">
                            <div className="member-photo-placeholder">
                                <span>{member.name.charAt(0)}</span>
                            </div>
                            <div className="scanlines" />
                        </div>
                        <div className="member-info">
                            <span className="member-name pixel-text">{member.name}</span>
                            <span className="member-role">{member.role}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Selected Member Detail */}
            {selectedMember && (
                <div className="member-detail">
                    <div className="detail-header">
                        <span className="detail-name pixel-text">{selectedMember.name}</span>
                        <span className="detail-handle text-green">{selectedMember.handle}</span>
                    </div>
                    <p className="detail-bio">{selectedMember.bio}</p>
                    {selectedMember.links?.instagram && (
                        <a
                            href={selectedMember.links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="detail-link btn-98"
                        >
                            📷 Instagram
                        </a>
                    )}
                </div>
            )}

            {/* Status Bar */}
            <div className="members-status">
                <span>{members.length} artists loaded</span>
            </div>
        </div>
    );
};
