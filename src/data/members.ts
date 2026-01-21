import type { Member } from '../types';

export const members: Member[] = [
    // SPITTERS
    {
        id: '44lex',
        name: '44LEX',
        handle: '@44lex.exe',
        role: 'Spitter',
        category: 'spitters',
        bio: '',
        links: {
            instagram: 'https://instagram.com/44lex.exe',
        },
    },
    {
        id: 'sushiislime',
        name: 'SUSHIISLIME',
        handle: '@sushiislime',
        role: 'Spitter',
        category: 'spitters',
        bio: '',
        links: {
            instagram: 'https://instagram.com/sushiislime',
        },
    },
    {
        id: 'vranovcrevo',
        name: 'Pudge',
        handle: '@vranovcrevo',
        role: 'Spitter',
        category: 'spitters',
        bio: '',
        links: {
            instagram: 'https://instagram.com/vranovcrevo',
        },
    },

    // PRODUCERS
    {
        id: 'noeliiizi',
        name: 'NOELIIIZI',
        handle: '@noeliiizi',
        role: 'Producer',
        category: 'producers',
        bio: '',
        links: {
            instagram: 'https://instagram.com/noeliiizi',
        },
    },
    {
        id: 'bohacdaniell',
        name: 'BOHAC DANIELL',
        handle: '@bohacdaniell',
        role: 'Producer',
        category: 'producers',
        bio: '',
        links: {
            instagram: 'https://instagram.com/bohacdaniell',
        },
    },

    // CREW
    {
        id: 'smargiela7',
        name: 'SMARGIELA7',
        handle: '@smargiela7',
        role: 'Executive Producer',
        category: 'crew',
        bio: '',
        links: {
            instagram: 'https://instagram.com/smargiela7',
        },
    },
    {
        id: 'danky_kubis',
        name: 'DANKY KUBIS',
        handle: '@danky_kubis',
        role: 'Executive Producer',
        category: 'crew',
        bio: '',
        links: {
            instagram: 'https://instagram.com/danky_kubis',
        },
    },
];

export const getMembersByCategory = (category: Member['category']) =>
    members.filter(m => m.category === category);
