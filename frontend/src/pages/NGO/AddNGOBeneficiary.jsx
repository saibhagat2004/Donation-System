// import React, { useState } from "react";
// import axios from "axios";

// export default function AddNGOBeneficiary() {
//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     phone: "",
//     bank_account: "",
//     ifsc: "",
//     address1: "",
//     city: "",
//     state: "",
//     pincode: "",
//     org_name: "",
//     org_pan: "",
//     org_gst: "",
//     registration_cert: null
//   });

//   const [errors, setErrors] = useState({});

//   const handleChange = (e) => {
//     const { name, value, files } = e.target;
//     setForm({
//       ...form,
//       [name]: files ? files[0] : value
//     });
//     setErrors({
//       ...errors,
//       [name]: ""
//     });
//   };

//   const validate = () => {
//     const newErrors = {};
//     // Required fields except GST and registration_cert
//     const requiredFields = [
//       "name", "email", "phone", "bank_account", "ifsc",
//       "address1", "city", "state", "pincode", "org_name", "org_pan"
//     ];
//     requiredFields.forEach(field => {
//       if (!form[field]) {
//         newErrors[field] = "This field is required";
//       }
//     });
//     return newErrors;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const validationErrors = validate();
//     if (Object.keys(validationErrors).length > 0) {
//       setErrors(validationErrors);
//       return;
//     }
//     try {
//       const formData = new FormData();
//       for (let key in form) {
//         formData.append(key, form[key]);
//       }
//       const res = await axios.post("/api/cashfreepg/addBeneficiary", formData, {
//         headers: { "Content-Type": "multipart/form-data" }
//       });
//       alert("Beneficiary Added! ID: " + res.data.beneficiary_id);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to add beneficiary");
//     }
//   };

//   return (
//     <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
//       <h2 className="text-3xl font-bold mb-8 text-center">Add NGO Beneficiary</h2>
//       <form onSubmit={handleSubmit} className="space-y-8">

//         {/* NGO Contact Details */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div className="flex flex-col">
//               <label>
//                 Full Name <span className="text-red-500">*</span>
//               </label>
//               <input name="name" placeholder="Full Name" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.name && "border-red-500"}`} onChange={handleChange} />
//               {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 Email <span className="text-red-500">*</span>
//               </label>
//               <input name="email" placeholder="Email" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.email && "border-red-500"}`} onChange={handleChange} />
//               {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 Phone <span className="text-red-500">*</span>
//               </label>
//               <input name="phone" placeholder="Phone" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.phone && "border-red-500"}`} onChange={handleChange} />
//               {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
//             </div>
//           </div>
//         </div>

//         {/* Bank Details */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="flex flex-col">
//               <label>
//                 Bank Account Number <span className="text-red-500">*</span>
//               </label>
//               <input name="bank_account" placeholder="Bank Account Number" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.bank_account && "border-red-500"}`} onChange={handleChange} />
//               {errors.bank_account && <span className="text-red-500 text-sm">{errors.bank_account}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 IFSC Code <span className="text-red-500">*</span>
//               </label>
//               <input name="ifsc" placeholder="IFSC Code" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.ifsc && "border-red-500"}`} onChange={handleChange} />
//               {errors.ifsc && <span className="text-red-500 text-sm">{errors.ifsc}</span>}
//             </div>
//           </div>
//         </div>

//         {/* Address */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4">Address</h3>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <div className="flex flex-col">
//               <label>
//                 Address <span className="text-red-500">*</span>
//               </label>
//               <input name="address1" placeholder="Address" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.address1 && "border-red-500"}`} onChange={handleChange} />
//               {errors.address1 && <span className="text-red-500 text-sm">{errors.address1}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 City <span className="text-red-500">*</span>
//               </label>
//               <input name="city" placeholder="City" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.city && "border-red-500"}`} onChange={handleChange} />
//               {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 State <span className="text-red-500">*</span>
//               </label>
//               <input name="state" placeholder="State" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.state && "border-red-500"}`} onChange={handleChange} />
//               {errors.state && <span className="text-red-500 text-sm">{errors.state}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 Pincode <span className="text-red-500">*</span>
//               </label>
//               <input name="pincode" placeholder="Pincode" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.pincode && "border-red-500"}`} onChange={handleChange} />
//               {errors.pincode && <span className="text-red-500 text-sm">{errors.pincode}</span>}
//             </div>
//           </div>
//         </div>

//         {/* Organization Details */}
//         <div>
//           <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="flex flex-col">
//               <label>
//                 Organization Name <span className="text-red-500">*</span>
//               </label>
//               <input name="org_name" placeholder="Organization Name" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.org_name && "border-red-500"}`} onChange={handleChange} />
//               {errors.org_name && <span className="text-red-500 text-sm">{errors.org_name}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 Organization PAN <span className="text-red-500">*</span>
//               </label>
//               <input name="org_pan" placeholder="Organization PAN" className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.org_pan && "border-red-500"}`} onChange={handleChange} />
//               {errors.org_pan && <span className="text-red-500 text-sm">{errors.org_pan}</span>}
//             </div>
//             <div className="flex flex-col">
//               <label>
//                 GST Number (if applicable)
//               </label>
//               <input name="org_gst" placeholder="GST Number (if applicable)" className="border rounded-lg p-3 focus:outline-blue-500" onChange={handleChange} />
//             </div>
//             <div className="flex flex-col">
//               <label htmlFor="registration_cert" className="mb-1 font-medium text-gray-700">
//                 Registration Certificate (PDF/JPG/PNG)
//               </label>
//               <input type="file" name="registration_cert" id="registration_cert" className="border rounded-lg p-2" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
//             </div>
//           </div>
//         </div>

