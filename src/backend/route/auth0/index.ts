import { Router } from 'express';
import auth0LogoutRoute from './logout'
import auth0LoginRoute from './login'

export const auth0Route = Router();

auth0Route.use(auth0LogoutRoute)
auth0Route.use(auth0LoginRoute)