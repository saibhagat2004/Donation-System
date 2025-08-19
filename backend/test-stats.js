import mongoose from 'mongoose';
import Donation from './models/donation.model.js';

// Connect to MongoDB 
mongoose.connect('mongodb+srv://saibhagat:saibhagat@cluster0.1cgmn3r.mongodb.net/DonationSystem?retryWrites=true&w=majority&appName=Cluster0');

async function testStats() {
  try {
    console.log('🔍 Testing donation stats...');
    
    // Find all donations
    const allDonations = await Donation.find({}).select('donor_id payment_status amount cashfree_order_id paid_at');
    console.log('📊 All donations:', allDonations.length);
    console.log('Sample donations:', allDonations.slice(0, 3));
    
    // Test with a specific donor ID (use one from your donations)
    if (allDonations.length > 0) {
      const testDonorId = allDonations[0].donor_id;
      console.log('🧪 Testing with donor ID:', testDonorId);
      
      // Get donations for this donor
      const donorDonations = await Donation.find({ donor_id: testDonorId });
      console.log('👤 Donor donations:', donorDonations.length);
      console.log('Donor donation statuses:', donorDonations.map(d => d.payment_status));
      
      // Test the stats function
      const stats = await Donation.getDonorStats(testDonorId);
      console.log('📈 Stats result:', stats);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.disconnect();
  }
}

testStats();
