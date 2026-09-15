import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import NenDong from './components/NenDong'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import AiChatModal from './components/AiChatModal'
import { ViTriRapProvider } from './context/ViTriRapContext'
import { useHinhThucThanhToan } from './hooks/useCatalogQueries'
import HomePage from './pages/HomePage'
import ScrollToTop from './components/ScrollToTop'

const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'))
const SeatBookingPage = lazy(() => import('./pages/SeatBookingPage'))
const ComboFoodPage = lazy(() => import('./pages/ComboFoodPage'))
const PaymentPage = lazy(() => import('./pages/PaymentPage'))
const PaymentResultPage = lazy(() => import('./pages/PaymentResultPage'))
const MyTicketsPage = lazy(() => import('./pages/MyTicketsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const AdminOverviewPage = lazy(() => import('./pages/admin/AdminOverviewPage'))
const ManageCombosPage = lazy(() => import('./pages/admin/ManageCombosPage'))
const ManageVouchersPage = lazy(() => import('./pages/admin/ManageVouchersPage'))
const ManageStaffsPage = lazy(() => import('./pages/admin/ManageStaffsPage'))
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage'))
const ManagePersonsPage = lazy(() => import('./pages/admin/ManagePersonsPage'))
const ManageMoviesPage = lazy(() => import('./pages/admin/ManageMoviesPage'))
const ManageShowtimesPage = lazy(() => import('./pages/admin/ManageShowtimesPage'))
const ShowtimeSchedulePage = lazy(() => import('./pages/ShowtimeSchedulePage'))
const ManageCinemasPage = lazy(() => import('./pages/admin/ManageCinemasPage'))
const ManageRoomsPage = lazy(() => import('./pages/admin/ManageRoomsPage'))
const ManageSeatMapPage = lazy(() => import('./pages/admin/ManageSeatMapPage'))
const ManageRegionsPage = lazy(() => import('./pages/admin/ManageRegionsPage'))
const ManageTicketsPage = lazy(() => import('./pages/admin/ManageTicketsPage'))
const ManagePaymentConfigPage = lazy(() => import('./pages/admin/ManagePaymentConfigPage'))
const ScanQrPage = lazy(() => import('./pages/staff/ScanQrPage'))
const BookingSuccessPage = lazy(() => import('./pages/BookingSuccessPage'))

function PrefetchCatalog() {
  useHinhThucThanhToan()
  return null
}

function PublicLayout() {
  return (
    <ViTriRapProvider>
      <PrefetchCatalog />
      <NenDong />
      <Navbar />
      <main className="relative min-h-[75vh]">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/movies/:id" element={<MovieDetailPage />} />
          <Route path="/movies/:id/schedule" element={<ShowtimeSchedulePage />} />
          <Route path="/booking/:id" element={<SeatBookingPage />} />
          <Route path="/booking/:id/combo" element={<ComboFoodPage />} />
          <Route path="/booking/:id/payment" element={<PaymentPage />} />
          <Route path="/booking/success/:id" element={<BookingSuccessPage />} />
          <Route path="/payment/result" element={<PaymentResultPage />} />
          <Route path="/my-tickets" element={<MyTicketsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      <Footer />
      <AuthModal />
      <AiChatModal />
    </ViTriRapProvider>
  )
}
export default function App() {
  return (
    <Suspense fallback={<p role="status" className="min-h-screen bg-cinema-950 p-8 text-center text-white">Đang tải trang…</p>}>
      <ScrollToTop />
      <Routes>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminOverviewPage />} />
        <Route path="movies" element={<ManageMoviesPage />} />
        <Route path="persons" element={<ManagePersonsPage />} />
        <Route path="regions" element={<ManageRegionsPage />} />
        <Route path="cinemas" element={<ManageCinemasPage />} />
        <Route path="rooms" element={<ManageRoomsPage />} />
        <Route path="rooms/:maRap/:maPhong/seats" element={<ManageSeatMapPage />} />
        <Route path="showtimes" element={<ManageShowtimesPage />} />
        <Route path="tickets" element={<ManageTicketsPage />} />
        <Route path="payments" element={<ManagePaymentConfigPage />} />
        <Route path="scan-qr" element={<ScanQrPage />} />
        <Route path="combos" element={<ManageCombosPage />} />
        <Route path="vouchers" element={<ManageVouchersPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="staffs" element={<ManageStaffsPage />} />
      </Route>
      <Route path="/staff/scan-qr" element={<ScanQrPage />} />
      <Route path="/*" element={<PublicLayout />} />
      </Routes>
    </Suspense>
  )
}
