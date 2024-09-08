import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PaginationType = 'scrollDown' | 'scrollUp' | 'clickNext' | 'clickLoadMore' | 'none' | '';
export type LimitType = '10' | '100' | 'custom' | '';

interface ActionContextProps {
    getText: boolean;
    getList: boolean;
    getScreenshot: boolean;
    paginationMode: boolean;
    limitMode: boolean;
    paginationType: PaginationType;
    limitType: LimitType;
    customLimit: string;
    startPaginationMode: () => void;
    startGetText: () => void;
    stopGetText: () => void;
    startGetList: () => void;
    stopGetList: () => void;
    startGetScreenshot: () => void;
    stopGetScreenshot: () => void;
    stopPaginationMode: () => void;
    updatePaginationType: (type: PaginationType) => void;
    startLimitMode: () => void;
    stopLimitMode: () => void;
    updateLimitType: (type: LimitType) => void;
    updateCustomLimit: (limit: string) => void;
}

const ActionContext = createContext<ActionContextProps | undefined>(undefined);

export const ActionProvider = ({ children }: { children: ReactNode }) => {
    const [getText, setGetText] = useState<boolean>(false);
    const [getList, setGetList] = useState<boolean>(false);
    const [getScreenshot, setGetScreenshot] = useState<boolean>(false);
    const [paginationMode, setPaginationMode] = useState<boolean>(false);
    const [limitMode, setLimitMode] = useState<boolean>(false);
    const [paginationType, setPaginationType] = useState<PaginationType>('');
    const [limitType, setLimitType] = useState<LimitType>('');
    const [customLimit, setCustomLimit] = useState<string>('');

    const updatePaginationType = (type: PaginationType) => setPaginationType(type);
    const updateLimitType = (type: LimitType) => setLimitType(type);
    const updateCustomLimit = (limit: string) => setCustomLimit(limit);

    const startPaginationMode = () => setPaginationMode(true);
    const stopPaginationMode = () => setPaginationMode(false);

    const startLimitMode = () => setLimitMode(true);
    const stopLimitMode = () => setLimitMode(false);

    const startGetText = () => setGetText(true);
    const stopGetText = () => setGetText(false);

    const startGetList = () => setGetList(true);
    const stopGetList = () => {
        setGetList(false);
        setPaginationType('');
        setLimitType('');
        setCustomLimit('');
    };

    const startGetScreenshot = () => setGetScreenshot(true);
    const stopGetScreenshot = () => setGetScreenshot(false);

    return (
        <ActionContext.Provider value={{ 
            getText, 
            getList, 
            getScreenshot, 
            paginationMode, 
            limitMode,
            paginationType, 
            limitType,
            customLimit,
            startGetText, 
            stopGetText, 
            startGetList, 
            stopGetList, 
            startGetScreenshot, 
            stopGetScreenshot, 
            startPaginationMode, 
            stopPaginationMode,
            startLimitMode,
            stopLimitMode,
            updatePaginationType,
            updateLimitType,
            updateCustomLimit
        }}>
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