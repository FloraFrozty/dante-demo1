import { Router, Request, Response } from 'express';
import { vectorFilesRoute } from './files/index'

export const vectorRoute = Router();

vectorRoute.use("/files",vectorFilesRoute);