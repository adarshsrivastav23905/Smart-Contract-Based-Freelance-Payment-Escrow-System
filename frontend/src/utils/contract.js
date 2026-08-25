/**
 * @file contract.js
 * @notice Contract ABI, address, and helper functions for the FreelanceEscrow DApp.
 *
 * HOW TO USE:
 * 1. Deploy the contract using `npx hardhat run scripts/deploy.js --network localhost`
 * 2. Copy the deployed contract address and paste it below in CONTRACT_ADDRESS.
 * 3. The ABI is extracted from the Hardhat compilation artifacts.
 */

// ============================================================
//  CONTRACT ADDRESS — Update this after deployment!
// ============================================================
export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// ============================================================
//  CONTRACT ABI — Minimal ABI for the frontend
// ============================================================
export const CONTRACT_ABI = [
  // ── Constructor ──
  "constructor()",

  // ── State Variables ──
  "function escrowCount() view returns (uint256)",
  "function arbitrator() view returns (address)",

  // ── Core Functions ──
  "function createEscrow(address payable _freelancer, uint256 _amount, string memory _projectTitle) external returns (uint256)",
  "function fundEscrow(uint256 _escrowId) external payable",
  "function startWork(uint256 _escrowId) external",
  "function submitWork(uint256 _escrowId) external",
  "function approveAndRelease(uint256 _escrowId) external",
  "function cancelAndRefund(uint256 _escrowId) external",
  "function raiseDispute(uint256 _escrowId) external",
  "function resolveDispute(uint256 _escrowId, bool _freelancerWins) external",

  // ── View Functions ──
  "function getEscrowDetails(uint256 _escrowId) external view returns (uint256 id, address client, address freelancer, uint256 amount, string projectTitle, uint8 state, uint256 createdAt, uint256 fundedAt, uint256 completedAt)",
  "function getContractBalance() external view returns (uint256)",
  "function getEscrowCount() external view returns (uint256)",

  // ── Events ──
  "event EscrowCreated(uint256 indexed escrowId, address indexed client, address indexed freelancer, uint256 amount, string projectTitle)",
  "event FundsDeposited(uint256 indexed escrowId, address indexed client, uint256 amount)",
  "event WorkStarted(uint256 indexed escrowId, address indexed freelancer)",
  "event WorkSubmitted(uint256 indexed escrowId, address indexed freelancer)",
  "event PaymentReleased(uint256 indexed escrowId, address indexed freelancer, uint256 amount)",
  "event RefundIssued(uint256 indexed escrowId, address indexed client, uint256 amount)",
  "event DisputeRaised(uint256 indexed escrowId, address indexed raisedBy)",
  "event DisputeResolved(uint256 indexed escrowId, bool freelancerWins, address resolvedBy)",
];

// ============================================================
//  ESCROW STATE LABELS & BADGE CLASSES
// ============================================================
export const STATE_LABELS = [
  "Created",
  "Funded",
  "In Progress",
  "Submitted",
  "Completed",
  "Cancelled",
  "Disputed",
  "Refunded",
];

export const STATE_BADGE_CLASSES = [
  "badge-created",
  "badge-funded",
  "badge-inprogress",
  "badge-submitted",
  "badge-completed",
  "badge-cancelled",
  "badge-disputed",
  "badge-refunded",
];

/**
 * @notice Shortens an Ethereum address for display.
 * @param {string} address - Full Ethereum address.
 * @returns {string} Shortened address like "0x1234...abcd".
 */
export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * @notice Formats a BigInt wei value to ETH string.
 * @param {BigInt|string} wei - Value in wei.
 * @returns {string} Value in ETH.
 */
export function formatEth(wei) {
  try {
    const { ethers } = require("ethers");
    return ethers.formatEther(wei);
  } catch {
    // Fallback if ethers not loaded
    return (Number(wei) / 1e18).toFixed(4);
  }
}
