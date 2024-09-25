import { useReducer, createContext, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface AuthProviderProps {
    children: React.ReactNode;
}

interface ActionType {
    type: 'LOGIN' | 'LOGOUT';
    payload?: any;
}

type InitialStateType = {
    user: any;
};

const initialState = {
    user: null,
};

const AuthContext = createContext<{
    state: InitialStateType;
    dispatch: any;
}>({
    state: initialState,
    dispatch: () => null,
});

const reducer = (state: InitialStateType, action: ActionType) => {
    switch (action.type) {
        case 'LOGIN':
            return {
                ...state,
                user: action.payload,
            };
        case 'LOGOUT':
            return {
                ...state,
                user: null,
            };
        default:
            return state;
    }
};

const AuthProvider = ({ children }: AuthProviderProps) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    const navigate = useNavigate();

    // get user info from local storage
    useEffect(() => {
        dispatch({
            type: 'LOGIN',
            payload: JSON.parse(window.localStorage.getItem('user') || 'null'),
        });
    }, []);

    axios.interceptors.response.use(
        function (response) {
            // any status code that lies within the range of 2XX causes this function to trigger
            return response;
        },
        function (error) {
            // any status codes that fall outside the range of 2XX cause this function to trigger
            let res = error.response;
            if (res.status === 401 && res.config && !res.config.__isRetryRequest) {
                return new Promise((resolve, reject) => {
                    axios
                        .get('http://localhost:8080/auth/logout')
                        .then((data) => {
                            console.log('/401 error > logout');
                            dispatch({ type: 'LOGOUT' });
                            window.localStorage.removeItem('user');
                            navigate('/login'); // Replace router.push with navigate
                        })
                        .catch((err) => {
                            console.log('AXIOS INTERCEPTORS ERROR:', err);
                            reject(error);
                        });
                });
            }
            return Promise.reject(error);
        }
    );

    // csrf - include tokens in the axios header every time a request is made
    useEffect(() => {
        const getCsrfToken = async () => {
            try {
                const { data } = await axios.get('http://localhost:8080/csrf-token');
                console.log('CSRF Token Response:', data);
                if (data && data.csrfToken) {
                    (axios.defaults.headers as any)['X-CSRF-TOKEN'] = data.csrfToken;
                } else {
                    console.error('CSRF token not found in the response');
                }
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
            }
        };
        getCsrfToken();
    }, []);

    return (
        <AuthContext.Provider value={{ state, dispatch }}>{children}</AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };
