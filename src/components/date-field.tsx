import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BrandFonts, Palette } from '@/constants/theme';

const pad = (n: number) => String(n).padStart(2, '0');

/** "YYYY-MM-DD" ↔ Date (local, no timezone shift). */
const toDate = (value: string) => {
  const [y, m, d] = value.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : new Date(2000, 0, 1);
};
const fromDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** "HH:MM" ↔ Date. */
const timeToDate = (value: string) => {
  const [h, m] = value.split(':').map(Number);
  const d = new Date();
  d.setHours(Number.isFinite(h) ? h : 7, Number.isFinite(m) ? m : 0, 0, 0);
  return d;
};
const fromTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function formatDisplayDate(value: string) {
  if (!value) return '';
  return toDate(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDisplayTime(value: string) {
  if (!value) return '';
  return timeToDate(value).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Tappable field that opens the native date (or time) picker.
 * value / onChange use "YYYY-MM-DD" for dates and "HH:MM" for times — the formats the backend expects.
 */
export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  placeholder,
  maximumDate,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  mode?: 'date' | 'time';
  placeholder?: string;
  maximumDate?: Date;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isTime = mode === 'time';
  const current = isTime ? timeToDate(value) : toDate(value);
  const display = isTime ? formatDisplayTime(value) : formatDisplayDate(value);
  const commit = (d: Date) => onChange(isTime ? fromTime(d) : fromDate(d));

  // Web has no native picker — plain text input in the backend format.
  if (Platform.OS === 'web') {
    return <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        editable={!disabled}
        placeholder={isTime ? 'HH:MM' : 'YYYY-MM-DD'}
        placeholderTextColor={Palette.stoneLight}
      />
    </View>;
  }


  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}${display ? `, ${display}` : ''}`}
      disabled={disabled}
      onPress={() => setOpen(true)}
      style={[styles.input, styles.trigger, disabled && { opacity: 0.6 }]}
    >
      <Text style={[styles.value, !display && styles.placeholder]}>{display || placeholder || (isTime ? 'Choose a time' : 'Choose a date')}</Text>
      <Ionicons name={isTime ? 'time-outline' : 'calendar-outline'} size={19} color={Palette.goldDark} />
    </Pressable>

    {open && Platform.OS === 'android' ? (
      <DateTimePicker
        value={current}
        mode={mode}
        maximumDate={maximumDate}
        onValueChange={(_e, d) => { setOpen(false); commit(d); }}
        onDismiss={() => setOpen(false)}
      />
    ) : null}

    {Platform.OS === 'ios' ? (
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={10}><Text style={styles.done}>Done</Text></Pressable>
            </View>
            <DateTimePicker
              value={current}
              mode={mode}
              display="spinner"
              maximumDate={maximumDate}
              onValueChange={(_e, d) => commit(d)}
              themeVariant="light"
            />
          </Pressable>
        </Pressable>
      </Modal>
    ) : null}
  </View>;
}

const styles = StyleSheet.create({
  field: { gap: 7 },
  label: { fontFamily: BrandFonts.bodySemi, color: Palette.charcoal, fontSize: 14 },
  input: { backgroundColor: Palette.surfaceRaised, borderWidth: 1, borderColor: Palette.line, borderRadius: 14, minHeight: 52, paddingHorizontal: 16, fontSize: 16, color: Palette.charcoal, fontFamily: BrandFonts.body },
  trigger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontFamily: BrandFonts.body, fontSize: 16, color: Palette.charcoal },
  placeholder: { color: Palette.stoneLight },
  backdrop: { flex: 1, backgroundColor: 'rgba(63,51,40,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: Palette.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, paddingTop: 8 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Palette.line },
  sheetTitle: { fontFamily: BrandFonts.heading, fontSize: 18, color: Palette.charcoal },
  done: { fontFamily: BrandFonts.bodyBold, fontSize: 16, color: Palette.goldDark },
});
