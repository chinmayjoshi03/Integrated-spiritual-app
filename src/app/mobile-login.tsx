import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AuthShell, authStyles } from '@/components/auth-shell';
import { ActionButton, Field } from '@/components/karma-ui';

export default function MobileLogin() { const [phone, setPhone] = useState(''); return <AuthShell title="Sign in by mobile" subtitle="We’ll send a one-time code to your phone."><View style={authStyles.form}><Field label="Mobile number" placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" /><ActionButton label="Send OTP" onPress={() => router.push({ pathname: '/otp', params: { phone } } as any)} /><Pressable onPress={() => router.back()}><Text style={[authStyles.link, { textAlign: 'center' }]}>Use email instead</Text></Pressable></View></AuthShell>; }
