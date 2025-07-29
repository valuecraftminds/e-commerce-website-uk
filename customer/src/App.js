import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import ProductCategory from './pages/ProductCategory';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import {CartProvider} from './context/CartContext';
import Cart from './components/Cart';
import { AuthProvider } from './context/AuthContext';

function App() {
   return (
    <>
      <AuthProvider>
        <CartProvider>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="shop/:category" element={<Shop />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="shop/:category/:productType" element={<ProductCategory />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="cart" element={<Cart />} />

      </Routes>
      <Footer />
      </CartProvider>
      </AuthProvider>
    </>
  );
}

export default App;
