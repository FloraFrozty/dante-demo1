import { Router, Request, Response } from 'express';
import { oa_cli } from '../../../module/openaiConfig';

export const assitanceMessageListRoute = Router();

export const listMessageAssistance = async (threadID:string) => {
    let allMessages = [];
    let hasMore = true;
    let after = null;
    while (hasMore) {
        const response:any = await oa_cli.beta.threads.messages.list(threadID, {
            limit: 100,
            after: after
        });
        
        const messages = response.data;
        allMessages.push(...messages);
        hasMore = response.has_more;
        if (hasMore) {
            after = messages[messages.length - 1].id;
        }
    }
    return allMessages
}

const listMessageRoute = async (req: Request, res: Response) => {
    try {
        const { threadID } = req.body;
        let allMessages = await listMessageAssistance(threadID);
        allMessages.reverse();
        res.status(200).json({ historyThread: allMessages });
    } catch (error:any) {
        res.status(500).json({ error: error.message });
    }
  }

assitanceMessageListRoute.post('/list', listMessageRoute);