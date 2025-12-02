import { Router, Request, Response } from 'express';
// import { assistantRoute } from './assistant/index';
import { emoteRoute } from './emote/index';
import { agentRoute } from './agent/index';
import { filesRoute } from './files/index';
import { kpiRoute } from './kpi/index';
// import { vectorRoute } from './vector/index';
import { userRoute } from './user/index';
import { auth0Route } from './auth0/index';
import { requiresAuth } from 'express-openid-connect';

export const route = Router();

// route.use("/assistant",assistantRoute);
// route.use("/emote",emoteRoute);
// route.use("/agent",agentRoute);

// route.use("/assistant",requiresAuth(),assistantRoute);
route.use("/emote",requiresAuth(),emoteRoute);
route.use("/agent",requiresAuth(),agentRoute);
route.use("/files",requiresAuth(),filesRoute);
route.use("/kpi",requiresAuth(),kpiRoute);
// route.use("/vector",requiresAuth(),vectorRoute);
route.use("/user",requiresAuth(),userRoute);
route.use("/auth0",requiresAuth(),auth0Route);