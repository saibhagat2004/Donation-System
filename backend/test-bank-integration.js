import axios from 'axios';

/**
 * Test the new bank withdrawal notification system
 * This simulates what the Python banking system will do
 */

const testWithdrawalNotification = async () => {
  try {
    console.log('🧪 Testing withdrawal notification system...');
    
    // Test data - simulate a bank withdrawal
    const withdrawalData = {
      account_number: "12345678", // This should match an NGO's bank account
      amount: 5000,
      transaction_id: `TEST_WD_${Date.now()}`,
      bank_reference: `REF_TEST_${Date.now()}`,
      cause: "Medical supplies purchase",
      description: "Cash withdrawal for purchasing medical supplies for campaign",
      withdrawal_type: "CASH_WITHDRAWAL"
    };

    console.log('📤 Sending withdrawal notification:', withdrawalData);

    // Send to our new endpoint
    const response = await axios.post(
      'http://localhost:5000/api/bank/withdrawal-notification',
      withdrawalData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ Response received:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));

    // Test getting pending transactions
    if (response.data.success && response.data.data.transaction_id) {
      console.log('\n🔍 Testing transaction status endpoint...');
      
      const statusResponse = await axios.get(
        `http://localhost:5000/api/bank/transaction-status/${response.data.data.transaction_id}`
      );
      
      console.log('📊 Transaction Status:');
      console.log(JSON.stringify(statusResponse.data, null, 2));
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

// Test document upload
const testDocumentUpload = async (transactionId) => {
  try {
    console.log('\n📄 Testing document upload...');
    
    const documentData = {
      document_url: "https://res.cloudinary.com/demo/image/upload/v1234567890/receipts/sample_receipt.jpg",
      document_hash: "a1b2c3d4e5f6789012345678901234567890abcdef",
      ngo_notes: "Receipt for medical supplies purchased from local pharmacy"
    };

    const response = await axios.post(
      `http://localhost:5000/api/bank/upload-document/${transactionId}`,
      documentData,
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );

    console.log('✅ Document upload response:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Document upload test failed:', error.response?.data || error.message);
  }
};

// Run tests
const runTests = async () => {
  console.log('🚀 Starting Bank Integration Tests\n');
  
  await testWithdrawalNotification();
  
  // Test document upload with a sample transaction ID
  // You can get a real transaction ID from the withdrawal notification test above
  // await testDocumentUpload('PWT_1728123456789_ABC123');
  
  console.log('\n🏁 Tests completed');
};

export default runTests;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}