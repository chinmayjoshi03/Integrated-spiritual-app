import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';

export default function SignIn() {
  const { signIn } = useSession();
  const params = useLocalSearchParams<{ verified?: string; email?: string }>();
  const justVerified = params.verified === '1';
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (result) {
      setError(result);
    } else {
      router.replace('/');
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Continue your journey inward.">
      <View style={authStyles.form}>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        {justVerified && !error ? <Text style={authStyles.success}>Email verified. Sign in to continue.</Text> : null}

        <Field
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!loading}
        />
        
        <View style={authStyles.passwordWrap}>
          <Field
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
            editable={!loading}
          />
          <Pressable style={authStyles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
            <Text style={authStyles.link}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => router.push('/forgot-password' as any)}>
          <Text style={[authStyles.link, { textAlign: 'right' }]}>Forgot password?</Text>
        </Pressable>

        <ActionButton label={loading ? 'Signing in…' : 'Sign in'} onPress={submit} loading={loading} />

        <View style={authStyles.row}>
          <Text style={authStyles.plain}>New to The Karm Vajra?</Text>
          <Pressable onPress={() => router.push('/sign-up')}>
            <Text style={authStyles.link}>Create an account</Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}
