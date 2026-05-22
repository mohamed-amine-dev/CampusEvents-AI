import { useState, useRef, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../context/AuthContext'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme'
import { Badge, EmptyState } from '../../components/ui'

const TABS = [
  { key: 'search', label: 'Recherche', icon: 'search' },
  { key: 'recommendation', label: 'Recommandations', icon: 'bulb' },
  { key: 'planning', label: 'Planning', icon: 'calendar' },
  { key: 'qa', label: 'Questions', icon: 'help-circle' },
] as const

type TabKey = typeof TABS[number]['key']

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export default function AssistantScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [activeTab, setActiveTab] = useState<TabKey>('search')
  const [inputText, setInputText] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<TextInput>(null)

  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY || ''

  async function handleSend() {
    const text = inputText.trim()
    if (!text || loading) return

    setInputText('')
    setError('')

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            { role: 'system', content: `Tu es un assistant spécialisé dans les événements du campus. Réponds en français de manière concise et utile. Type de requête: ${activeTab}.` },
            { role: 'user', content: text },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()
      const assistantText = data.choices[0].message.content
      const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', text: assistantText }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e: any) {
      setError(e.message || 'Erreur de communication avec l\'IA')
    } finally {
      setLoading(false)
    }
  }

  function renderMessage({ item }: { item: Message }) {
    const isUser = item.role === 'user'
    return (
      <View style={[styles.bubbleRow, isUser ? styles.userRow : styles.assistantRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.bubbleText, isUser && { color: Colors.textWhite }]}>{item.text}</Text>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={[styles.container, { paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.title}>Assistant IA</Text>
        <Text style={styles.subtitle}>Posez vos questions sur les événements</Text>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? Colors.textWhite : Colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              icon="flash"
              title="Que puis-je faire pour vous ?"
              subtitle="Recherchez des événements, obtenez des recommandations, planifiez votre semaine"
            />
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>L'IA réfléchit...</Text>
            </View>
          ) : null
        }
      />

      {error ? (
        <View style={styles.errorBar}>
          <Ionicons name="alert-circle" size={16} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.inputBar}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Tapez votre message..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} onPress={handleSend} disabled={!inputText.trim() || loading}>
          <Ionicons name="send" size={20} color={Colors.textWhite} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.body, color: Colors.textSecondary, marginTop: Spacing.xs },
  tabsRow: { flexDirection: 'row', paddingHorizontal: Spacing.xl, gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textWhite, fontWeight: FontWeight.semibold },
  messagesList: { padding: Spacing.xl, gap: Spacing.md, paddingBottom: Spacing.xxl },
  bubbleRow: { flexDirection: 'row', marginBottom: Spacing.sm },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: Spacing.md, borderRadius: BorderRadius.lg },
  userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: 20 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: Spacing.xl },
  loadingText: { fontSize: FontSize.label, color: Colors.textSecondary },
  errorBar: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm, backgroundColor: Colors.errorBg },
  errorText: { fontSize: FontSize.caption, color: Colors.error, flex: 1 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 100,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: FontSize.body,
    color: Colors.textPrimary,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
})
