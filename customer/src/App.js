import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Shop from './pages/Shop';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import ProductCategory from './pages/ProductCategory';

function App() {
   return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="shop/:category" element={<Shop />} />
        <Route path="product/:id" element={<ProductPage />} />
        <Route path="shop/:category/:productType" element={<ProductCategory />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
