import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActionContextProps {
    getText: boolean;
    getList: boolean;
    getScreenshot: boolean;
    startGetText: () => void;
    stopGetText: () => void;
    startGetList: () => void;
    stopGetList: () => void;
    startGetScreenshot: () => void;
    stopGetScreenshot: () => void;
}

const ActionContext = createContext<ActionContextProps | undefined>(undefined);

export const ActionProvider = ({ children }: { children: ReactNode }) => {
    const [getText, setGetText] = useState<boolean>(false);
    const [getList, setGetList] = useState<boolean>(false);
    const [getScreenshot, setGetScreenshot] = useState<boolean>(false);

    const startGetText = () => setGetText(true);
    const stopGetText = () => setGetText(false);

    const startGetList = () => setGetList(true);
    const stopGetList = () => setGetList(false);

    const startGetScreenshot = () => setGetScreenshot(true);
    const stopGetScreenshot = () => setGetScreenshot(false);

    return (
        <ActionContext.Provider value={{ getText, getList, getScreenshot, startGetText, stopGetText, startGetList, stopGetList, startGetScreenshot, stopGetScreenshot }}>
            {children}
        </ActionContext.Provider>
    );
};

export const useActionContext = () => {
    const context = useContext(ActionContext);
    if (context === undefined) {
        throw new Error('useActionContext must be used within an ActionProvider');
    }
    return context;
};