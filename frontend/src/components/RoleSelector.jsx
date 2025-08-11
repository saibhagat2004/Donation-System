import React from "react";
export default function RoleSelector({ onSelect }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedRole = e.target.role.value; // assuming name="role" in your input/select
    onSelect(selectedRole);
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center" >
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="mb-4 text-lg font-bold">Select Your Role</h2>
        <select name="role" className="border p-2 rounded">
          <option value="">Choose role...</option>
          <option value="donor">Donor</option>
          <option value="ngo">NGO</option>
        </select>
        <button type="submit" className="ml-3 bg-blue-500 text-white px-4 py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}
