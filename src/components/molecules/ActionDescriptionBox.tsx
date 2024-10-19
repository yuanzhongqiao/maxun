import React, { ReactNode } from 'react';
import styled from 'styled-components';

const CustomBoxContainer = styled.div`
  position: relative;
  width: 200px; /* Adjust width as needed */
  height: 200px; /* Adjust height as needed */
  border: 2px solid black;
  background-color: white;
  margin: 50px auto;
`;

const Triangle = styled.div`
  position: absolute;
  top: -20px; /* Adjust this value to control the height of the triangle */
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 20px solid black;
`;

const Content = styled.div`
  padding: 20px;
  text-align: center;
`;

const ActionDescriptionBox = ({ children }: { children: ReactNode }) => {
    return (
        <CustomBoxContainer>
            <Triangle />
            <Content>{children}</Content>
        </CustomBoxContainer>
    );
};

export default ActionDescriptionBox;
