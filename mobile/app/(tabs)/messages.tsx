import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, IconButton, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';
import { colors, spacing } from '../../constants/theme';

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState(null);
  const [coupleUnit, setCoupleUnit] = useState(null);
  const [partner, setPartner] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    if (coupleUnit) {
      fetchMessages();
      // Subscribe to new messages
      const subscription = supabase
        .channel('messages')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `couple_unit_id=eq.${coupleUnit.id}`,
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [coupleUnit]);

  async function initializeChat() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Get couple unit
      const { data: coupleData } = await supabase
        .from('couple_units')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'active')
        .single();

      if (coupleData) {
        setCoupleUnit(coupleData);

        // Get partner
        const partnerId = coupleData.user1_id === user.id
          ? coupleData.user2_id
          : coupleData.user1_id;

        const { data: partnerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', partnerId)
          .single();

        setPartner(partnerData);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('couple_unit_id', coupleUnit.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      scrollToBottom();

      // Mark unread messages as read
      await markMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }

  async function markMessagesAsRead() {
    try {
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('couple_unit_id', coupleUnit.id)
        .neq('sender_id', userId)
        .is('read_at', null);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !coupleUnit) return;

    setSending(true);
    try {
      await supabase
        .from('messages')
        .insert([{
          couple_unit_id: coupleUnit.id,
          sender_id: userId,
          message_text: newMessage.trim(),
          message_type: 'text',
        }]);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  const renderMessage = ({ item }) => {
    const isOwnMessage = item.sender_id === userId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessageContainer : styles.partnerMessageContainer,
        ]}
      >
        <Card
          style={[
            styles.messageCard,
            isOwnMessage ? styles.ownMessage : styles.partnerMessage,
          ]}
        >
          <Card.Content style={styles.messageContent}>
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.partnerMessageText,
            ]}>
              {item.message_text}
            </Text>
            <Text style={[
              styles.timestamp,
              isOwnMessage ? styles.ownTimestamp : styles.partnerTimestamp,
            ]}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading messages...</Text>
      </View>
    );
  }

  if (!coupleUnit || !partner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTitle}>No Partner Connected</Text>
          <Text style={styles.emptyText}>
            Connect with your partner to start messaging
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={100}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages with {partner.name}</Text>
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyMessagesText}>
                No messages yet. Start the conversation! 💬
              </Text>
            </View>
          }
          onContentSizeChange={scrollToBottom}
        />

        <View style={styles.inputContainer}>
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            mode="outlined"
            style={styles.input}
            multiline
            maxLength={1000}
            onSubmitEditing={sendMessage}
            data-testid="message-input"
          />
          <IconButton
            icon="send"
            mode="contained"
            iconColor={colors.white}
            containerColor={colors.accent}
            size={24}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
            style={styles.sendButton}
            data-testid="send-message-btn"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  messagesList: {
    padding: spacing.md,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
  },
  partnerMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageCard: {
    elevation: 1,
  },
  ownMessage: {
    backgroundColor: colors.accent,
  },
  partnerMessage: {
    backgroundColor: colors.white,
  },
  messageContent: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  ownMessageText: {
    color: colors.white,
  },
  partnerMessageText: {
    color: colors.black,
  },
  timestamp: {
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  partnerTimestamp: {
    color: colors.gray,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: spacing.sm,
    backgroundColor: colors.background,
    maxHeight: 100,
  },
  sendButton: {
    margin: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
  emptyMessages: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyMessagesText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: 'center',
  },
});
