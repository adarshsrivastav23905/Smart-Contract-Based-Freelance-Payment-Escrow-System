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
  const totalValue = escrows?.reduce(
    (total, escrow) => total + Number(ethers.formatEther(escrow.amount)),
    0
  ) || 0;
  const activeEscrows = escrows?.filter((escrow) => {
    const state = Number(escrow.state);
    return state > 0 && state < 4;
  }).length || 0;

  if (loading) {
    return <div className="dashboard-state"><span className="spinner"></span><p>Loading escrow activity...</p></div>;
  }

  if (!escrows || escrows.length === 0) {
    return <div className="dashboard-state"><span className="empty-icon">—</span><h2>No escrow activity yet</h2><p>Create your first escrow to see payment activity here.</p></div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-heading">
        <div>
          <p className="eyebrow">Operations overview</p>
          <h2>Escrow dashboard</h2>
          <p className="dashboard-subtitle">Track projects, payment milestones, and counterparties.</p>
        </div>
        <div className="record-count"><span className="status-dot"></span>{escrows.length} records</div>
      </div>

      <div className="dashboard-metrics">
        <div className="metric-card"><span className="metric-label">Total escrows</span><strong>{escrows.length}</strong><span className="metric-note">All projects</span></div>
        <div className="metric-card"><span className="metric-label">Active projects</span><strong>{activeEscrows}</strong><span className="metric-note">In progress or funded</span></div>
        <div className="metric-card metric-card-accent"><span className="metric-label">Managed value</span><strong>{totalValue.toFixed(2)} <small>ETH</small></strong><span className="metric-note">Across all records</span></div>
      </div>

      <section className="escrow-table-panel">
        <div className="table-header"><h3>Recent escrow activity</h3><span>Sorted by escrow ID</span></div>
        <div className="escrow-table-wrap">
          <table className="escrow-table">
            <thead>
              <tr><th>Project</th><th>Client</th><th>Freelancer</th><th>Value</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {escrows.map((escrow) => (
                <tr key={escrow.id.toString()}>
                  <td data-label="Project"><div className="project-cell"><span className="project-id">#{escrow.id.toString().padStart(3, '0')}</span><strong>{escrow.projectTitle}</strong></div></td>
                  <td data-label="Client" className="mono" title={escrow.client}>{shortenAddress(escrow.client)}</td>
                  <td data-label="Freelancer" className="mono" title={escrow.freelancer}>{shortenAddress(escrow.freelancer)}</td>
                  <td data-label="Value" className="amount-cell">{ethers.formatEther(escrow.amount)} ETH</td>
                  <td data-label="Status"><span className={`badge ${STATE_BADGE_CLASSES[Number(escrow.state)]}`}>{STATE_LABELS[Number(escrow.state)]}</span></td>
                  <td data-label="Created" className="date-cell">{escrow.createdAt > 0 ? new Date(Number(escrow.createdAt) * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
