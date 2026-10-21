export type Role = 'ADMIN' | 'ORGANIZER';
export type EventStatus = 'SCHEDULED' | 'CANCELLED';

export interface ApiError {
    status: number;
    message: string;
    raw?: unknown;
}