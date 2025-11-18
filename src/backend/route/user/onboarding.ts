import { Router, Request, Response } from 'express';
import { mongoClient } from '../../module/mongoDbConfig';

export const userOnboardingRoute = Router();

const checkOnboarding = async (req: Request, res: Response) => {
  const auth0_id = req.oidc.user?.sub ?? '';

  try {
    await mongoClient.connect();
    const db = mongoClient.db('dante');

    // ensure user exists and is approved
    const user = await db.collection('users').findOne({ auth0_id });
    if (!user || !user.approved || !user.UID) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // onboardingAnswers field contains the questionnaire results
    const answers = user.onboardingAnswers ?? null;

    res.status(200).json({ answers });
  } catch (err: any) {
    console.error('checkOnboarding error:', err);
    res.status(500).json({ error: err.message });
  }
};



/* -----------------------------
   POST /user/submitOnboarding
   ----------------------------- */
const submitOnboarding = async (req: Request, res: Response) => {
  const auth0_id = req.oidc.user?.sub ?? '';
  const { ageRange, place, source } = req.body;

  try {
    // Validate presence of all fields
    if (!ageRange || !place || !source) {
      res.status(400).json({ error: 'Missing fields' });
      return;
    }

    await mongoClient.connect();
    const db = mongoClient.db('dante');

    // ensure user exists and is approved
    const user = await db.collection('users').findOne({ auth0_id });
    if (!user || !user.approved || !user.UID) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    // update onboarding answers
    await db.collection('users').updateOne(
      { auth0_id },
      {
        $set: {
          onboardingAnswers: {
            ageRange,
            place,
            source,
            updatedAt: new Date()
          }
        }
      }
    );

    res.status(200).json({ message: 'Onboarding saved' });
  } catch (err: any) {
    console.error('submitOnboarding error:', err);
    res.status(500).json({ error: err.message });
  }
};

userOnboardingRoute.get('/onboarding', checkOnboarding);
userOnboardingRoute.post('/onboarding', submitOnboarding);