import axios, { type AxiosInstance } from 'axios'
import crypto from 'node:crypto'
import type {
  IPaymentGateway,
  PaymentInitInput, PaymentInitResult,
  PaymentVerifyResult, RefundResult,
} from '@/application/ports/services/payment-gateway.service.port.js'

interface NagadConfig {
  merchantId:    string
  merchantNumber: string
  /** PEM-formatted merchant private key for signing */
  privateKey:    string
  /** PEM-formatted Nagad public key for encrypting sensitive data */
  nagadPublicKey: string
  baseUrl:        string
  callbackHost:   string
}

interface NagadInitResponse {
  sensitiveData:      string
  signature:          string
  status:             string
  reason:             string
  callBackUrl:        string
  paymentReferenceId: string
}

interface NagadCompleteResponse {
  paymentRefId:       string
  orderId:            string
  amount:             string
  clientMobileNo:     string
  merchantMobileNo:   string
  orderDateTime:      string
  issuerPaymentDateTime: string
  issuerPaymentRefNo:    string
  additionalMerchantInfo: string
  status:             string
  statusCode:         string
  statusMessage:      string
}

/**
 * Nagad Merchant API
 * Docs: https://nagad.com.bd/developer
 *
 * Flow:
 *  1. Initialize order → get paymentReferenceId + redirect URL
 *  2. Nagad redirects to callbackUrl with paymentRefId param
 *  3. Complete order → verify settlement status
 */
export class NagadGatewayAdapter implements IPaymentGateway {
  readonly gatewayName = 'NAGAD' as const

  private readonly http: AxiosInstance

  constructor(private readonly config: NagadConfig) {
    this.http = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Content-Type':   'application/json',
        'X-KM-Api-Version': 'v-0.2.0',
        'X-KM-Client-Type': 'PC_WEB',
      },
      timeout: 15_000,
    })
  }

  // ── Crypto helpers ────────────────────────────────────────────────────────

  /**
   * Encrypts a JSON payload with Nagad's RSA public key (PKCS1 v1.5).
   * Nagad's docs require RSA/ECB/PKCS1Padding.
   */
  private rsaEncrypt(data: string): string {
    const buffer = Buffer.from(data, 'utf8')
    const encrypted = crypto.publicEncrypt(
      {
        key:     this.config.nagadPublicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer,
    )
    return encrypted.toString('base64')
  }

  /**
   * Signs a string with the merchant's RSA private key using SHA-1.
   * Nagad uses SHA1withRSA.
   */
  private rsaSign(data: string): string {
    const sign = crypto.createSign('SHA1')
    sign.update(data)
    sign.end()
    return sign.sign(this.config.privateKey, 'base64')
  }

  private datetime(): string {
    return new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14)
  }

  // ── IPaymentGateway ────────────────────────────────────────────────────────

  async initiatePayment(input: PaymentInitInput): Promise<PaymentInitResult> {
    const datetime = this.datetime()

    // Sensitive data encrypted with Nagad's public key
    const sensitivePayload = JSON.stringify({
      merchantId:    this.config.merchantId,
      datetime,
      orderId:       input.merchantRef,
      challenge:     crypto.randomBytes(16).toString('hex'),
    })
    const sensitiveData = this.rsaEncrypt(sensitivePayload)

    // Signature over raw JSON with merchant private key
    const signature = this.rsaSign(sensitivePayload)

    const initUrl = `/api/dfs/check-out/initialize/${this.config.merchantId}/${input.merchantRef}`

    const initRes = await this.http.post<NagadInitResponse>(initUrl, {
      dateTime:       datetime,
      sensitiveData,
      signature,
      merchantCallbackURL: input.callbackUrl,
    })

    if (initRes.data.status !== 'Success') {
      throw new Error(`Nagad init failed: ${initRes.data.reason}`)
    }

    const redirectUrl = `${this.config.baseUrl}/api/dfs/check-out/initialize/${this.config.merchantId}/${input.merchantRef}?paymentRefId=${initRes.data.paymentReferenceId}`

    return {
      gatewayRef:  initRes.data.paymentReferenceId,
      redirectUrl,
      raw:         initRes.data as unknown as Record<string, unknown>,
    }
  }

  async verifyCallback(params: Record<string, string>): Promise<PaymentVerifyResult> {
    const { payment_ref_id: paymentRefId, status } = params

    if (!paymentRefId) throw new Error('Nagad callback missing payment_ref_id')

    if (status === 'Cancel') {
      return {
        gatewayRef:           paymentRefId,
        gatewayTransactionId: '',
        status:               'CANCELLED',
        amount:               0,
        raw:                  params as Record<string, unknown>,
      }
    }

    const completeUrl = `/api/dfs/check-out/complete/${paymentRefId}`
    const datetime    = this.datetime()

    const sensitivePayload = JSON.stringify({
      merchantId: this.config.merchantId,
      datetime,
      orderId:    paymentRefId,
      challenge:  crypto.randomBytes(16).toString('hex'),
    })
    const sensitiveData = this.rsaEncrypt(sensitivePayload)
    const signature     = this.rsaSign(sensitivePayload)

    const res = await this.http.post<NagadCompleteResponse>(completeUrl, {
      dateTime:     datetime,
      sensitiveData,
      signature,
      merchantCallbackURL: `${this.config.callbackHost}/payments/nagad/callback`,
    })

    const raw = res.data as unknown as Record<string, unknown>

    if (res.data.status !== 'Success' || res.data.statusCode !== '000') {
      return {
        gatewayRef:           paymentRefId,
        gatewayTransactionId: res.data.issuerPaymentRefNo ?? '',
        status:               'FAILED',
        amount:               Number(res.data.amount ?? 0),
        raw,
      }
    }

    return {
      gatewayRef:           paymentRefId,
      gatewayTransactionId: res.data.issuerPaymentRefNo,
      status:               'SUCCESS',
      amount:               Number(res.data.amount),
      raw,
    }
  }

  async refund(_transactionId: string, _amount: number, _reason: string): Promise<RefundResult> {
    // Nagad does not support programmatic refunds via API at this time.
    // Refunds are processed manually through the Nagad merchant portal.
    return {
      refundTransactionId: '',
      status:              'FAILED',
      raw:                 { error: 'Nagad does not support programmatic refunds. Process via Nagad merchant portal.' },
    }
  }
}
