import type { Show } from '../types';

export const shows: Show[] = [
    {
        id: 'show-1',
        date: '2026-01-24',
        venue: 'PRAHA VENUE',
        city: 'Praha',
        country: 'CZ',
        ticketUrl: 'https://goout.net/sk/vranov-music+hostia/szqwcfy',
        isPast: false,
    },
    {
        id: 'show-2',
        date: '2026-02-14',
        venue: 'FUGA',
        city: 'Bratislava',
        country: 'SK',
        ticketUrl: '#',
        isPast: false,
    },
    {
        id: 'show-3',
        date: '2026-03-08',
        venue: 'TABAČKA',
        city: 'Košice',
        country: 'SK',
        ticketUrl: '#',
        isPast: false,
    },
    // Past shows
    {
        id: 'show-past-1',
        date: '2026-01-10',
        venue: 'FUGA',
        city: 'Bratislava',
        country: 'SK',
        isPast: true,
    },
    {
        id: 'show-past-2',
        date: '2025-12-27',
        venue: 'TABAČKA',
        city: 'Košice',
        country: 'SK',
        isPast: true,
    },
];

export const getUpcomingShows = () => shows.filter(s => !s.isPast);
export const getPastShows = () => shows.filter(s => s.isPast);
