import type { UserRepository, User } from "../user";

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async update(id: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(id);
    if (!user) throw new Error(`User ${id} not found`);
    this.users.set(id, { ...user, ...updates, updatedAt: Date.now() });
  }

  async getById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }

  async getAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getByAddress(address: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.address === address) return user;
    }
    return null;
  }

  async getByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }
}
