import express from "express";
import PendingTransaction from "../models/pendingTransaction.model.js";
import User from "../models/user.model.js";
import mongoose from "mongoose";
import { uploadMemory, handleMulterError } from "../middleware/uploadMiddleware.js";
import cloudinary, { uploadToCloudinary } from "../config/cloudinary.js";

const router = express.Router();

/**
 * @route POST /api/bank/withdrawal-notification
 * @desc Receive withdrawal notification from bank API
 * @access Public (Bank API)
 */
router.post("/withdrawal-notification", async (req, res) => {
  try {
    const {
      account_number,
      amount,
      transaction_id,
      bank_reference,
      cause,
      description,
      withdrawal_type = "CASH_WITHDRAWAL"
    } = req.body;

    // Validate required fields
    if (!account_number || !amount || !transaction_id) {
      return res.status(400).json({
        success: false,
        message: "Account number, amount, and transaction ID are required"
      });
    }

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0"
      });
    }

    // Find NGO by bank account number
    const ngo = await User.findOne({
      "ngoDetails.bank_account": account_number.toString(),
      role: "ngo"
    });

    if (!ngo) {
      console.error(`❌ NGO not found for bank account: ${account_number}`);
      return res.status(404).json({
        success: false,
        message: `No NGO found with bank account number: ${account_number}`
      });
    }

    // Check for duplicate transaction
    const existingTransaction = await PendingTransaction.findOne({
      $or: [
        { bank_transaction_id: transaction_id },
        { bank_reference: bank_reference }
      ]
    });

    if (existingTransaction) {
      return res.status(409).json({
        success: false,
        message: "Transaction already exists",
        transaction_id: existingTransaction.transaction_id
      });
    }

    // Create pending transaction
    const pendingTransaction = new PendingTransaction({
      ngo_id: ngo._id,
      ngo_account_number: account_number.toString(),
      amount: parseFloat(amount),
      withdrawal_type,
      cause: cause || "Cash Withdrawal",
      description: description || `Cash withdrawal of ₹${amount} from bank account ${account_number}`,
      bank_transaction_id: transaction_id,
      bank_reference: bank_reference,
      initiated_by: "BANK_API",
      ip_address: req.ip || req.connection.remoteAddress
    });

    await pendingTransaction.save();

    console.log(`✅ Pending transaction created:`);
    console.log(`   NGO: ${ngo.fullName} (${ngo.ngoDetails?.org_name})`);
    console.log(`   Account: ${account_number}`);
    console.log(`   Amount: ₹${amount}`);
    console.log(`   Transaction ID: ${pendingTransaction.transaction_id}`);
    console.log(`   Deadline: ${pendingTransaction.document_upload_deadline}`);

    res.status(201).json({
      success: true,
      message: "Withdrawal notification received. NGO has been notified to upload documentation.",
      data: {
        transaction_id: pendingTransaction.transaction_id,
        ngo_name: ngo.fullName,
        ngo_org: ngo.ngoDetails?.org_name,
        amount: amount,
        deadline: pendingTransaction.document_upload_deadline,
        time_limit_minutes: Math.floor(pendingTransaction.time_remaining / 60)
      }
    });

  } catch (error) {
    console.error("❌ Error processing withdrawal notification:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process withdrawal notification",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/bank/pending-transactions/:ngoId
 * @desc Get pending transactions for an NGO
 * @access Protected (NGO)
 */
router.get("/pending-transactions/:ngoId", async (req, res) => {
  try {
    const { ngoId } = req.params;

    // Validate NGO ID
    if (!mongoose.Types.ObjectId.isValid(ngoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid NGO ID"
      });
    }

    // Find pending transactions for the NGO
    const pendingTransactions = await PendingTransaction.find({
      ngo_id: ngoId,
      status: { $in: ['PENDING', 'DOCUMENT_UPLOADED'] }
    }).sort({ createdAt: -1 });

    // Add computed fields
    const transactionsWithStatus = pendingTransactions.map(transaction => ({
      ...transaction.toJSON(),
      is_expired: transaction.is_expired,
      time_remaining: transaction.time_remaining,
      minutes_remaining: transaction.minutes_remaining,
      has_document: transaction.has_document
    }));

    res.status(200).json({
      success: true,
      count: transactionsWithStatus.length,
      data: transactionsWithStatus
    });

  } catch (error) {
    console.error("❌ Error fetching pending transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending transactions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/bank/pending-transactions/account/:accountNumber
 * @desc Get pending transactions by bank account number
 * @access Protected
 */
router.get("/pending-transactions/account/:accountNumber", async (req, res) => {
  try {
    const { accountNumber } = req.params;

    // Find pending transactions for the account
    const pendingTransactions = await PendingTransaction.find({
      ngo_account_number: accountNumber,
      status: { $in: ['PENDING', 'DOCUMENT_UPLOADED'] }
    })
    .populate('ngo_id', 'fullName ngoDetails.org_name')
    .sort({ createdAt: -1 });

    // Add computed fields
    const transactionsWithStatus = pendingTransactions.map(transaction => ({
      ...transaction.toJSON(),
      is_expired: transaction.is_expired,
      time_remaining: transaction.time_remaining,
      minutes_remaining: transaction.minutes_remaining,
      has_document: transaction.has_document
    }));

    res.status(200).json({
      success: true,
      count: transactionsWithStatus.length,
      data: transactionsWithStatus
    });

  } catch (error) {
    console.error("❌ Error fetching pending transactions by account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending transactions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/bank/upload-document/:transactionId
 * @desc Upload document for pending transaction
 * @access Protected (NGO)
 */
router.post("/upload-document/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { document_url, document_hash, ngo_notes } = req.body;

    if (!document_url || !document_hash) {
      return res.status(400).json({
        success: false,
        message: "Document URL and hash are required"
      });
    }

    // Find the pending transaction
    const transaction = await PendingTransaction.findOne({
      transaction_id: transactionId,
      status: 'PENDING'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Pending transaction not found or no longer accepting documents"
      });
    }

    // Check if expired
    if (transaction.is_expired) {
      await PendingTransaction.findByIdAndUpdate(transaction._id, {
        status: 'EXPIRED',
        expired_at: new Date(),
        expiry_reason: 'TIMEOUT'
      });

      return res.status(410).json({
        success: false,
        message: "Document upload deadline has passed"
      });
    }

    // Update transaction with document info
    const updatedTransaction = await PendingTransaction.findByIdAndUpdate(
      transaction._id,
      {
        document_url,
        document_hash,
        verification_hash: document_hash, // Use same hash for blockchain verification
        ngo_notes: ngo_notes || null,
        status: 'DOCUMENT_UPLOADED',
        document_uploaded_at: new Date()
      },
      { new: true }
    );

    console.log(`✅ Document uploaded for transaction ${transactionId}:`);
    console.log(`   Document URL: ${document_url}`);
    console.log(`   Document Hash: ${document_hash}`);
    console.log(`   Status: ${updatedTransaction.status}`);

    // Send confirmation notification
    try {
      const [{ default: notificationService }, { default: User }] = await Promise.all([
        import('../services/notificationService.js'),
        import('../models/user.model.js')
      ]);

      const ngo = await User.findById(updatedTransaction.ngo_id);
      if (ngo) {
        await notificationService.sendDocumentUploadConfirmation(ngo, updatedTransaction);
      }
    } catch (notificationError) {
      console.error('❌ Failed to send upload confirmation:', notificationError);
      // Don't fail the request if notification fails
    }

    // 🚀 SEND TO PYTHON BANK FOR BLOCKCHAIN RECORDING
    try {
      console.log(`🏦 Sending document to Python bank for blockchain recording...`);
      
      // Send to Python bank's complete-withdrawal endpoint
      const bankResponse = await fetch('http://localhost:5050/api/complete-withdrawal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_number: updatedTransaction.ngo_account_number,
          amount: updatedTransaction.amount,
          bank_transaction_id: updatedTransaction.bank_transaction_id || updatedTransaction.transaction_id,
          document_url: updatedTransaction.document_url,
          document_hash: updatedTransaction.document_hash,
          cause: updatedTransaction.cause || 'Cash Withdrawal'
        })
      });

      if (bankResponse.ok) {
        const bankResult = await bankResponse.json();
        
        if (bankResult.success && bankResult.data.blockchain.recorded) {
          // Update transaction with blockchain details from bank
          await PendingTransaction.findByIdAndUpdate(updatedTransaction._id, {
            status: 'RECORDED',
            blockchain_tx_id: bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash,
            blockchain_recorded_at: new Date()
          });

          console.log(`✅ BANK: Transaction ${updatedTransaction.transaction_id} recorded on blockchain!`);
          console.log(`   Blockchain TX: ${bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash}`);
          
          // Update response to reflect blockchain recording
          updatedTransaction.status = 'RECORDED';
          updatedTransaction.blockchain_tx_id = bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash;
          updatedTransaction.blockchain_recorded_at = new Date();
        } else {
          console.log(`⚠️ BANK: Blockchain recording failed at bank level`);
          console.log(`   Bank Error: ${bankResult.data?.blockchain?.error || 'Unknown error'}`);
        }
      } else {
        console.log(`⚠️ BANK: Failed to communicate with Python bank: ${bankResponse.status}`);
      }
    } catch (bankError) {
      console.log(`⚠️ BANK: Error communicating with Python bank: ${bankError.message}`);
      // Don't fail the upload if bank communication fails
    }

    res.status(200).json({
      success: true,
      message: updatedTransaction.status === 'RECORDED' 
        ? "Document uploaded and transaction recorded on blockchain successfully!" 
        : "Document uploaded successfully. Transaction will be recorded on blockchain.",
      data: {
        transaction_id: updatedTransaction.transaction_id,
        status: updatedTransaction.status,
        document_url: updatedTransaction.document_url,
        uploaded_at: updatedTransaction.document_uploaded_at,
        blockchain_tx_id: updatedTransaction.blockchain_tx_id || null,
        blockchain_recorded_at: updatedTransaction.blockchain_recorded_at || null
      }
    });

  } catch (error) {
    console.error("❌ Error uploading document:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload document",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/bank/transaction-status/:transactionId
 * @desc Get status of a specific transaction
 * @access Public
 */
router.get("/transaction-status/:transactionId", async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await PendingTransaction.findOne({
      transaction_id: transactionId
    }).populate('ngo_id', 'fullName ngoDetails.org_name');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const responseData = {
      ...transaction.toJSON(),
      is_expired: transaction.is_expired,
      time_remaining: transaction.time_remaining,
      minutes_remaining: transaction.minutes_remaining,
      has_document: transaction.has_document
    };

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error("❌ Error fetching transaction status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/bank/process-expired
 * @desc Process expired transactions (admin/system use)
 * @access Protected (Admin)
 */
router.post("/process-expired", async (req, res) => {
  try {
    // Find expired transactions
    const expiredTransactions = await PendingTransaction.findExpiredTransactions();

    if (expiredTransactions.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No expired transactions found",
        processed: 0
      });
    }

    // Update expired transactions
    const updatePromises = expiredTransactions.map(transaction =>
      PendingTransaction.findByIdAndUpdate(transaction._id, {
        status: 'EXPIRED',
        expired_at: new Date(),
        expiry_reason: 'TIMEOUT'
      })
    );

    await Promise.all(updatePromises);

    console.log(`⏰ Processed ${expiredTransactions.length} expired transactions`);

    res.status(200).json({
      success: true,
      message: `Processed ${expiredTransactions.length} expired transactions`,
      processed: expiredTransactions.length,
      expired_transaction_ids: expiredTransactions.map(t => t.transaction_id)
    });

  } catch (error) {
    console.error("❌ Error processing expired transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process expired transactions",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/bank/service-stats
 * @desc Get pending transaction service statistics
 * @access Public
 */
router.get("/service-stats", async (req, res) => {
  try {
    // Import service dynamically to avoid circular dependency issues
    const { default: pendingTransactionService } = await import('../services/pendingTransactionService.js');
    
    const stats = await pendingTransactionService.getStats();

    res.status(200).json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error("❌ Error getting service stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get service statistics",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/bank/blockchain-outgoing-metadata
 * @desc Get document metadata for blockchain outgoing transactions
 * @access Public
 */
router.get("/blockchain-outgoing-metadata", async (req, res) => {
  try {
    const { receiverIds } = req.query;
    
    if (!receiverIds) {
      return res.status(400).json({
        success: false,
        message: "receiverIds query parameter is required"
      });
    }

    // Parse receiverIds (comma-separated list)
    const receiverIdList = receiverIds.split(',').map(id => id.trim()).filter(Boolean);
    
    if (receiverIdList.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const metadata = [];

    // For each receiverId, extract the transaction identifier and lookup document
    for (const receiverId of receiverIdList) {
      try {
        // receiverId format: withdrawal_<transaction_id> or withdrawal_<bank_transaction_id>
        if (receiverId.startsWith('withdrawal_')) {
          const identifier = receiverId.replace('withdrawal_', '');
          
          // Try to find by transaction_id first, then by bank_transaction_id
          let pendingTransaction = await PendingTransaction.findOne({
            $or: [
              { transaction_id: identifier },
              { bank_transaction_id: identifier }
            ],
            status: { $in: ['RECORDED', 'DOCUMENT_UPLOADED'] }
          });

          if (pendingTransaction) {
            metadata.push({
              receiverId: receiverId,
              document_url: pendingTransaction.document_url || null,
              document_hash: pendingTransaction.document_hash || null,
              verification_hash: pendingTransaction.verification_hash || pendingTransaction.document_hash || null,
              blockchain_tx_id: pendingTransaction.blockchain_tx_id || null,
              ngo_notes: pendingTransaction.ngo_notes || null,
              document_uploaded_at: pendingTransaction.document_uploaded_at || null,
              amount: pendingTransaction.amount,
              cause: pendingTransaction.cause || 'Cash Withdrawal',
              transaction_id: pendingTransaction.transaction_id
            });
          } else {
            // No matching transaction found - return placeholder
            metadata.push({
              receiverId: receiverId,
              document_url: null,
              document_hash: null,
              verification_hash: null,
              blockchain_tx_id: null,
              ngo_notes: null,
              document_uploaded_at: null,
              amount: null,
              cause: null,
              transaction_id: null
            });
          }
        } else {
          // Invalid receiverId format
          metadata.push({
            receiverId: receiverId,
            document_url: null,
            document_hash: null,
            verification_hash: null,
            blockchain_tx_id: null,
            ngo_notes: null,
            document_uploaded_at: null,
            amount: null,
            cause: null,
            transaction_id: null
          });
        }
      } catch (error) {
        console.error(`❌ Error processing receiverId ${receiverId}:`, error);
        // Add error entry but continue processing other IDs
        metadata.push({
          receiverId: receiverId,
          document_url: null,
          document_hash: null,
          verification_hash: null,
          blockchain_tx_id: null,
          ngo_notes: null,
          document_uploaded_at: null,
          amount: null,
          cause: null,
          transaction_id: null,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      count: metadata.length,
      data: metadata
    });

  } catch (error) {
    console.error("❌ Error fetching blockchain outgoing metadata:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blockchain outgoing metadata",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get NGO names by their IDs (account numbers)
router.get("/ngo-names", async (req, res) => {
  try {
    const { ngoIds } = req.query; // Expecting comma-separated ngoIds

    if (!ngoIds) {
      return res.status(400).json({
        success: false,
        message: "NGO IDs are required"
      });
    }

    // Parse ngoIds from query parameter
    const ngoIdArray = ngoIds.split(',').map(id => id.trim());
    
    // Convert ngoIds to account numbers (remove "NGO_" prefix if present)
    const accountNumbers = ngoIdArray.map(ngoId => {
      // If ngoId starts with "NGO_", remove it, otherwise use as-is
      return ngoId.startsWith('NGO_') ? ngoId.substring(4) : ngoId;
    });

    console.log("🔍 Looking up NGO names for account numbers:", accountNumbers);

    // Query User model to find NGOs with matching bank account numbers
    const ngos = await User.find({
      'ngoDetails.bank_account': { $in: accountNumbers },
      role: 'ngo'
    }, {
      'ngoDetails.bank_account': 1,
      'fullName': 1,
      '_id': 0
    });

    console.log("📋 Found NGOs:", ngos);

    // Create mapping from original ngoId to fullName
    const ngoNameMapping = {};
    
    ngos.forEach(ngo => {
      const accountNumber = ngo.ngoDetails.bank_account;
      const fullName = ngo.fullName;
      
      // Find matching ngoId(s) for this account number
      ngoIdArray.forEach(ngoId => {
        const cleanNgoId = ngoId.startsWith('NGO_') ? ngoId.substring(4) : ngoId;
        if (cleanNgoId === accountNumber) {
          ngoNameMapping[ngoId] = fullName;
        }
      });
    });

    console.log("🏷️ NGO name mapping:", ngoNameMapping);

    res.status(200).json({
      success: true,
      data: ngoNameMapping
    });

  } catch (error) {
    console.error("❌ Error fetching NGO names:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch NGO names",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;

/**
 * Additional endpoint: direct file upload for spending document
 * @route POST /api/bank/upload-document-file/:transactionId
 * @desc Upload a file (image/pdf) which will be stored in Cloudinary and linked to pending transaction
 * @access Protected (NGO)
 */
router.post(
  "/upload-document-file/:transactionId",
  (req, res, next) => {
    // Adjust multer filter dynamically to allow pdf too
    uploadMemory.single("document")(req, res, function(err){
      if (err) return handleMulterError(err, req, res, next);
      next();
    });
  },
  async (req, res) => {
    try {
      const { transactionId } = req.params;
      const { ngo_notes } = req.body;

      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded. Use 'document' field." });
      }

      // Extend supported mimetypes beyond images (allow PDFs)
      const allowed = ["image/jpeg","image/jpg","image/png","application/pdf"]; 
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: "Unsupported file type. Only JPEG, PNG, PDF allowed." });
      }

      // Find pending transaction still pending
      const transaction = await PendingTransaction.findOne({ transaction_id: transactionId, status: 'PENDING' });
      if (!transaction) {
        return res.status(404).json({ success: false, message: "Pending transaction not found or not accepting documents" });
      }

      // Check expiry
      if (transaction.is_expired) {
        await PendingTransaction.findByIdAndUpdate(transaction._id, { status: 'EXPIRED', expired_at: new Date(), expiry_reason: 'TIMEOUT' });
        return res.status(410).json({ success: false, message: "Document upload deadline has passed" });
      }

      // Upload to Cloudinary (support pdf + images) using upload_stream
      let uploadResult;
      const public_id = `withdrawal_doc_${Date.now()}_${Math.random().toString(36).substring(2,8)}`;
      try {
        uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              folder: 'ngo-documents',
              public_id,
              resource_type: 'auto', // auto-detect (image/pdf)
              use_filename: false,
              overwrite: false
            },
            (error, result) => {
              if (error) return reject(error);
              resolve({ url: result.secure_url, public_id: result.public_id });
            }
          ).end(req.file.buffer);
        });
      } catch (e) {
        console.error('Cloudinary upload_stream failed, attempting helper fallback', e);
        try {
          uploadResult = await uploadToCloudinary(req.file.buffer, 'ngo-documents');
        } catch (fallbackErr) {
          return res.status(500).json({ success: false, message: 'Cloudinary upload failed', error: fallbackErr.message });
        }
      }

      const document_url = uploadResult.url;
      const document_hash = uploadResult.public_id;

      const updated = await PendingTransaction.findByIdAndUpdate(
        transaction._id,
        {
          document_url,
          document_hash,
          verification_hash: document_hash,
          ngo_notes: ngo_notes || null,
          status: 'DOCUMENT_UPLOADED',
          document_uploaded_at: new Date()
        },
        { new: true }
      );

      // Fire confirmation notification (best effort)
      try {
        const [{ default: notificationService }, { default: User }] = await Promise.all([
          import('../services/notificationService.js'),
          import('../models/user.model.js')
        ]);
        const ngo = await User.findById(updated.ngo_id);
        if (ngo) await notificationService.sendDocumentUploadConfirmation(ngo, updated);
      } catch (notifyErr) {
        console.error('Notification send failed (non-fatal)', notifyErr);
      }

      // 🚀 SEND TO PYTHON BANK FOR BLOCKCHAIN RECORDING
      try {
        console.log(`🏦 Sending document to Python bank for blockchain recording...`);
        
        // Send to Python bank's complete-withdrawal endpoint
        const bankResponse = await fetch('http://localhost:5050/api/complete-withdrawal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_number: updated.ngo_account_number,
            amount: updated.amount,
            bank_transaction_id: updated.bank_transaction_id || updated.transaction_id,
            document_url: updated.document_url,
            document_hash: updated.document_hash,
            cause: updated.cause || 'Cash Withdrawal'
          })
        });

        if (bankResponse.ok) {
          const bankResult = await bankResponse.json();
          
          if (bankResult.success && bankResult.data.blockchain.recorded) {
            // Update transaction with blockchain details from bank
            await PendingTransaction.findByIdAndUpdate(updated._id, {
              status: 'RECORDED',
              blockchain_tx_id: bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash,
              blockchain_recorded_at: new Date()
            });

            console.log(`✅ BANK: Transaction ${updated.transaction_id} recorded on blockchain!`);
            console.log(`   Blockchain TX: ${bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash}`);
            
            // Update response to reflect blockchain recording
            updated.status = 'RECORDED';
            updated.blockchain_tx_id = bankResult.data.blockchain.blockchain_tx_id || bankResult.data.blockchain.tx_hash;
            updated.blockchain_recorded_at = new Date();
          } else {
            console.log(`⚠️ BANK: Blockchain recording failed at bank level`);
            console.log(`   Bank Error: ${bankResult.data?.blockchain?.error || 'Unknown error'}`);
          }
        } else {
          console.log(`⚠️ BANK: Failed to communicate with Python bank: ${bankResponse.status}`);
        }
      } catch (bankError) {
        console.log(`⚠️ BANK: Error communicating with Python bank: ${bankError.message}`);
        // Don't fail the upload if bank communication fails
      }

      res.status(200).json({
        success: true,
        message: updated.status === 'RECORDED' 
          ? 'Document uploaded and transaction recorded on blockchain successfully!' 
          : 'Document uploaded successfully',
        data: {
          transaction_id: updated.transaction_id,
          status: updated.status,
          document_url: updated.document_url,
          uploaded_at: updated.document_uploaded_at,
          blockchain_tx_id: updated.blockchain_tx_id || null,
          blockchain_recorded_at: updated.blockchain_recorded_at || null
        }
      });
    } catch (error) {
      console.error('❌ Error in file document upload endpoint', error);
      res.status(500).json({ success: false, message: 'Failed to upload spending document', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
  }
);