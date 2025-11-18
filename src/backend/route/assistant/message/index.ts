import { Router, Request, Response } from 'express';
import { assitanceMessageCreateRoute } from './create'
import { assitanceMessageListRoute } from './list'

export const assistantMessageRoute = Router();

assistantMessageRoute.use(assitanceMessageCreateRoute)
assistantMessageRoute.use(assitanceMessageListRoute)