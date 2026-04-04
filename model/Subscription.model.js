import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserDundderMifflin',
        required: true
    },
    creemSubscriptionId: String, // ID que genera Creem para la suscripción
    status: {
        type: String,
        enum: ['active', 'past_due', 'canceled', 'unpaid'],
        required: true
    },
    amount: Number,
    currency: { type: String, default: 'ARS' },
    periodStart: Date,
    periodEnd: Date,
    rawWebhookData: Object // Guardar el JSON completo de Creem por si necesitas revisarlo luego
}, { timestamps: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;