import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';

export const assistantThreadUpdateRoute = Router();

assistantThreadUpdateRoute.post('/update', async (req, res) => {
  const auth0_id = req.oidc?.user?.sub;
  if (!auth0_id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { threadID, readJSON } = req.body;
  if (!threadID || !readJSON) { 
    res.status(400).json({ error: 'Missing threadID or readJSON' }); 
    return
    }

  // build your new entry
  const today = new Date();
  const formattedDate = `${String(today.getDate()).padStart(2,'0')}-${String(today.getMonth()+1).padStart(2,'0')}-${today.getFullYear()}`;
  const newEntry = { date: formattedDate, note: '', warning: false };

  try {
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const filesColl = db.collection('user_files');

    // store it as an object, not an array
    const update = {
      $set: {
        [`chat.${threadID}`]: newEntry
      }
    };

    const result = await filesColl.updateOne(
      { auth0_id },
      update,
      { upsert: true }
    );

    res.status(200).json({
      ok: true,
      modifiedCount: result.modifiedCount,
      thread: { [threadID]: newEntry }
    });
  } catch (err: any) {
    console.error('updateThread error:', err);
    res.status(500).json({ error: err.message });
  }
});
