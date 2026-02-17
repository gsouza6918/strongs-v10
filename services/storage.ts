import { AppData, User, UserRole, ConfTier } from '../types';

const STORAGE_KEY = 'strongs_brazil_db_v2';

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
  ],
  members: [],
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
  joinApplications: []
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    // Migration for existing data (if any) to include active flag
    const parsedData = JSON.parse(stored);
    if (parsedData.confederations) {
      parsedData.confederations = parsedData.confederations.map((c: any) => ({
        ...c,
        active: c.active !== undefined ? c.active : true
      }));
    }
    return parsedData;
  }
  return DEFAULT_DATA;
};

export const saveData = (data: AppData) => {
  // Don't save currentUser to localstorage persistence to avoid auto-login issues in this demo, 
  // or do save it if we want persistence. Let's strictly save the *database*, not the session.
  const { currentUser, ...db } = data; 
  // We need to preserve the DB but we can re-inject current user if needed. 
  // actually for simplicity in this React state model, we will save everything.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};