//         <button
//           type="submit"
//           className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
//         >
//           Add Beneficiary
//         </button>
//       </form>
//     </div>
//   );
// }



import React, { useState } from "react";
import axios from "axios";

export default function AddNGOBeneficiary() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    bank_account: "",
    ifsc: "",
    vpa: "",
    address1: "",
    city: "",
    state: "",
    pincode: "",
    org_name: "",
    org_pan: "",
    org_gst: "",
    registration_cert: null
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm({
      ...form,
      [name]: files ? files[0] : value
    });
    setErrors({
      ...errors,
      [name]: ""
    });
    // Clear success message when user starts editing
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const validate = () => {
    const newErrors = {};
    // Required fields except GST and registration_cert
    const requiredFields = [
      "name", "email", "phone", "bank_account", "ifsc",
      "address1", "city", "state", "pincode", "org_name", "org_pan"
    ];
    requiredFields.forEach(field => {
      if (!form[field]) {
        newErrors[field] = "This field is required";
      }
    });
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const formData = new FormData();
      for (let key in form) {
        formData.append(key, form[key]);
      }
      // If you want to send files, use formData and multipart/form-data
      // Otherwise, send JSON as below
      const res = await axios.post("/api/cashfreepg/addBeneficiary", form, {
        headers: { "Content-Type": "application/json" }
      });
      setServerError("");
      setSuccessMessage(`Beneficiary successfully added! ID: ${res.data.beneficiary_id}`);
      // Reset form after successful submission
      setForm({
        name: "",
        email: "",
        phone: "",
        bank_account: "",
        ifsc: "",
        vpa: "",
        address1: "",
        city: "",
        state: "",
        pincode: "",
        org_name: "",
        org_pan: "",
        org_gst: "",
        registration_cert: null
      });
    } catch (err) {
      console.error(err);
      let errorMsg = "Failed to add beneficiary";
      if (err.response && err.response.data && err.response.data.error) {
        errorMsg = err.response.data.error;
      }
      setServerError(errorMsg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-xl rounded-2xl">
      <h2 className="text-3xl font-bold mb-8 text-center">Add NGO Beneficiary</h2>
      {serverError && (
        <div className="mb-4 text-red-600 text-center font-semibold border border-red-300 bg-red-50 p-2 rounded-lg">
          {serverError}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 text-green-600 text-center font-semibold border border-green-300 bg-green-50 p-2 rounded-lg">
          {successMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-8">

        {/* NGO Contact Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                name="name"
                placeholder="Full Name"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.name && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. John Doe</span>
              {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                placeholder="Email"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.email && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. johndoe@email.com</span>
              {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="Phone"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.phone && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. 9876543210</span>
              {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label>
                Bank Account Number <span className="text-red-500">*</span>
              </label>
              <input
                name="bank_account"
                placeholder="Bank Account Number"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.bank_account && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. 123456789012</span>
              {errors.bank_account && <span className="text-red-500 text-sm">{errors.bank_account}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                IFSC Code <span className="text-red-500">*</span>
              </label>
              <input
                name="ifsc"
                placeholder="IFSC Code"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.ifsc && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. HDFC0000001</span>
              {errors.ifsc && <span className="text-red-500 text-sm">{errors.ifsc}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                VPA/UPI ID (Optional)
              </label>
              <input
                name="vpa"
                placeholder="VPA/UPI ID"
                className="border rounded-lg p-3 focus:outline-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. user@paytm</span>
            </div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <label>
                Address <span className="text-red-500">*</span>
              </label>
              <input
                name="address1"
                placeholder="Address"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.address1 && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. Priyanka Apt</span>
              {errors.address1 && <span className="text-red-500 text-sm">{errors.address1}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                City <span className="text-red-500">*</span>
              </label>
              <input
                name="city"
                placeholder="City"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.city && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. Mumbai</span>
              {errors.city && <span className="text-red-500 text-sm">{errors.city}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                State <span className="text-red-500">*</span>
              </label>
              <input
                name="state"
                placeholder="State"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.state && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. Maharashtra</span>
              {errors.state && <span className="text-red-500 text-sm">{errors.state}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                name="pincode"
                placeholder="Pincode"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.pincode && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. 401209</span>
              {errors.pincode && <span className="text-red-500 text-sm">{errors.pincode}</span>}
            </div>
          </div>
        </div>

        {/* Organization Details */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label>
                Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                name="org_name"
                placeholder="Organization Name"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.org_name && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. Helping Hands Foundation</span>
              {errors.org_name && <span className="text-red-500 text-sm">{errors.org_name}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                Organization PAN <span className="text-red-500">*</span>
              </label>
              <input
                name="org_pan"
                placeholder="Organization PAN"
                required
                className={`border rounded-lg p-3 focus:outline-blue-500 ${errors.org_pan && "border-red-500"}`}
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. ABCDE1234F</span>
              {errors.org_pan && <span className="text-red-500 text-sm">{errors.org_pan}</span>}
            </div>
            <div className="flex flex-col">
              <label>
                GST Number (if applicable)
              </label>
              <input
                name="org_gst"
                placeholder="GST Number (if applicable)"
                className="border rounded-lg p-3 focus:outline-blue-500"
                onChange={handleChange}
              />
              <span className="text-xs text-gray-500">e.g. 27ABCDE1234F1Z5</span>
            </div>
            <div className="flex flex-col">
              <label htmlFor="registration_cert" className="mb-1 font-medium text-gray-700">
                Registration Certificate (PDF/JPG/PNG)
              </label>
              <input
                type="file"
                name="registration_cert"
                id="registration_cert"
                className="border rounded-lg p-2"
                onChange={handleChange}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <span className="text-xs text-gray-500">Upload your NGO registration certificate</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
        >
          Add Beneficiary
        </button>
      </form>
    </div>
  );
}