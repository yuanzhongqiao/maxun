import React, { useCallback, useEffect, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import Canvas from "../atoms/canvas";
import { useBrowserDimensionsStore } from "../../context/browserDimensions";
import { Highlighter } from "../atoms/Highlighter";
import { GenericModal } from '../atoms/GenericModal';
import { Button, Typography, Box } from '@mui/material';

interface ConfirmationBoxProps {
    selector: string;
    onYes: () => void;
    onNo: () => void;
}

const ConfirmationBox = ({ selector, onYes, onNo }: ConfirmationBoxProps) => {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Confirmation
      </Typography>
      <Typography variant="body1" gutterBottom>
        Do you want to interact with the element: {selector}?
      </Typography>
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
        <Button variant="contained" color="primary" onClick={onYes}>
          Yes
        </Button>
        <Button variant="contained" color="secondary" onClick={onNo}>
          No
        </Button>
      </Box>
    </Box>
  );
};

export const BrowserWindow = () => {
    const [canvasRef, setCanvasReference] = useState<React.RefObject<HTMLCanvasElement> | undefined>(undefined);
    const [screenShot, setScreenShot] = useState<string>("");
    const [highlighterData, setHighlighterData] = useState<{ rect: DOMRect, selector: string } | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const { socket } = useSocketStore();
    const { width, height } = useBrowserDimensionsStore();

    // console.log('Use browser dimensions:', width, height)

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
        // console.log('Highlighter Rect via socket:', data.rect)
    }, [highlighterData])

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
                setShowConfirmation(true);
            }
        }
    };

    const handleConfirmation = (confirmed: boolean) => {
        if (confirmed) {
            console.log(`User confirmed interaction with: ${highlighterData?.selector}`);
            // Here you can add logic to interact with the element
        } else {
            console.log('User declined interaction');
        }
        setShowConfirmation(false);
    };

    return (
        <div onClick={handleClick}>
            <GenericModal 
                isOpen={showConfirmation} 
                onClose={() => setShowConfirmation(false)}
                canBeClosed={false}
            >
                <ConfirmationBox
                    selector={highlighterData?.selector || ''}
                    onYes={() => handleConfirmation(true)}
                    onNo={() => handleConfirmation(false)}
                />
            </GenericModal>
            {(!showConfirmation && highlighterData?.rect != null && highlighterData?.rect.top != null) && canvasRef?.current ?
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
        //console.log('Image drawn on canvas:', img.width, img.height);
        //console.log('Image drawn on canvas:', canvas.width, canvas.height);
    };

};