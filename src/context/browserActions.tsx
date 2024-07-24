import React, { createContext, useState, useContext, ReactNode } from 'react';

interface ActionContextType {
    getText: boolean;
    getScreenshot: boolean;
    handleGetText: () => void;
    handleGetScreenshot: () => void;
    resetActions: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const useActionContext = (): ActionContextType => {
    const context = useContext(ActionContext);
    if (context === undefined) {
        throw new Error('useActionContext must be used within an ActionProvider');
    }
    return context;
};

