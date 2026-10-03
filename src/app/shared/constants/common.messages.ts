export const COMMON_MESSAGES = {
    ERROR: {
        GENERIC: 'Something went wrong. Please try again.',
        LOAD_FAILED: (subject: string) => `Unable to load ${subject}.`,
    },
} as const;

export const VALIDATION_MESSAGES = {
    MIN_LENGTH: (length: number) => `Enter at least ${length} characters.`,
    MAX_LENGTH: (length: number) => `Maximum ${length} characters are allowed.`,
    LENGTH_RANGE: (name: string, min: number, max: number) =>
        `${name} must contain ${min}–${max} characters.`,
} as const;
