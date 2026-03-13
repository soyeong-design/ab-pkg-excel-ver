import { type ReactNode } from 'react'
import { Sidebar } from './Sidebar'

export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {children}
      </div>
    </div>
  )
}
