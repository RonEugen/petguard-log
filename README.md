# PetGuard Log

A privacy-first pet care record DApp that uses Web3 wallet for field-level encryption of sensitive logs (e.g., medication dosage, weight changes). Only the owner's wallet can decrypt and view the encrypted data.

## 🌐 Live Demo

- **Vercel Deployment**: [https://petguard-log.vercel.app/](https://petguard-log.vercel.app/)
- **GitHub Repository**: [https://github.com/RonEugen/petguard-log.git](https://github.com/RonEugen/petguard-log.git)

## 📹 Demo Video

Watch the demo video to see PetGuard Log in action:
- [Demo Video](./petguard-log.mp4)

## 🔐 Contract Addresses

### Local Network (Hardhat)
- **Chain ID**: 31337
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### Sepolia Testnet
- **Chain ID**: 11155111
- **Contract Address**: `0x65Cfc68376c35B3eDeCb78164a8A55B95a8c9BD9`
- **Explorer**: [View on Etherscan](https://sepolia.etherscan.io/address/0x65Cfc68376c35B3eDeCb78164a8A55B95a8c9BD9)

## ✨ Features

- **Privacy-First**: Sensitive data is encrypted using FHEVM (Fully Homomorphic Encryption Virtual Machine)
- **Field-Level Encryption**: Only sensitive fields are encrypted, public fields remain readable
- **Owner-Only Decryption**: Only the wallet that created the log can decrypt its sensitive data
- **Three Log Types**: Feeding, Medication, and Activity logs
- **Web3 Integration**: Uses RainbowKit wallet for seamless Web3 experience
- **Multi-Network Support**: Works on Hardhat local network and Sepolia testnet

## 🏗️ Project Structure

```
petguard-log/
├── contracts/           # Smart contract source files
│   └── PetGuard.sol    # Main contract for care log storage
├── deploy/             # Deployment scripts
│   └── deploy.ts       # Deployment script
├── test/               # Test files
│   ├── PetGuard.ts     # Local test suite
│   └── PetGuardSepolia.ts  # Sepolia testnet test suite
├── tasks/              # Hardhat custom tasks
│   ├── accounts.ts     # Account management tasks
│   └── PetGuard.ts     # PetGuard contract tasks
├── frontend/           # React frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── hooks/      # Custom React hooks
│   │   │   ├── useFHEVM.tsx      # FHEVM initialization and decryption
│   │   │   └── usePetGuard.tsx   # PetGuard contract interaction
│   │   ├── config/    # Configuration files
│   │   │   ├── contracts.ts      # Contract addresses
│   │   │   └── wagmi.ts          # Wagmi configuration
│   │   └── pages/     # Page components
│   └── package.json
└── hardhat.config.ts   # Hardhat configuration
```

## 🔒 Encryption & Decryption Logic

### Encryption Flow

When creating a care log with sensitive data, the frontend encrypts the data before sending it to the contract:

1. **Initialize FHEVM Instance**
   ```typescript
   // For Hardhat (local): Uses @fhevm/mock-utils
   // For Sepolia: Uses @zama-fhe/relayer-sdk
   const instance = await createFhevmInstance(walletClient, chainId);
   ```

2. **Create Encrypted Input**
   ```typescript
   const input = instance.createEncryptedInput(contractAddress, userAddress);
   input.add32(sensitiveData); // Add uint32 value
   const encrypted = await input.encrypt();
   ```

3. **Extract Handle and Proof**
   ```typescript
   // Handle is a bytes32 value representing the encrypted data
   const handle = encrypted.handles[0]; // Convert to hex string
   const inputProof = encrypted.inputProof; // Proof for verification
   ```

4. **Store on Contract**
   ```solidity
   // Contract receives externalEuint32 (bytes32 handle) and inputProof
   function createCareLog(
       uint8 logType,
       string memory title,
       string memory description,
       externalEuint32 encryptedSensitiveData, // bytes32 handle
       bytes calldata inputProof
   ) external returns (uint256)
   ```

### Decryption Flow

Only the owner can decrypt their encrypted data:

1. **Get Encrypted Handle from Contract**
   ```typescript
   const logData = await contract.getCareLog(logId);
   const encryptedHandle = logData[6]; // bytes32 handle
   ```

2. **Generate Keypair**
   ```typescript
   const keypair = instance.generateKeypair();
   ```

3. **Create EIP712 Signature**
   ```typescript
   const eip712 = instance.createEIP712(
       keypair.publicKey,
       [contractAddress],
       startTimestamp,
       durationDays
   );
   
   const signature = await walletClient.signTypedData({
       account: address,
       domain: eip712.domain,
       types: eip712.types,
       primaryType: eip712.primaryType,
       message: eip712.message,
   });
   ```

4. **Decrypt Data**
   ```typescript
   const result = await instance.userDecrypt(
       [{ handle: encryptedHandle, contractAddress }],
       keypair.privateKey,
       keypair.publicKey,
       signature.replace('0x', ''),
       [contractAddress],
       address,
       startTimestamp,
       durationDays
   );
   
   const decryptedValue = result[encryptedHandle];
   ```

### Smart Contract Encryption Logic

```solidity
// Contract receives encrypted data and proof
if (hasEncrypted) {
    // Convert external encrypted input to internal euint32
    encryptedData = FHE.fromExternal(encryptedSensitiveData, inputProof);
    
    // Set ACL permissions: allow contract and owner
    FHE.allowThis(encryptedData);
    FHE.allow(encryptedData, msg.sender);
}
```

## 📋 Smart Contract

### PetGuard.sol

The main contract that stores encrypted pet care logs on-chain.

#### Key Functions

**`createCareLog`**
- Creates a new care log entry
- Accepts optional encrypted sensitive data
- Sets ACL permissions for encrypted data

```solidity
function createCareLog(
    uint8 logType,                    // 0: feeding, 1: medication, 2: activity
    string memory title,
    string memory description,
    externalEuint32 encryptedSensitiveData,  // bytes32 handle
    bytes calldata inputProof
) external returns (uint256)
```

**`getCareLog`**
- Retrieves a care log by ID
- Returns encrypted data as a handle (bytes32)
- Only the owner can decrypt the handle

```solidity
function getCareLog(uint256 logId)
    external
    view
    returns (
        address owner,
        uint8 logType,
        string memory title,
        string memory description,
        uint256 timestamp,
        bool hasEncryptedData,
        euint32 encryptedSensitiveData  // Returns as handle
    )
```

**`getOwnerLogs`**
- Returns all log IDs for a specific owner

```solidity
function getOwnerLogs(address owner) 
    external 
    view 
    returns (uint256[] memory)
```

#### Contract Structure

```solidity
struct CareLog {
    uint256 id;
    address owner;
    uint8 logType;              // 0: feeding, 1: medication, 2: activity
    string title;
    string description;
    uint256 timestamp;
    bool hasEncryptedData;
    euint32 encryptedSensitiveData;  // Encrypted sensitive information
}
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH** (for testnet testing)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/RonEugen/petguard-log.git
   cd petguard-log
   ```

2. **Install contract dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

4. **Compile contracts**

   ```bash
   npm run compile
   ```

5. **Set up frontend**

   ```bash
   cd frontend
   npm install
   ```

### Local Development

1. **Start local Hardhat node**

   ```bash
   npx hardhat node
   ```

2. **Deploy to local network** (in another terminal)

   ```bash
   npx hardhat deploy --network localhost
   ```

3. **Start frontend dev server**

   ```bash
   cd frontend
   npm run dev
   ```

4. **Connect wallet**
   - Open http://localhost:8080
   - Connect your wallet to Hardhat network (Chain ID: 31337)
   - Use test accounts from Hardhat node

### Sepolia Testnet Deployment

1. **Deploy to Sepolia**

   ```bash
   # Set environment variables
   export PRIVATE_KEY=your_private_key
   export INFURA_API_KEY=your_infura_key
   
   # Deploy
   npx hardhat deploy --network sepolia
   ```

2. **Verify contract** (optional)

   ```bash
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

3. **Test on Sepolia**
   - Connect wallet to Sepolia testnet
   - Ensure you have Sepolia ETH
   - Use the deployed contract address

## 📜 Available Scripts

### Contract Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run test suite           |
| `npm run test:sepolia` | Run tests on Sepolia |
| `npm run lint`     | Lint code                |
| `npm run clean`    | Clean build artifacts    |

### Frontend Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `cd frontend && npm run dev` | Start dev server |
| `cd frontend && npm run build` | Build for production |
| `cd frontend && npm run preview` | Preview production build |

## 🔧 Hardhat Tasks

### Create a Care Log

```bash
npx hardhat --network localhost task:create-log \
  --type 0 \
  --title "Morning Feeding" \
  --description "Fed 2 cups" \
  --sensitive 100
```

### Get a Care Log

```bash
npx hardhat --network localhost task:get-log --logId 0
```

### Decrypt a Care Log

```bash
npx hardhat --network localhost task:decrypt-log --logId 0
```

## 🧪 Testing

### Local Testing

1. Start local Hardhat node: `npx hardhat node`
2. Deploy contract: `npx hardhat deploy --network localhost`
3. Run tests: `npm run test`
4. Start frontend: `cd frontend && npm run dev`

### Sepolia Testing

1. Deploy to Sepolia: `npx hardhat deploy --network sepolia`
2. Run Sepolia tests: `npm run test:sepolia`
3. Test on frontend: Connect to Sepolia network

## 🔐 Security Features

- **FHEVM Encryption**: Uses Zama's FHEVM for fully homomorphic encryption
- **Owner-Only Access**: Only the log creator can decrypt sensitive data
- **ACL Permissions**: Contract-level access control for encrypted data
- **Input Verification**: Cryptographic proofs verify encrypted input validity
- **No Private Key Storage**: All encryption/decryption happens client-side

## 🛠️ Technology Stack

### Smart Contracts
- **Solidity**: ^0.8.24
- **Hardhat**: Development environment
- **FHEVM**: Fully Homomorphic Encryption Virtual Machine
- **@fhevm/solidity**: FHEVM Solidity library

### Frontend
- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Wagmi**: Ethereum React hooks
- **RainbowKit**: Wallet connection UI
- **TailwindCSS**: Styling
- **shadcn/ui**: UI components

### Encryption
- **@zama-fhe/relayer-sdk**: FHEVM SDK for Sepolia
- **@fhevm/mock-utils**: Mock FHEVM for local development

## 📝 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or support, please open an issue on GitHub.
