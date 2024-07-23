import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSocketStore } from '../../context/socket';
import { getMappedCoordinates } from "../../helpers/inputHelpers";
import { useGlobalInfoStore } from "../../context/globalInfo";
import { GenericModal } from '../atoms/GenericModal';
import { Box, Button, Typography } from '@mui/material';

interface CreateRefCallback {
    (ref: React.RefObject<HTMLCanvasElement>): void;
}

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
    const { setLastAction, lastAction } = useGlobalInfoStore();
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [pendingClick, setPendingClick] = useState<Coordinates | null>(null);

    const notifyLastAction = (action: string) => {
        if (lastAction !== action) {
            setLastAction(action);
        }
    };

    const lastMousePosition = useRef<Coordinates>({ x: 0, y: 0 });

    const onMouseEvent = useCallback((event: MouseEvent) => {
        if (socket) {
            const coordinates = getMappedCoordinates(event, canvasRef.current, width, height);
            switch (event.type) {
                case 'mousemove':
                    if (lastMousePosition.current.x !== coordinates.x ||
                        lastMousePosition.current.y !== coordinates.y) {
                        lastMousePosition.current = {
                            x: coordinates.x,
                            y: coordinates.y,
                        };
                        socket.emit('input:mousemove', {
                            x: coordinates.x,
                            y: coordinates.y,
                        });
                        setLastAction('move');
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
                default:
                    console.log('Default mouseEvent registered');
                    return;
            }
        }
    }, [socket, width, height, setLastAction]);

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

    const handleCanvasClick = useCallback((event: MouseEvent) => {
        if (canvasRef.current && highlighterData) {
            const canvasRect = canvasRef.current.getBoundingClientRect();
            const clickX = event.clientX - canvasRect.left;
            const clickY = event.clientY - canvasRect.top;

            const highlightRect = highlighterData.rect;
            if (
                clickX >= highlightRect.left &&
                clickX <= highlightRect.right &&
                clickY >= highlightRect.top &&
                clickY <= highlightRect.bottom
            ) {
                setPendingClick({ x: clickX, y: clickY });
                setShowConfirmation(true);
            }
        }
    }, [highlighterData]);

    const handleConfirmation = (confirmed: boolean) => {
        if (confirmed && pendingClick && socket && canvasRef.current) {
            const mappedCoordinates = getMappedCoordinates(
                { clientX: pendingClick.x, clientY: pendingClick.y } as MouseEvent,
                canvasRef.current,
                width,
                height
            );
            socket.emit('input:mousedown', mappedCoordinates);
            setLastAction('click');
        }
        setShowConfirmation(false);
        setPendingClick(null);
    };

    useEffect(() => {
        if (canvasRef.current) {
            onCreateRef(canvasRef);
            canvasRef.current.addEventListener('click', handleCanvasClick);
            canvasRef.current.addEventListener('mousemove', onMouseEvent);
            canvasRef.current.addEventListener('wheel', onMouseEvent, { passive: true });
            canvasRef.current.addEventListener('keydown', onKeyboardEvent);
            canvasRef.current.addEventListener('keyup', onKeyboardEvent);

            return () => {
                if (canvasRef.current) {
                    canvasRef.current.removeEventListener('click', handleCanvasClick);
                    canvasRef.current.removeEventListener('mousemove', onMouseEvent);
                    canvasRef.current.removeEventListener('wheel', onMouseEvent);
                    canvasRef.current.removeEventListener('keydown', onKeyboardEvent);
                    canvasRef.current.removeEventListener('keyup', onKeyboardEvent);
                }
            };
        }
    }, [onMouseEvent, onKeyboardEvent, handleCanvasClick, onCreateRef]);

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