import { Router, Request, Response } from 'express';
import { assistantThreadRetrieveRoute } from './retrieve'
import { assistantThreadRetrieveAllRoute } from './retrieveAll'
import { assistantThreadUpdateRoute } from './update'

export const assistantThreadRoute = Router();

assistantThreadRoute.use(assistantThreadRetrieveRoute)
assistantThreadRoute.use(assistantThreadRetrieveAllRoute)
assistantThreadRoute.use(assistantThreadUpdateRoute)