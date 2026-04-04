// controllers/payment.controller.js
import { processSubscriptionUpdate } from "../services/user.service.js";

export const handleCreemWebhook = async (req, res) => {
    try {
        const event = req.body;
        console.log("Ingreso al webhook:", event.type);

        if (event.type === "subscription.created" || event.type === "subscription.updated") {
            // Pasamos el email y el objeto 'data' completo al servicio
            await processSubscriptionUpdate(event.data.user_email, event.data);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error("Webhook Error:", error.message);
        res.status(400).json({ message: error.message });
    }
};