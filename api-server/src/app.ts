/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import os from 'node:os';
import { corsMiddleware } from './middleware/cors.middleware.js';
import { securityMiddleware } from './middleware/security.middleware.js';
import { validateSessionAge } from './middleware/session.middleware.js';
import startDB from './db.js';

import config from '../config.json' with { type: 'json' };
import { usersRouter } from './routes/users.route.js';
import { authRouter } from './routes/auth.route.js';
import { sessionRouter } from './routes/session.routes.js';
import { adminStatsRouter } from './routes/adminStats.routes.js';
import { dbRouter } from './routes/db.routes.js';
import { rfcErros } from './errors/rfc-error.js';
import { userStatsRouter } from './routes/userStats.route.js';
import { foodRouter } from './routes/food.routes.js';
import { exercisesRouter } from './routes/exercises.routes.js';
import { workoutPlansRouter } from './routes/workout-plans.routes.js';
import { workoutSessionsRouter } from './routes/workout-sessions.routes.js';
import { workoutHistoryRouter } from './routes/workout-history.routes.js';
import { systemRouter } from './routes/system.routes.js';
import { adminFoodRouter } from './routes/admin.food.routes.js';
import { adminExerciseRouter } from './routes/admin.exercise.routes.js';
import { adminWorkoutPlansRouter } from './routes/admin.workout-plans.routes.js';
import { validateEncryptionKey } from './utils/crypto.util.js';
import { validateHmacKey } from './utils/mac.util.js';

function configureApp(app: Express) {
	app.use(express.urlencoded({ extended: true }));
	app.use(express.json({ limit: '100kb' }));
	app.use(cookieParser());
	app.use(corsMiddleware);
	app.use(securityMiddleware);
	app.use(validateSessionAge);
	app.use('/api/users', usersRouter);
	app.use('/api/auth', authRouter);
	app.use('/api/admin/session', sessionRouter);
	app.use('/api/admin/stats', adminStatsRouter);
	app.use('/api/admin', adminFoodRouter);
	app.use('/api/admin', adminExerciseRouter);
	app.use('/api/admin', adminWorkoutPlansRouter);
	app.use('/api/usersStats/', userStatsRouter);
	app.use('/api/food', foodRouter);
	app.use('/db', dbRouter);
	app.use('/api/exercises', exercisesRouter);
	app.use('/api/workout-plans', workoutPlansRouter);
	app.use('/api/workout-sessions', workoutSessionsRouter);
	app.use('/api/workout-history', workoutHistoryRouter);
	app.use('/api/system', systemRouter);
	app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
		void _next;
		console.error(err);
		res.status(500).json(rfcErros.internalServerError('Unexpected error').toJSON());
	});
}

export async function start() {
	const app = express();

	validateEncryptionKey();
	validateHmacKey();
	configureApp(app);
	await startDB(app);
	startHttpServer(app, config.server.port);
}

async function startHttpServer(app: Express, port: number) {
	if (config.server.https) {
		const options = {
			key: fs.readFileSync('/certificates/server.key.pem'),
			cert: Buffer.concat([
				fs.readFileSync('/certificates/server.cert.pem'),
				fs.readFileSync('/certificates/intermediate-ca.cert.pem')
			])
		};
		const httpsServer = https.createServer(options, app);
		httpsServer.listen(port, () => {
			app.locals.port = port;
			const ip =
				Object.values(os.networkInterfaces())
					.flat()
					.find(a => a?.family === 'IPv4' && !a.internal)?.address ?? 'localhost';
			console.log(`Server running at https://${ip}:${port}`);
		});
	} else {
		const httpServer = http.createServer(app);
		httpServer.listen(port, () => {
			app.locals.port = port;
			console.log(`Server running at http://localhost:${port}`);
		});
	}
}

start();
