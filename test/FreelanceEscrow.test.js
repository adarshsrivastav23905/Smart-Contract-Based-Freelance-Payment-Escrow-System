/**
 * @file FreelanceEscrow.test.js
 * @notice Comprehensive test suite for the FreelanceEscrow smart contract.
 *
 * Run with:  npx hardhat test
 *
 * Test Categories:
 *   1. Deployment
 *   2. Escrow Creation
 *   3. Funding
 *   4. Work Lifecycle (start → submit → approve)
 *   5. Payment Release
 *   6. Cancellation & Refund
 *   7. Dispute Resolution
 *   8. Access Control
 *   9. Edge Cases
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FreelanceEscrow", function () {
  // ── Shared variables ──
  let escrowContract;
  let deployer, client, freelancer, outsider;
  const PROJECT_TITLE = "Build a DeFi Dashboard";
  const ESCROW_AMOUNT = ethers.parseEther("1.0"); // 1 ETH

  // ── Enum mirrors (for readability) ──
  const State = {
    CREATED: 0,
    FUNDED: 1,
    IN_PROGRESS: 2,
    SUBMITTED: 3,
    COMPLETED: 4,
    CANCELLED: 5,
    DISPUTED: 6,
    REFUNDED: 7,
  };

  /**
   * @notice Fresh contract deployment before every test.
   */
  beforeEach(async function () {
    [deployer, client, freelancer, outsider] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("FreelanceEscrow");
    escrowContract = await Factory.deploy();
    await escrowContract.waitForDeployment();
  });

  // ============================================================
  //  1. DEPLOYMENT
  // ============================================================
  describe("1. Deployment", function () {
    it("Should set the deployer as arbitrator", async function () {
      expect(await escrowContract.arbitrator()).to.equal(deployer.address);
    });

    it("Should start with zero escrows", async function () {
      expect(await escrowContract.getEscrowCount()).to.equal(0);
    });

    it("Should start with zero contract balance", async function () {
      expect(await escrowContract.getContractBalance()).to.equal(0);
    });
  });

  // ============================================================
  //  2. ESCROW CREATION
  // ============================================================
  describe("2. Escrow Creation", function () {
    it("Should create an escrow with correct details", async function () {
      const tx = await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);

      await expect(tx)
        .to.emit(escrowContract, "EscrowCreated")
        .withArgs(0, client.address, freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.id).to.equal(0);
      expect(details.client).to.equal(client.address);
      expect(details.freelancer).to.equal(freelancer.address);
      expect(details.amount).to.equal(ESCROW_AMOUNT);
      expect(details.projectTitle).to.equal(PROJECT_TITLE);
      expect(details.state).to.equal(State.CREATED);
    });

    it("Should increment escrow count", async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);

      expect(await escrowContract.getEscrowCount()).to.equal(1);
    });

    it("Should REVERT if freelancer address is zero", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(ethers.ZeroAddress, ESCROW_AMOUNT, PROJECT_TITLE)
      ).to.be.revertedWith("Freelancer address cannot be zero");
    });

    it("Should REVERT if client and freelancer are the same", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(client.address, ESCROW_AMOUNT, PROJECT_TITLE)
      ).to.be.revertedWith("Client cannot be the freelancer");
    });

    it("Should REVERT if escrow amount is zero", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(freelancer.address, 0, PROJECT_TITLE)
      ).to.be.revertedWith("Escrow amount must be greater than zero");
    });

    it("Should REVERT if project title is empty", async function () {
      await expect(
        escrowContract
          .connect(client)
          .createEscrow(freelancer.address, ESCROW_AMOUNT, "")
      ).to.be.revertedWith("Project title cannot be empty");
    });
  });

  // ============================================================
  //  3. FUNDING
  // ============================================================
  describe("3. Funding", function () {
    beforeEach(async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);
    });

    it("Should fund the escrow with exact amount", async function () {
      const tx = await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });

      await expect(tx)
        .to.emit(escrowContract, "FundsDeposited")
        .withArgs(0, client.address, ESCROW_AMOUNT);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.FUNDED);
      expect(await escrowContract.getContractBalance()).to.equal(ESCROW_AMOUNT);
    });

    it("Should REVERT if funding amount does not match", async function () {
      const wrongAmount = ethers.parseEther("0.5");
      await expect(
        escrowContract.connect(client).fundEscrow(0, { value: wrongAmount })
      ).to.be.revertedWith("Must send exact escrow amount");
    });

    it("Should REVERT if non-client tries to fund", async function () {
      await expect(
        escrowContract
          .connect(outsider)
          .fundEscrow(0, { value: ESCROW_AMOUNT })
      ).to.be.revertedWith("Only the client can call this");
    });

    it("Should REVERT if already funded", async function () {
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });

      await expect(
        escrowContract
          .connect(client)
          .fundEscrow(0, { value: ESCROW_AMOUNT })
      ).to.be.revertedWith("Invalid escrow state for this action");
    });
  });

  // ============================================================
  //  4. WORK LIFECYCLE
  // ============================================================
  describe("4. Work Lifecycle", function () {
    beforeEach(async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });
    });

    it("Freelancer should start work", async function () {
      const tx = await escrowContract.connect(freelancer).startWork(0);

      await expect(tx)
        .to.emit(escrowContract, "WorkStarted")
        .withArgs(0, freelancer.address);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.IN_PROGRESS);
    });

    it("Should REVERT if non-freelancer tries to start work", async function () {
      await expect(
        escrowContract.connect(outsider).startWork(0)
      ).to.be.revertedWith("Only the freelancer can call this");
    });

    it("Freelancer should submit work", async function () {
      await escrowContract.connect(freelancer).startWork(0);
      const tx = await escrowContract.connect(freelancer).submitWork(0);

      await expect(tx)
        .to.emit(escrowContract, "WorkSubmitted")
        .withArgs(0, freelancer.address);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.SUBMITTED);
    });

    it("Should REVERT if freelancer submits before starting", async function () {
      await expect(
        escrowContract.connect(freelancer).submitWork(0)
      ).to.be.revertedWith("Invalid escrow state for this action");
    });
  });

  // ============================================================
  //  5. PAYMENT RELEASE
  // ============================================================
  describe("5. Payment Release", function () {
    beforeEach(async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });
      await escrowContract.connect(freelancer).startWork(0);
      await escrowContract.connect(freelancer).submitWork(0);
    });

    it("Client should approve and release payment to freelancer", async function () {
      const freelancerBalBefore = await ethers.provider.getBalance(
        freelancer.address
      );

      const tx = await escrowContract.connect(client).approveAndRelease(0);

      await expect(tx)
        .to.emit(escrowContract, "PaymentReleased")
        .withArgs(0, freelancer.address, ESCROW_AMOUNT);

      const freelancerBalAfter = await ethers.provider.getBalance(
        freelancer.address
      );
      expect(freelancerBalAfter - freelancerBalBefore).to.equal(ESCROW_AMOUNT);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.COMPLETED);
      expect(await escrowContract.getContractBalance()).to.equal(0);
    });

    it("Should REVERT if payment released twice", async function () {
      await escrowContract.connect(client).approveAndRelease(0);
      await expect(
        escrowContract.connect(client).approveAndRelease(0)
      ).to.be.revertedWith("Invalid escrow state for this action");
    });

    it("Should REVERT if non-client tries to approve", async function () {
      await expect(
        escrowContract.connect(outsider).approveAndRelease(0)
      ).to.be.revertedWith("Only the client can call this");
    });
  });

  // ============================================================
  //  6. CANCELLATION & REFUND
  // ============================================================
  describe("6. Cancellation & Refund", function () {
    beforeEach(async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });
    });

    it("Client should cancel and receive refund before work starts", async function () {
      const clientBalBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrowContract.connect(client).cancelAndRefund(0);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(escrowContract, "RefundIssued")
        .withArgs(0, client.address, ESCROW_AMOUNT);

      const clientBalAfter = await ethers.provider.getBalance(client.address);
      // Refund minus gas cost
      expect(clientBalAfter + gasUsed - clientBalBefore).to.equal(ESCROW_AMOUNT);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.CANCELLED);
      expect(await escrowContract.getContractBalance()).to.equal(0);
    });

    it("Should REVERT if cancelling after work started", async function () {
      await escrowContract.connect(freelancer).startWork(0);
      await expect(
        escrowContract.connect(client).cancelAndRefund(0)
      ).to.be.revertedWith("Invalid escrow state for this action");
    });

    it("Should REVERT if non-client tries to cancel", async function () {
      await expect(
        escrowContract.connect(outsider).cancelAndRefund(0)
      ).to.be.revertedWith("Only the client can call this");
    });
  });

  // ============================================================
  //  7. DISPUTE RESOLUTION
  // ============================================================
  describe("7. Dispute Resolution", function () {
    beforeEach(async function () {
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });
      await escrowContract.connect(freelancer).startWork(0);
    });

    it("Client should raise a dispute", async function () {
      const tx = await escrowContract.connect(client).raiseDispute(0);

      await expect(tx)
        .to.emit(escrowContract, "DisputeRaised")
        .withArgs(0, client.address);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.DISPUTED);
    });

    it("Freelancer should raise a dispute", async function () {
      const tx = await escrowContract.connect(freelancer).raiseDispute(0);

      await expect(tx)
        .to.emit(escrowContract, "DisputeRaised")
        .withArgs(0, freelancer.address);
    });

    it("Should REVERT if outsider tries to raise dispute", async function () {
      await expect(
        escrowContract.connect(outsider).raiseDispute(0)
      ).to.be.revertedWith("Only client or freelancer can raise a dispute");
    });

    it("Should REVERT if dispute raised in wrong state", async function () {
      await escrowContract.connect(client).raiseDispute(0); // now DISPUTED
      await expect(
        escrowContract.connect(client).raiseDispute(0)
      ).to.be.revertedWith(
        "Dispute can only be raised during work or after submission"
      );
    });

    it("Arbitrator should resolve dispute in favor of freelancer", async function () {
      await escrowContract.connect(client).raiseDispute(0);

      const freelancerBalBefore = await ethers.provider.getBalance(
        freelancer.address
      );

      const tx = await escrowContract
        .connect(deployer) // deployer is arbitrator
        .resolveDispute(0, true);

      await expect(tx)
        .to.emit(escrowContract, "DisputeResolved")
        .withArgs(0, true, deployer.address);

      const freelancerBalAfter = await ethers.provider.getBalance(
        freelancer.address
      );
      expect(freelancerBalAfter - freelancerBalBefore).to.equal(ESCROW_AMOUNT);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.COMPLETED);
    });

    it("Arbitrator should resolve dispute in favor of client", async function () {
      await escrowContract.connect(client).raiseDispute(0);

      const clientBalBefore = await ethers.provider.getBalance(client.address);

      const tx = await escrowContract
        .connect(deployer)
        .resolveDispute(0, false);

      await expect(tx)
        .to.emit(escrowContract, "DisputeResolved")
        .withArgs(0, false, deployer.address);

      const clientBalAfter = await ethers.provider.getBalance(client.address);
      expect(clientBalAfter - clientBalBefore).to.equal(ESCROW_AMOUNT);

      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.REFUNDED);
    });

    it("Should REVERT if non-arbitrator tries to resolve", async function () {
      await escrowContract.connect(client).raiseDispute(0);
      await expect(
        escrowContract.connect(outsider).resolveDispute(0, true)
      ).to.be.revertedWith("Only the arbitrator can call this");
    });
  });

  // ============================================================
  //  8. MULTIPLE ESCROWS
  // ============================================================
  describe("8. Multiple Escrows", function () {
    it("Should handle multiple independent escrows", async function () {
      // Create two escrows
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, "Project A");
      await escrowContract
        .connect(client)
        .createEscrow(outsider.address, ethers.parseEther("2.0"), "Project B");

      expect(await escrowContract.getEscrowCount()).to.equal(2);

      const detailsA = await escrowContract.getEscrowDetails(0);
      const detailsB = await escrowContract.getEscrowDetails(1);

      expect(detailsA.freelancer).to.equal(freelancer.address);
      expect(detailsB.freelancer).to.equal(outsider.address);
      expect(detailsA.amount).to.equal(ESCROW_AMOUNT);
      expect(detailsB.amount).to.equal(ethers.parseEther("2.0"));
    });
  });

  // ============================================================
  //  9. FULL WORKFLOW (end-to-end happy path)
  // ============================================================
  describe("9. Full Workflow — Happy Path", function () {
    it("Should complete the entire escrow lifecycle", async function () {
      // Step 1: Create
      await escrowContract
        .connect(client)
        .createEscrow(freelancer.address, ESCROW_AMOUNT, PROJECT_TITLE);

      // Step 2: Fund
      await escrowContract
        .connect(client)
        .fundEscrow(0, { value: ESCROW_AMOUNT });

      // Step 3: Start Work
      await escrowContract.connect(freelancer).startWork(0);

      // Step 4: Submit Work
      await escrowContract.connect(freelancer).submitWork(0);

      // Step 5: Approve and Release
      const freelancerBalBefore = await ethers.provider.getBalance(
        freelancer.address
      );

      await escrowContract.connect(client).approveAndRelease(0);

      const freelancerBalAfter = await ethers.provider.getBalance(
        freelancer.address
      );

      // Verify final state
      const details = await escrowContract.getEscrowDetails(0);
      expect(details.state).to.equal(State.COMPLETED);
      expect(freelancerBalAfter - freelancerBalBefore).to.equal(ESCROW_AMOUNT);
      expect(await escrowContract.getContractBalance()).to.equal(0);
    });
  });
});
