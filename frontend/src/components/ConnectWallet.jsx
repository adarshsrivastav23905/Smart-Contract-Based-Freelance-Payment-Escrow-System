import React from 'react';
import { shortenAddress } from '../utils/contract';

/**
 * ConnectWallet Component
 * 
 * Handles MetaMask wallet connection and displays the connected address.
 * Shows a "Connect Wallet" button when not connected, and wallet info when connected.
 */
export default function ConnectWallet({ account, onConnect, networkName }) {
  return (
    <div className="wallet-section">
      {account ? (
        <>
          <span className="wallet-address" title={account}>
            🔗 {shortenAddress(account)}
          </span>
          {networkName && (
            <span className="network-badge">
              🌐 {networkName}
            </span>
          )}
        </>
      ) : (
        <button className="btn btn-primary" onClick={onConnect}>
          🦊 Connect MetaMask
        </button>
      )}
    </div>
  );
}
