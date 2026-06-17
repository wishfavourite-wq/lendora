import type { PrismaClient } from '@prisma/client'

type NotifType =
  | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'RENTAL_STARTED'
  | 'RETURN_REQUESTED'  | 'RETURN_CONFIRMED'   | 'DEPOSIT_REFUNDED'
  | 'DEPOSIT_DEDUCTED'  | 'NEW_REVIEW'         | 'PAYMENT_RECEIVED'
  | 'PAYOUT_PROCESSED'  | 'VENDOR_APPROVED'    | 'VENDOR_SUSPENDED'
  | 'DISPUTE_OPENED'    | 'DISPUTE_RESOLVED'   | 'MESSAGE_RECEIVED'
  | 'ITEM_SHIPPED'      | 'ITEM_DELIVERED'     | 'LATE_FEE_WARNING'

export async function notify(
  prisma: PrismaClient,
  userId: string,
  type:   NotifType,
  title:  string,
  body:   string,
  data?:  Record<string, unknown>,
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, body, data: data ?? undefined },
    })
  } catch {
    // never let a notification failure break the main flow
  }
}
