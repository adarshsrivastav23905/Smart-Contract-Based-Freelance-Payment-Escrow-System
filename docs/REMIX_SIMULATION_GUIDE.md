# Remix IDE Simulation Guide

> **Step-by-step guide to simulate the FreelanceEscrow smart contract using Remix IDE — no installation required.**

---

## Prerequisites

- A modern web browser (Chrome, Firefox, Brave)
- Internet connection
- No installation, no MetaMask, no real crypto needed

---

## Simulation 1: Happy Path (Create → Fund → Work → Approve → Pay)

### Step 1: Open Remix IDE

Navigate to: **https://remix.ethereum.org**

📸 **Screenshot:** `screenshots/remix_01_open.png`

---

### Step 2: Create the Contract File

1. In the File Explorer (left panel), click the **📄 New File** icon
2. Name it: `FreelanceEscrow.sol`
3. Copy the entire contract code from `contracts/FreelanceEscrow.sol` and paste it

📸 **Screenshot:** `screenshots/remix_02_contract_code.png`

---

### Step 3: Compile the Contract

1. Click the **Solidity Compiler** tab (left sidebar — hammer icon)
2. Set compiler version to **0.8.20**
3. Click **"Compile FreelanceEscrow.sol"**
4. ✅ You should see a green checkmark — no errors

📸 **Screenshot:** `screenshots/remix_03_compilation_success.png`

---

### Step 4: Deploy the Contract

1. Click the **Deploy & Run Transactions** tab (left sidebar — Ethereum icon)
2. Set **Environment** to: `Remix VM (Shanghai)`
   - This gives you 10+ test accounts, each with 100 test ETH
3. Select **Account 1** (this will be the deployer/arbitrator)
4. Ensure **Contract** dropdown shows: `FreelanceEscrow`
5. Click **"Deploy"**
6. ✅ The contract appears under "Deployed Contracts" at the bottom

📸 **Screenshot:** `screenshots/remix_04_deployment.png`

**Record:**
- Contract address (shown next to the deployed contract)
- Transaction hash (shown in the console at the bottom)

---

### Step 5: Set Up Accounts

| Account | Role | How to Select |
|---|---|---|
| Account 1 (first in dropdown) | Deployer / Arbitrator | Already selected |
| Account 2 (second in dropdown) | **Client** | Select from the "Account" dropdown |
| Account 3 (third in dropdown) | **Freelancer** | Copy this address for use later |

**Copy Account 3's address** — you'll need it to create the escrow.

---

### Step 6: Create an Escrow (as Client)

1. **Switch to Account 2** (Client) using the Account dropdown
2. Expand the deployed contract functions
3. Find `createEscrow` and enter:
   - `_freelancer`: paste Account 3's address
   - `_amount`: `1000000000000000000` (this is 1 ETH in wei)
   - `_projectTitle`: `"Build a DeFi Dashboard"`
4. Click **"transact"**
5. ✅ Check the console — you should see `EscrowCreated` event

📸 **Screenshot:** `screenshots/remix_05_escrow_created.png`

**Verify:**
- Call `getEscrowDetails` with input `0`
- State should show `0` (CREATED)

---

### Step 7: Fund the Escrow (as Client)

1. **Stay on Account 2** (Client)
2. In the **"Value"** field at the top, enter: `1` and select `Ether` from the dropdown
3. Find `fundEscrow` and enter: `0` (the escrow ID)
4. Click **"transact"**
5. ✅ Check the console — you should see `FundsDeposited` event

📸 **Screenshot:** `screenshots/remix_06_funds_deposited.png`

**Verify:**
- Call `getContractBalance` → should show `1000000000000000000` (1 ETH)
- Call `getEscrowDetails(0)` → state should show `1` (FUNDED)

📸 **Screenshot:** `screenshots/remix_07_contract_balance.png`

---

### Step 8: Start Work (as Freelancer)

1. **Switch to Account 3** (Freelancer)
2. Find `startWork` and enter: `0`
3. Click **"transact"**
4. ✅ Check the console — `WorkStarted` event

📸 **Screenshot:** `screenshots/remix_08_work_started.png`

**Verify:** `getEscrowDetails(0)` → state = `2` (IN_PROGRESS)

---

### Step 9: Submit Work (as Freelancer)

