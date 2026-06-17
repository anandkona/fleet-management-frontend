import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { PALETTE } from "../theme";

// 👉 If image is inside src/assets use this:
// import hippoLogo from "../assets/hippo-fleet.png";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(form.identifier, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
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
          {/* 🔥 Header Section */}
          <Stack alignItems="center" mb={4}>
            <Box
             
            >
             
              <img
                src="/hippo fleet logo.png" 
                alt="Hippo Fleet Logo"
                style={{

                  
                  width: '250px',
               
                  objectFit: "contain",
                }}
              />

              
            
            </Box>


            <Typography
              variant="body2"
              color="text.secondary"
              mb={1}
              
            >
              Sign in to your account
            </Typography>
          </Stack>

          {/* 🔴 Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 🔐 Form */}
          <Box component="form" onSubmit={handleLogin}>
            <Stack spacing={2.5}>
              <TextField
                label="Email or Username"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                fullWidth
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined sx={{ color: "text.secondary" }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
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


             

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  py: 1.3,
                  fontSize: "0.95rem",
                }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Sign In"
                )}
              </Button>

            
            </Stack>
          </Box>

          
        </CardContent>
      </Card>
    </Box>
  );
}