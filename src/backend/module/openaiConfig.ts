import OpenAI from 'openai';

export const oa_cli = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});