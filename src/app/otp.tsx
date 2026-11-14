import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';
import { apiResendOtp } from '@/services/api';

export default function Otp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyOtp } = useSession();

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    setError('');
    if (!code || code.length < 4) return setError('Please enter the verification code.');

    setLoading(true);
    const err = await verifyOtp(email, code.trim());
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      router.replace('/');
    }
  };

  const resend = async () => {
    if (!email) return;
    setResending(true);
    setResent(false);
    setError('');
    await apiResendOtp(email);
    setResending(false);
    setResent(true);
  };

  return (
    <AuthShell
      title="Verify your email"
      subtitle={`We sent a code to ${email || 'your email'}. Enter it below to complete registration.`}
    >
      <View style={authStyles.form}>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        {resent ? <Text style={authStyles.link}>Code resent — check your inbox.</Text> : null}

        <Field
          label="Verification code"
          placeholder="Enter the code from your email"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />

        <ActionButton
          label={loading ? 'Verifying…' : 'Verify & sign in'}
          onPress={submit}
          disabled={loading}
        />
        {loading ? <ActivityIndicator /> : null}

        <View style={authStyles.row}>
          <Text style={authStyles.plain}>Didn't receive it?</Text>
          <Pressable onPress={resend} disabled={resending}>
            <Text style={authStyles.link}>{resending ? 'Resending…' : 'Resend code'}</Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}
