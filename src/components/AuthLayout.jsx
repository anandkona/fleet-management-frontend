import React, { useState } from 'react';
import { Truck, ShieldCheck, Lock, User, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';

export default function AuthLayout({ onLogin, error, setError }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credential fields');
      return;
    }

    setLoading(true);
    try {
      await onLogin(username, password);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100vw',
      backgroundColor: '#f8fafc',
      fontFamily: '"Nunito", "Helvetica Neue", Arial, sans-serif',
      color: '#020617',
      transition: 'background-color 0.2s ease'
    }}>

      {/* Left side: Visual Branding */}
      <div
        style={{
          flex: 1,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px',
          position: 'relative',
          overflow: 'hidden',
          borderRight: '1px solid #1e293b'
        }}
      >
        {/* Animated Background */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.15 }}>
          <svg width="100%" height="100%">
            <line x1="-100" y1="100" x2="800" y2="300" stroke="#00C2A8" strokeWidth="3" strokeDasharray="5,5" />
            <line x1="100" y1="-100" x2="600" y2="500" stroke="#F5A623" strokeWidth="2" strokeDasharray="3,3" />
            <circle cx="200" cy="180" r="40" fill="none" stroke="#00C2A8" strokeWidth="1" />
            <circle cx="500" cy="300" r="80" fill="none" stroke="#F5A623" strokeWidth="1" />
          </svg>
        </div>

        {/* Top brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 10 }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: 'rgba(0, 194, 168, 0.25)',
            border: '1px solid #00C2A8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00C2A8'
          }}>
            <Truck size={24} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, color: 'white', fontFamily: '"Space Grotesk", sans-serif' }}>
            HIPPO FLEET
          </span>
        </div>

        {/* Center message */}
        <div style={{ maxWidth: '480px', zIndex: 10, marginTop: '80px', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '42px', fontWeight: 800, color: 'white', lineHeight: 1.1, fontFamily: '"Space Grotesk", sans-serif', letterSpacing: '-0.02em' }}>
            Enterprise Dispatch & Fleet Logistics Control
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', lineHeight: 1.5, marginTop: '16px' }}>
            Real-time GPS telemetry tracks, automated maintenance schedules, and robust master data security control panels.
          </p>

          {/* Quick info widget */}
          <div style={{
            marginTop: '40px',
            padding: '20px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            gap: '16px'
          }}>
            <div>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#F5A623' }}>100%</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '2px' }}>Operational Security</span>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: '#00C2A8' }}>Live</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', display: 'block', marginTop: '2px' }}>Telemetry Simulator</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div style={{ zIndex: 10, display: 'flex', justifyContent: 'space-between', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
          <span>© 2026 Hippo Logistics Inc.</span>
          <span>Security Certified Panel</span>
        </div>
      </div>

      {/* Right side: Credentials Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px'
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>

          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#020617', fontFamily: '"Space Grotesk", sans-serif' }}>
              Control Center Sign In
            </h2>
            <p style={{ color: '#475569', fontSize: '14px', marginTop: '8px' }}>
              Enter your credentials to access operations
            </p>
          </div>

          {/* Demo Credentials */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: '#f1f5f9',
            border: '1px solid #e2e8f0',
            fontSize: '12px',
            color: '#475569',
            lineHeight: 1.5,
            marginBottom: '24px'
          }}>
            <span style={{ fontWeight: 700, color: '#020617', display: 'block', marginBottom: '4px' }}>Demonstration Credentials:</span>
            Email: <strong style={{ color: '#00C2A8' }}>admin@fleet.com</strong> / password: <strong>admin123</strong>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#dc2626',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Email *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Enter email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: '"Nunito", sans-serif',
                    backgroundColor: 'white',
                    color: '#020617',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00C2A8'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 38px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontFamily: '"Nunito", sans-serif',
                    backgroundColor: 'white',
                    color: '#020617',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00C2A8'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    padding: 0
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#94a3b8' : '#00C2A8',
                color: 'white',
                fontSize: '14px',
                fontWeight: 700,
                fontFamily: '"Nunito", sans-serif',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => { if (!loading) e.target.style.backgroundColor = '#00a896'; }}
              onMouseLeave={(e) => { if (!loading) e.target.style.backgroundColor = '#00C2A8'; }}
            >
              <Lock size={16} />
              {loading ? 'Signing in...' : 'Authorized Sign In'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
