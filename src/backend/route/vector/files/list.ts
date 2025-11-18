import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';
import { oa_cli } from '../../../module/openaiConfig';

export const vectorFilesListRoute = Router();

// paginate through every page of files (limit=100, using `after` cursor)
const listAllVectorFiles = async (vectorStoreID: string) => {
  const allFiles: any[] = [];
  let hasMore = true;
  let after: string | undefined;

  while (hasMore) {
    const resp: any = await oa_cli.vectorStores.files.list(
      vectorStoreID,
      { limit: 100, after }
    );

    allFiles.push(...resp.data);

    hasMore = resp.has_more;
    if (hasMore && resp.data.length) {
      after = resp.data[resp.data.length - 1].id;
    }
  }

  return allFiles;
};

const listFile = async (req: Request, res: Response) => {
  try {
    // 0. ensure user is authenticated
    const auth0_id = req.oidc?.user?.sub;
    if (!auth0_id) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // 1. look up this user’s vector_store_id in Mongo
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

    // 2. page through and list _all_ files
    const files = await listAllVectorFiles(userEnv.vector_store_id);

    res.status(200).json({ files });
    return;
  } catch (error: any) {
    console.error("[vectorFilesList] error:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};

// POST /vector/files/list
vectorFilesListRoute.post('/list', listFile);