/**
 * Autor: Justus Heinz

 */

import { Router } from 'express';
import { z } from 'zod';
import { WorkoutHistoryDao } from '../dao/workout-history.dao.js';
import { requireAuth, asyncHandler } from '../middleware/auth.js';
import { rfcErros } from '../errors/rfc-error.js';
import {
	dateOnlySchema,
	isoWeekSchema,
	monthSchema,
	optionalDateOnlySchema,
	validationDetail,
	yearSchema
} from '../utils/validation.util.js';

export const workoutHistoryRouter = Router();

workoutHistoryRouter.use(requireAuth);

const dailyQuerySchema = z.object({
	date: dateOnlySchema
});

const weeklyQuerySchema = z.object({
	year: yearSchema,
	week: isoWeekSchema
});

const monthlyQuerySchema = z.object({
	year: yearSchema,
	month: monthSchema
});

const yearlyQuerySchema = z.object({
	year: yearSchema
});

const rangeQuerySchema = z
	.object({
		from: optionalDateOnlySchema,
		to: optionalDateOnlySchema
	})
	.refine(data => !data.from || !data.to || data.from <= data.to, {
		message: 'from must be before or equal to to'
	});

function dayRange(dateStr: string): [number, number] {
	const from = new Date(dateStr + 'T00:00:00.000Z').getTime();
	return [from, from + 86_400_000 - 1];
}

function isoWeekRange(year: number, week: number): [number, number] {
	const jan4 = new Date(Date.UTC(year, 0, 4));
	const dow = jan4.getUTCDay() || 7;
	const monday1 = new Date(jan4);
	monday1.setUTCDate(jan4.getUTCDate() - dow + 1);
	const from = new Date(monday1);
	from.setUTCDate(monday1.getUTCDate() + (week - 1) * 7);
	return [from.getTime(), from.getTime() + 7 * 86_400_000 - 1];
}

function monthRange(year: number, month: number): [number, number] {
	const from = Date.UTC(year, month - 1, 1);
	const to = Date.UTC(year, month, 1) - 1;
	return [from, to];
}

function yearRange(year: number): [number, number] {
	return [Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1) - 1];
}

// GET /api/workout-history/daily?date=YYYY-MM-DD
workoutHistoryRouter.get(
	'/daily',
	asyncHandler(async (req, res) => {
		const dao: WorkoutHistoryDao = req.app.locals.workoutHistoryDao;
		const query = dailyQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const [from, to] = dayRange(query.data.date);
		const sessions = await dao.getHistory(userId, from, to);
		res.status(200).json(sessions);
	})
);

// GET /api/workout-history/weekly?year=YYYY&week=WW
workoutHistoryRouter.get(
	'/weekly',
	asyncHandler(async (req, res) => {
		const dao: WorkoutHistoryDao = req.app.locals.workoutHistoryDao;
		const query = weeklyQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const [from, to] = isoWeekRange(query.data.year, query.data.week);
		const sessions = await dao.getHistory(userId, from, to);
		res.status(200).json(sessions);
	})
);

// GET /api/workout-history/monthly?year=YYYY&month=MM
workoutHistoryRouter.get(
	'/monthly',
	asyncHandler(async (req, res) => {
		const dao: WorkoutHistoryDao = req.app.locals.workoutHistoryDao;
		const query = monthlyQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const [from, to] = monthRange(query.data.year, query.data.month);
		const sessions = await dao.getHistory(userId, from, to);
		res.status(200).json(sessions);
	})
);

// GET /api/workout-history/yearly?year=YYYY
workoutHistoryRouter.get(
	'/yearly',
	asyncHandler(async (req, res) => {
		const dao: WorkoutHistoryDao = req.app.locals.workoutHistoryDao;
		const query = yearlyQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const [from, to] = yearRange(query.data.year);
		const sessions = await dao.getHistory(userId, from, to);
		res.status(200).json(sessions);
	})
);

// GET /api/workout-history?from=YYYY-MM-DD&to=YYYY-MM-DD
workoutHistoryRouter.get(
	'/',
	asyncHandler(async (req, res) => {
		const dao: WorkoutHistoryDao = req.app.locals.workoutHistoryDao;
		const query = rangeQuerySchema.safeParse(req.query);
		if (!query.success) {
			res.status(400).json(rfcErros.badRequest(validationDetail(query.error)).toJSON());
			return;
		}

		const userId = res.locals.userId as string;
		const fromTs = query.data.from ? new Date(query.data.from + 'T00:00:00.000Z').getTime() : undefined;
		const toTs = query.data.to ? new Date(query.data.to + 'T23:59:59.999Z').getTime() : undefined;

		const sessions = await dao.getHistory(userId, fromTs, toTs);
		res.status(200).json(sessions);
	})
);
