import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', backgroundColor: '#0a0a0c' }}>
      {/* Left side - Branding/Graphic */}
      <Box sx={{ flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column', backgroundColor: '#16161a', borderRight: '1px solid #2a2a30', p: 6, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessCenterIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>FleetAI</Typography>
              <Typography sx={{ color: '#888', fontSize: '0.75rem', fontWeight: 600 }}>ENTERPRISE</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 'auto', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', mb: 2, lineHeight: 1.1 }}>Intelligent<br/>Fleet Operations.</Typography>
            <Typography sx={{ color: '#aaa', fontSize: '1.1rem', maxWidth: 400 }}>Streamline your logistics, monitor real-time tracking, and optimize routes with AI-driven insights.</Typography>
          </Box>
        </Box>
        
        {/* Decorative elements */}
        <Box sx={{ position: 'absolute', bottom: -100, right: -50, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(25,118,210,0.15) 0%, rgba(25,118,210,0) 70%)' }} />
        <Box sx={{ position: 'absolute', top: 100, left: 100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,175,80,0.08) 0%, rgba(76,175,80,0) 70%)' }} />
      </Box>

      {/* Right side - Login Form */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4, position: 'relative' }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.5, mb: 6 }}>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, backgroundColor: '#1976d2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessCenterIcon sx={{ color: '#fff', fontSize: 24 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff' }}>FleetAI</Typography>
          </Box>
          
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>Welcome back</Typography>
          <Typography sx={{ color: '#888', mb: 4, fontSize: '0.95rem' }}>Please enter your details to sign in.</Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, backgroundColor: 'rgba(244,67,54,0.1)', color: '#f44336', border: '1px solid rgba(244,67,54,0.2)', '& .MuiAlert-icon': { color: '#f44336' } }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>Email or Phone</Typography>
            <TextField
              fullWidth
              placeholder="Enter your email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#16161a',
                  color: '#fff',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#2a2a30' },
                  '&:hover fieldset': { borderColor: '#444' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1 },
                },
              }}
            />

            <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, mb: 1 }}>Password</Typography>
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#16161a',
                  color: '#fff',
                  borderRadius: 2,
                  '& fieldset': { borderColor: '#2a2a30' },
                  '&:hover fieldset': { borderColor: '#444' },
                  '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 1 },
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#888', '&:hover': { color: '#fff' } }}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                py: 1.5,
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                backgroundColor: '#1976d2',
                borderRadius: 2,
                boxShadow: '0 4px 14px rgba(25,118,210,0.4)',
                '&:hover': { backgroundColor: '#1565c0', boxShadow: '0 6px 20px rgba(25,118,210,0.6)' },
                '&:disabled': { backgroundColor: '#333', color: '#777' },
              }}
            >
              {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>

            {/* Quick Login Buttons for Demo/Testing */}
            <Box sx={{ mt: 4 }}>
              <Typography sx={{ color: '#555', fontSize: '0.75rem', textAlign: 'center', mb: 1.5, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Test Credentials
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => { setIdentifier('admin@fleet.local'); setPassword('admin123'); }}
                  sx={{ 
                    color: '#888', borderColor: '#2a2a30', fontSize: '0.75rem', textTransform: 'none',
                    '&:hover': { borderColor: '#1976d2', color: '#1976d2', backgroundColor: 'transparent' }
                  }}
                >
                  Admin
                </Button>
                <Button 
                  variant="outlined" 
                  fullWidth 
                  onClick={() => { setIdentifier('driver@fleet.local'); setPassword('driver123'); }}
                  sx={{ 
                    color: '#888', borderColor: '#2a2a30', fontSize: '0.75rem', textTransform: 'none',
                    '&:hover': { borderColor: '#1976d2', color: '#1976d2', backgroundColor: 'transparent' }
                  }}
                >
                  Driver
                </Button>
              </Box>
            </Box>

          </Box>
        </Box>
      </Box>
    </Box>
  );
}
