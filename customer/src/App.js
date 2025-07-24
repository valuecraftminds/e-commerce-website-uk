import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import Footer from './components/Footer';
import Shop from './pages/Shop';

function App() {
   return (
    <>
      <NavBar />
      <Routes>
        <Route path="shop/:category" element={<Shop />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
