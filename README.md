# Smart Contract-Based Freelance Payment Escrow System
    
<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?style=for-the-badge&logo=solidity)
![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=ethereum&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=for-the-badge&logo=hardhat&logoColor=black)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Ethers.js](https://img.shields.io/badge/Ethers.js-2535A0?style=for-the-badge&logo=ethers&logoColor=white)

**A decentralized escrow payment system for freelancers built on Ethereum smart contracts.**

Funds are locked inside a smart contract and released automatically when the client approves the freelancer's work — eliminating the need for a trusted middleman.

[Smart Contract](#smart-contract-architecture) • [Installation](#installation) • [Testing](#running-tests) • [Frontend](#frontend-dapp) • [Remix Simulation](#remix-ide-simulation)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Industry Relevance](#industry-relevance)
- [Blockchain Concepts Used](#blockchain-concepts-used)
- [Technology Stack](#technology-stack)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Actors](#actors)
- [Escrow Workflow](#escrow-workflow)
- [Contract States](#contract-states)
- [Smart Contract Functions](#smart-contract-functions)
- [Events](#events)
- [Security Features](#security-features)
- [Folder Structure](#folder-structure)
- [Installation](#installation)
- [Remix IDE Simulation](#remix-ide-simulation)
- [Hardhat Setup](#hardhat-setup)
- [Running Tests](#running-tests)
- [Deployment](#deployment)
- [Frontend DApp](#frontend-dapp)
- [Sample Transactions](#sample-transactions)
- [Screenshots](#screenshots)
- [Results](#results)
- [Limitations](#limitations)
- [Future Improvements](#future-improvements)
- [Learning Outcomes](#learning-outcomes)
- [Author](#author)

---

## Overview

The **Freelance Payment Escrow System** is a blockchain-based decentralized application (DApp) that uses Ethereum smart contracts to manage payments between clients and freelancers. Instead of relying on a centralized platform (like Upwork or Fiverr) to hold and release funds, the smart contract acts as an automated, trustless escrow.

### Simple Explanation

Think of this as a "digital locker" managed by code instead of a person:
1. The **client** puts money into the locker (smart contract).
2. The **freelancer** does the work and shows it to the client.
3. If the client is happy, they press a button and the money is released to the freelancer.
4. If something goes wrong, either party can raise a dispute, and an arbitrator decides.

### Technical Explanation

The system implements a state-machine-based Solidity smart contract deployed on the Ethereum blockchain. It enforces role-based access control (`onlyClient`, `onlyFreelancer`, `onlyArbitrator`), strict state transitions (8 states managed via an `enum`), and secure ETH transfers using the checks-effects-interactions pattern with reentrancy protection. All actions emit events for off-chain indexing and transparency.

---

## Problem Statement

In traditional freelancing:

| Problem | Impact |
|---|---|
| Client may refuse to pay after work is done | Freelancer loses time and money |
| Freelancer may take payment and deliver poor work | Client loses money |
| Platform charges 10–20% fees | Both parties lose value |
| Payment disputes are slow and subjective | Delays and frustration |
| Cross-border payments are slow and expensive | Global freelancing is harder |

**This project solves all of these problems** by replacing the middleman with a transparent smart contract.

---

## Objectives

- ✅ Build a Solidity smart contract for escrow payments
- ✅ Implement client → freelancer payment workflow
- ✅ Support cancellation and refund before work starts
- ✅ Support dispute resolution via arbitrator
- ✅ Emit events for all on-chain actions
- ✅ Write comprehensive automated tests (25+ test cases)
- ✅ Create a React frontend DApp
- ✅ Deploy on local blockchain (no real crypto required)
- ✅ Document for GitHub and academic submission

---

## Industry Relevance

This escrow pattern is used across many industries:

| Industry | Use Case |
|---|---|
| Freelance Platforms | Upwork, Fiverr — payment holding |
| Gig Economy | Task-based payments with delivery proof |
| Outsourcing | Milestone-based project payments |
| Remote Work | Cross-border trustless payments |
| NFT Marketplaces | Conditional asset transfers |
| B2B Contracts | Service-level agreement payments |
| Real Estate | Property sale escrows |
| Cross-Border Trade | International payment protection |

**Business Value:**
- 🔒 Reduced trust dependency — code is the arbiter
- 📊 Transparent payments — anyone can audit the blockchain
- 💸 Lower fees — no 20% platform cut
- ⚡ Automated settlement — instant on approval
- 📝 Immutable records — permanent transaction history
- 🌍 Global accessibility — no banks needed

---

## Blockchain Concepts Used

| Concept | Role in This Project |
|---|---|
| **Blockchain** | Immutable ledger storing all escrow transactions |
| **Ethereum** | Platform for deploying and running the smart contract |
| **Smart Contract** | Self-executing escrow logic — no middleman |
| **Solidity** | Programming language for the contract |
| **Wallet Address** | Unique identifiers for client, freelancer, arbitrator |
| **msg.sender** | Identifies who is calling each function |
| **msg.value** | The ETH amount sent with a transaction |
| **payable** | Allows functions and addresses to receive ETH |
| **mapping** | Key-value store linking escrow IDs to data |
| **struct** | Custom data type holding all escrow fields |
| **enum** | Defines the 8 escrow lifecycle states |
| **modifier** | Access control (onlyClient, onlyFreelancer, etc.) |
| **event** | On-chain logs for frontend and off-chain tracking |
| **require()** | Input validation — reverts on failure |
| **revert()** | Explicit error handling |
| **Gas** | Transaction fee paid to miners/validators |
| **Transaction Hash** | Unique identifier for each blockchain transaction |
| **Block Confirmation** | Proof that a transaction is finalized |
| **Testnet** | Fake blockchain for testing without real money |

---

## Technology Stack

| Category | Technology |
|---|---|
| Smart Contract | Solidity 0.8.20 |
| Development Framework | Hardhat |
| Testing | Chai + Hardhat Toolbox |
| Frontend | React 18 + Vite |
| Blockchain Interaction | Ethers.js v6 |
| Wallet | MetaMask |
| Local Blockchain | Hardhat Node |
| IDE Alternative | Remix IDE |
| Version Control | Git + GitHub |

---

## Smart Contract Architecture

```
┌──────────────────────────────────────────────────┐
│              FreelanceEscrow.sol                  │
├──────────────────────────────────────────────────┤
│  State Variables:                                │
│  ├── escrowCount (uint256)                       │
│  ├── arbitrator (address)                        │
│  ├── escrows (mapping: id → Escrow)              │
│  └── _locked (bool) — reentrancy guard           │
├──────────────────────────────────────────────────┤
│  Struct: Escrow                                  │
│  ├── id, client, freelancer, amount              │
│  ├── projectTitle, state                         │
│  └── createdAt, fundedAt, completedAt            │
├──────────────────────────────────────────────────┤
│  Enum: EscrowState                               │
│  ├── CREATED → FUNDED → IN_PROGRESS              │
│  ├── → SUBMITTED → COMPLETED                     │
│  ├── FUNDED → CANCELLED                          │
│  └── IN_PROGRESS/SUBMITTED → DISPUTED → RESOLVED │
├──────────────────────────────────────────────────┤
│  Functions:                                      │
│  ├── createEscrow()     — Client                 │
│  ├── fundEscrow()       — Client                 │
│  ├── startWork()        — Freelancer             │
│  ├── submitWork()       — Freelancer             │
│  ├── approveAndRelease()— Client                 │
│  ├── cancelAndRefund()  — Client                 │
│  ├── raiseDispute()     — Client/Freelancer      │
│  ├── resolveDispute()   — Arbitrator             │
│  ├── getEscrowDetails() — Anyone (view)          │
│  ├── getContractBalance()— Anyone (view)         │
│  └── getEscrowCount()   — Anyone (view)          │
└──────────────────────────────────────────────────┘
```

---

## Actors

| Actor | Role | Actions |
|---|---|---|
| **Client** | Hires a freelancer and pays for work | Create escrow, deposit funds, approve work, request refund, raise dispute |
| **Freelancer** | Delivers work and receives payment | Start work, submit work, raise dispute |
| **Arbitrator** | Resolves disputes (contract deployer) | Resolve disputes (award to freelancer or refund client) |

---

## Escrow Workflow

### Happy Path

```
Client Creates Escrow (createEscrow)
        │
        ▼
Client Deposits Funds (fundEscrow)
        │
        ▼
Smart Contract Locks Funds [FUNDED]
        │
        ▼
Freelancer Starts Work (startWork)
        │
        ▼
Freelancer Completes & Submits (submitWork)
        │
        ▼
Client Approves Work (approveAndRelease)
        │
        ▼
Smart Contract Releases Payment → Freelancer ✅
```

### Alternative Paths

```
Cancellation:                    Dispute:
  FUNDED                           IN_PROGRESS / SUBMITTED
    │                                   │
    ▼                                   ▼
  cancelAndRefund()                raiseDispute()
    │                                   │
    ▼                                   ▼
  Client gets refund ✅             DISPUTED
                                        │
                                        ▼
                                  resolveDispute()
                                   ╱         ╲
                          Freelancer       Client
                           wins ✅        refunded ✅
```

---

## Contract States

| # | State | Description | Who Changes It | Next States |
|---|---|---|---|---|
| 0 | `CREATED` | Escrow created, not yet funded | Client via `createEscrow()` | → FUNDED |
| 1 | `FUNDED` | Client deposited ETH | Client via `fundEscrow()` | → IN_PROGRESS, CANCELLED |
| 2 | `IN_PROGRESS` | Freelancer is working | Freelancer via `startWork()` | → SUBMITTED, DISPUTED |
| 3 | `SUBMITTED` | Work delivered, pending review | Freelancer via `submitWork()` | → COMPLETED, DISPUTED |
| 4 | `COMPLETED` | Work approved, freelancer paid | Client via `approveAndRelease()` | Terminal |
| 5 | `CANCELLED` | Escrow cancelled, client refunded | Client via `cancelAndRefund()` | Terminal |
| 6 | `DISPUTED` | Dispute raised by either party | Client/Freelancer via `raiseDispute()` | → COMPLETED, REFUNDED |
| 7 | `REFUNDED` | Dispute resolved in client's favor | Arbitrator via `resolveDispute()` | Terminal |

---

## Smart Contract Functions

| Function | Caller | From State | To State | Description |
|---|---|---|---|---|
| `createEscrow()` | Anyone (becomes client) | — | CREATED | Creates new escrow with freelancer address, amount, title |
| `fundEscrow()` | Client | CREATED | FUNDED | Client deposits exact ETH amount |
| `startWork()` | Freelancer | FUNDED | IN_PROGRESS | Freelancer acknowledges and begins work |
| `submitWork()` | Freelancer | IN_PROGRESS | SUBMITTED | Freelancer submits deliverables |
| `approveAndRelease()` | Client | SUBMITTED | COMPLETED | Approves work, transfers ETH to freelancer |
| `cancelAndRefund()` | Client | FUNDED | CANCELLED | Cancels before work starts, refunds client |
| `raiseDispute()` | Client/Freelancer | IN_PROGRESS/SUBMITTED | DISPUTED | Flags escrow for arbitration |
| `resolveDispute()` | Arbitrator | DISPUTED | COMPLETED/REFUNDED | Awards funds to winner |
| `getEscrowDetails()` | Anyone | Any | — | Returns all escrow data (view) |
| `getContractBalance()` | Anyone | Any | — | Returns contract ETH balance (view) |
| `getEscrowCount()` | Anyone | Any | — | Returns total escrow count (view) |

---

## Events

| Event | Emitted When | Indexed Fields |
|---|---|---|
| `EscrowCreated` | New escrow created | escrowId, client, freelancer |
| `FundsDeposited` | Client deposits funds | escrowId, client |
| `WorkStarted` | Freelancer begins work | escrowId, freelancer |
| `WorkSubmitted` | Freelancer submits work | escrowId, freelancer |
| `PaymentReleased` | Payment sent to freelancer | escrowId, freelancer |
| `RefundIssued` | Refund sent to client | escrowId, client |
| `DisputeRaised` | Dispute opened | escrowId, raisedBy |
| `DisputeResolved` | Arbitrator resolves dispute | escrowId |

---

## Security Features

| Vulnerability | Protection Implemented |
|---|---|
| **Reentrancy** | Custom `nonReentrant` modifier with lock variable; state updated before ETH transfer |
| **Unauthorized Access** | `onlyClient`, `onlyFreelancer`, `onlyArbitrator` modifiers |
| **Double Payment** | State changes to COMPLETED before transfer — cannot approve twice |
| **Invalid State Transitions** | `inState` modifier enforces correct lifecycle |
| **Zero Address** | `require(_freelancer != address(0))` validation |
| **Self-Escrow** | `require(_freelancer != msg.sender)` |
| **Wrong Amount** | `require(msg.value == escrow.amount)` |
| **Locked Funds** | Cancellation and dispute resolution paths ensure funds are always recoverable |
| **Checks-Effects-Interactions** | All functions update state BEFORE making external calls |

---

## Folder Structure

```
Smart-Contract-Freelance-Escrow/
│
├── contracts/
│   └── FreelanceEscrow.sol        # Main smart contract
│
├── scripts/
│   └── deploy.js                  # Hardhat deployment script
│
├── test/
│   └── FreelanceEscrow.test.js    # 25+ automated test cases
│
├── frontend/
│   ├── index.html                 # HTML entry point
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.js             # Vite configuration
│   └── src/
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Main application component
│       ├── index.css              # Global styles
│       ├── utils/
│       │   └── contract.js        # ABI, address, helpers
│       └── components/
│           ├── ConnectWallet.jsx   # MetaMask connection
│           ├── CreateEscrow.jsx    # Escrow creation form
│           ├── EscrowDashboard.jsx # Escrow list & details
│           └── EscrowActions.jsx   # Action buttons
│
├── docs/
│   ├── PROJECT_REPORT.md          # Academic project report
│   ├── INTERVIEW_PREP.md          # Interview Q&A
│   ├── REMIX_SIMULATION_GUIDE.md  # Step-by-step Remix guide
│   ├── SECURITY_ANALYSIS.md       # Security analysis
│   └── PROOF_CHECKLIST.md         # Screenshots & proof plan
│
├── screenshots/                   # Captured proof images
├── hardhat.config.js              # Hardhat configuration
├── package.json                   # Project dependencies
├── .gitignore                     # Git ignore rules
├── .env.example                   # Environment template
└── README.md                     # This file
```

---

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ and npm
- [MetaMask](https://metamask.io/) browser extension (for frontend)
- [Git](https://git-scm.com/)

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/Smart-Contract-Freelance-Escrow.git
cd Smart-Contract-Freelance-Escrow
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Compile the Smart Contract

```bash
npx hardhat compile
```

### Step 4: Run Tests

```bash
npx hardhat test
```

### Step 5: Start Local Blockchain

```bash
npx hardhat node
```

### Step 6: Deploy Contract (in a new terminal)

```bash
npx hardhat run scripts/deploy.js --network localhost
```

---

## Remix IDE Simulation

> **For students who want to test without installing anything locally.**

See the detailed guide: [`docs/REMIX_SIMULATION_GUIDE.md`](docs/REMIX_SIMULATION_GUIDE.md)

**Quick Steps:**
1. Open [Remix IDE](https://remix.ethereum.org)
2. Create `FreelanceEscrow.sol` and paste the contract code
3. Compile with Solidity 0.8.20
4. Deploy using "Remix VM (Shanghai)"
5. Use Account 1 as Client, Account 2 as Freelancer
6. Call functions in order: `createEscrow` → `fundEscrow` → `startWork` → `submitWork` → `approveAndRelease`

---

## Hardhat Setup

```bash
# Initialize project (already done)
npm init -y

# Install Hardhat and toolbox
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Install OpenZeppelin (for reference)
npm install @openzeppelin/contracts

# Compile contracts
npx hardhat compile

# Run all tests
npx hardhat test

# Start local blockchain node
npx hardhat node

# Deploy to local node
npx hardhat run scripts/deploy.js --network localhost
```

### Command Reference

| Command | Purpose |
|---|---|
| `npx hardhat compile` | Compile Solidity contracts |
| `npx hardhat test` | Run automated tests |
| `npx hardhat node` | Start local Ethereum node with 20 test accounts |
| `npx hardhat run scripts/deploy.js` | Deploy to in-memory network |
| `npx hardhat run scripts/deploy.js --network localhost` | Deploy to running local node |

---

## Running Tests

```bash
npx hardhat test
```

**Test Categories (25+ tests):**

| Category | Tests |
|---|---|
| Deployment | Arbitrator set, zero escrows, zero balance |
| Escrow Creation | Valid creation, zero address, self-escrow, zero amount, empty title |
| Funding | Exact amount, wrong amount, non-client, double fund |
| Work Lifecycle | Start work, unauthorized start, submit, premature submit |
| Payment Release | Correct transfer, double release, unauthorized approve |
| Cancellation | Refund before work, cancel after work, unauthorized cancel |
| Dispute | Client dispute, freelancer dispute, outsider dispute, wrong state, resolve for freelancer, resolve for client, non-arbitrator resolve |
| Multiple Escrows | Independent escrow management |
| Full Workflow | End-to-end happy path |

---

## Deployment

### Option 1: Hardhat Local Node (Recommended)

```bash
# Terminal 1: Start local blockchain
npx hardhat node

# Terminal 2: Deploy
npx hardhat run scripts/deploy.js --network localhost
```

### Option 2: Sepolia Testnet (Advanced)

1. Get test ETH from [sepoliafaucet.com](https://sepoliafaucet.com)
2. Create `.env` from `.env.example`
3. Add your private key and RPC URL
4. Deploy:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Option 3: Remix IDE (Easiest)

See [`docs/REMIX_SIMULATION_GUIDE.md`](docs/REMIX_SIMULATION_GUIDE.md)

> ⚠️ **No real cryptocurrency is required for any option.**

---

## Frontend DApp

### Setup

```bash
cd frontend
npm install
npm run dev
```

### Features

| Feature | Description |
|---|---|
| 🦊 Wallet Connection | Connect MetaMask to the DApp |
| 📝 Create Escrow | Enter freelancer address, title, amount |
| 💰 Fund Escrow | Deposit exact ETH into contract |
| 🔨 Start/Submit Work | Freelancer workflow |
| ✅ Approve & Release | Client releases payment |
| ❌ Cancel & Refund | Client cancels before work starts |
| ⚠️ Raise Dispute | Either party raises dispute |
| 📊 Dashboard | View all escrows with status badges |

### Connecting MetaMask to Local Blockchain

1. Start Hardhat node: `npx hardhat node`
2. In MetaMask → Add Network → Manual:
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
3. Import a test account using a private key from the Hardhat node output

---

## Sample Transactions

### Transaction 1: Create Escrow
```
Function: createEscrow("0xFreelancer", 1000000000000000000, "Build DeFi Dashboard")
From: Client (0x...)
State Change: → CREATED
Event: EscrowCreated(0, client, freelancer, 1 ETH, "Build DeFi Dashboard")
```

### Transaction 2: Fund Escrow
```
Function: fundEscrow(0)
From: Client (0x...)
Value: 1 ETH
State Change: CREATED → FUNDED
Event: FundsDeposited(0, client, 1 ETH)
Contract Balance: 1 ETH
```

### Transaction 3: Approve & Release
```
Function: approveAndRelease(0)
From: Client (0x...)
State Change: SUBMITTED → COMPLETED
Event: PaymentReleased(0, freelancer, 1 ETH)
Contract Balance: 0 ETH
Freelancer Balance: +1 ETH
```

---

## Screenshots

Capture and save these in the `screenshots/` folder:

| # | Screenshot | Filename |
|---|---|---|
| 1 | Project folder structure | `01_folder_structure.png` |
| 2 | Solidity code in editor | `02_contract_code.png` |
| 3 | Successful compilation | `03_compilation.png` |
| 4 | Contract deployment | `04_deployment.png` |
| 5 | Escrow creation tx | `05_escrow_created.png` |
| 6 | Fund deposit tx | `06_funds_deposited.png` |
| 7 | Contract balance after funding | `07_contract_balance.png` |
| 8 | Work submitted | `08_work_submitted.png` |
| 9 | Payment released | `09_payment_released.png` |
| 10 | Refund transaction | `10_refund.png` |
| 11 | Hardhat test results | `11_test_results.png` |
| 12 | Frontend dashboard | `12_frontend.png` |
| 13 | GitHub repository | `13_github_repo.png` |

---

## Results

- ✅ Smart contract compiles without errors (Solidity 0.8.20)
- ✅ All 25+ automated tests pass
- ✅ Full escrow lifecycle works end-to-end
- ✅ Cancellation and refund works correctly
- ✅ Dispute resolution distributes funds to the correct party
- ✅ Reentrancy protection verified
- ✅ Access control prevents unauthorized actions
- ✅ Events emitted for all actions
- ✅ Frontend DApp connects and interacts with contract
- ✅ Deployed on local Hardhat blockchain (no real crypto used)

---

## Limitations

| Limitation | Description |
|---|---|
| Single payment | No milestone-based partial payments |
| Basic dispute resolution | Arbitrator makes unilateral decision |
| No file storage | Work submissions are not stored on-chain |
| Gas costs | Each transaction costs gas on mainnet |
| Single arbitrator | Deployer is the only arbitrator |
| No deadline enforcement | No automatic refund after time expires |

---

## Future Improvements

- 🔄 **Multi-milestone payments** — Release funds in stages
- ⏰ **Time-locked escrows** — Auto-refund if deadline passes
- 👥 **Multi-signature dispute resolution** — DAO-based voting
- 📁 **IPFS integration** — Store work deliverables on decentralized storage
- 💬 **On-chain messaging** — Client-freelancer communication
- 📈 **Reputation system** — Rating-based trust scores
- 🪙 **ERC-20 token support** — Pay with stablecoins (USDT, USDC)
- 🔔 **Push notifications** — Alert users on state changes
- 📊 **Analytics dashboard** — Track platform-wide statistics

---

## Learning Outcomes

By building this project, I learned:

1. How to write and deploy **Solidity smart contracts**
2. The **escrow pattern** and its real-world applications
3. **State machine design** using enums and modifiers
4. **Access control** with `msg.sender` and custom modifiers
5. **Secure ETH transfers** using checks-effects-interactions
6. **Reentrancy protection** techniques
7. How to write **automated tests** with Hardhat and Chai
8. **Event emission** and on-chain logging
9. Building a **React DApp** with Ethers.js and MetaMask
10. **Git workflow** and professional GitHub documentation

---

## Author

**Adarsh Srivastav**
- Diploma Course — Blockchain Technology
- GitHub: (https://github.com/adarshsrivastav23905)

---

<div align="center">

⭐ **Star this repository if you found it helpful!** ⭐

Built with ❤️ using Solidity, Hardhat, React, and Ethers.js

</div>
