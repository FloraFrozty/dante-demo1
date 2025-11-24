import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';
import { oa_cli } from '../../../module/openaiConfig';

export const vectorFilesAttachRoute = Router();

const attachFile = async (req: Request, res: Response) => {
  try {
    // 0. ensure user is authenticated
    const auth0_id = req.oidc?.user?.sub;
    if (!auth0_id) {
        res.status(401).json({ error: "Not authenticated" });
        return
    }

    // 1. pull vector_store_id from Mongo
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const envColl = db.collection<{
      auth0_id: string;
      assistant_id?: string;
      vector_store_id?: string;
    }>('user_env');
    const userEnv = await envColl.findOne({ auth0_id });
    

    if (!userEnv?.vector_store_id) {
        res.status(400).json({ error: "No vector_store_id configured for this user" });
        return
    }

    const { fileID } = req.body;
    if (!fileID) {
        res.status(400).json({ error: "Missing fileID" });
        return;
    }

    // 2. attach into *their* vector store
    await oa_cli.vectorStores.files.create(
      userEnv.vector_store_id,
      { file_id: fileID }
    );

    res.status(200).json({ message: "File attached successfully" });
    return
  } catch (error) {
    console.error("[attachFile] error:", error);
    if (error instanceof Error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
    return;
  }
};

vectorFilesAttachRoute.post('/attach', attachFile);