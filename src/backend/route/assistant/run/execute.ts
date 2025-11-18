import { Router, Request, Response } from 'express';
import { mongoClient } from '../../../module/mongoDbConfig';
import { oa_cli } from '../../../module/openaiConfig';

export const assistanceRunExecuteRoute = Router();

const executeRun = async (req: Request, res: Response) => {
  try {
    // 0. figure out who’s calling
    const auth0_id = req.oidc?.user?.sub;
    if (!auth0_id) {
        res.status(401).json({ error: "Not authenticated" });
        return;
    }

    // 1. look up this user’s assistant_id in Mongo
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const envColl = db.collection<{ auth0_id: string; assistant_id: string }>('user_env');
    const userEnv = await envColl.findOne({ auth0_id });
    

    if (!userEnv?.assistant_id) {
        res.status(400).json({ error: "No assistant_id configured for this user" });
        return;
    }

    const { threadID } = req.body;
    if (!threadID) {
        res.status(400).json({ error: "Missing threadID" });
        return;
    }

    // 2. start the run and wait until either completion or tool request
    let run = await oa_cli.beta.threads.runs.createAndPoll(
      threadID,
      { assistant_id: userEnv.assistant_id }
    );

    // 3. If the model asks for tool outputs, submit them and poll again
    if (
      run.status === "requires_action" &&
      run.required_action?.type === "submit_tool_outputs"
    ) {
      const callId = run.required_action.submit_tool_outputs.tool_calls[0].id;
      const toolOutputs = [{
        tool_call_id: callId,
        output: "ok"
      }];

      await oa_cli.beta.threads.runs.submitToolOutputs(
        run.thread_id,
        run.id,
        { tool_outputs: toolOutputs }
      );

      // poll until the run fully completes
      run = await oa_cli.beta.threads.runs.poll(
        run.thread_id,
        run.id
      );
    }

    // 4. return the final messages if completed
    if (run.status === 'completed') {
      const msgs = await oa_cli.beta.threads.messages.list(run.thread_id);
      const responses = msgs.data.reverse().map(msg => ({
        role: msg.role,
        text: msg.content[0].type === 'text'
          ? msg.content[0].text.value
          : ''
      }));
        res.status(200).json({ responses });
        return
    }

    // otherwise just return the intermediate status
    res.status(200).json({ status: run.status });
    return;

  } catch (error: any) {
    console.error("executeRun error:", error);
    res.status(500).json({ error: error.message });
    return;
  }
};

assistanceRunExecuteRoute.post('/execute', executeRun);