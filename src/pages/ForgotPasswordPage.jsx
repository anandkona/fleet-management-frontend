import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  EmailOutlined,
  VpnKeyOutlined,
  ArrowBackOutlined,
} from "@mui/icons-material";
import { authService } from "../services/api";
import { PALETTE } from "../theme";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleRequestOtp = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.requestPasswordReset(email);
      setSuccessMsg("OTP sent to your email. Please check your inbox.");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      setError("OTP is required");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.verifyPasswordResetOtp(email, otp);
      setSuccessMsg("OTP verified successfully. Please set your new password.");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccessMsg("Password reset successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${PALETTE.navy} 0%, #162238 100%)`,
      }}
    >
      <Card
        sx={{
          width: 420,
          borderRadius: 3,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Header Section */}
          <Stack alignItems="center" mb={4}>
            <Box mb={2} sx={{ textAlign: "center" }}>
              <img
                src="/hippo fleet logo.png"
                alt="Hippo Fleet Logo"
                style={{
                  width: "200px",
                  objectFit: "contain",
                }}
              />
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 1 && "Enter your email to receive an OTP"}
              {step === 2 && "Enter the OTP sent to your email"}
              {step === 3 && "Create your new password"}
            </Typography>
          </Stack>

          {/* Success Alert */}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMsg}
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <Stack spacing={2.5}>
              <TextField
                label="Email Address"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                required
                type="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleRequestOtp}
                sx={{ py: 1.3, fontSize: "0.95rem" }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Send OTP"}
              </Button>

              <Button
                variant="text"
                startIcon={<ArrowBackOutlined />}
                onClick={() => navigate("/login")}
                sx={{ textTransform: "none" }}
              >
                Back to Login
              </Button>
            </Stack>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <Stack spacing={2.5}>
              <Typography variant="body2" color="text.secondary">
                We've sent an OTP to <strong>{email}</strong>
              </Typography>

              <TextField
                label="Enter OTP"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                fullWidth
                required
                placeholder="000000"
                inputProps={{ maxLength: 6, style: { letterSpacing: "0.5em", fontSize: "1.2rem", fontWeight: 600 } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <VpnKeyOutlined sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleVerifyOtp}
                sx={{ py: 1.3, fontSize: "0.95rem" }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Verify OTP"}
              </Button>

              <Button
                variant="text"
                onClick={() => {
                  setStep(1);
                  setOtp("");
                  setError("");
                  setSuccessMsg("");
                }}
                sx={{ textTransform: "none" }}
              >
                Back
              </Button>
            </Stack>
          )}

          {/* Step 3: Reset Password */}
          {step === 3 && (
            <Stack spacing={2.5}>
              <TextField
                label="New Password"
                name="newPassword"
                type={showPass ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPass(!showPass)}
                        edge="end"
                        size="small"
                      >
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Confirm Password"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirm(!showConfirm)}
                        edge="end"
                        size="small"
                      >
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleResetPassword}
                sx={{ py: 1.3, fontSize: "0.95rem" }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Reset Password"}
              </Button>

              <Button
                variant="text"
                onClick={() => {
                  setStep(2);
                  setNewPassword("");
                  setConfirmPassword("");
                  setError("");
                  setSuccessMsg("");
                }}
                sx={{ textTransform: "none" }}
              >
                Back
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
