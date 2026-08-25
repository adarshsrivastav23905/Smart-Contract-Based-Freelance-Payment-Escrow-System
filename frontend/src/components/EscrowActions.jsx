import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * EscrowActions Component
 *
 * Provides action buttons for a specific escrow based on the current user's role
 * and the escrow's state. Actions:
 *   - Fund (client, state=CREATED)
 *   - Start Work (freelancer, state=FUNDED)
 *   - Submit Work (freelancer, state=IN_PROGRESS)
 *   - Approve & Release (client, state=SUBMITTED)
 *   - Cancel & Refund (client, state=FUNDED)
 *   - Raise Dispute (client/freelancer, state=IN_PROGRESS or SUBMITTED)
 */
export default function EscrowActions({ contract, account, escrows, onSuccess }) {
  const [escrowId, setEscrowId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // State constants
  const CREATED = 0, FUNDED = 1, IN_PROGRESS = 2, SUBMITTED = 3;

  const getEscrow = () => {
    if (escrowId === '' || isNaN(Number(escrowId))) return null;
    return escrows.find((e) => e.id.toString() === escrowId.toString());
  };

  const escrow = getEscrow();
  const state = escrow ? Number(escrow.state) : -1;
  const isClient = escrow && escrow.client.toLowerCase() === account?.toLowerCase();
  const isFreelancer = escrow && escrow.freelancer.toLowerCase() === account?.toLowerCase();

  /**
   * Generic action handler — calls a contract method and refreshes.
   */
  const handleAction = async (actionName, contractCall) => {
    setMessage(null);
    setLoading(true);
    try {
      const tx = await contractCall();
      await tx.wait();
      setMessage({ type: 'success', text: `✅ ${actionName} successful!` });
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.reason || err.message || `${actionName} failed.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>⚡ Escrow Actions</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="form-group">
        <label>Escrow ID</label>
        <input
          type="number"
          min="0"
          placeholder="Enter escrow ID (e.g., 0)"
          value={escrowId}
          onChange={(e) => {
            setEscrowId(e.target.value);
            setMessage(null);
          }}
          disabled={loading}
        />
      </div>

      {escrowId !== '' && !escrow && (
        <div className="alert alert-info">
          No escrow found with ID #{escrowId}. Check the dashboard for valid IDs.
        </div>
      )}

      {escrow && (
        <>
          <div className="alert alert-info">
            <strong>{escrow.projectTitle}</strong> — {ethers.formatEther(escrow.amount)} ETH
            {isClient && ' (You are the Client)'}
            {isFreelancer && ' (You are the Freelancer)'}
            {!isClient && !isFreelancer && ' (You are not a party)'}
          </div>

          <div className="actions-group">
            {/* Fund — Client, CREATED */}
            {isClient && state === CREATED && (
              <button
                className="btn btn-success btn-sm"
                disabled={loading}
                onClick={() =>
                  handleAction('Fund Escrow', () =>
                    contract.fundEscrow(escrowId, { value: escrow.amount })
                  )
                }
              >
                💰 Fund Escrow
              </button>
            )}

            {/* Start Work — Freelancer, FUNDED */}
            {isFreelancer && state === FUNDED && (
              <button
                className="btn btn-primary btn-sm"
                disabled={loading}
                onClick={() =>
                  handleAction('Start Work', () => contract.startWork(escrowId))
                }
              >
                🔨 Start Work
              </button>
            )}

            {/* Submit Work — Freelancer, IN_PROGRESS */}
            {isFreelancer && state === IN_PROGRESS && (
              <button
                className="btn btn-primary btn-sm"
                disabled={loading}
                onClick={() =>
                  handleAction('Submit Work', () => contract.submitWork(escrowId))
                }
              >
                📤 Submit Work
              </button>
            )}

            {/* Approve & Release — Client, SUBMITTED */}
            {isClient && state === SUBMITTED && (
              <button
                className="btn btn-success btn-sm"
                disabled={loading}
                onClick={() =>
                  handleAction('Approve & Release', () =>
                    contract.approveAndRelease(escrowId)
                  )
                }
              >
                ✅ Approve & Release Payment
              </button>
            )}

            {/* Cancel & Refund — Client, FUNDED */}
            {isClient && state === FUNDED && (
              <button
                className="btn btn-warning btn-sm"
                disabled={loading}
                onClick={() =>
                  handleAction('Cancel & Refund', () =>
                    contract.cancelAndRefund(escrowId)
                  )
                }
              >
                ❌ Cancel & Refund
              </button>
            )}

            {/* Raise Dispute — Client or Freelancer, IN_PROGRESS or SUBMITTED */}
            {(isClient || isFreelancer) &&
              (state === IN_PROGRESS || state === SUBMITTED) && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={loading}
                  onClick={() =>
                    handleAction('Raise Dispute', () =>
                      contract.raiseDispute(escrowId)
                    )
                  }
                >
                  ⚠️ Raise Dispute
                </button>
              )}

            {loading && <span className="spinner"></span>}
          </div>
        </>
      )}
    </div>
  );
}
