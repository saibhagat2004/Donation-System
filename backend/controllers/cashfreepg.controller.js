import { Cashfree } from "cashfree-pg";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const cashfree = new Cashfree(
  Cashfree.SANDBOX,
  process.env.CASHFREE_CLIENT_ID,
  process.env.CASHFREE_CLIENT_SECRET
);

function generateOrderId() {
  return `ORD_${crypto.randomBytes(12).toString("hex")}`;
}

// export const createOrder = async (req, res) => {
//   try {
//     const amount = req.body; // from frontend
//     if (!amount) {
//       return res.status(400).json({ error: "Amount is required" });
//     }

//     const request = {
//       order_amount: amount,
//       order_currency: "INR",
//       order_id: generateOrderId(),
//       customer_details: {
//         customer_id: customer?.id || "guest_001",
//         customer_phone: customer?.phone || "9999999999",
//         customer_name: customer?.name || "Guest User",
//         customer_email: customer?.email || "guest@example.com",
//       },
//       order_meta: {
//         return_url: process.env.CASHFREE_RETURN_URL,
//       },
//     };

//     const response = await cashfree.PGCreateOrder(request);
//     return res.json(response.data || response);
//   } catch (err) {
//     console.error("CreateOrder error:", err?.response?.data || err.message || err);
//     return res
//       .status(500)
//       .json({ error: err?.response?.data || err.message || "Internal server error" });
//   }
// };
export const createOrder = async (req, res) => {
  try {
    const { amount } = req.body; // destructure from body
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const request = {
      order_amount: amount,
      order_currency: "INR",
      order_id: generateOrderId(),
      customer_details: {
        customer_id: "guest_001",
        customer_phone: "9999999999",
        customer_name: "Guest User",
        customer_email: "guest@example.com",
      },
      order_meta: {
        return_url: process.env.CASHFREE_RETURN_URL,
      },
    };

    const response = await cashfree.PGCreateOrder(request);
    return res.json(response.data || response);
  } catch (err) {
    console.error("CreateOrder error:", err?.response?.data || err.message || err);
    return res
      .status(500)
      .json({ error: err?.response?.data || err.message || "Internal server error" });
  }
};
export const verifyOrder = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ error: "orderId is required" });

  try {
    const response = await cashfree.PGFetchOrder(orderId);
    return res.json(response.data || response);
  } catch (err) {
    console.error("GetOrder error:", err?.response?.data || err.message || err);
    return res
      .status(500)
      .json({ error: err?.response?.data || err.message || "Internal server error" });
  }
};
