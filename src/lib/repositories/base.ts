/**
 * Standard repository contract shared by every repository.
 *
 * Method names are uniform across repositories:
 *  - get(id)            → the entity, or null when not found
 *  - list()             → all entities
 *  - create(entity)     → persist a new entity
 *  - update(id, patch)  → merge a partial patch into an existing entity
 *  - delete(id)         → remove an entity
 */
export interface BaseRepository<T> {
  create(entity: T): Promise<void>;
  update(id: string, updates: Partial<T>): Promise<void>;
  get(id: string): Promise<T | null>;
  delete(id: string): Promise<void>;
  list(): Promise<T[]>;
}

export interface RepositoryFactory<T> {
  create(): BaseRepository<T>;
}
