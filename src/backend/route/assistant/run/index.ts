import { Router, Request, Response } from 'express';
import { assistanceRunCreateRoute } from './create'
import { assistanceRunExecuteRoute } from './execute'
import { assistanceRunListRoute } from './list'

export const assistantRunRoute = Router();

assistantRunRoute.use(assistanceRunCreateRoute)
assistantRunRoute.use(assistanceRunExecuteRoute)
assistantRunRoute.use(assistanceRunListRoute)