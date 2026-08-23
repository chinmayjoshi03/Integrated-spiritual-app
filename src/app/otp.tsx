import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';

export default function Otp() { const { phone } = useLocalSearchParams<{ phone: string }>(); const [code, setCode] = useState(''); const [verified, setVerified] = useState(false); return <AuthShell title={verified ? 'You are verified' : 'Enter your code'} subtitle={verified ? 'Your demo sign-in is complete.' : `We sent a code to ${phone || 'your mobile number'}.`}><View style={authStyles.form}>{!verified ? <Field label="One-time password" placeholder="6-digit code" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} /> : <Text style={authStyles.error}>This is a frontend demo. Email sign-in remains connected to the backend.</Text>}<ActionButton label={verified ? 'Return to email sign in' : 'Verify code'} onPress={() => verified ? router.replace('/sign-in') : setVerified(true)} /></View></AuthShell>; }
