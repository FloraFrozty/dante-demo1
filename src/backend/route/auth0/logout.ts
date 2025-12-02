import { Router } from 'express';

const auth0LogoutRoute = Router();

auth0LogoutRoute.get('/logout', (_req, res) => {
  res.oidc.logout({ returnTo: process.env.NEXT_PUBLIC_APP_BASE_URL ?? 'http://localhost:8080' });
});

export default auth0LogoutRoute;
