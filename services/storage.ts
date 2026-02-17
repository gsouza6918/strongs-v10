
import { AppData, User, UserRole, ConfTier } from '../types';

const STORAGE_KEY = 'strongs_brazil_db_v2';

// Helper to create empty weeks structure
const createEmptyWeeks = () => {
    return Array(4).fill(null).map(() => ({
        games: Array(4).fill(null).map(() => ({
            result: 'NONE',
            attendance: 'NONE'
        }))
    }));
};

const DEFAULT_DATA: AppData = {
  currentUser: null,
  users: [
    {
      id: 'u1',
      username: 'DiSouza',
      password: 'eusou123',
      name: 'DiSouza',
      role: UserRole.OWNER,
    }
  ],
  confederations: [
    { 
      id: 'c1', 
      name: 'Strongs Alpha', 
      tier: ConfTier.SUPREME,
      imageUrl: 'https://cdn-icons-png.flaticon.com/512/9309/9309390.png',
      active: true
    },
    { 
      id: 'c2', 
      name: 'Strongs Beta', 
      tier: ConfTier.DIAMOND,
      imageUrl: '',
      active: true
    }
  ],
  members: [], // Start empty to avoid conflict, user can add via Admin Panel
  news: [
    {
      id: 'n1',
      title: 'Bem-vindo à Strongs Brazil',
      subject: 'Inauguração',
      coverImage: 'https://picsum.photos/seed/soccer/800/400',
      content: '<p>Sejam bem-vindos à maior comunidade de Top Eleven do Brasil. Junte-se a uma de nossas confederações!</p>',
      date: new Date().toISOString()
    }
  ],
  top100History: [],
  joinApplications: [],
  archivedSeasons: []
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
        const parsedData = JSON.parse(stored);
        // Ensure structure integrity on load
        if (!parsedData.members) parsedData.members = [];
        if (!parsedData.confederations) parsedData.confederations = [];
        return parsedData;
    } catch (e) {
        console.error("Error loading local data, resetting to default.");
    }
  }
  return DEFAULT_DATA;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};
