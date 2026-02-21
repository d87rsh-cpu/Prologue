import { Outlet } from 'react-router-dom';
import DashboardTopBar from './DashboardTopBar';
import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <DashboardTopBar />
      <div className="flex flex-1 pt-[60px]">
        <DashboardSidebar />
        <main className="flex-1 ml-[240px] overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
