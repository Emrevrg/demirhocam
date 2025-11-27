
import { SubscriptionType } from './types';

export const DESK_LAYOUT = {
  leftColumn: Array.from({ length: 12 }, (_, i) => i + 1), // 1-12
  midLeftColumn: [...Array.from({ length: 8 }, (_, i) => i + 13), 35], // 13-20, 35
  midRightColumn: [...Array.from({ length: 5 }, (_, i) => i + 21), ...Array.from({ length: 4 }, (_, i) => i + 31)], // 21-25, 31-34
  rightColumn: Array.from({ length: 5 }, (_, i) => i + 26), // 26-30
};

export const ALL_DESK_NUMBERS = [
  ...DESK_LAYOUT.leftColumn,
  ...DESK_LAYOUT.midLeftColumn,
  ...DESK_LAYOUT.midRightColumn,
  ...DESK_LAYOUT.rightColumn,
].sort((a, b) => a - b);

export const DESK_COLORS = {
  EMPTY: 'bg-green-500 hover:bg-green-600',
  [SubscriptionType.MONTHLY]: 'bg-red-500 hover:bg-red-600',
  [SubscriptionType.YEARLY]: 'bg-purple-400 hover:bg-purple-500',
  [SubscriptionType.TRIAL]: 'bg-yellow-400 hover:bg-yellow-500',
};

export const DEFAULT_SETTINGS = {
  netgsm: {
    apiKey: '',
    username: '',
    password: '',
    header: 'DEMIRHOCA',
  },
  smtp: {
    email: 'demirhocamsalonu@gmail.com',
    appPassword: '2EE995AA', // Not: Bu normalde şifrelenmelidir, kullanıcı isteği üzerine demo için buraya eklendi.
  },
  security: {
    adminPin: '1234',
  },
  pricing: {
    monthlyPrice: 1500,
    yearlyPrice: 15000,
    trialPrice: 0,
  }
};

export const MOCK_STUDENTS = []; // Start empty
