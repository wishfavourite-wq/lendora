export const API_VERSION = 'v1' as const

export const API_ROUTES = {
  // Auth
  AUTH:               `/api/${API_VERSION}/auth`,
  AUTH_REGISTER:      `/api/${API_VERSION}/auth/register`,
  AUTH_LOGIN:         `/api/${API_VERSION}/auth/login`,
  AUTH_LOGOUT:        `/api/${API_VERSION}/auth/logout`,
  AUTH_REFRESH:       `/api/${API_VERSION}/auth/refresh`,
  AUTH_ME:            `/api/${API_VERSION}/auth/me`,
  AUTH_VERIFY_EMAIL:  `/api/${API_VERSION}/auth/verify-email`,
  AUTH_FORGOT_PW:     `/api/${API_VERSION}/auth/forgot-password`,
  AUTH_RESET_PW:      `/api/${API_VERSION}/auth/reset-password`,
  // Products
  PRODUCTS:           `/api/${API_VERSION}/products`,
  PRODUCT_BY_ID:      `/api/${API_VERSION}/products/:id`,
  PRODUCT_SEARCH:     `/api/${API_VERSION}/products/search`,
  PRODUCT_AVAILABILITY: `/api/${API_VERSION}/products/:id/availability`,
  // Categories
  CATEGORIES:         `/api/${API_VERSION}/categories`,
  // Rentals
  RENTALS:            `/api/${API_VERSION}/rentals`,
  RENTAL_BY_ID:       `/api/${API_VERSION}/rentals/:id`,
  RENTAL_CANCEL:      `/api/${API_VERSION}/rentals/:id/cancel`,
  RENTAL_CONFIRM:     `/api/${API_VERSION}/rentals/:id/confirm`,
  RENTAL_RETURN:      `/api/${API_VERSION}/rentals/:id/return`,
  RENTAL_REVIEW:      `/api/${API_VERSION}/rentals/:id/review`,
  RENTAL_MESSAGES:    `/api/${API_VERSION}/rentals/:id/messages`,
  // Disputes
  DISPUTES:           `/api/${API_VERSION}/disputes`,
  DISPUTE_BY_ID:      `/api/${API_VERSION}/disputes/:id`,
  DISPUTE_EVIDENCE:   `/api/${API_VERSION}/disputes/:id/evidence`,
  // Vendors
  VENDORS:            `/api/${API_VERSION}/vendors`,
  VENDOR_PROFILE:     `/api/${API_VERSION}/vendors/profile`,
  VENDOR_VERIFY:      `/api/${API_VERSION}/vendors/verification`,
  VENDOR_PRODUCTS:    `/api/${API_VERSION}/vendors/products`,
  VENDOR_RENTALS:     `/api/${API_VERSION}/vendors/rentals`,
  VENDOR_ANALYTICS:   `/api/${API_VERSION}/vendors/analytics`,
  VENDOR_PAYOUT:      `/api/${API_VERSION}/vendors/payout`,
  // Users
  USERS_ME:           `/api/${API_VERSION}/users/me`,
  USERS_WISHLIST:     `/api/${API_VERSION}/users/wishlist`,
  USERS_RENTALS:      `/api/${API_VERSION}/users/rentals`,
  USERS_REVIEWS:      `/api/${API_VERSION}/users/reviews`,
  // Admin
  ADMIN_USERS:        `/api/${API_VERSION}/admin/users`,
  ADMIN_VENDORS:      `/api/${API_VERSION}/admin/vendors`,
  ADMIN_RENTALS:      `/api/${API_VERSION}/admin/rentals`,
  ADMIN_DISPUTES:     `/api/${API_VERSION}/admin/disputes`,
  ADMIN_ANALYTICS:    `/api/${API_VERSION}/admin/analytics`,
  // Payments
  PAYMENT_INIT:       `/api/${API_VERSION}/payments/init`,
  PAYMENT_CALLBACK:   `/api/${API_VERSION}/payments/callback/:gateway`,
  // Uploads
  UPLOAD_PRODUCT:     `/api/${API_VERSION}/uploads/product`,
  UPLOAD_DOCUMENT:    `/api/${API_VERSION}/uploads/document`,
} as const

export const HTTP_STATUS = {
  OK:                  200,
  CREATED:             201,
  NO_CONTENT:          204,
  BAD_REQUEST:         400,
  UNAUTHORIZED:        401,
  FORBIDDEN:           403,
  NOT_FOUND:           404,
  CONFLICT:            409,
  UNPROCESSABLE:       422,
  TOO_MANY_REQUESTS:   429,
  INTERNAL_ERROR:      500,
  SERVICE_UNAVAILABLE: 503,
} as const
