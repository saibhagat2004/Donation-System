import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("pending"); // pending, verified, all
  const [ngos, setNgos] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, incomplete: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedNGO, setSelectedNGO] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchNGOs();
  }, [activeTab]);

  const fetchNGOs = async () => {
    setLoading(true);
    try {
      let endpoint = "/api/admin/ngos";
      if (activeTab === "pending") endpoint = "/api/admin/ngos/pending";
      else if (activeTab === "verified") endpoint = "/api/admin/ngos/verified";

      const res = await axios.get(endpoint);
      setNgos(res.data.ngos);
      if (res.data.stats) setStats(res.data.stats);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to fetch NGOs");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNGO = async (ngoId) => {
    if (!confirm("Are you sure you want to verify this NGO?")) return;
    
    try {
      await axios.put(`/api/admin/ngos/verify/${ngoId}`);
      toast.success("NGO verified successfully!");
      fetchNGOs();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to verify NGO");
    }
  };

  const handleRejectNGO = async (ngoId) => {
    const reason = prompt("Enter rejection reason (optional):");
    
    try {
      await axios.post(`/api/admin/ngos/reject/${ngoId}`, { reason });
      toast.success("NGO verification rejected");
      fetchNGOs();
      setShowModal(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to reject NGO");
    }
  };

  const viewNGODetails = async (ngoId) => {
    try {
      const res = await axios.get(`/api/admin/ngos/${ngoId}`);
      setSelectedNGO(res.data.ngo);
      setShowModal(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch NGO details");
    }
  };

  const NGODetailsModal = () => {
    if (!selectedNGO) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <h3 className="text-2xl font-bold">NGO Details</h3>
            <button onClick={() => setShowModal(false)} className="text-2xl hover:text-red-500">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            {/* Status Badge */}
            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                selectedNGO.verified 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {selectedNGO.verified ? '✓ Verified' : '⏳ Pending Verification'}
              </span>
            </div>

            {/* Basic Info */}
            <div>
              <h4 className="text-lg font-semibold mb-3">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Full Name" value={selectedNGO.fullName} />
                <InfoField label="Email" value={selectedNGO.email} />
                <InfoField label="Username" value={selectedNGO.username} />
                <InfoField label="Joined" value={new Date(selectedNGO.createdAt).toLocaleDateString()} />
              </div>
            </div>

            {/* NGO Details */}
            {selectedNGO.ngoDetails && (
              <>
                <div>
                  <h4 className="text-lg font-semibold mb-3">Contact Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Contact Name" value={selectedNGO.ngoDetails.name} />
                    <InfoField label="Contact Email" value={selectedNGO.ngoDetails.email} />
                    <InfoField label="Phone" value={selectedNGO.ngoDetails.phone} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Organization Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Organization Name" value={selectedNGO.ngoDetails.org_name} />
                    <InfoField label="Organization PAN" value={selectedNGO.ngoDetails.org_pan} />
                    <InfoField label="GST Number" value={selectedNGO.ngoDetails.org_gst || 'N/A'} />
                    <InfoField label="Beneficiary ID" value={selectedNGO.ngoDetails.beneficiary_id} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Bank Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Bank Account" value={selectedNGO.ngoDetails.bank_account} />
                    <InfoField label="IFSC Code" value={selectedNGO.ngoDetails.ifsc} />
                    <InfoField label="VPA/UPI" value={selectedNGO.ngoDetails.vpa || 'N/A'} />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold mb-3">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField label="Address" value={selectedNGO.ngoDetails.address1} />
                    <InfoField label="City" value={selectedNGO.ngoDetails.city} />
                    <InfoField label="State" value={selectedNGO.ngoDetails.state} />
                    <InfoField label="Pincode" value={selectedNGO.ngoDetails.pincode} />
                  </div>
                </div>
              </>
            )}

            {/* Reputation */}
            {selectedNGO.reputation && (
              <div>
                <h4 className="text-lg font-semibold mb-3">Reputation</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{selectedNGO.reputation.reputationScore}</div>
                    <div className="text-sm text-gray-600">Score</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedNGO.reputation.thumbsUpCount}</div>
                    <div className="text-sm text-gray-600">👍 Thumbs Up</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{selectedNGO.reputation.redFlagCount}</div>
                    <div className="text-sm text-gray-600">🚩 Red Flags</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{selectedNGO.reputation.totalFeedbackCount}</div>
                    <div className="text-sm text-gray-600">Total Feedback</div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!selectedNGO.verified && selectedNGO.ngoDetails?.beneficiary_id && (
              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => handleVerifyNGO(selectedNGO._id)}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  ✓ Verify NGO
                </button>
                <button
                  onClick={() => handleRejectNGO(selectedNGO._id)}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  ✗ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const InfoField = ({ label, value }) => (
    <div>
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-medium">{value || 'N/A'}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard - NGO Verification</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-gray-600">Total NGOs</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-3xl font-bold text-green-600">{stats.verified}</div>
          <div className="text-gray-600">Verified</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="text-3xl font-bold text-gray-600">{stats.incomplete}</div>
          <div className="text-gray-600">Incomplete</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === "pending"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Pending Verification ({stats.pending})
          </button>
          <button
            onClick={() => setActiveTab("verified")}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === "verified"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            Verified ({stats.verified})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-4 px-6 font-semibold transition ${
              activeTab === "all"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            All NGOs ({stats.total})
          </button>
        </div>

        {/* NGO List */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading NGOs...</p>
            </div>
          ) : ngos.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              No NGOs found in this category
            </div>
          ) : (
            <div className="space-y-4">
              {ngos.map((ngo) => (
                <div
                  key={ngo._id}
                  className="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => viewNGODetails(ngo._id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold">{ngo.fullName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ngo.verified 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {ngo.verified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-1">{ngo.email}</p>
                      {ngo.ngoDetails?.org_name && (
                        <p className="text-gray-600">
                          <span className="font-medium">Organization:</span> {ngo.ngoDetails.org_name}
                        </p>
                      )}
                      {ngo.ngoDetails?.beneficiary_id && (
                        <p className="text-gray-600">
                          <span className="font-medium">Beneficiary ID:</span> {ngo.ngoDetails.beneficiary_id}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 mt-2">
                        Joined: {new Date(ngo.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!ngo.verified && ngo.ngoDetails?.beneficiary_id && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVerifyNGO(ngo._id);
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                          >
                            ✓ Verify
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRejectNGO(ngo._id);
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                          >
                            ✗ Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && <NGODetailsModal />}
    </div>
  );
}
