import { Router } from 'express';
import { filesUploadRoute } from './upload'
import { filesDeleteRoute } from './delete'

export const filesRoute = Router();

filesRoute.use(filesUploadRoute)
filesRoute.use(filesDeleteRoute)