import React, { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import Canvas from "../atoms/canvas";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";

export const BrowserWindow = () => {
    const [canvasRef, setCanvasReference] = useState<React.RefObject<HTMLCanvasElement> | undefined>(undefined);
    const [screenShot, setScreenShot] = useState<string>("");
    const [highlighterData, setHighlighterData] = useState<{ rect: DOMRect, selector: string } | null>(null);

    const { socket } = useSocketStore();
    const { width, height } = useBrowserDimensionsStore();

    const screencastHandler = useCallback((data: string) => {
        setScreenShot(data);
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on("screencast", screencastHandler);
        }
        if (canvasRef?.current) {
            drawImage(screenShot, canvasRef.current);
        }
        return () => {
            socket?.off("screencast", screencastHandler);
        }
    }, [screenShot, canvasRef, socket, screencastHandler]);

    const highlighterHandler = useCallback((data: { rect: DOMRect, selector: string }) => {
        setHighlighterData(data);
    }, [])

    useEffect(() => {
        if (socket) {
            socket.on("highlighter", highlighterHandler);
        }
        return () => {
            socket?.off("highlighter", highlighterHandler);
        };
    }, [socket, highlighterHandler]);

    return (
        <div style={{ position: 'relative' }}>
            <Canvas
                onCreateRef={setCanvasReference}
                width={width}
                height={height}
                highlighterData={highlighterData}
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