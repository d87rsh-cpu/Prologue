import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { MessagesBadgeProvider } from '../../contexts/MessagesBadgeContext';
import DashboardTopBar from './DashboardTopBar';
import DashboardSidebar from './DashboardSidebar';
import PageTransition from '../PageTransition';

export default function DashboardLayout() {
  const location = useLocation();
  return (
    <MessagesBadgeProvider>
    <div className="min-h-screen flex flex-col bg-primary">
      <DashboardTopBar />
      <div className="flex flex-1 pt-[60px]">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto ml-[72px] xl:ml-[240px]">
          <AnimatePresence mode="wait">
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </MessagesBadgeProvider>
  );
}
