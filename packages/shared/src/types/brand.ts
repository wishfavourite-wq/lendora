/**
 * Branded types prevent ID mix-ups at compile time.
 * A UserId cannot be passed where a RentalId is expected.
 */
declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

export type UserId     = Brand<string, 'UserId'>
export type VendorId   = Brand<string, 'VendorId'>
export type ProductId  = Brand<string, 'ProductId'>
export type RentalId   = Brand<string, 'RentalId'>
export type ReviewId   = Brand<string, 'ReviewId'>
export type PaymentId  = Brand<string, 'PaymentId'>
export type DisputeId  = Brand<string, 'DisputeId'>
export type CategoryId = Brand<string, 'CategoryId'>
export type MessageId  = Brand<string, 'MessageId'>
export type MediaId    = Brand<string, 'MediaId'>

/** Cast a raw string to a branded ID — use only at system boundaries (DB reads, request parsing) */
export const asId = <T extends string>(raw: string): T => raw as T
