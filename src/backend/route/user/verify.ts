import { Router, Request, Response } from 'express';
import { mongoClient } from '../../module/mongoDbConfig';

export const userVerifyRoute = Router();

const verifyUser = async (req: Request, res: Response) => {
  // 0️⃣ Not authenticated?
  if (!req.oidc?.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const auth0_id = req.oidc.user.sub;

  try {
    // 1️⃣ Connect & get collections
    await mongoClient.connect();
    const db        = mongoClient.db('dante');
    const users     = db.collection('users');
    const filesColl = db.collection('user_files');
    const envColl   = db.collection('user_env');

    // 2️⃣ Ensure user document exists
    let user = await users.findOne({ auth0_id });
    if (!user) {
      // create the user
      const initial = {
        auth0_id,
        UID: String(Date.now()),
        approved: false,
        createdAt: new Date(),
        preferences: { theme: 'dark', language: 'en' }
      };
      await users.insertOne(initial);
      await filesColl.insertOne({ auth0_id, profile: null, chat: null });
      await envColl.insertOne({ auth0_id, assistant_id: null, vector_store_id: null });

      // re-fetch so we get back the generated _id
      user = await users.findOne({ auth0_id });
      
      res.status(403).json({ message: 'Awaiting admin approval' });
      return;
    }

    // 3️⃣ Ensure they also have a `user_files` record
    const filesRecord = await filesColl.findOne({ auth0_id });
    if (!filesRecord) {
      await filesColl.insertOne({ auth0_id, profile: null, chat: null });
    }

    // 4️⃣ Fetch their files/env back out
    const userFiles = await filesColl.findOne({ auth0_id });
    const userEnv   = await envColl.findOne({ auth0_id });

    // 5️⃣ If not yet approved, block
    if (!user.approved) {
      res.status(403).json({ message: 'Awaiting admin approval' });
      return;
    }

    // 6️⃣ All good—send back Mongo‐driven state
    res.status(200).json({
      message:   'Access granted',
      user,
      userFiles,
      userEnv
    });

  } catch (err: any) {
    console.error('[verifyUser]', err);
    res.status(500).json({ error: err.message });
  } 
};

// only mount the `/verify` endpoint here;
userVerifyRoute.get('/verify', verifyUser);