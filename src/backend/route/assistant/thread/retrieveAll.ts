// src/route/assistant/thread/retrieveAll.ts
import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';

export const assistantThreadRetrieveAllRoute = Router();

assistantThreadRetrieveAllRoute.get('/retrieveAll', async (req: Request, res: Response) => {
  try {
    // 0. ensure user is authenticated
    const auth0_id = req.oidc?.user?.sub;
    if (!auth0_id) {
        res.status(401).json({ error: 'Not authenticated' });
        return
    }

    // 1. fetch this user’s threads document
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const coll = db.collection<{
      auth0_id: string;
      threads: Record<string, any[]>;
    }>('user_files');

    const userDoc = await coll.findOne({ auth0_id });
    

    if (!userDoc) {
      // no threads yet for this user
        res.status(200).json({ threadID: {} });
        return
    }

    // 2. return the full threads map
    res.status(200).json({ threadID: userDoc.threads });
    return;
  } catch (err: any) {
    console.error('[retrieveAllThread] error =', err);
    res.status(500).json({ error: err.message });
    return;
  }
});
