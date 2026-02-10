import ClientSearchPage from './ClientSearchPage'
import { Suspense } from 'react'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading Search...</div>}>
      <ClientSearchPage />
    </Suspense>
  )
}
