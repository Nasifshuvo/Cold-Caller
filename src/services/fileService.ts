import { Phone, Lead } from "@/types/phone";
import fs from "fs";
import path from "path";

export class FileService {
    private static getStoragePath(): string {
        const storagePath = path.join(process.cwd(), 'app', '(admin)', 'dashboard', 'data');
        if (!fs.existsSync(storagePath)) {
            fs.mkdirSync(storagePath, { recursive: true });
        }
        return path.join(storagePath, 'leads.json');
    }

    static async getLeads(): Promise<Lead[]> {
        const filePath = this.getStoragePath();
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = await fs.promises.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    }

    static async savePhones(userId: string, phones: Phone[]): Promise<void> {
        const filePath = this.getStoragePath();
        let existingLeads: Lead[] = [];
        
        // Load existing leads if file exists
        if (fs.existsSync(filePath)) {
            const data = await fs.promises.readFile(filePath, 'utf-8');
            existingLeads = JSON.parse(data);
        }

        // Convert phones to leads and append
        const lastSerial = existingLeads.length > 0 
            ? Math.max(...existingLeads.map(lead => lead.serial))
            : 0;

        const newLeads: Lead[] = phones.map((phone, index) => ({
            serial: lastSerial + index + 1,
            phone: phone.phoneNumber,
            uploadedAt: phone.createdAt,
            callStatus: 'pending',
            appointmentBooked: false
        }));

        // Merge existing and new leads
        const updatedLeads = [...existingLeads, ...newLeads];
        
        // Save to file
        await fs.promises.writeFile(
            filePath, 
            JSON.stringify(updatedLeads, null, 2)
        );
    }
} 