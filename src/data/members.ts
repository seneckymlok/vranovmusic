import type { Member } from '../types';

export const members: Member[] = [
    {
        id: '44lex',
        name: '44LEX',
        handle: '@44lex.exe',
        role: 'Spitter',
        category: 'spitters',
        photo: '/members/44lex.webp',
        bio: '',
        links: {
            instagram: 'https://instagram.com/44lex.exe',
            spotify: 'https://open.spotify.com/artist/5iZTYBhlfr88ZIwTYCZgdb',
            appleMusic: 'https://music.apple.com/sk/artist/44lex/1652573906',
        },
    },
    {
        id: 'sushislime',
        name: 'SUSHISLIME',
        handle: '@sushiiislime',
        role: 'Spitter',
        category: 'spitters',
        photo: '/members/susi.webp',
        bio: '',
        links: {
            instagram: 'https://www.instagram.com/sushiiislime/',
            spotify: 'https://open.spotify.com/artist/6gzOCUTX3igvLapUbJinDh',
            appleMusic: 'https://music.apple.com/sk/artist/sushislime/1738278360',
        },
    },
    {
        id: 'vranovcrevo',
        name: 'Pudge',
        handle: '@vranovcrevo',
        role: 'Spitter',
        category: 'spitters',
        photo: '/members/pudge.webp',
        bio: '',
        links: {
            instagram: 'https://instagram.com/vranovcrevo',
            spotify: 'https://open.spotify.com/artist/5hA4e3qNO5vbDnG0t6okYM',
            appleMusic: 'https://music.apple.com/sk/artist/pudge/1471355405',
        },
    },
    {
        id: 'noeliiizi',
        name: 'NOELIIIZI',
        handle: '@noeliiizi',
        role: 'Producer',
        category: 'producers',
        photo: '/members/noel.webp',
        bio: '',
        links: {
            instagram: 'https://instagram.com/noeliiizi',
        },
    },
    {
        id: 'sniiisen',
        name: 'SNÍSEN',
        handle: '@sniiisen',
        role: 'DJ / Producer',
        category: 'producers',
        bio: '',
        links: {
            instagram: 'https://www.instagram.com/sniiisen/',
        },
    },
];

export const getMembersByCategory = (category: Member['category']) =>
    members.filter(m => m.category === category);
