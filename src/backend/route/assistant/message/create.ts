import { Router, Request, Response } from 'express';
import { oa_cli } from '../../../module/openaiConfig';

export const assitanceMessageCreateRoute = Router();

const createMessage = async (req: Request, res: Response) => {
    
    try {
        const { threadID, message } = req.body;

        await oa_cli.beta.threads.messages.create(threadID, {
            role: "user",
            content: [{ type: "text", text: message }]
        });

        res.status(200).json({ message: "Message sent successfully" });
    } catch (error:any) {
        res.status(500).json({ error: error.message });
    }
};

assitanceMessageCreateRoute.post('/create', createMessage);