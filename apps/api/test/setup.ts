import { vi } from 'vitest'

// Prevent the container singleton from persisting across test files.
// Each test that needs the container should call getContainer() after
// resetting the module — or inject mocks directly into use cases.
vi.mock('../src/infrastructure/database/prisma.client.js', () => ({
  prisma: {},
}))

// Suppress console noise from expected domain errors in tests
const originalConsoleError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = String(args[0] ?? '')
    if (msg.includes('DomainError') || msg.includes('UnauthorizedError')) return
    originalConsoleError(...args)
  }
})

afterAll(() => {
  console.error = originalConsoleError
})
