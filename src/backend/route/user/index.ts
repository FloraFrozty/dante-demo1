import { Router, Request, Response } from 'express';
import { userVerifyRoute } from './verify'
import { userProfileRoute } from './profile'
import { userThreadRoute } from './thread'
import { userOnboardingRoute } from './onboarding'

export const userRoute = Router();

userRoute.use(userVerifyRoute)
userRoute.use(userProfileRoute)
userRoute.use(userThreadRoute)
userRoute.use(userOnboardingRoute)