import type { PrismaClient } from '@prisma/client'

export const COURIER_FWD_KEY = 'courier_forward_fee'
export const COURIER_RET_KEY = 'courier_return_fee'
export const COURIER_DEFAULT_FWD = 60
export const COURIER_DEFAULT_RET = 40

export async function getCourierFees(prisma: PrismaClient) {
  const [fwd, ret] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: COURIER_FWD_KEY } }),
    prisma.systemSetting.findUnique({ where: { key: COURIER_RET_KEY } }),
  ])
  return {
    forwardFee: fwd ? Number(fwd.value) : COURIER_DEFAULT_FWD,
    returnFee:  ret ? Number(ret.value) : COURIER_DEFAULT_RET,
  }
}
