import React, { createContext, useContext, useState, ReactNode } from 'react';

type PaginationType = 'scrollDown' | 'scrollUp' | 'clickNext' | 'clickLoadMore' | '';

interface ActionContextProps {
    getText: boolean;
    getList: boolean;
    getScreenshot: boolean;
    paginationMode: boolean;
    paginationType: PaginationType;
    startPaginationMode: () => void;
    startGetText: () => void;
    stopGetText: () => void;
    startGetList: () => void;
    stopGetList: () => void;
    startGetScreenshot: () => void;
    stopGetScreenshot: () => void;
    stopPaginationMode: () => void;
    updatePaginationType: (type: PaginationType) => void;
}

const ActionContext = createContext<ActionContextProps | undefined>(undefined);

export const ActionProvider = ({ children }: { children: ReactNode }) => {
    const [getText, setGetText] = useState<boolean>(false);
    const [getList, setGetList] = useState<boolean>(false);
    const [getScreenshot, setGetScreenshot] = useState<boolean>(false);
    const [paginationMode, setPaginationMode] = useState<boolean>(false);

    const startPaginationMode = () => setPaginationMode(true);
    const stopPaginationMode = () => setPaginationMode(false);

    const startGetText = () => setGetText(true);
    const stopGetText = () => setGetText(false);

    const startGetList = () => setGetList(true);
    const stopGetList = () => setGetList(false);

    const startGetScreenshot = () => setGetScreenshot(true);
    const stopGetScreenshot = () => setGetScreenshot(false);

    return (
        <ActionContext.Provider value={{ getText, getList, getScreenshot, paginationMode, startGetText, stopGetText, startGetList, stopGetList, startGetScreenshot, stopGetScreenshot, startPaginationMode, stopPaginationMode }}>
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
