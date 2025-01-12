import { Phone } from "@/types/phone";

export class CSVService {
    /**
     * Parse CSV content and extract phone numbers
     * @param content - CSV file content as string
     * @returns Array of phone objects
     */
    static parseCSVContent(content: string): Phone[] {
        const lines = content.split('\n');
        
        return lines
            .filter(line => line.trim()) // Remove empty lines
            .filter(line => !line.toLowerCase().includes('phone')) // Remove header
            .map(line => {
                // Take first column and clean it
                const phone = line.split(',')[0].trim();
                
                // Skip if phone is empty
                if (!phone) return null;
                
                return {
                    phoneNumber: phone,
                    createdAt: new Date().toISOString()
                };
            })
            .filter((phone): phone is Phone => phone !== null); // Remove null entries
    }
} 