// backend/route/auth0/login.ts
import { Router } from 'express';

const auth0LoginRoute = Router();

auth0LoginRoute.get('/login', (req, res) => {
  res.oidc.login({ returnTo: 'http://localhost:3000/' });
});

export default auth0LoginRoute;