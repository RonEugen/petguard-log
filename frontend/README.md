# PetGuard Log Frontend

React frontend application for the PetGuard Log DApp, built with Vite, TypeScript, and RainbowKit.

## Features

- **Rainbow Wallet Integration**: Connect with Rainbow wallet plugin
- **FHEVM Encryption**: Field-level encryption for sensitive pet care data
- **On-chain Storage**: All care logs stored on the blockchain
- **Privacy-First**: Only the owner can decrypt their encrypted data

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set contract address**

   Create a `.env` file in the frontend directory:

   ```bash
   VITE_CONTRACT_ADDRESS=0xYourContractAddressHere
   ```

   To get the contract address:
   - For localhost: Run `npx hardhat deploy --network localhost` in the root directory
   - For Sepolia: Run `npx hardhat deploy --network sepolia` in the root directory

3. **Start development server**

   ```bash
   npm run dev
   ```

## Environment Variables

- `VITE_CONTRACT_ADDRESS`: The deployed PetGuard contract address

## Build

```bash
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── components/      # React components
│   ├── hooks/           # Custom hooks (FHEVM, PetGuard)
│   ├── pages/           # Page components
│   ├── config/          # Configuration (wagmi, etc.)
│   └── lib/             # Utility functions
├── public/              # Static assets
└── index.html           # HTML template
```

## Usage

1. Connect your wallet using the Rainbow button in the top right
2. Click "Add Care Log" to create a new log entry
3. Optionally enable encryption for sensitive data (requires wallet connection)
4. View your care logs - encrypted data will be automatically decrypted if you're the owner

## Technologies

- React 18
- TypeScript
- Vite
- Wagmi & RainbowKit
- FHEVM.js
- Tailwind CSS
- shadcn/ui


