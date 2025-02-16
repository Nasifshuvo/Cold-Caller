export interface Client {
  id: number;
  name?: string;
  email: string;
  phone: string;
  userId: number;
  balance: string;
  vapiKey?: string;
  vapiAssistantId?: string;
  vapiPhoneNumberId?: string;
  estimatedCallCost?: string | number;
  active: boolean;
  user: {
    email: string;
    active: boolean;
  };
} 