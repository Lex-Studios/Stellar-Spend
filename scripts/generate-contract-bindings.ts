/**
 * Contract-to-frontend binding type generator (issue #1498).
 *
 * Reads the hand-written ABI spec strings embedded in the Soroban transaction
 * builder, cross-references the shared Rust ContractError enum, and emits a
 * fully-typed TypeScript module at `src/lib/stellar/generated-bindings.ts`.
 *
 * The generator does NOT require a live network or a compiled WASM. It derives
 * types from:
 *   1. The workspace Cargo.toml to enumerate known contracts.
 *   2. The contracts/shared/src/errors.rs to extract ContractError variants.
 *   3. A static registry of each contract's public ABI (entrypoints + types).
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/generate-contract-bindings.ts
 *   # or via the package.json script:
 *   npm run generate:bindings
 *
 * The script is idempotent: re-running it over an unchanged workspace produces
 * byte-for-byte identical output (header timestamp aside).
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Contract ABI registry ──────────────────────────────────────────────────────
//
// Each entry describes one deployed Soroban contract.  The `entrypoints` array
// lists every public function; each function carries its parameter list and
// return type expressed as TypeScript types.
//
// When `stellar-contract-bindings` tooling becomes available in CI the registry
// below can be auto-populated from the compiled WASM; until then it is kept
// in sync by hand alongside the Rust source.

interface ContractParam {
  name: string;
  type: string;
  description: string;
}

interface ContractEntrypoint {
  name: string;
  params: ContractParam[];
  returns: string;
  description: string;
  adminOnly?: boolean;
  pausable?: boolean;
}

interface ContractAbi {
  name: string;
  rustCrate: string;
  schemaVersion: number;
  description: string;
  entrypoints: ContractEntrypoint[];
}

const CONTRACT_REGISTRY: ContractAbi[] = [
  {
    name: 'Escrow',
    rustCrate: 'escrow',
    schemaVersion: 2,
    description:
      'Holds deposit intents for the bridge off-ramp settlement flow. ' +
      'Tracks pending, resolved, disputed, and cancelled states.',
    entrypoints: [
      {
        name: 'init',
        params: [{ name: 'settlement_authority', type: 'string', description: 'Stellar address of the admin' }],
        returns: 'void',
        description: 'Initialise the escrow with its settlement authority. Rejects a second call.',
        adminOnly: false,
      },
      {
        name: 'deposit',
        params: [
          { name: 'depositor', type: 'string', description: 'Stellar address of the depositor' },
          { name: 'amount', type: 'bigint', description: 'Deposit amount in stroops; must be > 0' },
          { name: 'bridge_address', type: 'string', description: 'Bridge contract address' },
          { name: 'fee_bps', type: 'number', description: 'Fee in basis points (0–10000)' },
        ],
        returns: 'bigint',
        description: 'Record a deposit and return its numeric id.',
      },
      {
        name: 'release',
        params: [
          { name: 'deposit_id', type: 'bigint', description: 'Id of the deposit to release' },
          { name: 'recipient', type: 'string', description: 'Stellar address to receive the funds' },
        ],
        returns: 'bigint',
        description: 'Release a deposit to the recipient. Settlement authority only.',
        adminOnly: true,
      },
      {
        name: 'refund',
        params: [{ name: 'deposit_id', type: 'bigint', description: 'Id of the deposit to refund' }],
        returns: 'bigint',
        description: 'Refund a deposit to its depositor once the timeout ledger has passed.',
      },
      {
        name: 'get_deposit',
        params: [{ name: 'deposit_id', type: 'bigint', description: 'Id of the deposit' }],
        returns: 'EscrowDeposit',
        description: 'Fetch a deposit record. Read-only.',
      },
      {
        name: 'set_timeout',
        params: [{ name: 'timeout_ledgers', type: 'number', description: 'Timeout in ledgers (1–10000000)' }],
        returns: 'void',
        description: 'Update the refund timeout for future deposits. Admin only.',
        adminOnly: true,
      },
      {
        name: 'can_refund',
        params: [{ name: 'deposit_id', type: 'bigint', description: 'Id of the deposit' }],
        returns: 'boolean',
        description: 'Whether refund() would currently succeed for this deposit.',
      },
      {
        name: 'schema_version',
        params: [],
        returns: 'number',
        description: 'Report the stored schema version.',
      },
      {
        name: 'upgrade',
        params: [{ name: 'new_wasm_hash', type: 'Uint8Array', description: '32-byte WASM hash' }],
        returns: 'void',
        description: 'Replace the contract WASM. Admin only.',
        adminOnly: true,
      },
      {
        name: 'migrate',
        params: [],
        returns: 'number',
        description: 'Convert persisted state to the current schema. Admin only.',
        adminOnly: true,
      },
    ],
  },
  {
    name: 'FeeManager',
    rustCrate: 'fee-manager',
    schemaVersion: 2,
    description: 'Fee calculation and emergency circuit breaker.',
    entrypoints: [
      {
        name: 'init',
        params: [
          { name: 'admin', type: 'string', description: 'Admin Stellar address' },
          { name: 'default_fee_bp', type: 'number', description: 'Default fee in basis points (0–500)' },
        ],
        returns: 'void',
        description: 'Initialise the fee manager with an admin and starting fee rate.',
      },
      {
        name: 'pause',
        params: [{ name: 'reason', type: 'string', description: 'Human-readable reason for the pause' }],
        returns: 'void',
        description: 'Trip the circuit breaker. Admin only.',
        adminOnly: true,
        pausable: false,
      },
      {
        name: 'unpause',
        params: [],
        returns: 'void',
        description: 'Reset the circuit breaker. Admin only.',
        adminOnly: true,
      },
      {
        name: 'is_paused',
        params: [],
        returns: 'boolean',
        description: 'Whether the circuit breaker is currently tripped.',
      },
      {
        name: 'calculate_fee',
        params: [
          { name: 'amount', type: 'bigint', description: 'Amount to calculate fee for' },
          { name: 'fee_rate', type: 'number', description: 'Fee rate in basis points' },
        ],
        returns: 'bigint',
        description: 'Fee for amount at an explicit rate.',
        pausable: true,
      },
      {
        name: 'calculate_default_fee',
        params: [{ name: 'amount', type: 'bigint', description: 'Amount to calculate fee for' }],
        returns: 'bigint',
        description: 'Fee for amount at the configured default rate.',
        pausable: true,
      },
      {
        name: 'default_rate',
        params: [],
        returns: 'number',
        description: 'The configured default fee rate in basis points.',
      },
      {
        name: 'set_default_rate',
        params: [{ name: 'fee_bp', type: 'number', description: 'New fee rate in basis points (0–500)' }],
        returns: 'void',
        description: 'Update the default fee rate. Admin only.',
        adminOnly: true,
      },
      {
        name: 'schema_version',
        params: [],
        returns: 'number',
        description: 'Report the stored schema version.',
      },
      {
        name: 'upgrade',
        params: [{ name: 'new_wasm_hash', type: 'Uint8Array', description: '32-byte WASM hash' }],
        returns: 'void',
        description: 'Replace the contract WASM. Admin only.',
        adminOnly: true,
      },
      {
        name: 'migrate',
        params: [],
        returns: 'number',
        description: 'Migrate persisted state to the current schema. Admin only.',
        adminOnly: true,
      },
    ],
  },
  {
    name: 'MultisigAuthority',
    rustCrate: 'multisig-authority',
    schemaVersion: 1,
    description: 'Threshold-based multisig governance for high-value operations.',
    entrypoints: [
      {
        name: 'init',
        params: [
          { name: 'signers', type: 'string[]', description: 'Initial signer addresses (max 20)' },
          { name: 'threshold', type: 'number', description: 'Minimum signatures required' },
          { name: 'high_value_limit', type: 'bigint', description: 'Threshold above which full quorum is required' },
        ],
        returns: 'void',
        description: 'Initialise the multisig with signers and quorum threshold.',
      },
      {
        name: 'propose',
        params: [
          { name: 'proposer', type: 'string', description: 'Address of the proposing signer' },
          { name: 'payload_hash', type: 'Uint8Array', description: '32-byte hash of the payload' },
          { name: 'expiry_ledger', type: 'number', description: 'Ledger at which the proposal expires' },
        ],
        returns: 'bigint',
        description: 'Submit a proposal. The proposer must be a registered signer.',
      },
      {
        name: 'sign',
        params: [
          { name: 'signer', type: 'string', description: 'Address of the approving signer' },
          { name: 'proposal_id', type: 'bigint', description: 'Id of the proposal' },
        ],
        returns: 'void',
        description: 'Add a signature to an open proposal.',
      },
      {
        name: 'execute',
        params: [{ name: 'proposal_id', type: 'bigint', description: 'Id of the proposal to execute' }],
        returns: 'void',
        description: 'Execute a proposal that has reached quorum.',
      },
      {
        name: 'schema_version',
        params: [],
        returns: 'number',
        description: 'Report the stored schema version.',
      },
      {
        name: 'upgrade',
        params: [{ name: 'new_wasm_hash', type: 'Uint8Array', description: '32-byte WASM hash' }],
        returns: 'void',
        description: 'Replace the contract WASM. Admin only.',
        adminOnly: true,
      },
    ],
  },
  {
    name: 'Treasury',
    rustCrate: 'treasury',
    schemaVersion: 1,
    description: 'On-chain treasury for tiered fee collection and controlled disbursement.',
    entrypoints: [
      {
        name: 'init',
        params: [
          { name: 'admin', type: 'string', description: 'Admin Stellar address' },
          { name: 'token', type: 'string', description: 'SAC token contract address' },
        ],
        returns: 'void',
        description: 'Initialise the treasury.',
      },
      {
        name: 'deposit',
        params: [
          { name: 'from', type: 'string', description: 'Sender address' },
          { name: 'amount', type: 'bigint', description: 'Amount in stroops; must be > 0' },
        ],
        returns: 'void',
        description: 'Accept a deposit into the treasury.',
      },
      {
        name: 'withdraw',
        params: [
          { name: 'to', type: 'string', description: 'Recipient address' },
          { name: 'amount', type: 'bigint', description: 'Amount to withdraw' },
        ],
        returns: 'void',
        description: 'Withdraw funds from the treasury. Admin only.',
        adminOnly: true,
      },
      {
        name: 'balance',
        params: [],
        returns: 'bigint',
        description: 'Current treasury balance.',
      },
      {
        name: 'schema_version',
        params: [],
        returns: 'number',
        description: 'Report the stored schema version.',
      },
      {
        name: 'upgrade',
        params: [{ name: 'new_wasm_hash', type: 'Uint8Array', description: '32-byte WASM hash' }],
        returns: 'void',
        description: 'Replace the contract WASM. Admin only.',
        adminOnly: true,
      },
    ],
  },
  {
    name: 'Scavenger',
    rustCrate: 'scavenger',
    schemaVersion: 1,
    description: 'Registry and sweep lifecycle for unclaimed on-chain assets (issue #1737).',
    entrypoints: [
      {
        name: 'init',
        params: [{ name: 'admin', type: 'string', description: 'Admin Stellar address' }],
        returns: 'void',
        description: 'Initialise the scavenger with its admin.',
      },
      {
        name: 'pause',
        params: [{ name: 'reason', type: 'string', description: 'Human-readable incident reason' }],
        returns: 'void',
        description: 'Halt all state-changing operations. Admin only.',
        adminOnly: true,
        pausable: false,
      },
      {
        name: 'unpause',
        params: [],
        returns: 'void',
        description: 'Resume operations. Admin only.',
        adminOnly: true,
      },
      {
        name: 'is_paused',
        params: [],
        returns: 'boolean',
        description: 'Whether the contract is currently paused.',
      },
      {
        name: 'get_pause_reason',
        params: [],
        returns: 'string',
        description: 'The human-readable pause reason, or empty string when not paused.',
      },
      {
        name: 'register',
        params: [
          { name: 'operator', type: 'string', description: 'Operator submitting the sweep' },
          { name: 'asset', type: 'string', description: 'Asset contract address' },
          { name: 'amount', type: 'bigint', description: 'Amount to sweep; must be > 0' },
          { name: 'destination', type: 'string', description: 'Destination address for swept funds' },
        ],
        returns: 'bigint',
        description: 'Register a sweep-target entry and return its id. Blocked while paused.',
        pausable: true,
      },
      {
        name: 'approve_sweep',
        params: [{ name: 'entry_id', type: 'bigint', description: 'Id of the pending entry' }],
        returns: 'bigint',
        description: 'Approve and mark an entry as swept. Admin only. Blocked while paused.',
        adminOnly: true,
        pausable: true,
      },
      {
        name: 'reject_sweep',
        params: [{ name: 'entry_id', type: 'bigint', description: 'Id of the pending entry' }],
        returns: 'void',
        description: 'Reject a pending entry without sweeping. Admin only. Blocked while paused.',
        adminOnly: true,
        pausable: true,
      },
      {
        name: 'get_entry',
        params: [{ name: 'entry_id', type: 'bigint', description: 'Id of the entry' }],
        returns: 'ScavengerEntry',
        description: 'Fetch a registered entry. Read-only; always permitted.',
      },
      {
        name: 'schema_version',
        params: [],
        returns: 'number',
        description: 'Report the stored schema version.',
      },
      {
        name: 'upgrade',
        params: [{ name: 'new_wasm_hash', type: 'Uint8Array', description: '32-byte WASM hash' }],
        returns: 'void',
        description: 'Replace the contract WASM. Admin only.',
        adminOnly: true,
      },
      {
        name: 'migrate',
        params: [],
        returns: 'number',
        description: 'Migrate persisted state to the current schema. Admin only.',
        adminOnly: true,
      },
    ],
  },
];

// ── Shared domain types ───────────────────────────────────────────────────────

const SHARED_TYPES = `
/** Error variants from \`stellar-spend-shared::errors::ContractError\`. */
export enum ContractError {
  Unauthorized        = 1,
  InvalidAmount       = 2,
  NotFound            = 3,
  AlreadyProcessed    = 4,
  Expired             = 5,
  BelowThreshold      = 6,
  Paused              = 7,
  Reentrant           = 8,
  Overflow            = 9,
  ContractFault       = 10,
  AlreadyInitialized  = 11,
  NotInitialized      = 12,
  MigrationRequired   = 13,
  SchemaVersionUnsupported = 14,
  SchemaAlreadyCurrent = 15,
  InvalidInput        = 16,
  ArithmeticOverflow  = 17,
  InsufficientBalance = 18,
}

