import React, { createContext, useContext, useState } from 'react';

interface TextStep {
    id: number;
    type: 'text';
    label: string;
    data: string;
    selectorObj: SelectorObject;
}

interface ScreenshotStep {
    id: number;
    type: 'screenshot';
    fullPage: boolean;
}


type BrowserStep = TextStep | ScreenshotStep;

interface SelectorObject {
    selector: string;
    tag?: string;
    attribute?: string;
    [key: string]: any;
}

interface BrowserStepsContextType {
    browserSteps: BrowserStep[];
    addTextStep: (label: string, data: string, selectorObj: SelectorObject) => void;
    addScreenshotStep: (fullPage: boolean) => void;
    deleteBrowserStep: (id: number) => void;
    updateBrowserTextStepLabel: (id: number, newLabel: string) => void;
}

const BrowserStepsContext = createContext<BrowserStepsContextType | undefined>(undefined);

export const BrowserStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [browserSteps, setBrowserSteps] = useState<BrowserStep[]>([]);

    const addTextStep = (label: string, data: string, selectorObj: SelectorObject) => {
        setBrowserSteps(prevSteps => [
            ...prevSteps,
            { id: Date.now(), type: 'text', label, data, selectorObj }
        ]);
    };

    const addScreenshotStep = (fullPage: boolean) => {
        setBrowserSteps(prevSteps => [
            ...prevSteps,
            { id: Date.now(), type: 'screenshot', fullPage }
        ]);
    };

    const deleteBrowserStep = (id: number) => {
        setBrowserSteps(prevSteps => prevSteps.filter(step => step.id !== id));
    };

    const updateBrowserTextStepLabel = (id: number, newLabel: string) => {
        setBrowserSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === id ? { ...step, label: newLabel } : step
            )
        );
    };

    return (
        <BrowserStepsContext.Provider value={{
            browserSteps,
            addTextStep,
            addScreenshotStep,
            deleteBrowserStep,
            updateBrowserTextStepLabel,
        }}>
            {children}
        </BrowserStepsContext.Provider>
    );
};

export const useBrowserSteps = () => {
    const context = useContext(BrowserStepsContext);
    if (!context) {
        throw new Error('useBrowserSteps must be used within a BrowserStepsProvider');
    }
    return context;
};
