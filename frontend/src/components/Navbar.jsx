import React from 'react';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <a href="/home" className="navbar-logo" aria-label="Streamify Home">
          <span className="navbar-svg-logo">
            <svg width="40" height="40" viewBox="0 0 176 211" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M88 0.083334H175.75V70.3609V140.639H88V210.917H0.25V140.639V70.3609H88V0.083334V0.083334Z" fill="#fff"/>
            </svg>
          </span>
          <span className="navbar-title">Streamify</span>
        </a>
      </div>
      <div className="navbar-center">
        <a href="/home" className="navbar-icon" aria-label="Home">
          <svg width="24" height="24" fill="none"><path d="M3 12L12 4l9 8v8a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-4h-2v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8z" stroke="#fff" strokeWidth="2" strokeLinejoin="round"/></svg>
        </a>
        <a href="/home" className="navbar-icon" aria-label="Search">
          <svg width="24" height="24" fill="none"><circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2"/><path d="M20 20l-4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </a>
        <a href="/library" className="navbar-icon" aria-label="Library">
          <svg width="24" height="24" fill="none"><rect x="3" y="4" width="18" height="16" rx="2" stroke="#fff" strokeWidth="2"/><path d="M7 8h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M7 12h10" stroke="#fff" strokeWidth="2" strokeLinecap="round"/><path d="M7 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>
        </a>
      </div>
      <div className="navbar-right">
        <a
          className="navbar-avatar"
          href="/profile"
          title={currentUser?.displayName || 'Profile'}
        >
          <img
            src={currentUser?.photoURL || 'https://randomuser.me/api/portraits/women/44.jpg'}
            alt="User Avatar"
          />
        </a>
      </div>
    </nav>
  );
}
