export interface Lead {
    serial: number;
    phone: string;
    uploadedAt: string;
    callStatus: 'pending' | 'called' | 'no-answer' | 'invalid';
    response?: string;
    appointmentBooked: boolean;
}

export interface Phone {
    phoneNumber: string;
    createdAt: string;
} 