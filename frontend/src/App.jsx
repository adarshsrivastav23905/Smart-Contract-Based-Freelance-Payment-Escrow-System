import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './utils/contract';
import ConnectWallet from './components/ConnectWallet';
import CreateEscrow from './components/CreateEscrow';
import EscrowDashboard from './components/EscrowDashboard';
import EscrowActions from './components/EscrowActions';

/**
 * App — Main component for the FreelanceEscrow DApp.
 *
 * Manages wallet connection, contract instance, and tabs for:
 *   1. Create Escrow
 *   2. Escrow Actions
 *   3. Dashboard
 */
export default function App() {
  // ── Wallet state ──
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [networkName, setNetworkName] = useState('');

  // ── Escrow data ──
  const [escrows, setEscrows] = useState([]);
  const [contractBalance, setContractBalance] = useState('0');
  const [loadingEscrows, setLoadingEscrows] = useState(false);

  // ── UI state ──
  const [activeTab, setActiveTab] = useState('create');
  const [error, setError] = useState(null);

  // ============================================================
  //  CONNECT WALLET
  // ============================================================
  const connectWallet = async () => {
    setError(null);
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to use this DApp.');
        return;
      }

      // Request accounts
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      const signerInstance = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();

      // Create contract instance
      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signerInstance
      );

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setSigner(signerInstance);
      setContract(contractInstance);
      setNetworkName(network.name === 'unknown' ? 'Localhost' : network.name);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message || 'Failed to connect wallet.');
    }
  };

  // ============================================================
  //  LOAD ESCROWS
  // ============================================================
  const loadEscrows = useCallback(async () => {
    if (!contract) return;

    setLoadingEscrows(true);
    try {
      const count = await contract.getEscrowCount();
      const loaded = [];

      for (let i = 0; i < Number(count); i++) {
        const details = await contract.getEscrowDetails(i);
        loaded.push({
          id: details.id,
          client: details.client,
          freelancer: details.freelancer,
          amount: details.amount,
          projectTitle: details.projectTitle,
          state: details.state,
          createdAt: details.createdAt,
          fundedAt: details.fundedAt,
          completedAt: details.completedAt,
        });
      }

      setEscrows(loaded);

      const balance = await contract.getContractBalance();
      setContractBalance(ethers.formatEther(balance));
    } catch (err) {
      console.error('Failed to load escrows:', err);
    } finally {
      setLoadingEscrows(false);
    }
  }, [contract]);

  // ── Load escrows on connect ──
  useEffect(() => {
    if (contract) loadEscrows();
  }, [contract, loadEscrows]);

  // ── Listen for account/network changes ──
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setContract(null);
        } else {
          setAccount(accounts[0]);
          // Reconnect with new account
          connectWallet();
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // ============================================================
  //  RENDER
  // ============================================================
  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <h1>🔐 FreelanceEscrow DApp</h1>
        <p>Decentralized escrow payments for freelancers — powered by Ethereum smart contracts</p>
        <ConnectWallet
          account={account}
          onConnect={connectWallet}
          networkName={networkName}
        />
        {account && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#9ca3af' }}>
            Contract Balance: <strong style={{ color: '#10b981' }}>{contractBalance} ETH</strong>
          </div>
        )}
      </header>

      {/* ── Error ── */}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Main Content ── */}
      {account && contract ? (
        <>
          {/* ── Tabs ── */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'create' ? 'active' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              📝 Create
            </button>
            <button
              className={`tab ${activeTab === 'actions' ? 'active' : ''}`}
              onClick={() => setActiveTab('actions')}
            >
              ⚡ Actions
            </button>
            <button
              className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>

          {/* ── Tab Content ── */}
          {activeTab === 'create' && (
            <CreateEscrow contract={contract} onSuccess={loadEscrows} />
          )}

          {activeTab === 'actions' && (
            <EscrowActions
              contract={contract}
              account={account}
              escrows={escrows}
              onSuccess={loadEscrows}
            />
          )}

          {activeTab === 'dashboard' && (
            <EscrowDashboard escrows={escrows} loading={loadingEscrows} />
          )}
        </>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>👋 Welcome</h2>
          <p style={{ color: '#9ca3af', marginTop: '0.5rem' }}>
            Connect your MetaMask wallet to interact with the escrow contract.
          </p>
          <p style={{ color: '#6b7280', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Make sure you're connected to <strong>Localhost:8545</strong> or a testnet.
          </p>
        </div>
      )}

      {/* ── Footer ── */}
      <footer className="footer">
        <p>FreelanceEscrow DApp — Smart Contract-Based Freelance Payment Escrow System</p>
        <p>Built with Solidity • Hardhat • React • Ethers.js</p>
      </footer>
    </div>
  );
}
