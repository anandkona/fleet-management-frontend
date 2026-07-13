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
  Stack,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalShipping as LocalShippingIcon,
  ArrowForward as ArrowForwardIcon,
  Lock as LockIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8FAFC',
        backgroundImage: 'radial-gradient(#E2E8F0 1.5px, transparent 1.5px)',
        backgroundSize: '24px 24px',
        fontFamily: "'Outfit', 'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
        p: 3
      }}
    >
      {/* Decorative Pastel Glowing Lights */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, rgba(99, 102, 241, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.06) 0%, rgba(168, 85, 247, 0) 70%)',
          filter: 'blur(60px)',
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />

      {/* Main Container */}
      <Card
        sx={{
          width: '100%',
          maxWidth: '460px',
          borderRadius: '24px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.03), 0 1px 3px rgba(15, 23, 42, 0.01)',
          p: { xs: 4, sm: 5 },
          zIndex: 1,
          position: 'relative'
        }}
      >
        {/* Logo Icon & Title */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)',
              mb: 2.5
            }}
          >
            <LocalShippingIcon sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-1px', mb: 1, textAlign: 'center' }}>
            FleetAI Portal
          </Typography>
          <Typography sx={{ color: '#64748B', fontSize: '0.9rem', textAlign: 'center', fontWeight: 550 }}>
            Intelligent logistics & operations center
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FEE2E2',
              borderRadius: '12px',
              fontWeight: 500,
              fontSize: '0.85rem',
              '& .MuiAlert-icon': { color: '#EF4444' }
            }}
          >
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Username Field */}
            <Box>
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Username or Email
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. admin"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      '& fieldset': { borderColor: '#4F46E5', borderWidth: 1.5 }
                    },
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
                  }
                }}
              />
            </Box>

            {/* Password Field */}
            <Box>
              <Typography sx={{ color: '#475569', fontSize: '0.8rem', fontWeight: 700, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Password
              </Typography>
              <TextField
                fullWidth
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    borderRadius: '12px',
                    '& fieldset': { borderColor: '#E2E8F0' },
                    '&:hover fieldset': { borderColor: '#CBD5E1' },
                    '&.Mui-focused': {
                      backgroundColor: '#FFFFFF',
                      '& fieldset': { borderColor: '#4F46E5', borderWidth: 1.5 }
                    },
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.02)'
                  }
                }}
              />
            </Box>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              endIcon={!submitting && <ArrowForwardIcon />}
              sx={{
                py: 1.8,
                fontSize: '0.95rem',
                fontWeight: 700,
                textTransform: 'none',
                background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.2)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4338CA 0%, #2563EB 100%)',
                  boxShadow: '0 10px 28px rgba(79, 70, 229, 0.35)'
                },
                '&:disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' }
              }}
            >
              {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
            </Button>
          </Stack>
        </Box>


      </Card>


    </Box>
  );
}
