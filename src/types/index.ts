export type Language = 'es' | 'en' | 'pt';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  coupleCode: string;
  coupleId: string | null;
  language?: Language;
  theme?: ThemeMode;
  createdAt?: any;
}

export interface Couple {
  id: string;
  partner1: string;
  partner2: string;
  createdAt?: any;
}

export type TransactionCategory = 
  | 'Supermercado' 
  | 'Servicios' 
  | 'Restaurantes' 
  | 'Entretenimiento' 
  | 'Transporte' 
  | 'Salud' 
  | 'Otros';

export type TransactionScope = 'personal' | 'shared';
export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id?: string;
  uid: string;
  coupleId?: string | null;
  description: string;
  amount: number;
  category: TransactionCategory;
  type: TransactionType;
  scope: TransactionScope;
  date: string;
  createdAt?: any;
}

export interface Habit {
  id?: string;
  uid: string;
  coupleId?: string | null;
  name: string;
  streak: number;
  completedDates: string[];
  scope: TransactionScope;
}

export interface Task {
  id?: string;
  uid: string;
  coupleId?: string | null;
  title: string;
  completed: boolean;
  assignedTo?: string;
  scope: TransactionScope;
}
