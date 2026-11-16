/** Stable security question keys accepted by the API. */
export const SECURITY_QUESTIONS = {
	first_pet: 'Wie hieß dein erstes Haustier?',
	birth_city: 'In welcher Stadt wurdest du geboren?',
	mother_maiden_name: 'Wie lautet der Mädchenname deiner Mutter?',
	first_school: 'Wie hieß deine erste Schule?',
	favorite_school_subject: 'Was war dein Lieblingsfach in der Schule?'
} as const;

export type SecurityQuestionKey = keyof typeof SECURITY_QUESTIONS;

/** All valid security question keys. */
export const SECURITY_QUESTION_KEYS = Object.keys(SECURITY_QUESTIONS) as [
	SecurityQuestionKey,
	...SecurityQuestionKey[]
];
