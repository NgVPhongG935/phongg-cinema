import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import NenDong from './components/NenDong'
import Footer from './components/Footer'
import AuthModal from './components/AuthModal'
import AiChatModal from './components/AiChatModal'
import { ViTriRapProvider } from './context/ViTriRapContext'
import { useHinhThucThanhToan } from './hooks/useCatalogQueries'
import HomePage from './pages/HomePage'
import MovieDetailPage from './pages/MovieDetailPage'
import SeatBookingPage from './pages/SeatBookingPage'
import ComboFoodPage from './pages/ComboFoodPage'
import PaymentPage from './pages/PaymentPage'
import PaymentResultPage from './pages/PaymentResultPage'
import MyTicketsPage from './pages/MyTicketsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import AdminLayout from './pages/admin/AdminLayout'
import AdminOverviewPage from './pages/admin/AdminOverviewPage'
import ManageCombosPage from './pages/admin/ManageCombosPage'
import ManageVouchersPage from './pages/admin/ManageVouchersPage'
import ManageStaffsPage from './pages/admin/ManageStaffsPage'
import ManageUsersPage from './pages/admin/ManageUsersPage'
import ManagePersonsPage from './pages/admin/ManagePersonsPage'
import ManageMoviesPage from './pages/admin/ManageMoviesPage'
import ManageShowtimesPage from './pages/admin/ManageShowtimesPage'
import ShowtimeSchedulePage from './pages/ShowtimeSchedulePage'
import ManageCinemasPage from './pages/admin/ManageCinemasPage'
import ManageRoomsPage from './pages/admin/ManageRoomsPage'
import ManageSeatMapPage from './pages/admin/ManageSeatMapPage'
import ManageRegionsPage from './pages/admin/ManageRegionsPage'
import ManageTicketsPage from './pages/admin/ManageTicketsPage'
import ManagePaymentConfigPage from './pages/admin/ManagePaymentConfigPage'
import ScanQrPage from './pages/staff/ScanQrPage'
import BookingSuccessPage from './pages/BookingSuccessPage'
import ScrollToTop from './components/ScrollToTop'

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
    <>
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
    </>
  )
}
