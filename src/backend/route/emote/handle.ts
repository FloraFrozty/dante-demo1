import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export const emoteHandleRoute = Router();

const handleEmote = async (req: Request, res: Response) => {
    try {
        const { emoteString,URL_CONFIG } = req.body;

        const result = emoteString.replace(/:([\w_]+):/g, (match: string, emoteName: string) => {
            const emoteFile = `${emoteName}.png`;
            const emotePath = path.join(process.cwd(), 'component', 'customEmote', emoteFile);

            if (fs.existsSync(emotePath)) {
                const imgSrc = `${URL_CONFIG.url}/component/customEmote/${emoteFile}`;
                return `<img src="${imgSrc}" alt="${emoteName}" style="height: 1em; vertical-align: middle;" />`;
            }

            return match; // Return original :token: if not found
        });

        res.status(200).json({ emote: result });
    } catch (error) {
        if (error instanceof Error) {
            res.status(500).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An unknown error occurred.' });
        }
    }
};


  emoteHandleRoute.post('/handle', handleEmote);