import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { Home } from './pages/Home.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { DashboardLayout } from './components/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import { Products } from './pages/dashboard/Products.jsx';
import { CreateProduct } from './pages/dashboard/CreateProduct.jsx';
import { EditProduct } from './pages/dashboard/EditProduct.jsx';
import { Profile } from './pages/dashboard/Profile.jsx';
import { NotFound } from './pages/NotFound.jsx';
import { PrivateRoute } from './components/PrivateRoute.jsx';
import Settings from './components/Settings.jsx';
import CartPage from './pages/dashboard/CartPage.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import OrdersPage from './pages/dashboard/OrderPage.jsx';
import CheckoutPage from './pages/CheckOut.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import SellerOrderPage from './pages/dashboard/SellerOrderPage.jsx';
import LowStockPage from './pages/dashboard/LowStockPage.jsx';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />}/>

                <Route
                  path="/dashboard"
                  element={
                    <PrivateRoute>
                      <DashboardLayout />
                    </PrivateRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Products />} />
                  <Route path="products/create" element={<CreateProduct />} />
                  <Route path="products/seller" element={<Products />} />
                  <Route path="products/buyer" element={<Products />} />
                  <Route path="products/seller/:productId" element={<EditProduct />} />

                  <Route path="cart" element={<CartPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="checkout" element={<CheckoutPage />} />
                  <Route path='orders/seller' element={<SellerOrderPage />}/>
                  <Route path='products/seller/low-stock' element={<LowStockPage />}/>
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
