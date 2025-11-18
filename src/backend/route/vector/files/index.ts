import { Router, Request, Response } from 'express';
import { vectorFilesAttachRoute } from './attach'
import { vectorFilesListRoute } from './list'

export const vectorFilesRoute = Router();

vectorFilesRoute.use(vectorFilesAttachRoute)
vectorFilesRoute.use(vectorFilesListRoute)