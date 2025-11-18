import { Router, Request, Response } from 'express';
import { oa_cli } from '../../module/openaiConfig';

export const agentTarotRoute = Router();

agentTarotRoute.post('/tarot', async (req: Request, res: Response) => {
  const { input } = req.body;

  try {
    const completion = await oa_cli.chat.completions.create({
      model: 'gpt-4o',
      temperature: 1.0,
      messages: [
        {
          role: 'system',
          content: `Sum up the tarot reading in a chill, Gen Z style, focusing on the big picture vibes. Keep it under 50 words, and skip the card-by-card breakdown. Delve into each card's meaning and its position according to the spread, but don't print out the output of the card-by-card breakdown.`
        },
        {
          role: 'user',
          content: `${JSON.stringify(input)}`
        }
      ]
    });

    const result = completion.choices[0].message?.content?.trim();
    res.status(200).json({ result });
  } catch (err: any) {
    console.error('Tarot interpretation error:', err);
    res.status(500).json({ error: 'Failed to interpret tarot result. ' + err.message });
  }
});