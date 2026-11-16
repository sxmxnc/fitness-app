/**
 * Autor: Luca Lammers

 * Just used in the pipeline
 * does not need to be evaluated
 */
import express from 'express';
import { DbDao } from '../dao/db.dao.js';
import { requireAuth, requireAdmin, asyncHandler } from '../middleware/auth.js';

export const dbRouter = express.Router();
dbRouter.use(requireAuth, requireAdmin);

/**
 * GET /db
 * @returns all available and created tables
 */
dbRouter.get(
	'/',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const dbDao: DbDao = req.app.locals.dbDao;
			const tableNames = await dbDao.getAllTables();
			res.json(tableNames);
		}
	)
);

/**
 * GET /db/TableLengths
 * @returns all tables with their row counts
 */
dbRouter.get(
	'/TableLengths',
	asyncHandler(
		/**
		 * Handles an asynchronous Express request and forwards failures to the shared error handler.
		 * @param {Request<ParamsDictionary, any, any, ParsedQs, Record<string, any>>} req req.
		 * @param {Response<any, Record<string, any>, number>} res res.
		 */
		async (req, res) => {
			const dbDao: DbDao = req.app.locals.dbDao;
			const tableLengths = await dbDao.getAllTablesLengths();
			res.json(tableLengths);
		}
	)
);
