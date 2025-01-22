import type { NextApiRequest, NextApiResponse } from 'next';
import { CSVService } from '@/services/csvService';
import formidable from 'formidable';
import { FileUploadResponse } from '@/types/file';
import { promises as fsPromises } from 'fs';

// Disable the default body parser to handle form data
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<FileUploadResponse>
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            message: 'Method not allowed' 
        });
    }

    try {
        const form = formidable();
        
        // Parse the form data
        const [, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const fileArray = files.file;
        const fileData = Array.isArray(fileArray) ? fileArray[0] : fileArray;
        if (!fileData || !('filepath' in fileData)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid file upload'
            });
        }

        // Read the file content
        const fileContent = await fsPromises.readFile(fileData.filepath, 'utf8');
        
        const phones = CSVService.parseCSVContent(fileContent);
        // await FileService.savePhones(userId, phones); // Commented out saving

        return res.status(200).json({
            success: true,
            message: 'File processed successfully',
            data: phones
        });

    } catch (error) {
        console.error('Upload error:', error);
        return res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Upload failed'
        });
    }
} 