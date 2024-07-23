import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import { getMappedCoordinates } from "../../helpers/inputHelpers";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { GenericModal } from '../atoms/GenericModal';
import { Box, Button, Typography } from '@mui/material';

interface CreateRefCallback {
    (ref: React.RefObject<HTMLCanvasElement>): void;
}
/**
 * Interface for mouse's x,y coordinates
 */
interface CanvasProps {
    width: number;
    height: number;
    onCreateRef: CreateRefCallback;
    highlighterData: { rect: DOMRect, selector: string } | null;
}

export interface Coordinates {
    x: number;
    y: number;
}

const ConfirmationBox = ({ selector, onYes, onNo }: { selector: string; onYes: () => void; onNo: () => void }) => {
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

const Canvas = ({ width, height, onCreateRef, highlighterData }: CanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { socket } = useSocketStore();
    const { setLastAction } = useGlobalInfoStore();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingClick, setPendingClick] = useState<Coordinates | null>(null);

    const lastMousePosition = useRef<Coordinates>({ x: 0, y: 0 });

    const onMouseEvent = useCallback((event: MouseEvent) => {
        if (socket && canvasRef.current) {
            const coordinates = getMappedCoordinates(event, canvasRef.current, width, height);
            
            switch (event.type) {
                case 'mousemove':
                    if (lastMousePosition.current.x !== coordinates.x ||
                        lastMousePosition.current.y !== coordinates.y) {
                        lastMousePosition.current = coordinates;
                        socket.emit('input:mousemove', coordinates);
                        setLastAction('move');
                    }
                    break;
                case 'mousedown':
                    if (highlighterData) {
                        const highlightRect = highlighterData.rect;
                        if (
                            coordinates.x >= highlightRect.left &&
                            coordinates.x <= highlightRect.right &&
                            coordinates.y >= highlightRect.top &&
                            coordinates.y <= highlightRect.bottom
                        ) {
                            setPendingClick(coordinates);
                            setShowConfirmation(true);
                        } else {
                            socket.emit('input:mousedown', coordinates);
                            setLastAction('click');
                        }
                    } else {
                        socket.emit('input:mousedown', coordinates);
                        setLastAction('click');
                    }
                    break;
                case 'wheel':
                    const wheelEvent = event as WheelEvent;
                    const deltas = {
                        deltaX: Math.round(wheelEvent.deltaX),
                        deltaY: Math.round(wheelEvent.deltaY),
                    };
                    socket.emit('input:wheel', deltas);
                    setLastAction('scroll');
                    break;
            }
        }
    }, [socket, width, height, setLastAction, highlighterData]);

    const onKeyboardEvent = useCallback((event: KeyboardEvent) => {
        if (socket) {
            switch (event.type) {
                case 'keydown':
                    socket.emit('input:keydown', { key: event.key, coordinates: lastMousePosition.current });
                    setLastAction(`${event.key} pressed`);
                    break;
                case 'keyup':
                    socket.emit('input:keyup', event.key);
                    break;
            }
        }
    }, [socket, setLastAction]);

    const handleConfirmation = (confirmed: boolean) => {
        if (confirmed && pendingClick && socket) {
            socket.emit('input:mousedown', pendingClick);
            setLastAction('click');
        }
        setShowConfirmation(false);
        setPendingClick(null);
    };

    useEffect(() => {
        if (canvasRef.current) {
            onCreateRef(canvasRef);
            canvasRef.current.addEventListener('mousedown', onMouseEvent);
            canvasRef.current.addEventListener('mousemove', onMouseEvent);
            canvasRef.current.addEventListener('wheel', onMouseEvent, { passive: true });
            canvasRef.current.addEventListener('keydown', onKeyboardEvent);
            canvasRef.current.addEventListener('keyup', onKeyboardEvent);

            return () => {
                if (canvasRef.current) {
                    canvasRef.current.removeEventListener('mousedown', onMouseEvent);
                    canvasRef.current.removeEventListener('mousemove', onMouseEvent);
                    canvasRef.current.removeEventListener('wheel', onMouseEvent);
                    canvasRef.current.removeEventListener('keydown', onKeyboardEvent);
                    canvasRef.current.removeEventListener('keyup', onKeyboardEvent);
                }
            };
        }
    }, [onMouseEvent, onKeyboardEvent, onCreateRef]);

    return (
        <>
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
            <canvas
                tabIndex={0}
                ref={canvasRef}
                height={720}
                width={1280}
            />
        </>
    );
};

export default Canvas;