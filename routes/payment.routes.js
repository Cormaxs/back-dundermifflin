// routes/payment.routes.js
import { Router } from "express";
import { handleCreemWebhook } from "../controllers/payment.controller.js";

export const payments = Router();

// Creem enviará un POST a esta ruta cuando pase algo (pago exitoso, etc.)
payments.post("/webhook/creem", handleCreemWebhook);