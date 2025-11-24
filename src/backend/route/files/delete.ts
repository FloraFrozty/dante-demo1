// src/backend/route/files/delete.ts
import { Router, Request, Response } from 'express';
import { oa_cli } from '../../module/openaiConfig';

// match the name you’ll import elsewhere
export const filesDeleteRoute = Router();

filesDeleteRoute.post('/delete', async (req: Request, res: Response) => {
  const { fileID } = req.body;

  if (!fileID) {
    console.error('‼ [files/delete] missing fileID');
    res.status(400).json({ error: 'Missing fileID' });
    return;
  }

  try {
    // the OpenAI TS SDK calls this “delete”, not “del”
    const result = await oa_cli.files.del(fileID);
    res.json({ ok: true, result });
    return;
  } catch (err) {
    console.error('‼ [files/delete] error calling OpenAI:', err);
    if (err instanceof Error) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'An unknown error occurred' });
    }
    return;
  }
});