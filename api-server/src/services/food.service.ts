/**
 * Autor: Simon Josef Cebula

 */

import { FoodDao } from '../dao/food.dao.js';
import { FoodItemsService } from './food.items.service.js';
import { FoodEntriesService } from './food.entries.service.js';
import { FoodSummaryService } from './food.summary.service.js';

export class FoodService {
	readonly items: FoodItemsService;
	readonly entries: FoodEntriesService;
	readonly summary: FoodSummaryService;

	constructor(foodDao: FoodDao) {
		this.items = new FoodItemsService(foodDao);
		this.summary = new FoodSummaryService(foodDao);
		this.entries = new FoodEntriesService(foodDao, this.items);
	}
}
