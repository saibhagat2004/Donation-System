import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function ReceiptDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const transaction = location.state?.transaction;
  
  const [feedback, setFeedback] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState({
    thumbs_up_count: 0,
    red_flag_count: 0,
    total_feedback_count: 0
  });
  const [hasFeedback, setHasFeedback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  
  // Feedback form state
  const [ratingType, setRatingType] = useState('');
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (transaction && (transaction._id || transaction.id)) {
      fetchFeedback();
      checkUserFeedback();
    }
  }, [transaction]);

  const fetchFeedback = async () => {
    try {
      // Use _id for MongoDB documents, or id for other types
      const transactionId = transaction._id || transaction.id;
      const response = await fetch(`http://localhost:5000/api/feedback/transaction/${transactionId}`);
      const data = await response.json();
      
      if (data.success) {
        setFeedback(data.feedback || []);
        setFeedbackStats(data.stats || { thumbs_up_count: 0, red_flag_count: 0, total_feedback_count: 0 });
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const checkUserFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Use _id for MongoDB documents, or id for other types
      const transactionId = transaction._id || transaction.id;
      const response = await fetch(`http://localhost:5000/api/feedback/transaction/${transactionId}/check`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setHasFeedback(data.hasFeedback);
      }
    } catch (error) {
      console.error('Error checking user feedback:', error);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    
    if (!ratingType) {
      toast.error('Please select thumbs up or red flag');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to provide feedback');
        navigate('/login');
        return;
      }

      // Use _id for MongoDB documents, or id for other types
      const transactionId = transaction._id || transaction.id;
      const response = await fetch(`http://localhost:5000/api/feedback/transaction/${transactionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ratingType,
          comment,
          reason: reason || 'OTHER'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Feedback submitted successfully!');
        setShowFeedbackForm(false);
        setRatingType('');
        setComment('');
        setReason('');
        fetchFeedback();
        setHasFeedback(true);
      } else {
        toast.error(data.message || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <h2 className="text-xl font-bold mb-4">Receipt Details</h2>
        <p className="text-red-600">No transaction data found. Please access this page from the transactions table.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Go Back</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded">← Back</button>
      <h2 className="text-2xl font-bold mb-6">Receipt Details</h2>
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Transaction ID:</span> <span className="text-gray-900">{transaction.id}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">NGO:</span> <span className="text-gray-900">{transaction.ngoFullName || transaction.ngoId}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Amount:</span> <span className="text-gray-900">₹{transaction.amount}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Cause:</span> <span className="text-gray-900">{transaction.cause}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Date:</span> <span className="text-gray-900">{new Date(transaction.date).toLocaleString('en-IN')}</span>
        </div>
        {transaction.ngoNotes && (
          <div className="mb-4">
            <span className="font-semibold text-gray-700">NGO Notes:</span>
            <div className="bg-gray-50 border rounded p-3 mt-1 text-gray-800 whitespace-pre-line">{transaction.ngoNotes}</div>
          </div>
        )}
        {transaction.documentUrl && (
          <div className="mb-4">
            <span className="font-semibold text-gray-700">Receipt Image:</span>
            <div className="mt-2">
              <img src={transaction.documentUrl} alt="Receipt" className="max-w-full rounded border shadow" />
            </div>
            <a href={transaction.documentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">Open Full Image</a>
          </div>
        )}
        {transaction.description && (
          <div className="mb-4">
            <span className="font-semibold text-gray-700">Description:</span>
            <div className="bg-gray-50 border rounded p-3 mt-1 text-gray-800 whitespace-pre-line">{transaction.description}</div>
          </div>
        )}
        {/* Verification Hash - Commented out for better UX */}
        {/* {transaction.verificationHash && transaction.verificationHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
          <div className="mb-4">
            <span className="font-semibold text-gray-700">Verification Hash:</span>
            <code className="block bg-gray-100 px-2 py-1 rounded font-mono text-xs text-gray-700 mt-1">{transaction.verificationHash}</code>
          </div>
        )} */}
      </div>

      {/* Feedback Statistics */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Community Feedback</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-3xl mb-2">👍</div>
            <div className="text-2xl font-bold text-green-600">{feedbackStats.thumbs_up_count}</div>
            <div className="text-sm text-gray-600">Thumbs Up</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-3xl mb-2">🚩</div>
            <div className="text-2xl font-bold text-red-600">{feedbackStats.red_flag_count}</div>
            <div className="text-sm text-gray-600">Red Flags</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-3xl mb-2">💬</div>
            <div className="text-2xl font-bold text-blue-600">{feedbackStats.total_feedback_count}</div>
            <div className="text-sm text-gray-600">Total Feedback</div>
          </div>
        </div>

        {/* Add Feedback Button */}
        {transaction.documentUrl && !hasFeedback && (
          <div className="mb-6">
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {showFeedbackForm ? 'Cancel Feedback' : 'Add Your Feedback'}
            </button>
          </div>
        )}

        {hasFeedback && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            ✓ You have already provided feedback for this transaction
          </div>
        )}

        {/* Feedback Form */}
        {showFeedbackForm && (
          <form onSubmit={handleSubmitFeedback} className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h4 className="font-semibold mb-4">Your Feedback</h4>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rate the Proof</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setRatingType('THUMBS_UP')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    ratingType === 'THUMBS_UP'
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-3xl mb-1">👍</div>
                  <div className="text-sm font-medium">Thumbs Up</div>
                </button>
                
                <button
                  type="button"
                  onClick={() => setRatingType('RED_FLAG')}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition ${
                    ratingType === 'RED_FLAG'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-red-400'
                  }`}
                >
                  <div className="text-3xl mb-1">🚩</div>
                  <div className="text-sm font-medium">Red Flag</div>
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a reason (optional)</option>
                <option value="PROOF_APPROPRIATE">Proof is appropriate</option>
                <option value="WELL_DOCUMENTED">Well documented</option>
                <option value="GOOD_TRANSPARENCY">Good transparency</option>
                <option value="PROOF_INSUFFICIENT">Proof is insufficient</option>
                <option value="PROOF_FAKE">Proof appears fake</option>
                <option value="SUSPICIOUS_ACTIVITY">Suspicious activity</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Share your thoughts about this proof..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <div className="text-xs text-gray-500 mt-1">{comment.length}/500 characters</div>
            </div>

            <button
              type="submit"
              disabled={loading || !ratingType}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        )}

        {/* Feedback List */}
        {feedback.length > 0 && (
          <div>
            <h4 className="font-semibold mb-4">Comments ({feedback.length})</h4>
            <div className="space-y-4">
              {feedback.map((fb, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {fb.rating_type === 'THUMBS_UP' ? '👍' : '🚩'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{fb.user_name || 'Anonymous'}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(fb.created_at).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      {fb.reason && (
                        <div className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Reason:</span> {fb.reason.replace(/_/g, ' ').toLowerCase()}
                        </div>
                      )}
                      {fb.comment && (
                        <p className="text-gray-700 text-sm">{fb.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {feedback.length === 0 && !showFeedbackForm && (
          <div className="text-center py-8 text-gray-500">
            No feedback yet. Be the first to share your thoughts!
          </div>
        )}
      </div>
    </div>
  );
}
