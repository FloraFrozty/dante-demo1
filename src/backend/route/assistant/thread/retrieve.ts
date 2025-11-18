// src/backend/route/assistant/thread/retrieve.ts
import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';
export const assistantThreadRetrieveRoute = Router();

assistantThreadRetrieveRoute.get('/retrieve', async (req: Request, res: Response) => {
  const auth0_id = req.oidc?.user?.sub;
  if (!auth0_id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  try {
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const filesColl = db.collection<{ auth0_id: string; chat: Record<string, any[]> }>('user_files');
    const userDoc = await filesColl.findOne({ auth0_id });
    const chat = userDoc?.chat || {};

    // get all thread IDs in insertion order
    const ids = Object.keys(chat);
    if (ids.length === 0) {
      res.status(404).json({ error: 'No threads found' });
      return;
    }

    // return only the last one
    const latest = ids[ids.length - 1];
    res.json({ threadID: latest });
    return;
  
  } catch (err: any) {
    console.error('retrieveThread error:', err);
    res.status(500).json({ error: err.message });
    return;
  }
});
