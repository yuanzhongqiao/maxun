import React, { useState } from 'react';
import { styled } from '@mui/system';
import { TextField, Button, Switch, FormControlLabel, Box, Typography } from '@mui/material';
import { sendProxyConfig } from '../../api/proxy';
import { useGlobalInfoStore } from '../../context/globalInfo';

const FormContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    borderRadius: '8px',
});

const FormControl = styled(Box)({
    marginBottom: '16px',
});

const ProxyForm: React.FC = () => {
    const [proxyConfig, setProxyConfig] = useState({
        server: '',
        username: '',
        password: '',
    });
    const [requiresAuth, setRequiresAuth] = useState<boolean>(false);

    const { notify } = useGlobalInfoStore();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProxyConfig({ ...proxyConfig, [name]: value });
    };

    const handleAuthToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRequiresAuth(e.target.checked);
        if (!e.target.checked) {
            setProxyConfig({ ...proxyConfig, username: '', password: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendProxyConfig(proxyConfig).then((response) => {
            if (response) {
                notify('success', 'Proxy configuration submitted successfully');
            } else {
                notify('error', 'Failed to submit proxy configuration. Try again.');
            }
        });
    };

    return (
        <FormContainer>
            <form onSubmit={handleSubmit}>
                <Typography variant="subtitle1" gutterBottom style={{ marginBottom: '20px', marginTop: '20px' }}>
                    Proxy Configuration
                </Typography>
                <FormControl>
                    <TextField
                        label="Proxy Server URL"
                        name="server"
                        value={proxyConfig.server}
                        onChange={handleChange}
                        fullWidth
                        required
                        helperText="e.g., http://proxy-server.com:8080"
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
                                required
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
                                required
                            />
                        </FormControl>
                    </>
                )}
                <Button variant="contained" color="primary" type="submit" fullWidth>
                    Add Proxy
                </Button>
            </form>
        </FormContainer>
    );
};

export default ProxyForm;