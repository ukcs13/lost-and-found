import { Suspense } from 'react'
import ClientCreateItemPage from './ClientCreateItemPage'
 
export default function CreateItemPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ClientCreateItemPage />
    </Suspense>
  )
}
 
