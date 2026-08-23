import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';

export default function SignUp() {
  const { signUp } = useSession(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const submit = async () => { if (!email.trim() || !password) return setError('Email and password are required.'); if (password.length < 6) return setError('Password must be at least 6 characters.'); if (password !== confirm) return setError('Passwords do not match.'); setLoading(true); const result = await signUp(name.trim(), email.trim(), password); setLoading(false); if (result) setError(result); else router.replace('/'); };
  return <AuthShell title="Begin your journey" subtitle="Create a space for wisdom, stillness, and growth."><View style={authStyles.form}>{error ? <Text style={authStyles.error}>{error}</Text> : null}<Field label="Your name" placeholder="What should we call you?" value={name} onChangeText={setName} autoCapitalize="words" /><Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" /><View style={authStyles.passwordWrap}><Field label="Password" placeholder="At least 6 characters" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="new-password" /><Pressable style={authStyles.passwordToggle} onPress={() => setShowPassword(!showPassword)}><Text style={authStyles.link}>{showPassword ? 'Hide' : 'Show'}</Text></Pressable></View><Field label="Confirm password" placeholder="Enter your password again" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPassword} autoComplete="new-password" /><ActionButton label={loading ? 'Creating account…' : 'Create account'} onPress={submit} disabled={loading} />{loading ? <ActivityIndicator /> : null}<View style={authStyles.row}><Text style={authStyles.plain}>Already a member?</Text><Pressable onPress={() => router.back()}><Text style={authStyles.link}>Sign in</Text></Pressable></View></View></AuthShell>;
}
