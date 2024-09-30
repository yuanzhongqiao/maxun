import React, { useState } from 'react';
import { TextField, Button, RadioGroup, FormControlLabel, Radio, Box } from '@mui/material';
import { styled } from '@mui/system';
import axios from 'axios';

const FormContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
});

const FormControl = styled(Box)({
  marginBottom: '16px',
});

const ProxyForm: React.FC = () => {
  const [proxyConfig, setProxyConfig] = useState({
    type: 'http',
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
      alert(`Success!`);
    } catch (error) {
      alert('Error submitting proxy configuration');
    }
  };

  return (
    <FormContainer>
      <form onSubmit={handleSubmit}>
        <FormControl>
          <RadioGroup
            name="type"
            value={proxyConfig.type}
            onChange={handleChange}
            row
          >
            <FormControlLabel value="http" control={<Radio />} label="HTTP" />
            <FormControlLabel value="https" control={<Radio />} label="HTTPS" />
            <FormControlLabel value="socks5" control={<Radio />} label="SOCKS5" />
          </RadioGroup>
        </FormControl>

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
          <TextField
            label="Username (Optional)"
            name="username"
            value={proxyConfig.username}
            onChange={handleChange}
            fullWidth
          />
        </FormControl>

        <FormControl>
          <TextField
            label="Password (Optional)"
            name="password"
            value={proxyConfig.password}
            onChange={handleChange}
            type="password"
            fullWidth
          />
        </FormControl>

        <Button variant="contained" color="primary" type="submit" fullWidth>
          Submit Proxy
        </Button>
      </form>
    </FormContainer>
  );
};

export default ProxyForm;
