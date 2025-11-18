import { http } from './http';
import type { SpreadType } from '@/component/types/tarot';

export async function postTarotReading(input: {
  question: string | null;
  cards: string[];
  spreadCount: number;
  spreadType: SpreadType;
}): Promise<string> {
  const res = await http.post('/agent/tarot', { input });
  // API returns { result: string }
  return res.data.result;
}