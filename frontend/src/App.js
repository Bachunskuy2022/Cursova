import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import LoginForm from './components/LoginForm';
import ManagerDashboard from './components/ManagerDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />

          <Route path="/login" element={
            <div className="auth-wrapper" style={{ backgroundColor: '#5762D5', height: '100vh' }}>
              <div className="auth-card">
                <h2>Вхід</h2>
                <LoginForm />
                <p>Не маєте ще акаунту? <Link to="/register">Реєстрація</Link></p>
              </div>
            </div>
          } />

          <Route path="/register" element={
            <div className="auth-wrapper" style={{ backgroundColor: '#5762D5', height: '100vh' }}>
              <div className="auth-card">
                <h2>Реєстрація</h2>
                <RegisterForm />
                <p>Маєте вже акаунт? <Link to="/login">Вхід</Link></p>
              </div>
            </div>
          } />
          <Route path="/dashboard/manager" element={<ManagerDashboard />} />
        </Routes>
      </>
    </Router>
  );
}

export default App;
