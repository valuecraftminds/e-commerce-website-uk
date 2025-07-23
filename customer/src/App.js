import { Route, Routes } from 'react-router-dom';

import NavBar from './components/NavBar';
import Shop from './pages/Shop';

function App() {
   return (
    <>
      <NavBar />
      <Routes>
        <Route path="shop/:category" element={<Shop />} />
      </Routes>
    </>
  );
}

export default App;
