import styled from 'styled-components';

export const NavBarButton = styled.button<{ disabled: boolean }>`
    margin-left: 10px;
    margin-right: 5px;
    padding: 0;
    border: none;
    background-color: transparent;
    cursor: ${({ disabled }) => disabled ? 'default' : 'pointer'};
    width: 24px;
    height: 24px;
    border-radius: 12px;
    outline: none;
    color: ${({ disabled }) => disabled ? '#999' : '#333'};

    ${({ disabled }) => disabled ? null : `
        &:hover {
            background-color: #ddd;
        }
       &:active {
           background-color: #d0d0d0;
       }
    `};
`;

export const UrlFormButton = styled.button`
    position: absolute;
    top: 0;
    right: 10px;
    padding: 0;
    border: none;
    background-color: transparent;
    cursor: pointer;
    width: 24px;
    height: 24px;
    border-radius: 12px;
    outline: none;
    // color: #333;
    
    // &:hover {
    //   background-color: #ddd;
    // },
    
    // &:active {
    //   background-color: #d0d0d0;
    // },
`;
