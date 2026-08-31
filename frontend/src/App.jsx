import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import ImportStudents from './pages/ImportStudents';
import MapIdentity from './pages/MapIdentity';
import SearchStudent from './pages/SearchStudent';
import Students from './pages/Students';
import Login from './pages/Login';

export default function App() {
  return <AuthProvider><Routes>
    <Route path="login" element={<Login />} />
    <Route element={<ProtectedRoute />}><Route element={<Layout />}><Route index element={<Dashboard />} /><Route path="students" element={<Students />} /><Route path="import" element={<ImportStudents />} /><Route path="barcode" element={<MapIdentity type="barcode" />} /><Route path="rfid" element={<MapIdentity type="rfid" />} /><Route path="search" element={<SearchStudent />} /></Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
