import type { Repository } from './base';

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  supported: boolean;
}

export interface CurrencyRepository extends Repository<Currency> {
  getByCode(code: string): Promise<Currency | null>;
  getSupportedCurrencies(): Promise<Currency[]>;
}
