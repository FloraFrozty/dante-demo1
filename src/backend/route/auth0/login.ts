// backend/route/auth0/login.ts
import { Router } from 'express';

const auth0LoginRoute = Router();

auth0LoginRoute.get('/login', (req, res) => {
  res.oidc.login({ returnTo: 'https://dante-demo1.vercel.app' });
});

export default auth0LoginRoute;