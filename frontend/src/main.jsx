import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import {GoogleOAuthProvider} from '@react-oauth/google';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById('root')).render(
 
    <BrowserRouter >
     <GoogleOAuthProvider clientId={clientId}>
        <App />
    </GoogleOAuthProvider>
    </BrowserRouter>
   
  
)
