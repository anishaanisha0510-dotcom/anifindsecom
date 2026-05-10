import Razorpay from "razorpay";

export async function POST(req) {
  try {
    const body = await req.json();
    const { amount, receipt } = body;

    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return new Response(JSON.stringify({ error: "Razorpay keys are not configured" }), { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // amount in the smallest currency unit
      currency: "INR",
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return new Response(JSON.stringify(order), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to create razorpay order" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
