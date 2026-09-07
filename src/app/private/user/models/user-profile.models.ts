export type UserProfileType =
    | 'PERSONAL'
    | 'STUDENT'
    | 'PROFESSIONAL'
    | 'BUSINESS';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface UserProfile {
    _id: string;
    userId: string;
    firstName: string;
    lastName: string;
    displayName: string | null;
    bio: string | null;
    dateOfBirth: string | null;
    profileType: UserProfileType;
    occupation: string | null;
    education: string | null;
    interests: string[];
    countryId: string | null;
    timezoneId: string | null;
    languageId: string | null;
    currencyId: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateUserProfilePayload {
    firstName: string;
    lastName: string;
    displayName: string | null;
    bio: string | null;
    dateOfBirth: string | null;
    profileType: any;
    occupation: string | null;
    education: string | null;
    interests: string[];
    countryId: string | null;
    timezoneId: string | null;
    languageId: string | null;
}

export interface CountryReference {
    _id: string;
    name: string;
    iso2?: string;
    flag?: string;
}

export interface TimezoneReference {
    _id: string;
    name: string;
    offset?: string;
}

export interface LanguageReference {
    _id: string;
    name: string;
    code?: string;
}

export interface CurrencyReference {
    _id: string;
    name: string;
    code?: string;
    symbol?: string;
}

export interface ProfileReferenceData {
    countries: CountryReference[];
    timezones: TimezoneReference[];
    languages: LanguageReference[];
    currencies: CurrencyReference[];
}
