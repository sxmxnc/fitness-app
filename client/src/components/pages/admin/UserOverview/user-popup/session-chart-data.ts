/**
 * Autor: Luca Lammers

 */

export interface Session {
	id: string;
	userId: string;
	startedAt: number;
	finishedAt: number | null;
	isFinished: boolean;
}

/**
 * Builds login chart data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildLoginChartData(sessions: Session[]): { labels: string[]; data: number[] } {
	const yearStart = new Date(new Date().getFullYear(), 0, 1);
	const today = new Date();
	today.setHours(23, 59, 59, 999);

	const counts = new Map<string, number>();

	for (const s of sessions) {
		const d = new Date(Number(s.startedAt));
		if (d >= yearStart && d <= today) {
			const key = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}
	const labels: string[] = [];
	const data: number[] = [];
	const cursor = new Date(yearStart);

	while (cursor <= today) {
		const key = `${String(cursor.getDate()).padStart(2, '0')}.${String(cursor.getMonth() + 1).padStart(2, '0')}`;
		labels.push(key);
		data.push(counts.get(key) ?? 0);
		cursor.setDate(cursor.getDate() + 1);
	}

	return { labels, data };
}

/**
 * Builds popular times data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildPopularTimesData(sessions: Session[]): { labels: string[]; data: number[] } {
	const counts = new Map<number, number>();

	for (const s of sessions) {
		const hour = new Date(Number(s.startedAt)).getHours();
		counts.set(hour, (counts.get(hour) ?? 0) + 1);
	}

	const top3 = [...counts.entries()]
		.sort(
			/**
			 * Compares two items for the requested display order.
			 * @param {[number, number]} a a.
			 * @param {[number, number]} b b.
			 * @returns {number} The calculated number.
			 */
			(a, b) => b[1] - a[1]
		)
		.slice(0, 3);

	return {
		labels: top3.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {[number, number]} [h] [h].
			 * @returns {string} The formatted string.
			 */
			([h]) => `${String(h).padStart(2, '0')}:00`
		),
		data: top3.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {[number, number]} [, c] [, c].
			 * @returns {number} The calculated number.
			 */
			([, c]) => c
		)
	};
}

/**
 * Builds popular days data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildPopularDaysData(sessions: Session[]): { labels: string[]; data: number[] } {
	const dayNames = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
	const counts = new Map<number, number>();

	for (const s of sessions) {
		const day = new Date(Number(s.startedAt)).getDay();
		counts.set(day, (counts.get(day) ?? 0) + 1);
	}

	const top3 = [...counts.entries()]
		.sort(
			/**
			 * Compares two items for the requested display order.
			 * @param {[number, number]} a a.
			 * @param {[number, number]} b b.
			 * @returns {number} The calculated number.
			 */
			(a, b) => b[1] - a[1]
		)
		.slice(0, 3);

	return {
		labels: top3.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {[number, number]} [d] [d].
			 * @returns {string} The formatted string.
			 */
			([d]) => dayNames[d]
		),
		data: top3.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {[number, number]} [, c] [, c].
			 * @returns {number} The calculated number.
			 */
			([, c]) => c
		)
	};
}

/**
 * Builds monthly activity data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildMonthlyActivityData(sessions: Session[]): { labels: string[]; data: number[] } {
	const MONTHS = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const now = new Date();
	const counts = new Map<string, number>();

	const labels: string[] = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		labels.push(i === 0 ? MONTHS[d.getMonth()] : `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`);
		counts.set(key, 0);
	}

	for (const s of sessions) {
		const d = new Date(Number(s.startedAt));
		const key = `${d.getFullYear()}-${d.getMonth()}`;
		if (counts.has(key)) {
			counts.set(key, counts.get(key)! + 1);
		}
	}

	return { labels, data: [...counts.values()] };
}

/**
 * Builds duration timeline data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildDurationTimelineData(sessions: Session[]): { labels: string[]; data: number[] } {
	const cutoff = new Date();
	cutoff.setDate(cutoff.getDate() - 30);
	cutoff.setHours(0, 0, 0, 0);

	const finished = sessions.filter(
		/**
		 * Selects items that should remain in the derived collection.
		 * @param {Session} s s.
		 * @returns {boolean} True when the condition is met.
		 */
		s => s.isFinished && s.finishedAt != null && new Date(Number(s.startedAt)) >= cutoff
	);
	if (finished.length === 0) return { labels: [], data: [] };

	const totals = new Map<string, number>();
	const counts = new Map<string, number>();

	for (const s of finished) {
		const d = new Date(Number(s.startedAt));
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
		totals.set(key, (totals.get(key) ?? 0) + (Number(s.finishedAt) - Number(s.startedAt)) / 60_000);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	const sorted = [...totals.keys()].sort(
		/**
		 * Compares two items for the requested display order.
		 * @param {string} a a.
		 * @param {string} b b.
		 * @returns {number} The calculated number.
		 */
		(a, b) => a.localeCompare(b)
	);

	return {
		labels: sorted.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {string} k k.
			 * @returns {string} The formatted string.
			 */
			k => new Date(k).toLocaleDateString('de-DE')
		),
		data: sorted.map(
			/**
			 * Transforms one item for the rendered or derived collection.
			 * @param {string} k k.
			 * @returns {number} The calculated number.
			 */
			k => Math.round(totals.get(k)! / counts.get(k)!)
		)
	};
}

/**
 * Builds duration dist data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildDurationDistData(sessions: Session[]): { labels: string[]; data: number[] } {
	const finished = sessions.filter(
		/**
		 * Selects items that should remain in the derived collection.
		 * @param {Session} s s.
		 * @returns {boolean} True when the condition is met.
		 */
		s => s.isFinished && s.finishedAt != null
	);
	const buckets = [0, 0, 0];

	for (const s of finished) {
		const mins = (Number(s.finishedAt) - Number(s.startedAt)) / 60_000;
		if (mins < 30) buckets[0]++;
		else if (mins < 60) buckets[1]++;
		else buckets[2]++;
	}

	return { labels: ['0-30 Min', '30-60 Min', '60+ Min'], data: buckets };
}

/**
 * Builds monthly duration data.
 * @param {Session[]} sessions sessions.
 * @returns {{ labels: string[]; data: number[] }} The operation result.
 */
export function buildMonthlyDurationData(sessions: Session[]): { labels: string[]; data: number[] } {
	const monthNames = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
	const year = new Date().getFullYear();
	const totals = new Array(12).fill(0);
	const counts = new Array(12).fill(0);

	for (const s of sessions.filter(
		/**
		 * Selects items that should remain in the derived collection.
		 * @param {Session} s s.
		 * @returns {boolean} True when the condition is met.
		 */
		s => s.isFinished && s.finishedAt != null
	)) {
		const d = new Date(Number(s.startedAt));
		if (d.getFullYear() === year) {
			const m = d.getMonth();
			totals[m] += (Number(s.finishedAt) - Number(s.startedAt)) / 60_000;
			counts[m]++;
		}
	}

	const labels: string[] = [];
	const data: number[] = [];

	for (let i = 0; i < 12; i++) {
		if (counts[i] > 0) {
			labels.push(monthNames[i]);
			data.push(Math.round(totals[i] / counts[i]));
		}
	}

	return { labels, data };
}
