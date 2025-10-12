/**
 * Notification service for sending alerts to NGOs about pending transactions
 */

class NotificationService {
  constructor() {
    this.isEnabled = true;
    this.notifications = []; // In-memory store for demo
  }

  /**
   * Send withdrawal notification to NGO
   */
  async sendWithdrawalNotification(ngo, transaction) {
    try {
      console.log(`📧 Sending withdrawal notification:`);
      console.log(`   NGO: ${ngo.fullName} (${ngo.ngoDetails?.org_name})`);
      console.log(`   Email: ${ngo.email}`);
      console.log(`   Amount: ₹${transaction.amount}`);
      console.log(`   Deadline: ${transaction.document_upload_deadline}`);

      // Create notification record
      const notification = {
        id: `NOTIF_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'WITHDRAWAL_ALERT',
        ngo_id: ngo._id,
        ngo_email: ngo.email,
        ngo_name: ngo.fullName,
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        deadline: transaction.document_upload_deadline,
        created_at: new Date(),
        sent: false,
        attempts: 0
      };

      // TODO: Implement actual email/SMS sending
      // For now, simulate sending
      await this.simulateNotificationSending(notification);

      // Store notification
      this.notifications.push(notification);

      return {
        success: true,
        notification_id: notification.id,
        message: 'Notification sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send notification:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send reminder notification
   */
  async sendReminderNotification(ngo, transaction, minutesRemaining) {
    try {
      console.log(`⏰ Sending reminder notification:`);
      console.log(`   NGO: ${ngo.fullName}`);
      console.log(`   Transaction: ${transaction.transaction_id}`);
      console.log(`   Time remaining: ${minutesRemaining} minutes`);

      const notification = {
        id: `REMIND_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'REMINDER',
        ngo_id: ngo._id,
        ngo_email: ngo.email,
        ngo_name: ngo.fullName,
        transaction_id: transaction.transaction_id,
        amount: transaction.amount,
        minutes_remaining: minutesRemaining,
        created_at: new Date(),
        sent: false,
        attempts: 0
      };

      await this.simulateNotificationSending(notification);
      this.notifications.push(notification);

      return {
        success: true,
        notification_id: notification.id,
        message: 'Reminder sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send reminder:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send document upload confirmation
   */
  async sendDocumentUploadConfirmation(ngo, transaction) {
    try {
      console.log(`✅ Sending upload confirmation:`);
      console.log(`   NGO: ${ngo.fullName}`);
      console.log(`   Transaction: ${transaction.transaction_id}`);
      console.log(`   Document: ${transaction.document_url}`);

      const notification = {
        id: `CONFIRM_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'UPLOAD_CONFIRMATION',
        ngo_id: ngo._id,
        ngo_email: ngo.email,
        ngo_name: ngo.fullName,
        transaction_id: transaction.transaction_id,
        document_url: transaction.document_url,
        created_at: new Date(),
        sent: false,
        attempts: 0
      };

      await this.simulateNotificationSending(notification);
      this.notifications.push(notification);

      return {
        success: true,
        notification_id: notification.id,
        message: 'Confirmation sent successfully'
      };

    } catch (error) {
      console.error('❌ Failed to send confirmation:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate notification sending (replace with actual implementation)
   */
  async simulateNotificationSending(notification) {
    // Simulate email/SMS sending delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mark as sent
    notification.sent = true;
    notification.attempts = 1;
    notification.sent_at = new Date();

    // Log the notification content that would be sent
    console.log(`📧 [SIMULATED] ${notification.type} notification sent to ${notification.ngo_email}:`);
    
    switch (notification.type) {
      case 'WITHDRAWAL_ALERT':
        console.log(`   Subject: 🚨 Action Required: Document Upload for Bank Withdrawal`);
        console.log(`   Message: A withdrawal of ₹${notification.amount.toLocaleString()} has been made from your bank account.`);
        console.log(`   Please upload supporting documents by ${new Date(notification.deadline).toLocaleString()}`);
        console.log(`   Transaction ID: ${notification.transaction_id}`);
        break;

      case 'REMINDER':
        console.log(`   Subject: ⏰ Urgent: ${notification.minutes_remaining} minutes left to upload document`);
        console.log(`   Message: Don't forget to upload documents for transaction ${notification.transaction_id}`);
        console.log(`   Amount: ₹${notification.amount.toLocaleString()}`);
        break;

      case 'UPLOAD_CONFIRMATION':
        console.log(`   Subject: ✅ Document Upload Confirmed`);
        console.log(`   Message: Your document has been successfully uploaded for transaction ${notification.transaction_id}`);
        console.log(`   The transaction will be recorded on blockchain shortly.`);
        break;
    }

    return notification;
  }

  /**
   * Get notification history for an NGO
   */
  getNotificationsForNgo(ngoId) {
    return this.notifications
      .filter(n => n.ngo_id.toString() === ngoId.toString())
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    const total = this.notifications.length;
    const sent = this.notifications.filter(n => n.sent).length;
    const byType = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total_notifications: total,
      sent_notifications: sent,
      success_rate: total > 0 ? ((sent / total) * 100).toFixed(1) + '%' : '0%',
      by_type: byType
    };
  }

  /**
   * Clear old notifications (cleanup)
   */
  clearOldNotifications(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
    const before = this.notifications.length;
    
    this.notifications = this.notifications.filter(
      n => new Date(n.created_at) > cutoffDate
    );
    
    const removed = before - this.notifications.length;
    if (removed > 0) {
      console.log(`🧹 Cleaned up ${removed} old notifications`);
    }
    
    return removed;
  }
}

// Export singleton instance
const notificationService = new NotificationService();

export default notificationService;