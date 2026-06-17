import { env } from "../config/env.js";

export interface CreatePaymentInput {
  orderId: number;
  amount: number;
  payerReference: string;
}

export async function createBkashPayment(input: CreatePaymentInput) {
  return {
    gateway: "bkash",
    status: "ready_for_credentials",
    amount: input.amount,
    orderId: input.orderId,
    callbackURL: env.BKASH_CALLBACK_URL,
    message: "Wire tokenized bKash create-payment API here with production credentials."
  };
}

export async function executeBkashPayment(paymentId: string) {
  return {
    gateway: "bkash",
    paymentId,
    status: "executed_pending_gateway_credentials"
  };
}
