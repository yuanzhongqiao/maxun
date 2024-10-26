import React, { useState, useEffect } from 'react';
import { styled } from '@mui/system';
import { TextField, Button, Switch, FormControlLabel, Box, Typography, Tabs, Tab } from '@mui/material';
import { sendProxyConfig, getProxyConfig, testProxyConfig } from '../../api/proxy';
import { useGlobalInfoStore } from '../../context/globalInfo';

const FormContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginLeft: '30px'
});

const FormControl = styled(Box)({
    marginBottom: '16px',
});

const ProxyForm: React.FC = () => {
    const [proxyConfig, setProxyConfig] = useState({
        server_url: '',
        username: '',
        password: '',
    });
    const [requiresAuth, setRequiresAuth] = useState<boolean>(false);
    const [errors, setErrors] = useState({
        server_url: '',
        username: '',
        password: '',
    });
    const [tabIndex, setTabIndex] = useState(0);
    const [isProxyConfigured, setIsProxyConfigured] = useState(false);

    const { notify } = useGlobalInfoStore();

    const validateForm = () => {
        let valid = true;
        let errorMessages = { server_url: '', username: '', password: '' };

        if (!proxyConfig.server_url) {
            errorMessages.server_url = 'Server URL is required';
            valid = false;
        }

        if (requiresAuth) {
            if (!proxyConfig.username) {
                errorMessages.username = 'Username is required for authenticated proxies';
                valid = false;
            }
            if (!proxyConfig.password) {
                errorMessages.password = 'Password is required for authenticated proxies';
                valid = false;
            }
        }

        setErrors(errorMessages);
        return valid;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProxyConfig({ ...proxyConfig, [name]: value });
    };

    const handleAuthToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRequiresAuth(e.target.checked);
        if (!e.target.checked) {
            setProxyConfig({ ...proxyConfig, username: '', password: '' });
            setErrors({ ...errors, username: '', password: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        await sendProxyConfig(proxyConfig).then((response) => {
            if (response) {
                notify('success', 'Proxy configuration submitted successfully');
            } else {
                notify('error', 'Failed to submit proxy configuration. Try again.');
            }
        });
    };

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabIndex(newValue);
    };

    const testProxy = async () => {
        await testProxyConfig().then((response) => {
            if (response.success) {
                notify('success', 'Proxy configuration is working');
            } else {
                notify('error', 'Failed to test proxy configuration. Try again.');
            }
        });
    };

    const fetchProxyConfig = async () => {
        await getProxyConfig().then((response) => {
            if (response.proxy_url) {
                setIsProxyConfigured(true);
                notify('success', 'Proxy configuration fetched successfully');
            } else {
                notify('error', 'Failed to fetch proxy configuration. Try again.');
            }
        });
    };

    useEffect(() => {
        fetchProxyConfig();
    }, []);

    return (
        <>
        <FormContainer>
            <Typography variant="h6" gutterBottom component="div" style={{ marginTop: '20px' }}>
                Proxy Configuration
            </Typography>
            <Tabs value={tabIndex} onChange={handleTabChange}>
                <Tab label="Standard Proxy" />
                <Tab label="Automatic Proxy Rotation" />
            </Tabs>
            {tabIndex === 0 && (
                <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, width: '100%' }}>
                    <FormControl>
                        <TextField
                            label="Proxy Server URL"
                            name="server_url"
                            value={proxyConfig.server_url}
                            onChange={handleChange}
                            fullWidth
                            required
                            error={!!errors.server_url}
                            helperText={errors.server_url || `Proxy to be used for all robots. HTTP and SOCKS proxies are supported. 
                            Example http://myproxy.com:3128 or socks5://myproxy.com:3128. 
                            Short form myproxy.com:3128 is considered an HTTP proxy.`}
                        />
                    </FormControl>
                    <FormControl>
                        <FormControlLabel
                            control={<Switch checked={requiresAuth} onChange={handleAuthToggle} />}
                            label="Requires Authentication?"
                        />
                    </FormControl>
                    {requiresAuth && (
                        <>
                            <FormControl>
                                <TextField
                                    label="Username"
                                    name="username"
                                    value={proxyConfig.username}
                                    onChange={handleChange}
                                    fullWidth
                                    required={requiresAuth}
                                    error={!!errors.username}
                                    helperText={errors.username || ''}
                                />
                            </FormControl>
                            <FormControl>
                                <TextField
                                    label="Password"
                                    name="password"
                                    value={proxyConfig.password}
                                    onChange={handleChange}
                                    type="password"
                                    fullWidth
                                    required={requiresAuth}
                                    error={!!errors.password}
                                    helperText={errors.password || ''}
                                />
                            </FormControl>
                        </>
                    )}
                    <Button
                        variant="contained"
                        color="primary"
                        type="submit"
                        fullWidth
                        disabled={!proxyConfig.server_url || (requiresAuth && (!proxyConfig.username || !proxyConfig.password))}
                    >
                        Add Proxy
                    </Button>
                </Box>
            )}
            {tabIndex === 1 && (
                <Box sx={{ maxWidth: 600, width: '100%', textAlign: 'center', marginTop: '20px' }}>
                    <>
                    <Typography variant="body1" gutterBottom component="div">
                        Coming Soon. Join our Cloud Waitlist to get early access.
                    </Typography>
                    <Button variant="contained" color="primary" sx={{ marginTop: '20px'}}>
                        Join Maxun Cloud Waitlist
                    </Button>
                    </>
                </Box>
            )}
        </FormContainer>
        </>
    );
};

export default ProxyForm;
