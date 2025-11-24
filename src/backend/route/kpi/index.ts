import { Router } from 'express';
import { kpiClickRoute } from './click'

export const kpiRoute = Router();

kpiRoute.use(kpiClickRoute)