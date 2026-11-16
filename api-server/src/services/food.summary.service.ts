/**
 * Autor: Simon Josef Cebula

 */

import { FoodDao } from '../dao/food.dao.js';

type SummaryPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export class FoodSummaryService {
	constructor(private readonly foodDao: FoodDao) {}

	/**
	 * returns aggregated nutrition data for a user over a given period.
	 * @param period - aggregation period
	 * @param date - any Unix timestamp ms within the target day/week/month (required for daily/weekly/monthly)
	 * @param year - 4-digit year (required for yearly)
	 */
	async getSummary(
		userId: string,
		period: SummaryPeriod,
		date?: number,
		year?: number
	): Promise<{
		period: SummaryPeriod;
		from: number;
		to: number;
		totalCalories: number;
		totalProtein: number;
		totalFat: number;
		totalCarbs: number;
		breakdown: { date: number; calories: number; protein: number; fat: number; carbs: number }[];
	}> {
		const { from, to } = this.getDateRange(period, date, year);
		const rows = await this.foodDao.getNutritionBreakdown(userId, from, to);

		const totalCalories = rows.reduce((s, r) => s + r.totalCalories, 0);
		const totalProtein = rows.reduce((s, r) => s + r.totalProtein, 0);
		const totalFat = rows.reduce((s, r) => s + r.totalFat, 0);
		const totalCarbs = rows.reduce((s, r) => s + r.totalCarbs, 0);

		const breakdown = rows.map(r => ({
			date: r.entryDate,
			calories: r.totalCalories,
			protein: r.totalProtein,
			fat: r.totalFat,
			carbs: r.totalCarbs
		}));

		return { period, from, to, totalCalories, totalProtein, totalFat, totalCarbs, breakdown };
	}

	/**
	 * calculates the inclusive from/to Unix ms range for the given period.
	 */
	private getDateRange(period: SummaryPeriod, date?: number, year?: number): { from: number; to: number } {
		if (period === 'daily') {
			if (date === undefined) throw new Error('date is required for daily period');
			return { from: date, to: date };
		}

		// all ranges use UTC to stay consistent with getTodayMs() and the UTC-midnight entryDate storage
		if (period === 'weekly') {
			if (date === undefined) throw new Error('date is required for weekly period');
			const d = new Date(date);
			const dayOfWeek = d.getUTCDay();
			const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
			// Date.UTC rolls a negative/overflowing day into the neighbouring month automatically
			const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + offsetToMonday);
			const sunday = monday + 6 * 24 * 60 * 60 * 1000;
			return { from: monday, to: sunday };
		}

		if (period === 'monthly') {
			if (date === undefined) throw new Error('date is required for monthly period');
			const d = new Date(date);
			const firstDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1);
			// day 0 of the next month resolves to the last day of the current month
			const lastDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0);
			return { from: firstDay, to: lastDay };
		}

		// yearly
		if (year === undefined) throw new Error('year is required for yearly period');
		return { from: Date.UTC(year, 0, 1), to: Date.UTC(year, 11, 31) };
	}
}
