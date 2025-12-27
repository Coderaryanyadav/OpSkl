export * from '../../features/profile/types';

export * from '../../features/gig-discovery/types';
export interface RepositoryResponse<T> {
    data: T | null;
    error: {
        message: string;
        code?: string;
        details?: string;
    } | null;
}
