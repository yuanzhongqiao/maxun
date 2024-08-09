import React, { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import Canvas from "../atoms/canvas";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";
import { Highlighter } from "../atoms/Highlighter";
import { GenericModal } from '../atoms/GenericModal';
import { useActionContext } from '../../context/browserActions';
import { useBrowserSteps, TextStep } from '../../context/browserSteps';

interface ElementInfo {
    tagName: string;
    hasOnlyText?: boolean;
    innerText?: string;
    url?: string;
    imageUrl?: string;
}

interface AttributeOption {
    label: string;
    value: string;
}

const getAttributeOptions = (tagName: string): AttributeOption[] => {
    switch (tagName.toLowerCase()) {
        case 'a':
            return [
                { label: 'Text', value: 'innerText' },
                { label: 'URL', value: 'href' }
            ];
        case 'img':
            return [
                { label: 'Alt Text', value: 'alt' },
                { label: 'Source URL', value: 'src' }
            ];
        default:
            return [{ label: 'Text', value: 'innerText' }];
    }
};

export const BrowserWindow = () => {
    const [canvasRef, setCanvasReference] = useState<React.RefObject<HTMLCanvasElement> | undefined>(undefined);
    const [screenShot, setScreenShot] = useState<string>("");
    const [highlighterData, setHighlighterData] = useState<{ rect: DOMRect, selector: string, elementInfo: ElementInfo | null; } | null>(null);
    const [showAttributeModal, setShowAttributeModal] = useState(false);
    const [attributeOptions, setAttributeOptions] = useState<AttributeOption[]>([]);
    const [selectedElement, setSelectedElement] = useState<{ selector: string, info: ElementInfo | null } | null>(null);

    const [listSelector, setListSelector] = useState<string | null>(null);
    const [fields, setFields] = useState<Record<string, TextStep>>({});

    const { socket } = useSocketStore();
    const { width, height } = useBrowserDimensionsStore();
    const { getText, getList } = useActionContext();
    const { addTextStep, addListStep } = useBrowserSteps();

    const onMouseMove = (e: MouseEvent) => {
        if (canvasRef && canvasRef.current && highlighterData) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            // mousemove outside the browser window
            if (
                e.pageX < canvasRect.left
                || e.pageX > canvasRect.right
                || e.pageY < canvasRect.top
                || e.pageY > canvasRect.bottom
            ) {
                setHighlighterData(null);
            }
        }
    };

    const screencastHandler = useCallback((data: string) => {
        setScreenShot(data);
    }, [screenShot]);

    useEffect(() => {
        if (socket) {
            socket.on("screencast", screencastHandler);
        }
        if (canvasRef?.current) {
            drawImage(screenShot, canvasRef.current);
        } else {
            console.log('Canvas is not initialized');
        }
        return () => {
            socket?.off("screencast", screencastHandler);
        }
    }, [screenShot, canvasRef, socket, screencastHandler]);

    const highlighterHandler = useCallback((data: { rect: DOMRect, selector: string, elementInfo: ElementInfo | null }) => {
        if (getList === true) {
            socket?.emit('setGetList', { getList: true });
        }
        setHighlighterData(data);
    }, [highlighterData, getList, socket]);

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove, false);
        if (socket) {
            socket.on("highlighter", highlighterHandler);
        }
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            socket?.off("highlighter", highlighterHandler);
        };
    }, [socket, onMouseMove]);

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (highlighterData && canvasRef?.current) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const clickX = e.clientX - canvasRect.left;
            const clickY = e.clientY - canvasRect.top;

            const highlightRect = highlighterData.rect;
            if (
                clickX >= highlightRect.left &&
                clickX <= highlightRect.right &&
                clickY >= highlightRect.top &&
                clickY <= highlightRect.bottom
            ) {
                if (getText === true) {
                    const options = getAttributeOptions(highlighterData.elementInfo?.tagName || '');
                    if (options.length > 1) {
                        setAttributeOptions(options);
                        setSelectedElement({
                            selector: highlighterData.selector,
                            info: highlighterData.elementInfo
                        });
                        setShowAttributeModal(true);
                    } else {
                        addTextStep('', highlighterData.elementInfo?.innerText || '', {
                            selector: highlighterData.selector,
                            tag: highlighterData.elementInfo?.tagName,
                            attribute: 'innerText'
                        });
                    }
                }

                if (getList === true && !listSelector) {
                    setListSelector(highlighterData.selector);
                } else if (getList === true && listSelector) {
                    const options = getAttributeOptions(highlighterData.elementInfo?.tagName || '');
                    if (options.length > 1) {
                        setAttributeOptions(options);
                        setSelectedElement({
                            selector: highlighterData.selector,
                            info: highlighterData.elementInfo
                        });
                        setShowAttributeModal(true);
                    } else {
                        const newField: TextStep = {
                            id: Date.now(),
                            type: 'text',
                            label: `label ${Object.keys(fields).length + 1}`,
                            data: highlighterData.elementInfo?.innerText || '',
                            selectorObj: {
                                selector: highlighterData.selector,
                                tag: highlighterData.elementInfo?.tagName,
                                attribute: 'innerText'
                            }
                        };

                        setFields(prevFields => {
                            const updatedFields = {
                                ...prevFields,
                                [newField.id]: newField
                            };
                            return updatedFields;
                        });

                        if (listSelector) {
                            addListStep(listSelector, { ...fields, [newField.id]: newField });
                            console.log('Called addListStep with:', { listSelector, updatedFields: { ...fields, [newField.id]: newField } });
                        }
                    }

                }
            }
        }
    };

    const handleAttributeSelection = (attribute: string) => {
        if (selectedElement) {
            let data = '';
            switch (attribute) {
                case 'href':
                    data = selectedElement.info?.url || '';
                    break;
                case 'src':
                    data = selectedElement.info?.imageUrl || '';
                    break;
                default:
                    data = selectedElement.info?.innerText || '';
            }
            {
                if (getText === true) {
                    addTextStep('', data, {
                        selector: selectedElement.selector,
                        tag: selectedElement.info?.tagName,
                        attribute: attribute
                    });
                }
            }
        }
        setShowAttributeModal(false);
    };

    return (
        <div onClick={handleClick}>
            {
                getText === true || getList === true ? (
                    <GenericModal
                        isOpen={showAttributeModal}
                        onClose={() => { }}
                        canBeClosed={false}
                    >
                        <div>
                            <h2>Select Attribute</h2>
                            {attributeOptions.map((option) => (
                                <button key={option.value} onClick={() => handleAttributeSelection(option.value)}>
                                    {option.label}
                                </button>
                            ))}
                        </div>

                    </GenericModal>
                ) : null
            }
            {((getText === true || getList === true) && !showAttributeModal && highlighterData?.rect != null && highlighterData?.rect.top != null) && canvasRef?.current ?
                <Highlighter
                    unmodifiedRect={highlighterData?.rect}
                    displayedSelector={highlighterData?.selector}
                    width={width}
                    height={height}
                    canvasRect={canvasRef.current.getBoundingClientRect()}
                />
                : null}
            <Canvas
                onCreateRef={setCanvasReference}
                width={width}
                height={height}
            />
        </div>
    );
};

const drawImage = (image: string, canvas: HTMLCanvasElement): void => {

    const ctx = canvas.getContext('2d');

    const img = new Image();

    img.src = image;
    img.onload = () => {
        URL.revokeObjectURL(img.src);
        ctx?.drawImage(img, 0, 0, 1280, 720);
    };

};