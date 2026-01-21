// Type definitions for Vranov Music OS

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  position: { x: number; y: number };
  size: { width: number; height: number };
  defaultSize: { width: number; height: number };
}

export interface DesktopIcon {
  id: string;
  label: string;
  icon: string;
  windowId: string;
}

export interface Member {
  id: string;
  name: string;
  handle: string;
  role: string;
  category: 'spitters' | 'producers' | 'crew';
  photo?: string;
  bio?: string;
  links?: {
    instagram?: string;
    spotify?: string;
    soundcloud?: string;
  };
}

export interface Show {
  id: string;
  date: string; // ISO date string
  time?: string; // Optional time string (e.g., "20:00")
  venue: string;
  city: string;
  country: string;
  ticketUrl?: string;
  flyerImage?: string;
  description?: string; // Optional show notes/description
  isPast?: boolean;
}

export interface StreamingLink {
  name: string;
  url: string;
  icon: string;
  color: string;
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface Release {
  id: string;
  title: string;
  type: 'single' | 'ep' | 'album';
  releaseDate: string;
  coverArt?: string;
  streamingLinks: StreamingLink[];
}