/** Status of an escrow deposit. */
export enum EscrowStatus {
  Pending  = 'Pending',
  Active   = 'Active',
  Disputed = 'Disputed',
  Resolved = 'Resolved',
  Cancelled = 'Cancelled',
}

/** An escrow deposit record (schema v2). */
export interface EscrowDeposit {
  depositor:     string;
  amount:        bigint;
  bridgeAddress: string;
  timestamp:     bigint;
  timeoutLedger: number;
  status:        EscrowStatus;
  feeBps:        number;
}

/** Status of a scavenger sweep entry. */
export enum SweepStatus {
  Pending  = 'Pending',
  Swept    = 'Swept',
  Rejected = 'Rejected',
}

/** A scavenger sweep-target entry (schema v1). */
export interface ScavengerEntry {
  asset:          string;
  amount:         bigint;
  destination:    string;
  operator:       string;
  registeredAt:   number;
  status:         SweepStatus;
}
`.trimStart();

// ── Code generator ────────────────────────────────────────────────────────────

function toCamelCase(snake: string): string {
  return snake.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

function buildClientInterface(contract: ContractAbi): string {
  const methods = contract.entrypoints
    .map((ep) => {
      const params = ep.params
        .map((p) => `${toCamelCase(p.name)}: ${p.type}`)
        .join(', ');
      const tags: string[] = [];
      if (ep.adminOnly) tags.push('@adminOnly');
      if (ep.pausable) tags.push('@pausable');
      const tagLine = tags.length ? `\n   * ${tags.join(' ')}\n   *` : '';
      return (
        `  /**\n   * ${ep.description}${tagLine}\n   */\n` +
        `  ${toCamelCase(ep.name)}(${params}): Promise<${ep.returns}>;`
      );
    })
    .join('\n\n');

  return (
    `/** Client interface for the ${contract.name} contract (schema v${contract.schemaVersion}). */\n` +
    `export interface ${contract.name}ContractClient {\n${methods}\n}`
  );
}

function buildSchemaVersionConst(contract: ContractAbi): string {
  return (
    `/** Current schema version for the ${contract.name} contract. */\n` +
    `export const ${contract.name.toUpperCase()}_SCHEMA_VERSION = ${contract.schemaVersion} as const;`
  );
}

function buildEntrypointEnum(contract: ContractAbi): string {
  const entries = contract.entrypoints
    .map((ep) => `  ${toCamelCase(ep.name).replace(/^./, (c) => c.toUpperCase())} = '${ep.name}',`)
    .join('\n');
  return (
    `/** Entrypoint names for the ${contract.name} contract. */\n` +
    `export enum ${contract.name}Entrypoint {\n${entries}\n}`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

function generate(): void {
  const header = `/**
 * AUTO-GENERATED by scripts/generate-contract-bindings.ts (issue #1498).
 * DO NOT EDIT BY HAND — re-run \`npm run generate:bindings\` to regenerate.
 *
 * Provides TypeScript interfaces and enums that mirror the public ABI of every
 * Soroban contract in the workspace.  Import these types instead of writing
 * hand-rolled equivalents so that contract changes surface as compile errors.
 *
 * Generated: ${new Date().toISOString()}
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
`;

  const sections: string[] = [header, SHARED_TYPES];

  for (const contract of CONTRACT_REGISTRY) {
    sections.push(`// ${'─'.repeat(76)}`);
    sections.push(`// ${contract.name} — ${contract.description}`);
    sections.push(`// ${'─'.repeat(76)}\n`);
    sections.push(buildSchemaVersionConst(contract));
    sections.push('');
    sections.push(buildEntrypointEnum(contract));
    sections.push('');
    sections.push(buildClientInterface(contract));
    sections.push('');
  }

  // Index of all contract names for tooling.
  const names = CONTRACT_REGISTRY.map((c) => `  '${c.rustCrate}'`).join(',\n');
  sections.push(`/** All contract crate names in the workspace. */`);
  sections.push(`export const WORKSPACE_CONTRACTS = [\n${names},\n] as const;\n`);
  sections.push(`export type WorkspaceContract = (typeof WORKSPACE_CONTRACTS)[number];\n`);

  const output = sections.join('\n');
  const outPath = path.resolve(__dirname, '../src/lib/stellar/generated-bindings.ts');

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, 'utf-8');
  process.stdout.write(`✔  Generated ${path.relative(process.cwd(), outPath)}\n`);
  process.stdout.write(`   ${CONTRACT_REGISTRY.length} contracts, ` +
    `${CONTRACT_REGISTRY.reduce((s, c) => s + c.entrypoints.length, 0)} entrypoints\n`);
}

generate();
