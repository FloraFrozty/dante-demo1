// import { Router, Request, Response } from 'express';
// import { mongoClient } from '../../module/mongoDbConfig';

// export const userProfileRoute = Router();

// // GET /profile
// userProfileRoute.get('/profile', async (req: Request, res: Response) => {
//   try {
//     const auth0_id = req.oidc?.user?.sub;
//     if (!auth0_id) {
//       res.status(401).json({ error: 'Not authenticated' });
//       return;
//     }

//     await mongoClient.connect();
//     const db = mongoClient.db('dante');
//     const profiles = db.collection<{ auth0_id: string; profile: any; updatedAt: Date }>('user_profiles');

//     const record = await profiles.findOne({ auth0_id });
//     if (!record) {
//       res.status(404).json({ error: 'Profile not found' });
//       return;
//     }

//     res.status(200).json({ profile: record.profile });
//   } catch (err: any) {
//     console.error('Error fetching profile:', err);
//     res.status(500).json({ error: err.message });
//   } 
// });

// // POST /profile
// userProfileRoute.post('/profile', async (req: Request, res: Response) => {
//   try {
//     const auth0_id = req.oidc?.user?.sub;
//     if (!auth0_id) {
//       res.status(401).json({ error: 'Not authenticated' });
//       return
//     }

//     const profileData = req.body;

//     await mongoClient.connect();
//     const db = mongoClient.db('dante');
//     const profiles = db.collection<{ auth0_id: string; profile: any; updatedAt: Date }>('user_profiles');

//     await profiles.updateOne(
//       { auth0_id },
//       { $set: { profile: profileData, updatedAt: new Date() } },
//       { upsert: true }
//     );

//     res.status(200).json({ message: 'Profile updated' });
//   } catch (err: any) {
//     console.error('Error updating profile:', err);
//     res.status(500).json({ error: err.message });
//   } 
// });
