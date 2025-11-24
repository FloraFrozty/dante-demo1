import { Router } from 'express';
import { emoteHandleRoute } from './handle';

export const emoteRoute = Router();

emoteRoute.use(emoteHandleRoute);