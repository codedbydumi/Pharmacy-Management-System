import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DrugInventory from './pages/DrugInventory';
import Orders from './pages/Orders'; 
import Signup from './pages/Signup';
import Suppliers from './pages/Suppliers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Add other routes as needed */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/drug-inventory" element={<DrugInventory />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/suppliers" element={<Suppliers />} />
      </Routes>
    </Router>
  );
}

export default App;