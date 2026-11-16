/* Autor: Prof. Dr. Norman Lahme-Hütig (FH Münster) */

import pg from 'pg';
import { Express } from 'express';

import config from '../config.json' with { type: 'json' };
import { UserDao } from './dao/users.dao.js';
import { SessionDao } from './dao/sessions.dao.js';
import { SessionSeeder } from './dao/session.seeder.js';
import { DbDao } from './dao/db.dao.js';
import { UserService } from './services/user.service.js';
import { FoodDao } from './dao/food.dao.js';
import { FoodService } from './services/food.service.js';
import { ExercisesDao } from './dao/exercises.dao.js';
import { WorkoutPlansDao } from './dao/workout-plans.dao.js';
import { WorkoutSessionsDao } from './dao/workout-sessions.dao.js';
import { WorkoutHistoryDao } from './dao/workout-history.dao.js';
import { SystemDao } from './dao/system.dao.js';

const { Pool } = pg; // eslint-disable-line @typescript-eslint/naming-convention

export default async function startDB(app: Express) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const pool: any = await connectToPsql();
	app.locals.userDao = new UserDao(pool);
	await app.locals.userDao.ensureEncryptedProfileStorage();
	app.locals.userService = new UserService(app.locals.userDao);
	app.locals.sessionDao = new SessionDao(pool);
	app.locals.dbDao = new DbDao(pool);
	app.locals.foodDao = new FoodDao(pool);
	app.locals.foodService = new FoodService(app.locals.foodDao);
	await app.locals.foodDao.seedSystemFoodsIfEmpty();
	await new SessionSeeder(pool).seedSessionsUpToToday();
	app.locals.workoutPlansDao = new WorkoutPlansDao(pool);
	app.locals.workoutSessionsDao = new WorkoutSessionsDao(pool);
	app.locals.workoutHistoryDao = new WorkoutHistoryDao(pool);
	app.locals.systemDao = new SystemDao(pool);
	app.locals.exercisesDao = new ExercisesDao(pool);
}

async function connectToPsql() {
	const pool = new Pool({
		user: config.db.connect.user,
		host: config.db.connect.host,
		database: config.db.connect.database,
		password: config.db.connect.password,
		port: config.db.connect.port.psql
	});

	try {
		const result = await pool.query(
			`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
		);
		console.log(
			'PostgreSQL tables:',
			result.rows.map(r => r.table_name)
		);
		return pool;
	} catch (err) {
		console.log('Could not connect to PostgreSQL: ', err);
		process.exit(1);
	}
}
