import { Decimal } from '@prisma/client/runtime/library';

export interface Client {
  id: number;
  name: string | null;
  email: string;
  phone: string;
  balanceInSeconds: Decimal;
  vapiKey: string | null;
  vapiAssistantId: string | null;
  vapiPhoneNumberId: string | null;
  estimatedCallCost: number | null;
  estimatedMinutesPerCall: Decimal;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: {
    email: string;
    active: boolean;
  };
}

// For auth purposes, we convert minutes to seconds
export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  balanceInSeconds: string;
} 