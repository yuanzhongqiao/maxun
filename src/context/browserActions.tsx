import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ActionContextType {
    getText: boolean;
    getScreenshot: boolean;
    handleGetText: () => void;
    handleGetScreenshot: () => void;
    resetActions: () => void;
}

