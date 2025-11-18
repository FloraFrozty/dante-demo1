import { Router, Request, Response } from 'express';
import { assistantThreadRoute } from './thread/index'
import { assistantMessageRoute } from './message/index'
import { assistantRunRoute } from './run/index'

export const assistantRoute = Router();

assistantRoute.use("/thread",assistantThreadRoute);
assistantRoute.use("/message",assistantMessageRoute);
assistantRoute.use("/run",assistantRunRoute);