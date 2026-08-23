import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';

export default function ForgotPassword() { const [email, setEmail] = useState(''); const [sent, setSent] = useState(false); return <AuthShell title="Restore your access" subtitle="We’ll help you return to your practice."><View style={authStyles.form}>{sent ? <Text style={authStyles.error}>A reset link has been prepared for {email || 'your inbox'}.</Text> : <Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />}<ActionButton label={sent ? 'Back to sign in' : 'Send reset link'} onPress={() => sent ? router.replace('/sign-in') : setSent(true)} /><Pressable onPress={() => router.back()}><Text style={[authStyles.link, { textAlign: 'center' }]}>Return to sign in</Text></Pressable></View></AuthShell>; }
