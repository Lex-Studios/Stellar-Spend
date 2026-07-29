/**
 * GraphQL schema snapshot tests (#805)
 *
 * These tests act as a stability guard against unintentional schema drift.
 * They snapshot:
 *   1. The complete SDL printed schema.
 *   2. Every query, mutation, and subscription field name.
 *   3. Field names of every named object type.
 *   4. The resolver map (to detect resolver/schema mismatch early).
 *
 * When you intentionally change the schema, update the snapshots by running:
 *   npx vitest run src/test/graphql/schema-snapshot.test.ts -u
 */

import { describe, expect, it } from 'vitest';
import { printSchema, lexicographicSortSchema } from 'graphql';
import { schema } from '@/lib/graphql/schema';
import { resolvers } from '@/lib/graphql/resolvers';

// ── Helper: collect all field names from a type map ───────────────────────

function typeFieldNames(typeName: string): string[] {
  const t = schema.getType(typeName) as { getFields?: () => Record<string, unknown> } | undefined;
  if (!t || !t.getFields) return [];
  return Object.keys(t.getFields()).sort();
}

// ── 1. Full SDL snapshot ──────────────────────────────────────────────────

describe('GraphQL schema SDL snapshot', () => {
  it('matches the committed SDL', () => {
    // lexicographicSortSchema ensures deterministic field ordering
    const printed = printSchema(lexicographicSortSchema(schema));
    expect(printed).toMatchSnapshot();
  });
});

// ── 2. Top-level field inventories ───────────────────────────────────────

describe('GraphQL schema — query field inventory', () => {
  it('exposes exactly the expected query fields', () => {
    expect(typeFieldNames('Query')).toMatchSnapshot();
  });
});

describe('GraphQL schema — mutation field inventory', () => {
  it('exposes exactly the expected mutation fields', () => {
    expect(typeFieldNames('Mutation')).toMatchSnapshot();
  });
});

describe('GraphQL schema — subscription field inventory', () => {
  it('exposes exactly the expected subscription fields', () => {
    expect(typeFieldNames('Subscription')).toMatchSnapshot();
  });
});

// ── 3. Object-type field inventories ─────────────────────────────────────

const DOMAIN_TYPES = [
  'Transaction',
  'TransactionPage',
  'PageInfo',
  'Beneficiary',
  'ReversalInfo',
  'InsuranceInfo',
  'Tag',
  'Quote',
  'Currency',
  'Institution',
  'RateInfo',
  'Dispute',
  'AnalyticsSummary',
  'CurrencyVolume',
  'DailyVolume',
  'KYCInfo',
  'UserLimits',
  'ScreeningResult',
  'WebhookDelivery',
  'DLQEntry',
  'WebhookStats',
];

describe('GraphQL schema — object type field inventories', () => {
  for (const typeName of DOMAIN_TYPES) {
    it(`${typeName} fields match snapshot`, () => {
      expect(typeFieldNames(typeName)).toMatchSnapshot();
    });
  }
});

// ── 4. Resolver / schema alignment ───────────────────────────────────────

describe('GraphQL schema — resolver map alignment', () => {
  it('resolver Query keys are a subset of schema Query fields', () => {
    const schemaFields = new Set(typeFieldNames('Query'));
    const resolverFields = Object.keys(resolvers.Query).sort();
    const missing = resolverFields.filter((f) => !schemaFields.has(f));
    expect(missing).toEqual([]);
  });

  it('resolver Mutation keys are a subset of schema Mutation fields', () => {
    const schemaFields = new Set(typeFieldNames('Mutation'));
    const resolverFields = Object.keys(resolvers.Mutation).sort();
    const missing = resolverFields.filter((f) => !schemaFields.has(f));
    expect(missing).toEqual([]);
  });

  it('resolver map key inventory matches snapshot', () => {
    const inventory = {
      queryResolvers: Object.keys(resolvers.Query).sort(),
      mutationResolvers: Object.keys(resolvers.Mutation).sort(),
    };
    expect(inventory).toMatchSnapshot();
  });
});

// ── 5. Schema builds without errors ──────────────────────────────────────

describe('GraphQL schema — integrity', () => {
  it('schema object is defined', () => {
    expect(schema).toBeDefined();
  });

  it('every type referenced in Query exists', () => {
    const queryFields = schema.getQueryType()?.getFields() ?? {};
    for (const [_name, field] of Object.entries(queryFields)) {
      // unwrap NonNull / List wrappers
      let t: { name?: string; ofType?: unknown } = field.type as typeof t;
      while ('ofType' in t && t.ofType) {
        t = t.ofType as typeof t;
      }
      if (t.name) {
        expect(schema.getType(t.name)).toBeDefined();
      }
    }
  });
});
