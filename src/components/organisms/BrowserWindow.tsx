import React, { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import Canvas from "../atoms/canvas";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";
import { Highlighter } from "../atoms/Highlighter";

export const BrowserWindow = () => {

    const [canvasRef, setCanvasReference] = useState<React.RefObject<HTMLCanvasElement> | undefined>(undefined);
    const [screenShot, setScreenShot] = useState<string>("");
    const [highlighterData, setHighlighterData] = useState<{ rect: DOMRect, selector: string } | null>(null);
    const [selectedElement, setSelectedElement] = useState<Array<{ rect: DOMRect, selector: string }>>([]);

    const { socket } = useSocketStore();
    const { width, height } = useBrowserDimensionsStore();

    console.log('Use browser dimensions:', width, height)

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


    const highlighterHandler = useCallback((data: { rect: DOMRect, selector: string }) => {
        setHighlighterData(data);
        console.log('Highlighter Rect via socket:', data.rect)
    }, [highlighterData])

    const handleClick = useCallback(() => {
        if (highlighterData) {
            setSelectedElements(prev => [...prev, highlighterData]);
        }
    }, [highlighterData]);

    useEffect(() => {
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('click', handleClick);
        if (socket) {
            socket.on("highlighter", highlighterHandler);
        }
        //cleaning function
        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('click', handleClick);
            socket?.off("highlighter", highlighterHandler);
        };
    }, [socket, onMouseMove, handleClick]);

    // Adjust selected elements' positions after scroll
    useEffect(() => {
        const handleScroll = () => {
            if (canvasRef && canvasRef.current) {
                const canvasRect = canvasRef.current.getBoundingClientRect();
                setSelectedElements(prev => prev.map(element => ({
                    ...element,
                    rect: new DOMRect(
                        element.rect.x,
                        element.rect.y,
                        element.rect.width,
                        element.rect.height
                    )
                })));
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [canvasRef]);

    return (
        <>
            {(highlighterData?.rect != null && highlighterData?.rect.top != null) && canvasRef?.current ?
                < Highlighter
                    unmodifiedRect={highlighterData?.rect}
                    displayedSelector={highlighterData?.selector}
                    width={width}
                    height={height}
                    canvasRect={canvasRef.current.getBoundingClientRect()}
                    isSelected={false}
                />
                : null}
            {selectedElements.map((element, index) => (
                canvasRef?.current ? 
                <Highlighter 
                        key={index}
                        unmodifiedRect={element?.rect}
                        displayedSelector={element?.selector}
                        width={width}
                        height={height}
                        canvasRect={canvasRef.current.getBoundingClientRect()}
                        isSelected={false}
                />
            : null
            ))}
            <Canvas
                onCreateRef={setCanvasReference}
                width={width}
                height={height}
            />
        </>
    );
};

const drawImage = (image: string, canvas: HTMLCanvasElement): void => {

    const ctx = canvas.getContext('2d');

    const img = new Image();

    img.src = image;
    img.onload = () => {
        URL.revokeObjectURL(img.src);
        //ctx?.clearRect(0, 0, canvas?.width || 0, VIEWPORT_H || 0);
        // ctx?.drawImage(img, 0, 0, canvas.width , canvas.height);
        ctx?.drawImage(img, 0, 0, 1280, 720); // Explicitly draw image at 1280 x 720
        console.log('Image drawn on canvas:', img.width, img.height);
        console.log('Image drawn on canvas:', canvas.width, canvas.height);
    };

};
