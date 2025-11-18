import { Router, Request, Response } from 'express';
import { agentNarrativeRoute } from './narrative'
import { agentInputGuardrailRoute } from './guardrailInput'
import { agentOutputGuardrailRoute } from './guardrailOutput'
import { agentTarotRoute } from './tarot'

export const agentRoute = Router();

agentRoute.use(agentNarrativeRoute)
agentRoute.use(agentInputGuardrailRoute)
agentRoute.use(agentOutputGuardrailRoute)
agentRoute.use(agentTarotRoute)