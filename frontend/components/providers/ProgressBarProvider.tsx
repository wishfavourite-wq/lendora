'use client'
import { AppProgressBar } from 'next-nprogress-bar'

export function ProgressBarProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AppProgressBar
        height="4px"
        color="#C87941"
        options={{ showSpinner: true, spinnerSelector: '#nprogress-spinner' }}
        shallowRouting
      />
    </>
  )
}
