
export enum UserRole {
  USER = 'USER', // Registered but no access
  MEMBER = 'MEMBER', // Can read news
  MANAGER = 'MANAGER', // "Gestor" - Can edit specific member scores
  MOD = 'MOD', // Can manage confs/members
  ADMIN = 'ADMIN', // Full access
  OWNER = 'OWNER' // "Dono" - Highlighted
}

export enum ConfTier {
  SUPREME = 'SUPREMA', // x1.5
  DIAMOND = 'DIAMANTE', // x1.2
  PLATINUM = 'PLATINA', // x1
  GOLD = 'OURO' // x1
}

export interface User {
  id: string;
  username: string;
  password?: string; // stored simply for demo
  name: string;
  role: UserRole;
  linkedMemberId?: string; // If linked to a game member
  allowedConfIds?: string[]; // IDs das confederações que o Gestor pode editar
}

// --- NEW SETTINGS INTERFACE ---
export interface GlobalSettings {
  activeWeek: number; // 0, 1, 2, or 3
}

export type GameResult = 'WIN' | 'DRAW' | 'LOSS' | 'NONE';
export type Attendance = 'PRESENT' | 'ABSENT' | 'NO_TRAIN' | 'NONE';

export interface GameScore {
  result: GameResult;
  attendance: Attendance;
}

export interface MemberWeeklyData {
  games: GameScore[]; // Index 0-3 for 4 games
}

export interface Member {
  id: string;
  name: string;
  teamName: string;
  confId: string;
  isManager: boolean;
  linkedUserId?: string;
  weeks: MemberWeeklyData[]; // Index 0-3 for 4 weeks
}

export interface Confederation {
  id: string;
  name: string;
  tier: ConfTier;
  imageUrl?: string; // URL for the confederation logo
  active: boolean; // Determines visibility and editability
}

export interface NewsPost {
  id: string;
  title: string;
  subject: string;
  coverImage: string;
  content: string; // HTML allowed
  date: string;
  isPrivate?: boolean; // Controls visibility (True = Members Only, False/Undefined = Public)
}

export interface Top100Entry {
  id: string;
  confId: string;
  season: string;
  rank: number;
  points: number;
  bonus: number;
  dateAdded: string;
}

export interface JoinApplication {
  id: string;
  name: string;
  greens: number;
  tokens: number;
  teamPercentage: number;
  whatsapp: string;
  hasAttributedPlayers: boolean;
  attributedPlayersCount?: number;
  status: 'PENDING' | 'ANSWERED';
  date: string;
}

export interface ArchivedSeason {
  id: string;
  name: string;
  date: string;
  members: Member[];
  confederations: Confederation[];
}

export interface AppData {
  users: User[];
  confederations: Confederation[];
  members: Member[]; // UI uses Array
  membersConf?: Record<string, Member>; // Persistence uses Object Map
  news: NewsPost[];
  top100History: Top100Entry[];
  joinApplications: JoinApplication[];
  archivedSeasons: ArchivedSeason[];
  settings: GlobalSettings; // New Field
  currentUser: User | null;
}
