// src/backend/route/kpi/click.ts
import { Router, Request, Response } from 'express';
import { mongoClient } from '../../module/mongoDbConfig';

export const kpiClickRoute = Router();

const kpiClick = async (req: Request, res: Response) => {
  try {
    const { event, page, sessionId, spreadType } = req.body;  // 👈 [CHANGED] extra fields

    if (!event) {
      res.status(400).json({ error: '`event` is required' });
      return;
    }

    const auth0_id = req.oidc?.user?.sub || null;             // 👈 user if logged in

    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const coll = db.collection('kpi_clicks');

    await coll.insertOne({
      event,
      page: page || null,
      auth0_id,                    // ✅ who clicked
      sessionId: sessionId || null,  // ✅ which session/tab
      spreadType: spreadType || null, // ✅ which spread
      createdAt: new Date(),
    });

    res.status(201).json({ ok: true });
  } catch (error) {
    console.error('kpiClick error:', error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message ?? 'Internal server error' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

kpiClickRoute.post('/click', kpiClick);