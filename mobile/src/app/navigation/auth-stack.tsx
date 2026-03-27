import React from 'react';
import { LoginScreen } from '../../features/auth/screens/login-screen';

export function AuthStack() {
  // Currently we just have one screen for auth, no need for actual Stack Navigator yet
  // but we keep this structure for scalability
  return <LoginScreen />;
}
