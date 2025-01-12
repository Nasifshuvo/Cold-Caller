import { Phone } from "./phone";

export interface PhoneData {
    phones: string[];
    userId: string;
}

export interface FileUploadResponse {
    success: boolean;
    message: string;
    data?: Phone[];
} 