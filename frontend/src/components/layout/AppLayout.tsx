import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import AIPanel from '../ai/AIPanel'
import { useUIStore } from '../../store'

export default function AppLayout() {
  const { aiPanelOpen } = useUIStore()

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="page-content">
        <Topbar />
        <main className="page-main">
          <Outlet />
        </main>
      </div>
      <AIPanel open={aiPanelOpen} />
    </div>
  )
}
