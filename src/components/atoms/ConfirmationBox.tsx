import React from 'react';
import styled from 'styled-components';
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";

interface ConfirmationBoxProps {
    selector: string;
    onClose: () => void;
}

const ConfirmationBox = ({ selector, onClose }: ConfirmationBoxProps) => {
    return (
            <React.Fragment>
          <Typography>
          Do you want to proceed?
        </Typography>
        <Box style={{marginTop: '4px'}}>
              Selector: {selector}
          <pre>{selector}</pre>
        </Box>
          </React.Fragment>
    );
};

const ConfirmationBoxContainer = styled.div`
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    padding: 20px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    z-index: 2147483648; /* Ensure it's above the highlighter */
    text-align: center;
`;

export default ConfirmationBox;
