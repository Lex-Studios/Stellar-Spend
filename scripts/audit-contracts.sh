#!/bin/bash
# Script to audit Rust contract dependencies for security vulnerabilities
# Usage: ./scripts/audit-contracts.sh
#
# LOCAL SETUP (one-time):
#   Install cargo-audit before running this script:
#     cargo install cargo-audit --locked
#
#   Then run from the repo root:
#     npm run audit:contracts
#   Or directly:
#     bash scripts/audit-contracts.sh
#
# CI: The GitHub Actions workflow (.github/workflows/contract-audit.yml) installs
# cargo-audit automatically via `cargo install cargo-audit --locked`.

set -e

echo "🔍 Auditing Rust contract dependencies for known vulnerabilities..."
echo

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: cargo is not installed. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Install cargo-audit if not present
if ! command -v cargo-audit &> /dev/null; then
    echo "📦 cargo-audit not found — installing (this may take a minute)..."
    cargo install cargo-audit --locked
    echo "✅ cargo-audit installed"
    echo
fi

# Change to contracts directory
CONTRACTS_DIR="$(dirname "$0")/../contracts"
cd "$CONTRACTS_DIR"

echo "📁 Running cargo audit in: $(pwd)"
echo

# Run audit at the workspace level (covers all member crates via Cargo.lock)
if cargo audit; then
    echo
    echo "✅ All contract dependencies passed audit — no unignored advisories found."
    exit 0
else
    echo
    echo "⚠️  cargo audit found advisories. Review the output above."
    echo "   To ignore a specific advisory, add an entry to contracts/.cargo/audit.toml:"
    echo "   [advisories]"
    echo "   ignore = [\"RUSTSEC-YYYY-NNNN\"]"
    exit 1
fi
