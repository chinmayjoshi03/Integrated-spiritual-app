import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthShell, authStyles } from '@/components/auth-shell';
import { DateField } from '@/components/date-field';
import { ActionButton, Field } from '@/components/karma-ui';
import { useSession } from '@/context/auth-context';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Backend rule (utils/userProfile.js): 7–15 digits, optional leading "+".
const normalisePhone = (value: string) => value.replace(/[\s().-]/g, '');
const PHONE_RE = /^\+?\d{7,15}$/;

export default function SignUp() {
  const { signUp } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter your name.');
    if (!EMAIL_RE.test(email.trim())) return setError('Please enter a valid email address.');
    if (!PHONE_RE.test(normalisePhone(phoneNumber))) return setError('Enter a valid phone number with 7 to 15 digits.');
    if (!dateOfBirth) return setError('Please choose your date of birth.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    const { error: err, email: registeredEmail } = await signUp({
      name,
      email,
      password,
      phoneNumber: normalisePhone(phoneNumber),
      dateOfBirth,
    });
    setLoading(false);

    if (err) {
      setError(err);
    } else {
      // Backend emailed a verification code — continue to the OTP screen.
      router.push({ pathname: '/otp', params: { email: registeredEmail! } });
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Begin your journey with The Karm Vajra.">
      <View style={authStyles.form}>
        {error ? <Text style={authStyles.error}>{error}</Text> : null}

        <Field label="Full name" placeholder="What should we call you?" value={name} onChangeText={setName} autoCapitalize="words" autoComplete="name" />
        <Field label="Email address" placeholder="you@example.com" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Field
          label="Phone number"
          placeholder="+91 98765 43210"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoComplete="tel"
          hint="Include country code if needed."
        />
        <DateField label="Date of birth" value={dateOfBirth} onChange={setDateOfBirth} maximumDate={new Date()} />
        <View style={authStyles.passwordWrap}>
          <Field
            label="Password"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="new-password"
          />
          <Pressable style={authStyles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
            <Text style={authStyles.link}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>
        <Field
          label="Confirm password"
          placeholder="Re-enter your password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={!showPassword}
          autoComplete="new-password"
        />

        <ActionButton label={loading ? 'Creating account…' : 'Create account'} onPress={submit} loading={loading} />

        <View style={authStyles.row}>
          <Text style={authStyles.plain}>Already a member?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={authStyles.link}>Sign in</Text>
          </Pressable>
        </View>
      </View>
    </AuthShell>
  );
}
