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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0c',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '420px',
          p: '40px',
          backgroundColor: '#16161a',
          borderRadius: '16px',
          border: '1px solid #2a2a30',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '12px', mb: '32px', justifyContent: 'center' }}>
          <Box
            sx={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BusinessCenterIcon sx={{ color: '#fff', fontSize: '26px' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
              FleetAI
            </Typography>
            <Typography variant="body2" sx={{ color: '#75757a', fontSize: '0.75rem', fontWeight: 500 }}>
              Fleet Intelligence Platform
            </Typography>
          </Box>
        </Box>

        <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600, mb: '4px', textAlign: 'center' }}>
          Sign in to your account
        </Typography>
        <Typography variant="body2" sx={{ color: '#75757a', mb: '28px', textAlign: 'center' }}>
          Enter your credentials to continue
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: '20px', backgroundColor: '#2a1515', color: '#f44336', border: '1px solid #4a1515' }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email or Phone"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            sx={{
              mb: '20px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1e1e22',
                color: '#fff',
                '& fieldset': { borderColor: '#2a2a30' },
                '&:hover fieldset': { borderColor: '#444' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
              '& .MuiInputLabel-root': { color: '#888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
            }}
          />

          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: '28px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#1e1e22',
                color: '#fff',
                '& fieldset': { borderColor: '#2a2a30' },
                '&:hover fieldset': { borderColor: '#444' },
                '&.Mui-focused fieldset': { borderColor: '#1976d2' },
              },
              '& .MuiInputLabel-root': { color: '#888' },
              '& .MuiInputLabel-root.Mui-focused': { color: '#1976d2' },
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#888' }}>
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
              py: '12px',
              fontSize: '0.95rem',
              fontWeight: 600,
              textTransform: 'none',
              backgroundColor: '#1976d2',
              '&:hover': { backgroundColor: '#1565c0' },
              '&:disabled': { backgroundColor: '#333', color: '#777' },
            }}
          >
            {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
