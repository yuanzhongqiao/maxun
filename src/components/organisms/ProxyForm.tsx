import React, { useState } from 'react';
import { TextField, Button, MenuItem, Box } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';

const proxyTypes = [
  { label: 'HTTP', value: 'http' },
  { label: 'HTTPS', value: 'https' },
  { label: 'SOCKS5', value: 'socks5' },
];

const FormContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  width: '400px',
  margin: '0 auto',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
});

const FormControl = styled(Box)({
    marginBottom: '10px',
});

const ProxyForm: React.FC = () => {
  const [proxyConfig, setProxyConfig] = useState({
    type: '',
    server: '',
    username: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProxyConfig({ ...proxyConfig, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/proxy', proxyConfig);
      alert(`Successfully added the proxy`);
    } catch (error) {
      alert('Error submitting proxy configuration');
    }
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <TextField
          select
          label="Proxy Type"
          name="type"
          value={proxyConfig.type}
          onChange={handleChange}
          fullWidth
          required
        >
          {proxyTypes.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Proxy Server URL"
          name="server"
          value={proxyConfig.server}
          onChange={handleChange}
          fullWidth
          required
          helperText="e.g., http://proxy-server.com:8080"
        />

        <TextField
          label="Username (Optional)"
          name="username"
          value={proxyConfig.username}
          onChange={handleChange}
          fullWidth
        />

        <TextField
          label="Password (Optional)"
          name="password"
          value={proxyConfig.password}
          onChange={handleChange}
          type="password"
          fullWidth
        />

        <Button variant="contained" color="primary" type="submit" fullWidth>
          Submit Proxy
        </Button>
      </form>
    </FormContainer>
  );
};

export default ProxyForm;
