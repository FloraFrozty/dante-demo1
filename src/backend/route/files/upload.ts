import { Router, Request, Response } from 'express';
import { oa_cli } from '../../module/openaiConfig';
import fs from 'fs';

export const filesUploadRoute = Router();

const uploadFile = async (req: Request, res: Response): Promise<void> => {
    
    try {
        const { filePath } = req.body;

        const file = await oa_cli.files.create({ 
            file: fs.createReadStream(filePath),
            purpose: "assistants"}
        )

        res.status(200).json({ result: file });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Unknown error' });
        }
    }
};

filesUploadRoute.post('/upload', uploadFile);