1. **Stay on Account 3** (Freelancer)
2. Find `submitWork` and enter: `0`
3. Click **"transact"**
4. ✅ Check the console — `WorkSubmitted` event

📸 **Screenshot:** `screenshots/remix_09_work_submitted.png`

**Verify:** `getEscrowDetails(0)` → state = `3` (SUBMITTED)

---

### Step 10: Approve and Release Payment (as Client)

1. **Switch to Account 2** (Client)
2. Find `approveAndRelease` and enter: `0`
3. Click **"transact"**
4. ✅ Check the console — `PaymentReleased` event

📸 **Screenshot:** `screenshots/remix_10_payment_released.png`

**Verify:**
- `getEscrowDetails(0)` → state = `4` (COMPLETED)
- `getContractBalance` → should show `0`
- Check Account 3's balance — it should have increased by ~1 ETH

📸 **Screenshot:** `screenshots/remix_11_freelancer_balance.png`

---

## Simulation 2: Cancellation & Refund

### Step 1: Create a New Escrow

1. **Switch to Account 2** (Client)
2. Call `createEscrow`:
   - `_freelancer`: Account 3's address
   - `_amount`: `2000000000000000000` (2 ETH)
   - `_projectTitle`: `"Mobile App Design"`
3. Click **"transact"**
4. Note the escrow ID: `1`

---

### Step 2: Fund the Escrow

1. Set **Value** to `2 Ether`
2. Call `fundEscrow(1)`
3. ✅ `FundsDeposited` event emitted

**Verify:** `getContractBalance` → 2 ETH

---

### Step 3: Cancel and Get Refund

1. **Stay on Account 2** (Client)
2. Call `cancelAndRefund(1)`
3. ✅ `RefundIssued` event emitted

📸 **Screenshot:** `screenshots/remix_12_refund.png`

**Verify:**
- `getEscrowDetails(1)` → state = `5` (CANCELLED)
- `getContractBalance` → `0`
- Account 2's balance increased by ~2 ETH (minus gas)

---

## Simulation 3: Dispute Resolution

### Step 1: Create and Fund Escrow #2

1. Client (Account 2) creates escrow #2: `createEscrow(Account3, 500000000000000000, "Logo Design")` (0.5 ETH)
2. Fund with 0.5 ETH: `fundEscrow(2)`

### Step 2: Freelancer Starts Work

1. Switch to Account 3
2. Call `startWork(2)`

### Step 3: Raise Dispute

1. **Switch to Account 2** (Client) or stay on Account 3
2. Call `raiseDispute(2)`
3. ✅ `DisputeRaised` event emitted

📸 **Screenshot:** `screenshots/remix_13_dispute_raised.png`

**Verify:** `getEscrowDetails(2)` → state = `6` (DISPUTED)

### Step 4: Resolve Dispute (as Arbitrator)

1. **Switch to Account 1** (Arbitrator/Deployer)
2. Call `resolveDispute(2, true)` — to award freelancer
   - OR `resolveDispute(2, false)` — to refund client
3. ✅ `DisputeResolved` event emitted

📸 **Screenshot:** `screenshots/remix_14_dispute_resolved.png`

**Verify:**
- If `true`: state = `4` (COMPLETED), freelancer gets 0.5 ETH
- If `false`: state = `7` (REFUNDED), client gets 0.5 ETH

---

## Event Logs

After each transaction, check the **Remix console** at the bottom. Expand the transaction to see:

- **Transaction hash** — unique ID
- **From** — sender address
- **To** — contract address
- **Gas used** — cost of the transaction
- **Decoded output** — return values
- **Logs** — emitted events with parameters

📸 **Screenshot:** `screenshots/remix_15_event_logs.png`

---

## Quick Reference: State Codes

| Code | State |
|---|---|
| 0 | CREATED |
| 1 | FUNDED |
| 2 | IN_PROGRESS |
| 3 | SUBMITTED |
| 4 | COMPLETED |
| 5 | CANCELLED |
| 6 | DISPUTED |
| 7 | REFUNDED |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Invalid escrow state" | Check the current state with `getEscrowDetails` — you may be calling a function in the wrong order |
| "Only the client can call this" | Switch to the correct account in the Account dropdown |
| "Must send exact escrow amount" | Set the **Value** field at the top to the exact amount |
| Transaction reverts | Read the error message in the console — it tells you exactly what's wrong |
| Compiler error | Make sure the compiler version is set to 0.8.20 |
