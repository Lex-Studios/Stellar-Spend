# Internationalization (i18n)

Multi-language support with RTL language handling.

## Supported Languages

- **en** - English
- **es** - Spanish
- **fr** - French
- **zh** - Chinese (Simplified)
- **ar** - Arabic (RTL)

## Setup

Wrap your app with the I18nProvider:

```tsx
import { I18nProvider } from '@/lib/i18n';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <I18nProvider defaultLanguage="en">
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

## Usage

### In Components

```tsx
import { useI18n } from '@/lib/i18n';

export function MyComponent() {
  const { t, language, setLanguage, isRTL } = useI18n();

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <h1>{t('offramp.title')}</h1>
      <p>{t('common.loading')}</p>
    </div>
  );
}
```

### Language Selector

```tsx
import { LanguageSelector } from '@/lib/i18n';

export function Header() {
  return (
    <header>
      <LanguageSelector />
    </header>
  );
}
```

## Translation Keys

All translations are organized by namespace:

- `common.*` - Common UI strings
- `navigation.*` - Navigation labels
- `offramp.*` - Offramp feature strings
- `errors.*` - Error messages

## Adding New Translations

1. Update `TranslationKeys` interface in `types.ts`
2. Add translations to each language in `translations.ts`
3. Use `t('namespace.key')` in components

## RTL Support

The `isRTL()` method returns `true` for Arabic. Use it to adjust layout:

```tsx
<div dir={isRTL ? 'rtl' : 'ltr'}>
  {/* Content */}
</div>
```
