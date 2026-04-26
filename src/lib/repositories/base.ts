export interface Repository<T> {
  save(entity: T): Promise<void>;
  update(id: string, updates: Partial<T>): Promise<void>;
  getById(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
  getAll(): Promise<T[]>;
}

export interface RepositoryFactory<T> {
  create(): Repository<T>;
}
