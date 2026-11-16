/**
 * Autor: Simon Josef Cebula

 */

export type MealEntry = {
	id: string;
	userId: string;
	entryDate: number;
	mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
	createdAt: number;
	isDeleted: boolean;
};
