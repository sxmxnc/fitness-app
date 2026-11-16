/**
 * Autor: Simon Josef Cebula

 */

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { summaryRouter } from './food.summary.routes.js';
import { foodItemsRouter } from './food.items.routes.js';
import { entriesRouter } from './food.entries.routes.js';

export const foodRouter = express.Router();

foodRouter.use(requireAuth);
foodRouter.use(summaryRouter);
foodRouter.use(foodItemsRouter);
foodRouter.use(entriesRouter);
