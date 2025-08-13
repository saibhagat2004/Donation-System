import { useState } from "react";
import axios from "axios";

export default function AddNGOBeneficiary() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bank_account: "",
    ifsc: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
    org_name: "",
    org_pan: "",
    org_gst: "",
    registration_cert: null
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      for (let key in form) {
        formData.append(key, form[key]);
      }
      const res = await axios.post("/api/cashfreepg/add-beneficiary", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      alert("Beneficiary Added! ID: " + res.data.beneficiary_id);
    } catch (err) {
      console.error(err);
      alert("Failed to add beneficiary");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-6">Add NGO Beneficiary</h2>
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* NGO Contact Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" placeholder="Full Name" className="input" onChange={handleChange} />
            <input name="email" placeholder="Email" className="input" onChange={handleChange} />
            <input name="phone" placeholder="Phone" className="input" onChange={handleChange} />
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="bank_account" placeholder="Bank Account Number" className="input" onChange={handleChange} />
            <input name="ifsc" placeholder="IFSC Code" className="input" onChange={handleChange} />
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="address1" placeholder="Address" className="input" onChange={handleChange} />
            <input name="city" placeholder="City" className="input" onChange={handleChange} />
            <input name="state" placeholder="State" className="input" onChange={handleChange} />
            <input name="pincode" placeholder="Pincode" className="input" onChange={handleChange} />
          </div>
        </div>

        {/* Organization Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="org_name" placeholder="Organization Name" className="input" onChange={handleChange} />
            <input name="org_pan" placeholder="Organization PAN" className="input" onChange={handleChange} />
            <input name="org_gst" placeholder="GST Number (if applicable)" className="input" onChange={handleChange} />
            <input type="file" name="registration_cert" className="input" onChange={handleChange} />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Add Beneficiary
        </button>
      </form>
    </div>
  );
}
