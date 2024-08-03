import React, { createContext, useContext, useState } from 'react';

interface BrowserStep {
    id: number;
    label: string;
    data: string;
    selector: string;
}

interface BrowserStepsContextType {
    browserSteps: BrowserStep[];
    addBrowserStep: (label: string, data: string, selector: string) => void;
    deleteBrowserStep: (id: number) => void;
    updateBrowserStepLabel: (id: number, newLabel: string) => void;
}

const BrowserStepsContext = createContext<BrowserStepsContextType | undefined>(undefined);

export const BrowserStepsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [browserSteps, setBrowserSteps] = useState<BrowserStep[]>([]);

    const addBrowserStep = (label: string, data: string, selector: string) => {
        setBrowserSteps(prevSteps => [
            ...prevSteps,
            { id: Date.now(), label, data, selector }
        ]);
    };

    const deleteBrowserStep = (id: number) => {
        setBrowserSteps(prevSteps => prevSteps.filter(step => step.id !== id));
    };

    const updateBrowserStepLabel = (id: number, newLabel: string) => {
        setBrowserSteps(prevSteps =>
            prevSteps.map(step =>
                step.id === id ? { ...step, label: newLabel } : step
            )
        );
    };

    return (
        <BrowserStepsContext.Provider value={{ browserSteps, addBrowserStep, deleteBrowserStep, updateBrowserStepLabel }}>
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
