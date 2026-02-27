# 🏦 StellarVault

Personal XLM savings vault on Stellar Testnet. Level 3 challenge.

## Live Demo
> Add Vercel/Netlify URL

## Demo Video
> Add 1-min video link

## Contract
- Address: YOUR_CONTRACT_ID_HERE
- Explorer: https://stellar.expert/explorer/testnet/contract/YOUR_ID

## Setup
```bash
npm install
cargo install --locked stellar-cli
stellar keys generate admin --network testnet
stellar keys fund admin --network testnet
ADMIN_SECRET=$(stellar keys show admin) bash scripts/deploy.sh
cp .env.example .env  # paste CONTRACT_ID
npm run dev
```

## Tests
```bash
npm test
# 14 tests: cache (5) + errors (6) + vault hook (3)
```

## Deploy
```bash
npm run build && npx vercel --prod
```

