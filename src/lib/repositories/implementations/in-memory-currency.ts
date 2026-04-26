import type { CurrencyRepository, Currency } from '../currency';

const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', decimals: 2, supported: true },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', decimals: 2, supported: true },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', decimals: 2, supported: true },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', decimals: 0, supported: true },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimals: 2, supported: true },
  { code: 'GBP', name: 'British Pound', symbol: '£', decimals: 2, supported: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimals: 2, supported: true },
  { code: 'EUR', name: 'Euro', symbol: '€', decimals: 2, supported: true },
];

export class InMemoryCurrencyRepository implements CurrencyRepository {
  private currencies: Map<string, Currency> = new Map();

  constructor() {
    DEFAULT_CURRENCIES.forEach((currency) => {
      this.currencies.set(currency.code, currency);
    });
  }

  async save(entity: Currency): Promise<void> {
    this.currencies.set(entity.code, entity);
  }

  async update(id: string, updates: Partial<Currency>): Promise<void> {
    const currency = this.currencies.get(id);
    if (!currency) throw new Error(`Currency ${id} not found`);

    this.currencies.set(id, { ...currency, ...updates });
  }

  async getById(id: string): Promise<Currency | null> {
    return this.currencies.get(id) ?? null;
  }

  async delete(id: string): Promise<void> {
    this.currencies.delete(id);
  }

  async getAll(): Promise<Currency[]> {
    return Array.from(this.currencies.values());
  }

  async getByCode(code: string): Promise<Currency | null> {
    return this.currencies.get(code) ?? null;
  }

  async getSupportedCurrencies(): Promise<Currency[]> {
    return Array.from(this.currencies.values()).filter((c) => c.supported);
  }
}
