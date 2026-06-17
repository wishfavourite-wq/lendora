import axios, { type AxiosInstance } from 'axios'
import type {
  IPaymentGateway,
  PaymentInitInput, PaymentInitResult,
  PaymentVerifyResult, RefundResult,
} from '@/application/ports/services/payment-gateway.service.port.js'

interface BkashConfig {
  appKey:    string
  appSecret: string
  username:  string
  password:  string
  baseUrl:   string
}

interface GrantTokenResponse {
  id_token:      string
  token_type:    string
  expires_in:    number
  refresh_token: string
  statusCode:    string
  statusMessage: string
}

interface CreatePaymentResponse {
  paymentID:             string
  bkashURL:              string
  callbackURL:           string
  successCallbackURL:    string
  failureCallbackURL:    string
  cancelledCallbackURL:  string
  amount:                string
  intent:                string
  currency:              string
  paymentCreateTime:     string
  transactionStatus:     string
  merchantInvoiceNumber: string
  statusCode:            string
  statusMessage:         string
}

interface ExecutePaymentResponse {
  paymentID:            string
  trxID:                string
  transactionStatus:    string
  amount:               string
  currency:             string
  intent:               string
  paymentExecuteTime:   string
  merchantInvoiceNumber: string
  statusCode:           string
  statusMessage:        string
}

interface RefundResponse {
  refundTrxID:        string
  transactionStatus:  string
  originalTrxID:      string
  customerMsisdn:     string
  amount:             string
  currency:           string
  completedTime:      string
  statusCode:         string
  statusMessage:      string
}

/**
 * bKash Tokenized Checkout API v1.2
 * Docs: https://developer.bka.sh/docs/tokenized-checkout-overview
 *
 * Flow:
 *  1. grantToken (cached ~55 min)
 *  2. createPayment → get bkashURL redirect
 *  3. After redirect back: executePayment → confirm settlement
 *  4. Refund via refundTransaction
 */
export class BkashGatewayAdapter implements IPaymentGateway {
  readonly gatewayName = 'BKASH' as const

  private readonly http: AxiosInstance
  private tokenCache: { token: string; expiresAt: number } | null = null

  constructor(private readonly config: BkashConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    })
  }

  // ── Token management ───────────────────────────────────────────────────────

  private async getToken(): Promise<string> {
    const now = Date.now()
    if (this.tokenCache && this.tokenCache.expiresAt > now + 30_000) {
      return this.tokenCache.token
    }

    const res = await this.http.post<GrantTokenResponse>(
      '/tokenized/checkout/token/grant',
      { app_key: this.config.appKey, app_secret: this.config.appSecret },
      {
        headers: {
          username: this.config.username,
          password: this.config.password,
        },
      },
    )

    if (res.data.statusCode !== '0000') {
      throw new Error(`bKash token grant failed: ${res.data.statusMessage}`)
    }

    this.tokenCache = {
      token:     res.data.id_token,
      expiresAt: now + res.data.expires_in * 1000,
    }

    return this.tokenCache.token
  }

  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getToken()
    return {
      Authorization:  token,
      'X-App-Key':    this.config.appKey,
    }
  }

  // ── IPaymentGateway ────────────────────────────────────────────────────────

  async initiatePayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    const headers = await this.authHeaders()

    const res = await this.http.post<CreatePaymentResponse>(
      '/tokenized/checkout/create',
      {
        mode:                  '0011', // Checkout URL
        payerReference:        input.payerPhone ?? 'LENDORA_RENTER',
        callbackURL:           input.callbackUrl,
        amount:                input.amount.toFixed(2),
        currency:              'BDT',
        intent:                'sale',
        merchantInvoiceNumber: input.merchantRef,
      },
      { headers },
    )

    if (res.data.statusCode !== '0000') {
      throw new Error(`bKash createPayment failed: ${res.data.statusMessage}`)
    }

    return {
      gatewayRef:  res.data.paymentID,
      redirectUrl: res.data.bkashURL,
      raw:         res.data as unknown as Record<string, unknown>,
    }
  }

  async verifyCallback(params: Record<string, string>): Promise<PaymentVerifyResult> {
    const { paymentID, status } = params

    if (!paymentID) throw new Error('bKash callback missing paymentID')

    // Cancelled or failed before execution — no need to call execute
    if (status === 'cancel' || status === 'failure') {
      return {
        gatewayRef:           paymentID,
        gatewayTransactionId: '',
        status:               status === 'cancel' ? 'CANCELLED' : 'FAILED',
        amount:               0,
        raw:                  params as Record<string, unknown>,
      }
    }

    // Execute the payment to settle it
    const headers = await this.authHeaders()
    const res = await this.http.post<ExecutePaymentResponse>(
      '/tokenized/checkout/execute',
      { paymentID },
      { headers },
    )

    const raw = res.data as unknown as Record<string, unknown>

    if (res.data.statusCode !== '0000' || res.data.transactionStatus !== 'Completed') {
      return {
        gatewayRef:           paymentID,
        gatewayTransactionId: res.data.trxID ?? '',
        status:               'FAILED',
        amount:               Number(res.data.amount ?? 0),
        raw,
      }
    }

    return {
      gatewayRef:           paymentID,
      gatewayTransactionId: res.data.trxID,
      status:               'SUCCESS',
      amount:               Number(res.data.amount),
      raw,
    }
  }

  async refund(transactionId: string, amount: number, reason: string): Promise<RefundResult> {
    const headers = await this.authHeaders()

    const res = await this.http.post<RefundResponse>(
      '/tokenized/checkout/payment/refund',
      {
        paymentID:   transactionId,
        amount:      amount.toFixed(2),
        trxID:       transactionId,
        sku:         reason.slice(0, 50),
        reason:      reason.slice(0, 255),
      },
      { headers },
    )

    const raw = res.data as unknown as Record<string, unknown>

    return {
      refundTransactionId: res.data.refundTrxID ?? '',
      status:              res.data.transactionStatus === 'Refund Completed' ? 'SUCCESS' : 'FAILED',
      raw,
    }
  }
}
