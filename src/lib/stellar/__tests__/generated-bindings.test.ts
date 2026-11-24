/**
 * Tests for the generated contract bindings (issue #1498).
 *
 * Verifies that the generated module exports the expected enums, constants,
 * and that types are structurally consistent with the Rust source.
 */

import { describe, it, expect } from 'vitest';
import {
  ContractError,
  EscrowStatus,
  SweepStatus,
  EscrowEntrypoint,
  FeeManagerEntrypoint,
  ScavengerEntrypoint,
  MultisigAuthorityEntrypoint,
  TreasuryEntrypoint,
  ESCROW_SCHEMA_VERSION,
  FEE_MANAGER_SCHEMA_VERSION,
  MULTISIG_AUTHORITY_SCHEMA_VERSION,
  TREASURY_SCHEMA_VERSION,
  SCAVENGER_SCHEMA_VERSION,
  WORKSPACE_CONTRACTS,
} from '../generated-bindings';

// ── ContractError enum ────────────────────────────────────────────────────────

describe('ContractError', () => {
  it('maps Unauthorized to 1', () => {
    expect(ContractError.Unauthorized).toBe(1);
  });

  it('maps Paused to 7 — matches the Rust discriminant', () => {
    expect(ContractError.Paused).toBe(7);
  });

  it('maps Reentrant to 8', () => {
    expect(ContractError.Reentrant).toBe(8);
  });

  it('maps AlreadyInitialized to 11', () => {
    expect(ContractError.AlreadyInitialized).toBe(11);
  });

  it('maps SchemaAlreadyCurrent to 15', () => {
    expect(ContractError.SchemaAlreadyCurrent).toBe(15);
  });

  it('maps InsufficientBalance to 18', () => {
    expect(ContractError.InsufficientBalance).toBe(18);
  });

  it('contains no duplicate numeric values', () => {
    const values = Object.values(ContractError).filter((v) => typeof v === 'number');
    expect(new Set(values).size).toBe(values.length);
  });
});

// ── EscrowStatus enum ─────────────────────────────────────────────────────────

describe('EscrowStatus', () => {
  it('has the five expected variants', () => {
    expect(EscrowStatus.Pending).toBe('Pending');
    expect(EscrowStatus.Active).toBe('Active');
    expect(EscrowStatus.Disputed).toBe('Disputed');
    expect(EscrowStatus.Resolved).toBe('Resolved');
    expect(EscrowStatus.Cancelled).toBe('Cancelled');
  });
});

// ── SweepStatus enum ──────────────────────────────────────────────────────────

describe('SweepStatus', () => {
  it('has Pending, Swept, and Rejected', () => {
    expect(SweepStatus.Pending).toBe('Pending');
    expect(SweepStatus.Swept).toBe('Swept');
    expect(SweepStatus.Rejected).toBe('Rejected');
  });
});

// ── Schema version constants ──────────────────────────────────────────────────

describe('schema version constants', () => {
  it('Escrow schema version is 2', () => {
    expect(ESCROW_SCHEMA_VERSION).toBe(2);
  });

  it('FeeManager schema version is 2', () => {
    expect(FEE_MANAGER_SCHEMA_VERSION).toBe(2);
  });

  it('MultisigAuthority schema version is 1', () => {
    expect(MULTISIG_AUTHORITY_SCHEMA_VERSION).toBe(1);
  });

  it('Treasury schema version is 1', () => {
    expect(TREASURY_SCHEMA_VERSION).toBe(1);
  });

  it('Scavenger schema version is 1', () => {
    expect(SCAVENGER_SCHEMA_VERSION).toBe(1);
  });
});

// ── Entrypoint enums ──────────────────────────────────────────────────────────

describe('EscrowEntrypoint', () => {
  it('Init maps to the snake_case function name', () => {
    expect(EscrowEntrypoint.Init).toBe('init');
  });

  it('GetDeposit maps to get_deposit', () => {
    expect(EscrowEntrypoint.GetDeposit).toBe('get_deposit');
  });

  it('SetTimeout maps to set_timeout', () => {
    expect(EscrowEntrypoint.SetTimeout).toBe('set_timeout');
  });

  it('contains no duplicate values', () => {
    const vals = Object.values(EscrowEntrypoint);
    expect(new Set(vals).size).toBe(vals.length);
  });
});

describe('FeeManagerEntrypoint', () => {
  it('CalculateFee maps to calculate_fee', () => {
    expect(FeeManagerEntrypoint.CalculateFee).toBe('calculate_fee');
  });

  it('SetDefaultRate maps to set_default_rate', () => {
    expect(FeeManagerEntrypoint.SetDefaultRate).toBe('set_default_rate');
  });
});

describe('ScavengerEntrypoint', () => {
  it('ApproveSweep maps to approve_sweep', () => {
    expect(ScavengerEntrypoint.ApproveSweep).toBe('approve_sweep');
  });

  it('RejectSweep maps to reject_sweep', () => {
    expect(ScavengerEntrypoint.RejectSweep).toBe('reject_sweep');
  });

  it('GetPauseReason maps to get_pause_reason', () => {
    expect(ScavengerEntrypoint.GetPauseReason).toBe('get_pause_reason');
  });

  it('contains no duplicate values', () => {
    const vals = Object.values(ScavengerEntrypoint);
    expect(new Set(vals).size).toBe(vals.length);
  });
});

describe('MultisigAuthorityEntrypoint', () => {
  it('Propose maps to propose', () => {
    expect(MultisigAuthorityEntrypoint.Propose).toBe('propose');
  });
});

describe('TreasuryEntrypoint', () => {
  it('Withdraw maps to withdraw', () => {
    expect(TreasuryEntrypoint.Withdraw).toBe('withdraw');
  });
});

// ── WORKSPACE_CONTRACTS ───────────────────────────────────────────────────────

describe('WORKSPACE_CONTRACTS', () => {
  it('lists all five contract crates', () => {
    expect(WORKSPACE_CONTRACTS).toContain('escrow');
    expect(WORKSPACE_CONTRACTS).toContain('fee-manager');
    expect(WORKSPACE_CONTRACTS).toContain('multisig-authority');
    expect(WORKSPACE_CONTRACTS).toContain('treasury');
    expect(WORKSPACE_CONTRACTS).toContain('scavenger');
  });

  it('contains exactly five entries', () => {
    expect(WORKSPACE_CONTRACTS).toHaveLength(5);
  });

  it('contains no duplicates', () => {
    expect(new Set(WORKSPACE_CONTRACTS).size).toBe(WORKSPACE_CONTRACTS.length);
  });
});
