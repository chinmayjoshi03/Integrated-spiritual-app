import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field, Notice } from '@/components/karma-ui';
import { apiForgotPassword } from '@/services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!EMAIL_RE.test(email.trim())) {
      setError('Please enter the email address you signed up with.');
      return;
    }
    setLoading(true);
    const res = await apiForgotPassword(email.trim());
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSent(res.data?.message || 'If an account exists for this email, a reset link has been sent.');
  };

  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to choose a new password.">
      <View style={authStyles.form}>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}
        {sent ? (
          <>
            <Notice tone="success">{sent}</Notice>
            <Text style={[authStyles.plain, { textAlign: 'center' }]}>
              Open the link in the email to set a new password, then sign in here.
            </Text>
            <ActionButton label="Back to sign in" onPress={() => router.replace('/sign-in')} />
          </>
        ) : (
          <>
            <Field
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <ActionButton label="Send reset link" onPress={submit} loading={loading} />
            <Pressable onPress={() => router.back()}>
              <Text style={[authStyles.link, { textAlign: 'center' }]}>Return to sign in</Text>
            </Pressable>
          </>
        )}
      </View>
    </AuthShell>
  );
}
