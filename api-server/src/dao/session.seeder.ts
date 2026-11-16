/**
 * Autor: Luca Lammers

 * fully made by AI a nice to have bc we do not have any users so this creates data for the tables and overviews´
 * does not need to be evaluated
 */
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export class SessionSeeder {
	constructor(private readonly client: Pool) {}

	async seedSessionsUpToToday(): Promise<void> {
		const todayStart = new Date();
		todayStart.setHours(0, 0, 0, 0);

		const usersResult = await this.client.query<{ userId: string }>(
			`SELECT DISTINCT us."userId"
			 FROM user_sessions us
			 JOIN users u ON u."id" = us."userId"
			 WHERE u."role" != 'admin' AND u."isDeactivated" = FALSE`
		);

		for (const row of usersResult.rows) {
			const userId = row.userId;

			const maxResult = await this.client.query<{ latest: number | null }>(
				`SELECT MAX("startedAt") AS latest FROM user_sessions WHERE "userId" = $1`,
				[userId]
			);
			const latestMs = maxResult.rows[0].latest;
			if (latestMs === null) continue;

			const latestDay = new Date(Number(latestMs));
			latestDay.setHours(0, 0, 0, 0);
			const startDay = new Date(latestDay.getTime() + 86400000);

			if (startDay > todayStart) continue;

			const toInsert = buildSessionsForUser(userId, startDay, todayStart);
			if (toInsert.length === 0) continue;

			const placeholders = toInsert
				.map((_, i) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4}, TRUE)`)
				.join(', ');

			await this.client.query(
				`INSERT INTO user_sessions ("id", "userId", "startedAt", "finishedAt", "isFinished")
				 VALUES ${placeholders}
				 ON CONFLICT ("id") DO NOTHING`,
				toInsert.flat()
			);

			console.log(`[SessionSeeder] Inserted ${toInsert.length} sessions for user ${userId}`);
		}
	}
}

function buildSessionsForUser(userId: string, from: Date, to: Date): Array<[string, string, number, number]> {
	const now = Date.now();

	// Seed the LCG from userId so every user gets a stable, unique base pattern
	let seed = 0;
	for (const c of userId.replaceAll('-', '')) {
		const hex = Number.parseInt(c, 16);
		if (!Number.isNaN(hex)) seed = (seed * 31 + hex) & 0x7fffffff;
	}
	let rngState = seed >>> 0;
	const rng = () => {
		rngState = (Math.imul(rngState, 1664525) + 1013904223) >>> 0;
		return rngState / 0xffffffff;
	};

	// Base pattern derived from userId: weekdays, preferred start time, duration, skip rate
	const dayCount = 2 + Math.floor(rng() * 3); // 2–4 workout days per week
	const weekdays = [0, 1, 2, 3, 4, 5, 6];
	for (let i = weekdays.length - 1; i > 0; i--) {
		const j = Math.floor(rng() * (i + 1));
		[weekdays[i], weekdays[j]] = [weekdays[j], weekdays[i]];
	}
	const workoutDays = new Set(weekdays.slice(0, dayCount));
	const baseStartMin = (6 + Math.floor(rng() * 15)) * 60; // 06:00–20:00 in minutes
	const baseDurationMin = 45 + Math.floor(rng() * 76); // 45–120 min
	const skipRate = 0.1 + rng() * 0.2; // 10–30% missed sessions per user

	const toInsert: Array<[string, string, number, number]> = [];
	const cursor = new Date(from);

	while (cursor <= to) {
		if (workoutDays.has(cursor.getDay()) && rng() >= skipRate) {
			// Per-session jitter so no two sessions are identical
			const startOffsetMin = Math.round((rng() - 0.5) * 60); // ±30 min
			const durationOffsetMin = Math.round((rng() - 0.5) * 30); // ±15 min

			const startMin = Math.max(360, Math.min(1320, baseStartMin + startOffsetMin)); // clamp 06:00–22:00
			const durationMin = Math.max(30, baseDurationMin + durationOffsetMin);

			const startMs = cursor.getTime() + startMin * 60000;
			const finishMs = startMs + durationMin * 60000;

			if (startMs < now) {
				toInsert.push([uuidv4(), userId, startMs, finishMs]);
			}
		}
		cursor.setDate(cursor.getDate() + 1);
	}

	return toInsert;
}
