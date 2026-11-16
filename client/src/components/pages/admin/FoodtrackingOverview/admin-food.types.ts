/**
 * Autor: Simon Josef Cebula

 */

// shared shape for the admin system-food views (overview, popup, edit/create modals)
export interface SystemFood {
	id: string;
	name: string;
	caloriesPer100g: number | null;
	proteinPer100g: number | null;
	fatPer100g: number | null;
	carbsPer100g: number | null;
}
