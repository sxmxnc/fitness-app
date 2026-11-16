/**
 * Autor: Simon Josef Cebula

 */

import { HttpClient } from '../../../../../../http-client.js';
import { BASE_API } from '../../../../../../config.js';
import { type MealType, type PendingFoodItem } from '../../food-tracking.types.js';

// HttpClient is passed per-call: service classes have no LitElement context for @consume
class FoodEntryService {
	async createMealEntry(
		http: HttpClient,
		userId: string,
		mealType: MealType,
		entryDate: number
	): Promise<string | null> {
		const res = await http.post(`${BASE_API}/food/${userId}/entries`, { entryDate, mealType });
		if (!res.ok) return null;
		const data: { id: string } = await res.json();
		return data.id;
	}

	async rollbackEntry(http: HttpClient, userId: string, entryId: string): Promise<void> {
		await http.delete(`${BASE_API}/food/${userId}/entries/${entryId}`);
	}

	// returns null on success, or the displayName of the first item that failed to save
	async saveItems(
		http: HttpClient,
		entryId: string,
		userId: string,
		items: PendingFoodItem[]
	): Promise<string | null> {
		for (const item of items) {
			let ok: boolean;
			if (item.mode === 'existing') {
				const res = await http.post(`${BASE_API}/food/${userId}/entries/${entryId}/items`, {
					foodId: item.foodId,
					quantityGrams: item.quantityGrams
				});
				ok = res.ok;
			} else {
				const res = await http.post(`${BASE_API}/food/${userId}/entries/${entryId}/custom-food`, {
					name: item.displayName,
					quantityGrams: item.quantityGrams,
					caloriesPer100g: item.caloriesPer100g,
					proteinPer100g: item.proteinPer100g,
					fatPer100g: item.fatPer100g,
					carbsPer100g: item.carbsPer100g
				});
				ok = res.ok;
			}
			if (!ok) return item.displayName;
		}
		return null;
	}
}

export default new FoodEntryService();
