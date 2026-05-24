import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Storefront } from './pages/Storefront';
import { FulfillmentDashboard } from './pages/FulfillmentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthProvider } from './hooks/useAuth';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationListener } from './components/NotificationListener';

export default function App() {
  return (
    <AuthProvider>
      <NotificationListener />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Storefront />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/portal/fulfillment" element={<FulfillmentDashboard />} />
          <Route path="/admin/analytics" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
