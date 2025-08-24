import PDFDocument from 'pdfkit';
import Donation from '../models/donation.model.js';
import Campaign from '../models/campaign.model.js';
import User from '../models/user.model.js';

// Generate PDF receipt for donation
export const generateDonationReceipt = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // Find donation with populated data
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    })
    .populate('campaign_id', 'title category created_by')
    .populate('donor_id', 'fullName email')
    .populate('ngo_id', 'fullName email ngoDetails');

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (donation.payment_status !== 'PAID') {
      return res.status(400).json({ error: "Receipt can only be generated for successful donations" });
    }

    // Check if user is authorized to download receipt
    const userId = req.user._id.toString();
    if (donation.donor_id._id.toString() !== userId && 
        donation.ngo_id._id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="donation-receipt-${orderId}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20)
       .fillColor('#2563eb')
       .text('DONATION RECEIPT', 50, 50, { align: 'center' });
    
    doc.fontSize(12)
       .fillColor('#6b7280')
       .text('Tax Deduction Receipt under Section 80G', 50, 80, { align: 'center' });

    // Receipt details box
    doc.rect(50, 110, 500, 100)
       .stroke('#e5e7eb');

    doc.fontSize(14)
       .fillColor('#000000')
       .text('Receipt Number:', 70, 130)
       .text(donation.receipt_number, 200, 130);

    doc.text('Date:', 70, 150)
       .text(new Date(donation.paid_at).toLocaleDateString('en-IN'), 200, 150);

    doc.text('Order ID:', 70, 170)
       .text(donation.cashfree_order_id, 200, 170);

    doc.text('Payment Status:', 70, 190)
       .fillColor('#059669')
       .text('PAID', 200, 190);

    // Donor Information
    doc.fillColor('#000000')
       .fontSize(16)
       .text('Donor Information', 50, 240);

    doc.fontSize(12)
       .text(`Name: ${donation.donor_id.fullName}`, 70, 265);

    doc.text(`Email: ${donation.donor_id.email}`, 70, 285);

    if (donation.donor_message) {
      doc.text(`Message: "${donation.donor_message}"`, 70, 305);
    }

    // NGO Information
    doc.fontSize(16)
       .text('NGO Information', 50, 340);

    doc.fontSize(12)
       .text(`NGO Name: ${donation.ngo_id.ngoDetails?.name || donation.ngo_id.fullName}`, 70, 365);

    doc.text(`Contact: ${donation.ngo_id.email}`, 70, 385);

    // Campaign Information
    doc.fontSize(16)
       .text('Campaign Details', 50, 420);

    doc.fontSize(12)
       .text(`Campaign: ${donation.campaign_id.title}`, 70, 445);

    doc.text(`Category: ${donation.campaign_id.category}`, 70, 465);

    // Payment Breakdown
    doc.fontSize(16)
       .text('Payment Breakdown', 50, 500);

    const totalAmount = donation.total_amount || (donation.amount + donation.platform_fee + donation.payment_gateway_fee);

    // Breakdown table
    doc.rect(50, 525, 500, 120)
       .stroke('#e5e7eb');

    doc.fontSize(12)
       .text('Donation to NGO:', 70, 545)
       .text(`₹${donation.amount.toLocaleString('en-IN')}`, 450, 545, { align: 'right' });

    doc.text('Platform Fee:', 70, 565)
       .text(`₹${donation.platform_fee.toLocaleString('en-IN')}`, 450, 565, { align: 'right' });

    doc.text('Payment Gateway Fee:', 70, 585)
       .text(`₹${donation.payment_gateway_fee.toLocaleString('en-IN')}`, 450, 585, { align: 'right' });

    // Total line
    doc.moveTo(70, 610)
       .lineTo(530, 610)
       .stroke();

    doc.fontSize(14)
       .fillColor('#2563eb')
       .text('Total Amount Paid:', 70, 620)
       .text(`₹${totalAmount.toLocaleString('en-IN')}`, 450, 620, { align: 'right' });

    // Tax Information
    doc.fillColor('#000000')
       .fontSize(16)
       .text('Tax Information', 50, 670);

    doc.fontSize(12)
       .text('• This donation is eligible for tax deduction under Section 80G of Income Tax Act', 70, 695);
    
    doc.text('• Please retain this receipt for your tax filing', 70, 715);
    
    doc.text(`• Donation Amount (Tax Deductible): ₹${donation.amount.toLocaleString('en-IN')}`, 70, 735);

    // Footer
    doc.fontSize(10)
       .fillColor('#6b7280')
       .text('This is a computer-generated receipt and does not require a signature.', 50, 770, { align: 'center' });

    doc.text('For any queries, please contact our support team.', 50, 785, { align: 'center' });

    // Finalize PDF
    doc.end();

  } catch (error) {
    console.error('Receipt generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate receipt',
      details: error.message
    });
  }
};

// Get receipt data for preview
export const getReceiptData = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const donation = await Donation.findOne({ 
      cashfree_order_id: orderId 
    })
    .populate('campaign_id', 'title category')
    .populate('donor_id', 'fullName email')
    .populate('ngo_id', 'fullName email ngoDetails');

    if (!donation) {
      return res.status(404).json({ error: "Donation not found" });
    }

    if (donation.payment_status !== 'PAID') {
      return res.status(400).json({ error: "Receipt data only available for successful donations" });
    }

    // Check authorization
    const userId = req.user._id.toString();
    if (donation.donor_id._id.toString() !== userId && 
        donation.ngo_id._id.toString() !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    const totalAmount = donation.total_amount || (donation.amount + donation.platform_fee + donation.payment_gateway_fee);

    return res.json({
      success: true,
      receipt: {
        receipt_number: donation.receipt_number,
        order_id: donation.cashfree_order_id,
        date: donation.paid_at,
        donor: {
          name: donation.donor_id.fullName,
          email: donation.donor_id.email,
          message: donation.donor_message
        },
        ngo: {
          name: donation.ngo_id.ngoDetails?.name || donation.ngo_id.fullName,
          email: donation.ngo_id.email
        },
        campaign: {
          title: donation.campaign_id.title,
          category: donation.campaign_id.category
        },
        payment: {
          donation_amount: donation.amount,
          platform_fee: donation.platform_fee,
          gateway_fee: donation.payment_gateway_fee,
          total_amount: totalAmount,
          payment_status: donation.payment_status,
          payment_method: donation.payment_method
        },
        tax_info: {
          eligible: donation.tax_deduction_eligible,
          deductible_amount: donation.amount
        }
      }
    });

  } catch (error) {
    console.error('Get receipt data error:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch receipt data' 
    });
  }
};
