import './Login.css';
import { auth, provider } from '../utils/firebaseConfig';
import { signInWithPopup } from 'firebase/auth';
import { useAuth } from '../context/AuthContext.jsx';
import { Navigate, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Login = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      navigate('/home', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = () => {
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        console.log('User Info:', user);
        navigate('/home', { replace: true });
      })
      .catch((error) => {
        console.error('Login Error:', error.message);
      });
  };

  if (currentUser) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="login-container">
      <div
        className="logo"
        dangerouslySetInnerHTML={{
          __html: `
        <svg width="176" height="211" viewBox="0 0 176 211" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M88 0.083334H175.75V70.3609V140.639H88V210.917H0.25V140.639V70.3609H88V0.083334V0.083334Z" fill="white"/>
        </svg>
      `,
        }}
      />
      <h1 className="title">Streamify</h1>
      <h2 className="subtitle">Stream and Download millions of songs</h2>
      <p className="terms">
        By continuing, you agree to our <span>Terms of Service</span> and{' '}
        <span>Privacy Policy</span>
      </p>
      <button className="google-btn" onClick={handleGoogleLogin}>
        <img src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Google_Favicon_2025.svg" alt="" id="google-btn-svg"/>
        Continue with Google
      </button>
      <footer>©2025–Streamify Made By <a href ='https://github.com/ShirshenduR'  target='_blank' style={{ color: 'inherit', textDecoration: 'underline', }}>Shirshendu R Tripathi</a></footer>
    </div>
  );
};

export default Login;
