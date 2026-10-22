import type { BaseRepository } from './base';

export interface User {
  id: string;
  address: string;
  email?: string;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, unknown>;
}

export interface UserRepository extends BaseRepository<User> {
  getByAddress(address: string): Promise<User | null>;
  getByEmail(email: string): Promise<User | null>;
}
