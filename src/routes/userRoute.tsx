import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useGlobalInfoStore } from "../context/globalInfo";

const UserRoute = ({ children }) => {
  const [ok, setOk] = useState(true);
  const navigate = useNavigate(); 

  const { notify } = useGlobalInfoStore();
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await axios.get('/api/current-user');
      if (data.ok) {
        setOk(true); 
      }
    } catch (err: any) {
      setOk(false);  
      notify('error', err.message || 'Please login again to continue');
      navigate('/'); 
    }
  };

  // Display loading message while fetching user data
  return <div>{!ok ? <p>Loading...</p> : <>{children}</>}</div>;
};

export default UserRoute;
