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
        // Update status to EXPIRED
        await PendingTransaction.findByIdAndUpdate(transaction._id, {
          status: 'EXPIRED',
          expired_at: new Date(),
          expiry_reason: 'TIMEOUT'
        });

        // Re-fetch the updated transaction to ensure status and fields are current
        const updatedTransaction = await PendingTransaction.findById(transaction._id);

        // Record to blockchain without document (expired)
        await this.recordToBlockchain(updatedTransaction, null);
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
      
      // 🚀 SEND TO PYTHON BANK FOR BLOCKCHAIN RECORDING (same as upload flow)
      console.log(`🏦 Sending to Python bank for blockchain recording...`);
      
      const bankResponse = await fetch('http://localhost:5050/api/complete-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: transaction.ngo_account_number,
          amount: transaction.amount,
          bank_transaction_id: transaction.bank_transaction_id || transaction.transaction_id,
          document_url: verificationHash ? transaction.document_url : null, // No document for expired
          document_hash: verificationHash || null, // No hash for expired
          cause: transaction.cause || 'Cash Withdrawal'
        })
      });

      if (bankResponse.ok) {
        const bankResult = await bankResponse.json();
        
        if (bankResult.success && bankResult.data.blockchain.recorded) {
          // Update transaction with blockchain details from bank
          await PendingTransaction.findByIdAndUpdate(transaction._id, {
            status: 'RECORDED',
            blockchain_tx_id: bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash,
            blockchain_recorded_at: new Date()
          });

          console.log(`✅ BANK: Transaction ${transaction.transaction_id} recorded on blockchain!`);
          console.log(`   Blockchain TX: ${bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash}`);
          console.log(`   Amount: ₹${transaction.amount}`);
          console.log(`   Document: ${verificationHash ? 'Provided' : 'Not provided (expired)'}`);
          console.log(`   Document URL: ${transaction.document_url || 'None'}`);
        } else {
          console.log(`⚠️ BANK: Blockchain recording failed at bank level`);
          console.log(`   Bank Error: ${bankResult.data?.blockchain?.error || 'Unknown error'}`);
        }
      } else {
        console.log(`⚠️ BANK: Failed to communicate with Python bank: ${bankResponse.status}`);
      }

    } catch (error) {
      console.error(`❌ Error recording transaction ${transaction.transaction_id} to blockchain:`, error);
    }
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