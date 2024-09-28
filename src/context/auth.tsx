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
    dispatch: React.Dispatch<ActionType>;
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
    axios.defaults.withCredentials = true;

    useEffect(() => {
        const storedUser = window.localStorage.getItem('user');
        if (storedUser) {
            dispatch({ type: 'LOGIN', payload: JSON.parse(storedUser) });
        }
    }, []);

    axios.interceptors.response.use(
        function (response) {
            return response;
        },
        function (error) {
            const res = error.response;
            if (res.status === 401 && res.config && !res.config.__isRetryRequest) {
                return new Promise((resolve, reject) => {
                    axios
                        .get('http://localhost:8080/auth/logout')
                        .then(() => {
                            console.log('/401 error > logout');
                            dispatch({ type: 'LOGOUT' });
                            window.localStorage.removeItem('user');
                            navigate('/login');
                        })
                        .catch((err) => {
                            console.error('AXIOS INTERCEPTORS ERROR:', err);
                            reject(error);
                        });
                });
            }
            return Promise.reject(error);
        }
    );

    useEffect(() => {
        const getCsrfToken = async () => {
            try {
                const { data } = await axios.get('http://localhost:8080/csrf-token');
                if (data.csrfToken) {
                    (axios.defaults.headers as any)['X-CSRF-TOKEN'] = data.csrfToken;
                }
            } catch (error) {
                console.error('Error fetching CSRF token:', error);
            }
        };
        getCsrfToken();
    }, []);

    return (
        <AuthContext.Provider value={{ state, dispatch }}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext, AuthProvider };