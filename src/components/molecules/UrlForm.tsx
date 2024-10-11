import { useState, useEffect, useCallback } from 'react';
import type { SyntheticEvent } from 'react';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { NavBarForm, NavBarInput } from "../atoms/form";
import { UrlFormButton } from "../atoms/buttons/buttons";
import { useSocketStore } from '../../context/socket';
import { Socket } from "socket.io-client";

type Props = {
    currentAddress: string;
    handleRefresh: (socket: Socket) => void;
    setCurrentAddress: (address: string) => void;
};

export const UrlForm = ({
    currentAddress,
    handleRefresh,
    setCurrentAddress,
}: Props) => {
    // Internal address state, initially set to currentAddress. We need this else the input field will not update with recordingUrl 
    const [address, setAddress] = useState<string>(currentAddress);
    const { socket } = useSocketStore();

    const onChange = useCallback((event: SyntheticEvent): void => {
        setAddress((event.target as HTMLInputElement).value);
    }, []);

    const onSubmit = (event: SyntheticEvent): void => {
        event.preventDefault();
        let url = address;

        // If no manual change, use the currentAddress prop
        if (address === currentAddress) {
            url = currentAddress;
        }

        // Add protocol if missing
        if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
            url = "https://" + url;
            setAddress(url);  // Update the input field to reflect protocol addition
        }

        try {
            // Validate the URL
            new URL(url);
            setCurrentAddress(url); 
        } catch (e) {
            alert(`ERROR: ${url} is not a valid url!`);
        }
    };

    // Sync internal state with currentAddress prop when it changes
    useEffect(() => {
        setAddress(currentAddress);
    }, [currentAddress]);

    return (
        <NavBarForm onSubmit={onSubmit}>
            <NavBarInput
                type="text"
                value={address}
                onChange={onChange}
            />
            <UrlFormButton type="submit">
                <KeyboardArrowRightIcon />
            </UrlFormButton>
        </NavBarForm>
    );
};
