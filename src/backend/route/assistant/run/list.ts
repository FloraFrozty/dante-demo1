import { Router, Request, Response } from 'express';
import { oa_cli } from '../../../module/openaiConfig';

export const assistanceRunListRoute = Router();

const listRun = async (req: Request, res: Response) => {
    try {
        const { threadID } = req.body;
        const runs = await oa_cli.beta.threads.runs.list(threadID,{
            limit: 100
        });
        // console.log(JSON.stringify(runs,null,2))
        res.status(200).json({ runs });
    } catch (error:any) {
        res.status(500).json({ error: error.message });
    }
}

assistanceRunListRoute.post('/list', listRun);