export interface PaymentInitInput {
  /** Internal reference stored against the payment record */
  merchantRef:  string
  amount:       number
  currency:     'BDT'
  /** Deep-link back to our server after payer completes/cancels on gateway */
  callbackUrl:  string
  /** URL to redirect the browser on cancel */
  cancelUrl:    string
  /** Human-readable invoice description */
  description:  string
  payerPhone?:  string
}

export interface PaymentInitResult {
  /** Gateway-assigned payment identifier (stored as externalReference) */
  gatewayRef:  string
  /** Redirect the renter's browser here to complete payment */
  redirectUrl: string
  /** Raw response payload for audit logging */
  raw: Record<string, unknown>
}

export interface PaymentVerifyResult {
  gatewayRef:          string
  gatewayTransactionId: string
  status:              'SUCCESS' | 'FAILED' | 'CANCELLED'
  amount:              number
  raw:                 Record<string, unknown>
}

export interface RefundResult {
  refundTransactionId: string
  status:              'SUCCESS' | 'FAILED'
  raw:                 Record<string, unknown>
}

export interface IPaymentGateway {
  readonly gatewayName: 'BKASH' | 'NAGAD' | 'ROCKET'

  /**
   * Step 1 — Create a payment intent and return the redirect URL.
   * Called when a renter clicks "Pay now".
   */
  initiatePayment(input: PaymentInitInput): Promise<PaymentInitResult>

  /**
   * Step 2 — Called by our callback endpoint after the gateway redirects back.
   * Verifies authenticity, queries status, and returns the definitive outcome.
   */
  verifyCallback(params: Record<string, string>): Promise<PaymentVerifyResult>

  /**
   * Issue a full or partial refund for a previously completed transaction.
   */
  refund(transactionId: string, amount: number, reason: string): Promise<RefundResult>
}
