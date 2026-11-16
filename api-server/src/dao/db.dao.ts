/**
 * Autor: Luca Lammers

 * AI Made
 * Just used in the pipeline
 * does not need to be evaluated
 */
import { Pool } from 'pg';
import { quoteSqlIdentifier } from '../utils/output-encoding.util.js';

/**
 * This will be used as an Info in the pipline
 * It  will print all available Tables
 * can be extended to print all rows but why?
 */

type DbTable = {
	table_name: string;
};

/** Describes the db table count shape. */
type DbTableCount = {
	table_name: string;
	count: number;
};

/** Provides database access methods for db. */
export class DbDao {
	/**
	 * Creates a new db dao instance.
	 * @param {Pool} client client.
	 */
	constructor(private readonly client: Pool) {}

	/**
	 * Retrieves all tables.
	 * @returns {Promise<DbTable[]>} A promise resolving to the operation result.
	 */
	async getAllTables(): Promise<DbTable[]> {
		const result = await this.client.query(
			`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
		);
		return result.rows as DbTable[];
	}

	/**
	 * Retrieves all tables lengths.
	 * @returns {Promise<DbTableCount[]>} A promise resolving to the operation result.
	 */
	async getAllTablesLengths(): Promise<DbTableCount[]> {
		const tables = await this.getAllTables();
		return Promise.all(
			tables.map(
				/**
				 * Transforms one item while building the derived collection.
				 * @param {DbTable} table table.
				 * @returns {Promise<{ table_name: string; count: number; }>} A promise resolving to the operation result.
				 */
				async table => {
					const count = await this.client.query(
						`SELECT COUNT(*) FROM ${quoteSqlIdentifier(table.table_name)}`
					);
					return { table_name: table.table_name, count: Number.parseInt(count.rows[0].count) };
				}
			)
		);
	}
}
