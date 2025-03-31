import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const domainUrl = process.env.DOMAIN_URL || "http://localhost:5173";

// ✅ ROUTE: Start checkout session
router.post("/create-checkout-session", async (req, res) => {
    const { userId } = req.body;

    if (!userId) return res.status(400).json({ error: "userId is verplicht" });

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: [
                {
                    price: "price_1R6fEPI19looCLiZqAE1HhCp", // stripe price-ID
                    quantity: 1,
                },
            ],
            metadata: {
                user_id: userId, // Nodig voor webhook
            },
            success_url: `${domainUrl}/dashboard_student?payment=success`, // success en cancel geven we terug zodat we gepaste boodschap kunnen geven erna
            cancel_url: `${domainUrl}/dashboard_student?payment=cancel`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error("❌ Stripe error:", err.message);
        res.status(500).json({ error: "Stripe sessie mislukt" });
    }
});

export default router;
