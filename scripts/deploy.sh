#!/bin/bash
set -e
cd contract
cargo build --target wasm32-unknown-unknown --release
WASM=target/wasm32-unknown-unknown/release/stellar_vault.wasm
CONTRACT_ID=$(stellar contract deploy --wasm $WASM --source $ADMIN_SECRET --network testnet)
echo "Deployed: $CONTRACT_ID"
ADMIN_ADDR=$(stellar keys address $ADMIN_SECRET 2>/dev/null)
stellar contract invoke --id $CONTRACT_ID --source "$ADMIN_SECRET" --network testnet -- init --admin $ADMIN_ADDR
echo "VITE_CONTRACT_ID=$CONTRACT_ID"
