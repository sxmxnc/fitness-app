/**
 * Autor: Simon Josef Cebula

 */

export type Food = {
	id: string;
	userId: string | null;
	name: string;
	caloriesPer100g: number | null;
	proteinPer100g: number | null;
	fatPer100g: number | null;
	carbsPer100g: number | null;
	isSystemProperty: boolean;
	isDeleted: boolean;
};
