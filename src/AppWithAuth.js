import React from 'react';
import { AuthWrapper } from './components/auth/AuthWrapper';
import App from './App';

// This is an example of how to integrate authentication with your existing App
// To use this, rename your current App.js to App.js.backup and rename this file to App.js

export default function AppWithAuth() {
  return (
    <AuthWrapper>
      <App />
    </AuthWrapper>
  );
}