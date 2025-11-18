import { Router, type Request, type Response, type RequestHandler } from 'express';
import { oa_cli } from '../../module/openaiConfig';

export const agentTarotRoute = Router();

const VECTOR_STORE_ID = 'vs_6874ef51266081918ecbd1cccb3f127e';

const safeText = (r: any): string => {
  if (typeof r?.output_text === 'string') return r.output_text.trim();
  if (Array.isArray(r?.output) && r.output[0]?.content?.[0]?.type === 'output_text') {
    return (r.output[0].content[0].text || '').trim();
  }
  if (r?.choices?.[0]?.message?.content) return String(r.choices[0].message.content).trim();
  return '';
};

async function identifyLanguage(inputText: string): Promise<'Thai' | 'English' | 'other'> {
  const resp = await oa_cli.chat.completions.create({
    model: 'gpt-4o',
    temperature: 0,
    top_p: 0,
    messages: [
      {
        role: 'system',
        content:
          'You will classify user’s natural language question’s main language used into a domain. ' +
          'Choose exactly one: "Thai" | "English" | "other". Output exactly one word with no extras.'
      },
      { role: 'user', content: inputText }
    ]
  });
  const lang = safeText(resp);
  if (lang === 'Thai' || lang === 'English' || lang === 'other') return lang;
  const lc = lang.toLowerCase();
  if (lc.includes('thai')) return 'Thai';
  if (lc.includes('english') || lc.includes('eng')) return 'English';
  return 'other';
}

async function tarotReasoning(inputText: string): Promise<string> {
  const resp = await oa_cli.responses.create({
    model: 'gpt-4o',
    instructions:
      'You are interpreting a tarot reading based only on the supplied file sources via the file_search tool. ' +
      'Reason systematically, alternating between natural language explanations and DSL-like snippets when helpful. ' +
      'Do NOT use outside knowledge—cite/ground to the provided files only.',
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: inputText }]
      }
    ],
    tools: [{ type: 'file_search', vector_store_ids: [VECTOR_STORE_ID] }],
    temperature: 1,
    top_p: 1,
    max_output_tokens: 2048
  });

  return safeText(resp);
}

async function genZify(reasoning: string): Promise<string> {
  const instructions =
    `Your role is to write a short (3–4 sentence) conclusion that summarizes the vibe + message based on this reasoning prompt:\n\n` +
    `${reasoning}\n\n` +
    `Make it sound like you’re texting a friend: informal, playful, and empathetic.\n\n` +
    `Output Format:\nYour final message in full Gen Z tone — keep it warm, real, and slightly chaotic in the best way 💅\n` +
    `Use slang, stretched words, or emojis naturally.`;

  const resp = await oa_cli.chat.completions.create({
    model: 'gpt-4o',
    temperature: 1,
    top_p: 1,
    messages: [
      { role: 'system', content: instructions },
      { role: 'user', content: 'Write the final message only.' }
    ]
  });

  return safeText(resp);
}

const toInputText = (input: unknown): string => {
  if (input == null) return '';
  if (typeof input === 'string') return input;
  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
};

const tarotRouteHandler: RequestHandler = async (req, res): Promise<void> => {
  const { input } = req.body as { input?: unknown };

  const inputText = toInputText(input);
  if (!inputText || inputText.trim().length === 0) {
    res.status(400).json({ error: 'Missing "input". Provide a string or object with tarot data.' });
    return;
  }

  try {
    const language = await identifyLanguage(inputText);
    const reasoning = await tarotReasoning(inputText);

    if (language === 'English') {
      const result = await genZify(reasoning);
      res.status(200).json({ language, reasoning, result });
      return;
    }

    res.status(200).json({ language, result: reasoning });
  } catch (err: any) {
    console.error('Tarot interpretation error:', {
      message: err?.message,
      code: err?.code,
      status: err?.status,
      data: err?.response?.data,
    });
    res.status(500).json({
      error: 'Failed to interpret tarot result.',
      detail: err?.response?.data ?? err?.message ?? 'Unknown error',
    });
  }
};

/* ⬇⬇⬇ THIS IS THE LINE YOU’RE LOOKING FOR ⬇⬇⬇ */
agentTarotRoute.post('/tarot', tarotRouteHandler);
/* (optional debug)
agentTarotRoute.get('/__whoami', (_req, res) => res.json({ base: '/agent', routes: ['/tarot'] }));
*/