import React from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Navbar({ onSearchClick }) {
  const { currentUser } = useAuth();
  return (
    <nav className="navbar">
      {/* Hide logo/title on mobile, show only on desktop */}
      <div className="navbar-left">
        <Link to="/home" className="navbar-logo" aria-label="Streamify Home">
          <span className="navbar-svg-logo">
            <svg width="40" height="40" viewBox="0 0 176 211" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M88 0.083334H175.75V70.3609V140.639H88V210.917H0.25V140.639V70.3609H88V0.083334V0.083334Z" fill="#fff"/>
            </svg>
          </span>
          <span className="navbar-title">Streamify</span>
        </Link>
      </div>
      <div className="navbar-center">
        <Link to="/home" className="navbar-icon" aria-label="Home">
          {/* Modern Home Icon */}
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><path d="M3 12L12 5l9 7v7a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-3h-2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7z" stroke="#fff" strokeWidth="2.2" strokeLinejoin="round"/></svg>
        </Link>
        <button className="navbar-icon" aria-label="Search" onClick={onSearchClick} style={{background:'none',border:'none',padding:0,cursor:'pointer'}}>
          {/* Modern Search Icon */}
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2.2"/><path d="M20.5 20.5l-4.5-4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"/></svg>
        </button>
        <Link to="/library" className="navbar-icon" aria-label="Library">
          {/* Modern Library Icon */}
          <svg width="26" height="26" fill="none" viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="15" rx="2.5" stroke="#fff" strokeWidth="2.2"/><rect x="7.5" y="8.5" width="9" height="2" rx="1" fill="#fff"/><rect x="7.5" y="12.5" width="9" height="2" rx="1" fill="#fff"/></svg>
        </Link>
      </div>
      {/* Hide avatar on mobile, show only on desktop */}
      <div className="navbar-right">
        <Link
          className="navbar-avatar"
          to="/profile"
          title={currentUser?.displayName || 'Profile'}
        >
          <img
            src={currentUser?.photoURL || 'https://randomuser.me/api/portraits/women/44.jpg'}
            alt="User Avatar"
          />
        </Link>
      </div>
    </nav>
  );
}
