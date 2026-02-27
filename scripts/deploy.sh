#!/bin/bash
set -e
cd contract
cargo build --target wasm32-unknown-unknown --release
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/stellar_vault.wasm
WASM=target/wasm32-unknown-unknown/release/stellar_vault.optimized.wasm
CONTRACT_ID=$(stellar contract deploy --wasm $WASM --source $ADMIN_SECRET --network testnet)
echo "Deployed: $CONTRACT_ID"
ADMIN_ADDR=$(stellar keys address $ADMIN_SECRET 2>/dev/null)

# XLM Stellar Asset Contract address on testnet
# Obtained via: stellar contract id asset --asset native --network testnet
XLM_SAC_ADDRESS="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"

stellar contract invoke --id $CONTRACT_ID --source "$ADMIN_SECRET" --network testnet -- init --admin $ADMIN_ADDR --xlm_token $XLM_SAC_ADDRESS
echo "VITE_CONTRACT_ID=$CONTRACT_ID"
echo "XLM_TOKEN_ADDRESS=$XLM_SAC_ADDRESS"
