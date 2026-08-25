import React from 'react';
import { ethers } from 'ethers';
import { shortenAddress, STATE_LABELS, STATE_BADGE_CLASSES } from '../utils/contract';

/**
 * EscrowDashboard Component
 * 
 * Displays a list of all escrows with their details:
 * - Project title, ID, client, freelancer, amount, state
 */
export default function EscrowDashboard({ escrows, loading }) {
  if (loading) {
    return (
      <div className="card">
        <h2>📊 Escrow Dashboard</h2>
        <div className="escrow-list-empty">
          <span className="spinner"></span>
          <p>Loading escrows...</p>
        </div>
      </div>
    );
  }

  if (!escrows || escrows.length === 0) {
    return (
      <div className="card">
        <h2>📊 Escrow Dashboard</h2>
        <div className="escrow-list-empty">
          <p>📭 No escrows found. Create one to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>📊 Escrow Dashboard ({escrows.length})</h2>
      {escrows.map((escrow) => (
        <div className="card" key={escrow.id.toString()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ margin: 0 }}>
              #{escrow.id.toString()} — {escrow.projectTitle}
            </h3>
            <span className={`badge ${STATE_BADGE_CLASSES[Number(escrow.state)]}`}>
              {STATE_LABELS[Number(escrow.state)]}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Client</span>
            <span className="detail-value mono" title={escrow.client}>
              {shortenAddress(escrow.client)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Freelancer</span>
            <span className="detail-value mono" title={escrow.freelancer}>
              {shortenAddress(escrow.freelancer)}
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Amount</span>
            <span className="detail-value">
              {ethers.formatEther(escrow.amount)} ETH
            </span>
          </div>

          <div className="detail-row">
            <span className="detail-label">Created</span>
            <span className="detail-value">
              {escrow.createdAt > 0
                ? new Date(Number(escrow.createdAt) * 1000).toLocaleString()
                : '—'}
            </span>
          </div>

          {escrow.fundedAt > 0 && (
            <div className="detail-row">
              <span className="detail-label">Funded</span>
              <span className="detail-value">
                {new Date(Number(escrow.fundedAt) * 1000).toLocaleString()}
              </span>
            </div>
          )}

          {escrow.completedAt > 0 && (
            <div className="detail-row">
              <span className="detail-label">Completed</span>
              <span className="detail-value">
                {new Date(Number(escrow.completedAt) * 1000).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
