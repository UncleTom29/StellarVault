# 🏦 StellarVault

StellarVault is a professional non-custodial savings vault built on the **Stellar Network** using **Soroban smart contracts**. It allows users to securely deposit XLM into a personal vault, track their savings stats, and withdraw funds at any time.

![StellarVault UI Mockup](https://raw.githubusercontent.com/UncleTom29/StellarVault/main/public/preview.png)



---

## ✨ Features
- **Non-Custodial**: Your funds are held by the smart contract, not a central authority.
- **Personalized Stats**: Dynamic tracking of total deposits, balance, and transaction count.
- **Smart Caching**: High-performance UI powered by a custom caching layer for contract and Horizon data.
- **Multi-Wallet Support**: Seamless connection via `StellarWalletsKit` including Freighter and others.
- **Session Persistence**: Stay logged in even after page refreshes.
- **Testnet Ready**: Fully configured for the Stellar Testnet environment.

---

## 🛠️ Technology Stack

### Smart Contract
- **Language**: Rust
- **Platform**: Soroban (Stellar Smart Contracts)
- **SDK**: `soroban-sdk` v21.0.0
- **Build System**: Cargo + Wasm32

### Frontend
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Modern design with glassmorphism)
- **State Management**: Custom React Hooks (`useVault`, `useWallet`)
- **Stellar SDK**: `@stellar/stellar-sdk` v14.2.0
- **Wallet Integration**: `@creit.tech/stellar-wallets-kit`

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Rust & Cargo
- [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-the-stellar-cli)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/UncleTom29/StellarVault.git
   cd StellarVault
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development
1. **Initialize Admin Account**:
   ```bash
   stellar keys generate admin --network testnet
   stellar keys fund admin --network testnet
   ```
2. **Deploy the Contract**:
   ```bash
   # Make sure you have your admin secret in env
   ADMIN_SECRET=$(stellar keys show admin) bash scripts/deploy.sh
   ```
3. **Configure Environment**:
   Copy the `CONTRACT_ID` output from the deployment script into your `.env`:
   ```env
   VITE_CONTRACT_ID=YOUR_CONTRACT_ID
   VITE_RPC_URL=https://soroban-testnet.stellar.org
   VITE_HORIZON_URL=https://horizon-testnet.stellar.org
   ```
4. **Run the App**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testing

### Smart Contract Tests
The Soroban contract includes a comprehensive test suite in Rust.
```bash
cd contract
cargo test
```
Tests cover:
- Contract initialization logic.
- Deposit verification and state updates.
- Withdrawal balance checks and security.
- Statistics tracking accuracy.

### Frontend Tests
Frontend logic is tested using Vitest and React Testing Library.
```bash
npm test
```
**Test Coverage (14+ Tests):**
- **Cache Engine (`cache.test.js`)**: TTL expiration, prefix deletion, and data retrieval.
- **Error Handling (`errors.test.js`)**: Parsing RPC errors, wallet rejections, and network failures.
- **Vault Hook (`vault.test.js`)**: State management, wallet disconnection handling, and initial data loading.

---

## 📜 Contract Details
- **Testnet ID**: `CANS7QSSARTWIP3YVA5IQ5WPO2DLCWEWQJPBIDL57GQTEVTCRMIOISVO`
- **Explorer**: [View on Stellar Expert](https://stellar.expert/explorer/testnet/contract/CANS7QSSARTWIP3YVA5IQ5WPO2DLCWEWQJPBIDL57GQTEVTCRMIOISVO)

### Smart Contract API
- `init(admin: Address)`: Initializes the contract instance.
- `deposit(user: Address, amount: i128)`: Records a deposit.
- `withdraw(user: Address, amount: i128)`: Deducts from balance and returns funds.
- `get_vault(user: Address) -> Vault`: Returns current stats for a specific user.

---

## 🛠️ Build & Deployment
To build for production:
```bash
npm run build
```
Deploy the `dist` folder to your favorite provider (Vercel, Netlify, or GH Pages).

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
MIT © UncleTom29
