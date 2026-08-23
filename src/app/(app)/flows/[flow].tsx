import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, AppHeader, AppIcon, Card, Field, Pill, Screen, SectionTitle, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { usePrototype } from '@/context/prototype-context';
import { flowFor } from '@/data/flows';

export default function FlowScreen() {
  const { flow: slug } = useLocalSearchParams<{ flow: string }>();
  const flow = flowFor(slug);
  const state = usePrototype();
  const [selected, setSelected] = useState(flow.items[0]);
  const [message, setMessage] = useState('');
  const [notice, setNotice] = useState('');
  const onAction = () => {
    if (flow.kind === 'meditation') state.toggleBookmark(flow.title);
    if (flow.kind === 'event') state.registerEvent(flow.title);
    if (flow.kind === 'donation') state.addDonation(501);
    if (flow.kind === 'mood') state.addMood(selected);
    if (flow.kind === 'notification') state.toggleNotifications();
    if (flow.kind === 'course') state.advanceCourse();
    if (flow.kind === 'practice') state.toggleTask(selected);
    if (flow.kind === 'chat' && message.trim()) { state.sendMessage(message.trim()); setMessage(''); }
    setNotice(flow.kind === 'event' ? 'Your place is reserved.' : flow.kind === 'donation' ? 'Thank you for your generous offering.' : flow.kind === 'mood' ? 'Your check-in has been saved.' : 'Saved to your journey.');
  };
  return <Screen><AppHeader title={flow.title} subtitle={flow.eyebrow} back /><View><Text style={ui.title}>{flow.title}</Text><Text style={ui.body}>{flow.description}</Text></View>
    {flow.kind === 'chat' ? <Card style={styles.chat}>{state.messages.map((item, index) => <View key={`${item}-${index}`} style={[styles.bubble, index % 2 === 1 && styles.mine]}><Text style={styles.bubbleText}>{item}</Text></View>)}<TextInput value={message} onChangeText={setMessage} placeholder="Write what is on your heart…" placeholderTextColor={Palette.stoneLight} style={styles.chatInput} multiline /></Card> : null}
    {flow.kind === 'form' ? <Card><Field label="Your name" placeholder="Your name" /><Field label="Email address" placeholder="you@example.com" keyboardType="email-address" /><Field label="A short note" placeholder="Tell us a little more" multiline /></Card> : null}
    {flow.kind === 'journal' ? <Card><Field label="Today I am grateful for" placeholder="Write freely…" multiline /><Field label="A gentle reflection" placeholder="What would you like to remember?" multiline /></Card> : null}
    <SectionTitle>{flow.kind === 'chat' ? 'Ways I can help' : 'Explore this space'}</SectionTitle>
    <Card>{flow.items.map((item, index) => <Pressable key={item} onPress={() => setSelected(item)} style={[styles.row, index === flow.items.length - 1 && styles.lastRow, selected === item && styles.selected]}><AppIcon name={selected === item ? 'check' : 'circle'} active={selected === item} /><Text style={styles.rowText}>{item}</Text>{flow.kind === 'course' && index === 1 ? <Pill>{`${state.courseProgress}%`}</Pill> : null}</Pressable>)}</Card>
    {flow.kind === 'notification' ? <Card style={styles.info}><Text style={styles.infoTitle}>{state.notificationsEnabled ? 'Reminders are on' : 'Reminders are paused'}</Text><Text style={ui.small}>You can change this at any time.</Text></Card> : null}
    {flow.kind === 'session' ? <Card style={styles.info}><Text style={styles.infoTitle}>Your account is protected</Text><Text style={ui.small}>Use this space to manage active sign-ins.</Text></Card> : null}
    {notice ? <Card style={styles.notice}><Text style={styles.noticeText}>{notice}</Text></Card> : null}
    <ActionButton label={flow.action} onPress={onAction} />
    {flow.kind === 'event' ? <ActionButton variant="outline" label="View your ticket" onPress={() => router.push('/flows/events' as any)} /> : null}
  </Screen>;
}
const styles = StyleSheet.create({ row: { minHeight: 53, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: Palette.line, paddingHorizontal: 4 }, lastRow: { borderBottomWidth: 0 }, selected: { backgroundColor: '#FCF8ED', borderRadius: 12 }, rowText: { color: Palette.charcoal, fontSize: 16, flex: 1 }, chat: { gap: 10 }, bubble: { alignSelf: 'flex-start', maxWidth: '87%', backgroundColor: Palette.goldSoft, borderRadius: 16, padding: 11 }, mine: { alignSelf: 'flex-end', backgroundColor: Palette.surface, borderWidth: 1, borderColor: Palette.line }, bubbleText: { color: Palette.charcoal, lineHeight: 20 }, chatInput: { minHeight: 76, borderRadius: 14, borderColor: Palette.line, borderWidth: 1, padding: 12, textAlignVertical: 'top', color: Palette.charcoal }, info: { backgroundColor: Palette.goldSoft }, infoTitle: { color: Palette.charcoal, fontFamily: 'serif', fontSize: 18, fontWeight: '700' }, notice: { backgroundColor: Palette.goldSoft, paddingVertical: 14 }, noticeText: { color: Palette.goldDark, fontWeight: '800', textAlign: 'center' } });
