import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';
import { oa_cli } from '../../../module/openaiConfig';

export const assistanceRunCreateRoute = Router();

const createAndRun = async (req: Request, res: Response) => {
  try {
    // 0. figure out who’s calling
    const auth0_id = req.oidc?.user?.sub;
    if (!auth0_id) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    // 1. look up this user’s env in Mongo
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const envColl = db.collection<{ auth0_id: string; assistant_id: string }>('user_env');
    const userEnv = await envColl.findOne({ auth0_id });
    

    if (!userEnv?.assistant_id) {
      res.status(400).json({ error: "No assistant_id configured for this user" });
      return;
    }

    const { input } = req.body;

    // 2. Kick off the run with the ID we just fetched
    const thread = await oa_cli.beta.threads.createAndRun({
      assistant_id: userEnv.assistant_id,
      thread: {
        messages: [
          {
            role: "user",
            content: [{ type: "text", text: input }]
          }
        ]
      }
    });

    // 3. handle any required_action/tool calls exactly as before…
    if (thread.status === "requires_action"
        && thread.required_action?.type === "submit_tool_outputs") {

      const toolCalls = thread.required_action.submit_tool_outputs.tool_calls;
      const callId   = toolCalls[0].id;

      const toolOutputs = [
        {
          tool_call_id: callId,
          output: JSON.stringify({
            user_input: input,
            inferred_context: {
              emotional_state: "detected emotional state",
              intent:          "detected intent",
              personality_style: "detected style",
            }
          })
        }
      ];

      await oa_cli.beta.threads.runs.submitToolOutputs(
        thread.thread_id,
        thread.id,
        { tool_outputs: toolOutputs }
      );
    }

    // 4. return the updated thread
    res.status(200).json({ thread });

  } catch (error: any) {
    console.error("createAndRun error:", error);
    res.status(500).json({ error: error.message });
  }
};

assistanceRunCreateRoute.post('/create', createAndRun);