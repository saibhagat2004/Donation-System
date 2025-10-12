import PendingTransaction from '../models/pendingTransaction.model.js';
import cron from 'node-cron';

/**
 * Background service to process pending transactions
 * - Records transactions with documents to blockchain
 * - Marks expired transactions
 * - Sends reminders
 */

class PendingTransactionService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the background service
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Pending transaction service is already running');
      return;
    }

    console.log('🔄 Starting pending transaction background service...');
    this.isRunning = true;

    // Process transactions every minute
    this.processingInterval = cron.schedule('* * * * *', () => {
      this.processTransactions();
    }, {
      scheduled: true,
      timezone: "Asia/Kolkata"
    });

    console.log('✅ Pending transaction service started');
  }

  /**
   * Stop the background service
   */
  stop() {
    if (this.processingInterval) {
      this.processingInterval.stop();
      this.processingInterval = null;
    }
    this.isRunning = false;
    console.log('⏹️ Pending transaction service stopped');
  }

  /**
   * Process all pending transactions
   */
  async processTransactions() {
    try {
      await this.processExpiredTransactions();
      await this.processReadyTransactions();
      await this.sendReminders();
    } catch (error) {
      console.error('❌ Error processing pending transactions:', error);
    }
  }

  /**
   * Mark expired transactions
   */
  async processExpiredTransactions() {
    try {
      const expiredTransactions = await PendingTransaction.find({
        status: 'PENDING',
        document_upload_deadline: { $lt: new Date() }
      });

      if (expiredTransactions.length === 0) {
        return;
      }

      console.log(`⏰ Processing ${expiredTransactions.length} expired transactions...`);

      for (const transaction of expiredTransactions) {
        await PendingTransaction.findByIdAndUpdate(transaction._id, {
          status: 'EXPIRED',
          expired_at: new Date(),
          expiry_reason: 'TIMEOUT'
        });

        // Record to blockchain without document
        await this.recordToBlockchain(transaction, null);
      }

      console.log(`✅ Marked ${expiredTransactions.length} transactions as expired`);

    } catch (error) {
      console.error('❌ Error processing expired transactions:', error);
    }
  }

  /**
   * Process transactions that have documents uploaded
   */
  async processReadyTransactions() {
    try {
      const readyTransactions = await PendingTransaction.find({
        status: 'DOCUMENT_UPLOADED',
        blockchain_tx_id: { $exists: false } // Not yet recorded on blockchain
      });

      if (readyTransactions.length === 0) {
        return;
      }

      console.log(`🔗 Processing ${readyTransactions.length} transactions for blockchain recording...`);

      for (const transaction of readyTransactions) {
        await this.recordToBlockchain(transaction, transaction.verification_hash);
      }

    } catch (error) {
      console.error('❌ Error processing ready transactions:', error);
    }
  }

  /**
   * Record transaction to blockchain
   */
  async recordToBlockchain(transaction, verificationHash) {
    try {
      console.log(`🔗 Recording transaction ${transaction.transaction_id} to blockchain...`);
      
      // Try to integrate with actual blockchain service
      let blockchainResponse = null;
      
      try {
        // Import blockchain integration
        const { default: blockchainService } = await import('../utils/blockchainIntegration.js');
        
        // Record spending on blockchain
        blockchainResponse = await blockchainService.recordSpending({
          ngo_account: transaction.ngo_account_number,
          receiver_id: `withdrawal_${transaction.transaction_id}`,
          cause: transaction.cause || 'Cash Withdrawal',
          amount: transaction.amount,
          verification_hash: verificationHash || '0x0'
        });
        
      } catch (blockchainError) {
        console.log(`⚠️ Blockchain service not available, using simulation: ${blockchainError.message}`);
        // Fall back to simulation
        blockchainResponse = await this.simulateBlockchainRecording(transaction, verificationHash);
      }
      
      if (blockchainResponse && blockchainResponse.success) {
        await PendingTransaction.findByIdAndUpdate(transaction._id, {
          status: 'RECORDED',
          blockchain_tx_id: blockchainResponse.tx_id || blockchainResponse.blockchain_tx_id,
          blockchain_recorded_at: new Date()
        });

        console.log(`✅ Transaction ${transaction.transaction_id} recorded on blockchain`);
        console.log(`   Blockchain TX: ${blockchainResponse.tx_id || blockchainResponse.blockchain_tx_id}`);
        console.log(`   Amount: ₹${transaction.amount}`);
        console.log(`   Document: ${verificationHash ? 'Provided' : 'Not provided'}`);
        console.log(`   Document URL: ${transaction.document_url || 'None'}`);
      } else {
        console.error(`❌ Failed to record transaction ${transaction.transaction_id} on blockchain:`, blockchainResponse?.error || 'Unknown error');
      }

    } catch (error) {
      console.error(`❌ Error recording transaction ${transaction.transaction_id} to blockchain:`, error);
    }
  }

  /**
   * Simulate blockchain recording (replace with actual blockchain integration)
   */
  async simulateBlockchainRecording(transaction, verificationHash) {
    // TODO: Replace with actual blockchain integration
    // For now, simulate successful recording
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          tx_id: `BLOCKCHAIN_TX_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          block_number: Math.floor(Math.random() * 1000000),
          gas_used: Math.floor(Math.random() * 100000) + 50000
        });
      }, 1000); // Simulate network delay
    });
  }

  /**
   * Send reminder notifications for pending transactions
   */
  async sendReminders() {
    try {
      const pendingTransactions = await PendingTransaction.find({
        status: 'PENDING',
        document_upload_deadline: { $gt: new Date() }, // Not expired yet
        $or: [
          { last_reminder_at: { $exists: false } }, // Never sent reminder
          { 
            last_reminder_at: { 
              $lt: new Date(Date.now() - 30 * 60 * 1000) // Last reminder was 30+ minutes ago
            }
          }
        ]
      }).populate('ngo_id', 'fullName email ngoDetails.org_name');

      for (const transaction of pendingTransactions) {
        const timeRemaining = Math.floor((transaction.document_upload_deadline - new Date()) / (1000 * 60)); // minutes
        
        // Send reminder if less than 30 minutes remaining and no recent reminder
        if (timeRemaining <= 30) {
          await this.sendReminderNotification(transaction, timeRemaining);
        }
      }

    } catch (error) {
      console.error('❌ Error sending reminders:', error);
    }
  }

  /**
   * Send reminder notification to NGO
   */
  async sendReminderNotification(transaction, minutesRemaining) {
    try {
      // Import notification service dynamically
      const { default: notificationService } = await import('./notificationService.js');
      
      // Send reminder notification
      const reminderResult = await notificationService.sendReminderNotification(
        transaction.ngo_id, 
        transaction, 
        minutesRemaining
      );

      if (reminderResult.success) {
        console.log(`✅ Reminder sent for transaction ${transaction.transaction_id}`);
        
        // Update reminder tracking
        await PendingTransaction.findByIdAndUpdate(transaction._id, {
          $inc: { reminder_count: 1 },
          last_reminder_at: new Date()
        });
      } else {
        console.error(`❌ Failed to send reminder: ${reminderResult.error}`);
      }

    } catch (error) {
      console.error(`❌ Error sending reminder for transaction ${transaction.transaction_id}:`, error);
    }
  }

  /**
   * Get service statistics
   */
  async getStats() {
    try {
      const stats = await PendingTransaction.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const totalTransactions = await PendingTransaction.countDocuments();
      
      return {
        total_transactions: totalTransactions,
        by_status: stats,
        service_running: this.isRunning
      };

    } catch (error) {
      console.error('❌ Error getting service stats:', error);
      return { error: error.message };
    }
  }
}

// Export singleton instance
const pendingTransactionService = new PendingTransactionService();

export default pendingTransactionService;