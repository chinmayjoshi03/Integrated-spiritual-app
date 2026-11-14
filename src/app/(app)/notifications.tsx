import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader, Card, Screen, ui } from '@/components/karma-ui';
import { Palette } from '@/constants/theme';
import { useSession } from '@/context/auth-context';
import {
  type AppNotification,
  apiDismissNotification,
  apiGetNotifications,
  apiMarkAllNotificationsRead,
  apiMarkNotificationRead,
} from '@/services/api';
import { useFocusEffect } from 'expo-router';

// Map notification type prefix → emoji icon
function iconForType(type: string): string {
  if (type.startsWith('EVENT')) return '📅';
  if (type.startsWith('VOLUNTEERING')) return '🤝';
  if (type.startsWith('COMMUNITY')) return '💬';
  if (type.includes('MEDITATION')) return '🌸';
  if (type.startsWith('SUPPORT')) return '🆘';
  return '🔔';
}

// Navigate to the entity the notification is about
function pathForNotification(type: string, entityId: number | null): string | null {
  if (!entityId) return null;
  if (type.startsWith('EVENT')) return `/events/${entityId}`;
  if (type.startsWith('COMMUNITY')) return `/community/${entityId}`;
  if (type.startsWith('MEDITATION') || type.includes('MEDITATION')) return `/meditation/${entityId}`;
  if (type.startsWith('COURSE')) return `/courses/${entityId}`;
  return null;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const { session } = useSession();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [error, setError] = useState('');
  const [dismissingId, setDismissingId] = useState<number | null>(null);

  const loadItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    const res = await apiGetNotifications(session, {
      unreadOnly: filter === 'unread',
    });
    if (res.data) {
      setItems(res.data.notifications);
    } else {
      setError(res.error ?? 'Could not load notifications.');
    }
    setLoading(false);
  }, [session, filter]);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems])
  );

  const openNotification = async (item: AppNotification) => {
    if (!session) return;
    if (!item.is_read) {
      await apiMarkNotificationRead(session, item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
    }
    const path = pathForNotification(item.type, item.entity_id);
    if (path) router.push(path as any);
  };

  const handleMarkAll = async () => {
    if (!session) return;
    await apiMarkAllNotificationsRead(session);
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDismiss = async (item: AppNotification) => {
    if (!session || dismissingId !== null) return;
    setDismissingId(item.id);
    await apiDismissNotification(session, item.id);
    setItems((prev) => prev.filter((n) => n.id !== item.id));
    setDismissingId(null);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Screen>
        <AppHeader title="Notifications" subtitle="Stay current with your practice and community." back />

        {/* Toolbar */}
        <View style={styles.toolbar}>
          {/* Filter toggles */}
          <View style={styles.filterRow}>
            <Pressable
              style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]}
              onPress={() => setFilter('all')}
            >
              <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable
              style={[styles.filterBtn, filter === 'unread' && styles.filterBtnActive]}
              onPress={() => setFilter('unread')}
            >
              <Text
                style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}
              >
                Unread
              </Text>
            </Pressable>
          </View>

          <Pressable onPress={handleMarkAll}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>

        {error !== '' && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={Palette.gold} size="large" />
          </View>
        ) : items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={[ui.small, { textAlign: 'center' }]}>
              When something is published or a reminder is due, it will appear here.
            </Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <Pressable key={item.id} onPress={() => openNotification(item)}>
                <View style={[styles.notifRow, !item.is_read && styles.notifRowUnread]}>
                  {/* Unread dot */}
                  {!item.is_read && <View style={styles.unreadDot} />}

                  {/* Icon */}
                  <View style={styles.notifIcon}>
                    <Text style={styles.notifIconEmoji}>{iconForType(item.type)}</Text>
                  </View>

                  {/* Body */}
                  <View style={styles.notifBody}>
                    <Text
                      style={[styles.notifTitle, !item.is_read && styles.notifTitleUnread]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.notifMessage} numberOfLines={2}>
                      {item.message}
                    </Text>
                    <Text style={styles.notifMeta}>
                      {relativeTime(item.created_at)}
                      {!item.is_read ? ' · Unread' : ''}
                    </Text>
                  </View>

                  {/* Dismiss */}
                  <Pressable
                    style={styles.dismissBtn}
                    disabled={dismissingId !== null}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDismiss(item);
                    }}
                  >
                    <Text style={styles.dismissIcon}>✕</Text>
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </Screen>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.ivory },

  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Palette.surface,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: Palette.line,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 11,
  },
  filterBtnActive: { backgroundColor: Palette.goldDark },
  filterText: { color: Palette.stone, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: Palette.surface, fontWeight: '700' },
  markAllText: { color: Palette.goldDark, fontSize: 13, fontWeight: '700' },

  loadingWrap: { paddingVertical: 48, alignItems: 'center' },
  errorCard: { backgroundColor: Palette.blush },
  errorText: { color: Palette.danger, fontSize: 14 },

  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyIcon: { fontSize: 44 },
  emptyTitle: {
    color: Palette.charcoal,
    fontFamily: 'serif',
    fontSize: 18,
    fontWeight: '700',
  },

  list: { gap: 2 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Palette.surface,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: Palette.line,
    position: 'relative',
    overflow: 'hidden',
  },
  notifRowUnread: {
    backgroundColor: '#FEFDF8',
    borderColor: Palette.gold,
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    left: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Palette.goldDark,
  },
  notifIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Palette.goldSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifIconEmoji: { fontSize: 18 },
  notifBody: { flex: 1, gap: 3 },
  notifTitle: {
    color: Palette.stone,
    fontSize: 14,
    fontWeight: '600',
  },
  notifTitleUnread: { color: Palette.charcoal, fontWeight: '700' },
  notifMessage: { color: Palette.charcoal, fontSize: 13, lineHeight: 18 },
  notifMeta: { color: Palette.stoneLight, fontSize: 11, marginTop: 2 },
  dismissBtn: {
    padding: 6,
    flexShrink: 0,
  },
  dismissIcon: { color: Palette.stoneLight, fontSize: 14 },
});
