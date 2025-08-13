import React from 'react';
import { useState } from 'react'
import axios from "axios"
import {load} from '@cashfreepayments/cashfree-js'


function App() {
  const [amount, setAmount] = useState(1); // default ₹1


  let cashfree;

  let insitialzeSDK = async function () {

    cashfree = await load({
      mode: "sandbox",
    })
  }

  insitialzeSDK()

  const [orderId, setOrderId] = useState("")



  const getSessionId = async () => {
    try {
      let res = await axios.post("/api/cashfreepg/createOrder", { amount });
      
      if(res.data && res.data.payment_session_id){

        console.log(res.data)
        setOrderId(res.data.order_id)
        return res.data.payment_session_id
      }


    } catch (error) {
      console.log(error)
    }
  }

  const verifyPayment = async () => {
    try {
      
      let res = await axios.post("/api/cashfreepg/verify-order", {
        orderId: orderId
      })

      if(res && res.data){
        alert("payment verified")
      }

    } catch (error) {
      console.log(error)
    }
  }

  const handleClick = async (e) => {
    e.preventDefault()
    try {

      let sessionId = await getSessionId()
      let checkoutOptions = {
        paymentSessionId : sessionId,
        redirectTarget:"_modal",
      }

      cashfree.checkout(checkoutOptions).then((res) => {
        console.log("payment initialized")

        verifyPayment(orderId)
      })


    } catch (error) {
      console.log(error)
    }

  }
return (
  <>
    <h1>Cashfree Payment Gateway</h1>
    <input
      type="number"
      value={amount}
      onChange={(e) => setAmount(e.target.value)}
      placeholder="Enter amount"
    />
    <button onClick={handleClick}>Pay now</button>
  </>
)
}

export default App


