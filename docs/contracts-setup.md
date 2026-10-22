# Setting up and testing the Soroban contracts

The contracts live in `contracts/`, a single Cargo workspace (members: `admin_example`, `escrow`,
`fee-manager`, `multisig-authority`, `treasury`, `shared`).

## 1. Toolchain

- Install Rust with [rustup](https://rustup.rs).
- Add the WASM target used for contract builds: `rustup target add wasm32v1-none`.
- Install the Stellar CLI (`cargo install stellar-cli`) for deploying and invoking contracts.

## 2. Run the tests

From `contracts/`:

```bash
cd contracts
cargo test                       # every contract in the workspace
cargo test -p escrow             # one contract (replace escrow with the crate name)
```

## 3. Workspace layout

- `shared/`: code used by more than one contract.
- One directory per contract, each with its own `Cargo.toml` and `src/lib.rs`.
- `Cargo.toml` at `contracts/` lists the members. Add a new contract there.
