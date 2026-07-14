import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

function Layout() {
  return (
    <div className="min-h-screen bg-[#0B1120]">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main id="main-content" tabIndex={-1} className="flex-1 ml-64 mt-16 bg-[#0B1120] focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
