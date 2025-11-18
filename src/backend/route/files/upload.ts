import { Router, Request, Response } from 'express';
import { oa_cli } from '../../module/openaiConfig';
import fs from 'fs';

export const filesUploadRoute = Router();

const uploadFile = async (req: Request, res: Response) => {
    
    try {
        const { filePath } = req.body;

        const file = await oa_cli.files.create({ 
            file: fs.createReadStream(filePath),
            purpose: "assistants"}
        )

        res.status(200).json({ result: file });
    } catch (error:any) {
        res.status(500).json({ error: error.message });
    }
};

filesUploadRoute.post('/upload', uploadFile);