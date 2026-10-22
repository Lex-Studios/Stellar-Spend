export type Language = 'en' | 'es' | 'fr' | 'zh' | 'ar' | 'pt' | 'sw';

/**
 * Only keys that are actually referenced via t() in the codebase.
 * Unused sections (navigation, offramp, errors, loyalty, referral, dispute, receipt)
 * and unused individual keys have been removed to keep the bundle lean.
 * See: #1271
 */
export interface TranslationKeys {
  common: {
    loading: string;
    cancel: string;
    close: string;
  };
  insurance: {
    title: string;
    description: string;
    terms: string;
    terms_title: string;
    coverage: string;
    premium: string;
    provider: string;
    risk_score: string;
    expires: string;
    claim_title: string;
    claim_reason: string;
    evidence: string;
    evidence_placeholder: string;
    file_claim: string;
    eligibility_check: string;
    eligible: string;
    ineligible: string;
    upload_document: string;
  };
  settings: {
    title: string;
    profile: string;
    appearance: string;
    preferences: string;
    security: string;
    notifications: string;
    language: string;
    theme: string;
    dark: string;
    light: string;
    system: string;
    reset: string;
    save: string;
    saved: string;
    email_notifications: string;
    push_notifications: string;
  };
}
