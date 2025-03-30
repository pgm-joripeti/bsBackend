export const handleStripeWebhook = async (req, res) => {
    console.log("💥 Webhook route AANGEROEPEN!");

    const sig = req.headers["stripe-signature"];
    if (!sig) {
        console.error("❌ Geen Stripe Signature header!");
        return res.status(400).send("No stripe-signature header");
    }

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log("✅ Webhook event ontvangen:", event.type);
    } catch (err) {
        console.error("❌ constructEvent() faalt:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.user_id;
        console.log("🎯 Betaling ontvangen voor user:", userId);

        if (!userId) {
            console.error("❌ Geen user_id in metadata!");
            return res.status(400).send("Missing user_id in metadata");
        }

        const { data, error } = await supabaseService.rpc("add_qbits", {
            user_id_input: userId,
            amount: 150
        });

        if (error) {
            console.error("❌ Supabase RPC fout:", error.message);
            return res.status(500).send("Supabase RPC failed");
        }

        console.log(`✅ 150 Qbits toegevoegd voor ${userId}`);
    }

    res.status(200).json({ received: true });
};
