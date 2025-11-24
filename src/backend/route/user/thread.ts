// import { Router, Request, Response } from 'express';
// import { mongoClient } from '../../module/mongoDbConfig';

// export const userThreadRoute = Router();

// const getThread = async (req: Request, res: Response) => {
//   const auth0_id = req.oidc.user?.sub ?? '';
//   try {
//     await mongoClient.connect();
//     const db = mongoClient.db('dante');

//     // ensure user exists and is approved
//     const user = await db.collection('users').findOne({ auth0_id });
//     if (!user || !user.approved || !user.UID) {
//       res.status(403).json({ message: 'Access denied' });
//       return;
//     }

//     // load thread from Mongo
//     const files = db.collection('user_files');
//     const record = await files.findOne<{ auth0_id: string; chat: any }>({ auth0_id });
//     if (!record) {
//       res.status(404).json({ error: 'No thread found for this user' });
//       return;
//     }

//     res.status(200).json({ thread: record.chat });
//   } catch (err) {
//     console.error('getThread error:', err);
//     if (err instanceof Error) {
//       res.status(500).json({ error: err.message });
//     } else {
//       res.status(500).json({ error: 'Unknown error' });
//     }
//   } 
// };

// const updateThread = async (req: Request, res: Response) => {
//   const auth0_id = req.oidc.user?.sub ?? '';
//   const newThread = req.body;
//   try {
//     await mongoClient.connect();
//     const db = mongoClient.db('dante');

//     // ensure user exists and is approved
//     const user = await db.collection('users').findOne({ auth0_id });
//     if (!user || !user.approved || !user.UID) {
//       res.status(403).json({ message: 'Access denied' });
//       return;
//     }

//     // upsert the chat field
//     const files = db.collection('user_files');
//     await files.updateOne(
//       { auth0_id },
//       { $set: { chat: newThread } },
//       { upsert: true }
//     );

//     res.status(200).json({ message: 'Thread updated', thread: newThread });
//   } catch (err) {
//     console.error('updateThread error:', err);
//     if (err instanceof Error) {
//       res.status(500).json({ error: err.message });
//     } else {
//       res.status(500).json({ error: 'Unknown error' });
//     }
//   } 
// };

// userThreadRoute.get('/thread', getThread);
// userThreadRoute.post('/thread', updateThread);
