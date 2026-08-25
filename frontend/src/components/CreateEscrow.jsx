import React, { useState } from 'react';
import { ethers } from 'ethers';

/**
 * CreateEscrow Component
 * 
 * Form for clients to create a new escrow by entering:
 * - Freelancer wallet address
 * - Project title
 * - Escrow amount in ETH
 */
export default function CreateEscrow({ contract, onSuccess }) {
  const [freelancerAddr, setFreelancerAddr] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    // ── Validations ──
    if (!ethers.isAddress(freelancerAddr)) {
      setMessage({ type: 'error', text: 'Invalid freelancer address.' });
      return;
    }
    if (!projectTitle.trim()) {
      setMessage({ type: 'error', text: 'Project title is required.' });
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'Amount must be greater than 0.' });
      return;
    }

    try {
      setLoading(true);
      const amountWei = ethers.parseEther(amount);
      const tx = await contract.createEscrow(freelancerAddr, amountWei, projectTitle);
      const receipt = await tx.wait();

      setMessage({
        type: 'success',
        text: `✅ Escrow created! Tx: ${receipt.hash.slice(0, 16)}...`,
      });

      // Clear form
      setFreelancerAddr('');
      setProjectTitle('');
      setAmount('');

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      setMessage({
        type: 'error',
        text: err.reason || err.message || 'Transaction failed.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>📝 Create New Escrow</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Freelancer Wallet Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={freelancerAddr}
            onChange={(e) => setFreelancerAddr(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Project Title</label>
          <input
            type="text"
            placeholder="e.g., Build a DeFi Dashboard"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label>Escrow Amount (ETH)</label>
          <input
            type="number"
            step="0.001"
            min="0"
            placeholder="e.g., 1.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? <><span className="spinner"></span> Creating...</> : '🚀 Create Escrow'}
        </button>
      </form>
    </div>
  );
}
