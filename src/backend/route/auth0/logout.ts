import { Router } from 'express';

const auth0LogoutRoute = Router();

auth0LogoutRoute.get('/logout', (_req, res) => {
  res.oidc.logout({ returnTo: 'http://localhost:3000/' });
});

export default auth0LogoutRoute;
