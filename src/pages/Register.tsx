import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/auth';
import { TextField, Button, CircularProgress, Typography, Box, Container } from '@mui/material';
import { useGlobalInfoStore } from "../context/globalInfo";

const Register = () => {
    const [form, setForm] = useState({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const { notify } = useGlobalInfoStore();
    const { email, password } = form;

    const { state, dispatch } = useContext(AuthContext);
    const { user } = state;
    const navigate = useNavigate();

    useEffect(() => {
        if (user !== null) navigate('/');
    }, [user, navigate]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };

    const submitForm = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await axios.post('http://localhost:8080/auth/register', {
                email,
                password,
            });
            dispatch({
                type: 'LOGIN',
                payload: data,
            });
            notify('success', 'Welcome to Maxun!');
            window.localStorage.setItem('user', JSON.stringify(data));
            navigate('/');
        } catch (err: any) {
            notify('error', err.response.data || 'Registration Failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Typography component="h1" variant="h5">
                    Register
                </Typography>
                <Box component="form" onSubmit={submitForm} sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        value={email}
                        onChange={handleChange}
                        autoComplete="email"
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={password}
                        onChange={handleChange}
                        autoComplete="current-password"
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading || !email || !password}
                    >
                        {loading ? (
                            <CircularProgress size={24} sx={{ color: '#fff' }} />
                        ) : (
                            'Register'
                        )}
                    </Button>
                    <Typography variant="body2" align="center">
                        Already have an account?{' '}
                        <Link to="/login" style={{ textDecoration: 'none', color: '#1976d2' }}>
                            Login
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Register;
