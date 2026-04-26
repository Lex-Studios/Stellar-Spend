export type Language = 'en' | 'es' | 'fr' | 'zh' | 'ar';

export interface TranslationKeys {
  common: {
    loading: string;
    error: string;
    success: string;
    cancel: string;
    submit: string;
    close: string;
  };
  navigation: {
    home: string;
    history: string;
    settings: string;
  };
  offramp: {
    title: string;
    enterAmount: string;
    selectCurrency: string;
    selectBank: string;
    accountNumber: string;
    estimatedTime: string;
    fees: string;
    total: string;
  };
  errors: {
    invalidAmount: string;
    insufficientBalance: string;
    networkError: string;
    transactionFailed: string;
  };
}
