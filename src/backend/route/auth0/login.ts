// backend/route/auth0/login.ts
import { Router } from 'express';

const auth0LoginRoute = Router();

auth0LoginRoute.get('/login', (req, res) => {
  res.oidc.login({ returnTo: process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:8080' });
});

export default auth0LoginRoute;