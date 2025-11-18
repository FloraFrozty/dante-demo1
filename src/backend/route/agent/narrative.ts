import { Router, Request, Response } from 'express';
import { mongoClient } from '../../module/mongoDbConfig';
import { oa_cli } from '../../module/openaiConfig';

export const agentNarrativeRoute = Router();

agentNarrativeRoute.post('/narrative', async (req: Request, res: Response) => {
  const auth0_id = req.oidc?.user?.sub;
  if (!auth0_id) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  const { threadID } = req.body;
  if (!threadID) {
    res.status(400).json({ error: 'Missing threadID' });
    return;
  }

  try {
    // 1️⃣ connect to Mongo
    await mongoClient.connect();
    const db = mongoClient.db('dante');
    const filesColl = db.collection<{
      auth0_id: string;
      profile?: string;
      chat?: Record<string, { date: string; note?: any; warning?: boolean }>;
    }>('user_files');

    // 2️⃣ fetch the user doc and ensure chat.<threadID> exists
    const userDoc = await filesColl.findOne({ auth0_id });
    if (!userDoc || !userDoc.chat || !userDoc.chat[threadID]) {
      res.status(400).json({ error: `Thread ${threadID} not found` });
      return;
    }

    // 3️⃣ retrieve all messages from OpenAI
    let allMessages: any[] = [];
    let hasMore = true;
    let after: string | undefined = undefined;

    while (hasMore) {
      const resp: any = await oa_cli.beta.threads.messages.list(threadID, {
        limit: 100,
        after
      });
      allMessages.push(...resp.data);
      hasMore = resp.has_more;
      if (hasMore) {
        after = resp.data[resp.data.length - 1].id;
      }
    }

    // 4️⃣ filter only user messages
    const userMessages = allMessages
      .filter(m => m.role === 'user')
      .map(({ role, content }) => ({ role, content }));

    // 5️⃣ build narrative via LLM
    const noteComp = await oa_cli.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are memory agent. You will follow these instructions stricty and nothng else.

 You will be given a JSON array of messages; each message is an object with two keys:
- 'role': 'user'
- 'content': a plain text string

Your goal is to analyse the message from the 'user' and summarise them into a natural cohesive paragraph-style narrative which combines following aspects:

- Describe the user's background and roles, weaving in any relevant context about their profile.
- Highlight their preferences, including likes, dislikes, core values, beliefs, styles, speech patterns, and any notable catchphrases.
- Discuss their goals, whether short-term or long-term, and any projects or aspirations they mention.
- Include any miscellaneous details, such as non-critical tidbits or random thoughts that add depth to their character.
- Address recurring themes or unresolved topics, noting anything that seemed important but unspoken.

If information for a specific category is not provided, focus on the available details and maintain a smooth, flowing narrative. Avoid explicitly listing categories or bullet points; instead, blend the information into a cohesive and engaging summary.`
        },
        {
          role: 'user',
          content: JSON.stringify(userMessages, null, 2)
        }
      ]
    });

    const rawSummary = noteComp.choices[0].message?.content || '';
    const now = new Date();
    const updatedAt = [
      String(now.getDate()).padStart(2, '0'),
      String(now.getMonth() + 1).padStart(2, '0'),
      now.getFullYear()
    ].join('-');

    // 6️⃣ write back only note + warning under chat.<threadID>
    await filesColl.updateOne(
      { auth0_id },
      {
        $set: {
          [`chat.${threadID}.note`]: { summary: rawSummary, updatedAt },
          [`chat.${threadID}.warning`]: false
        }
      },
      { upsert: true }
    );

    // 7️⃣ return the new note
    res.status(200).json({
      threadID,
      note: { summary: rawSummary, updatedAt }
    });
  } catch (err: any) {
    console.error('[agentNarrative] error:', err);
    res.status(500).json({ error: err.message });
  }
});