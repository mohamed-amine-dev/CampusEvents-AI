import { useState, useCallback } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { getEventById } from '../../database/events'
import { callLLM } from '../../services/llm'
import { Colors, FontSize, FontWeight, BorderRadius, Spacing, Shadow } from '../../constants/theme'

const TABS = [
  { key: 'search',         label: 'Recherche',       icon: 'search-outline',      placeholder: 'Ex: "un atelier IA ce weekend", "quelque chose sur le stage"...' },
  { key: 'recommendation', label: 'Pour moi',         icon: 'bulb-outline',        placeholder: 'Ex: "suggère-moi des événements adaptés à mon profil"...' },
  { key: 'planning',       label: 'Planning',         icon: 'calendar-outline',    placeholder: 'Ex: "j\'ai cours lundi matin et exam jeudi, aide-moi à planifier"...' },
  { key: 'qa',             label: 'Questions',        icon: 'help-circle-outline', placeholder: 'Ex: "quels clubs sont actifs ce mois ?", "y a-t-il des places disponibles ?"...' },
] as const

type TabKey = typeof TABS[number]['key']

function getApiKey(): string {
  const fromEnv = process.env.EXPO_PUBLIC_GROQ_API_KEY
  if (fromEnv) return fromEnv
  const fromExtra = (Constants.expoConfig as any)?.extra?.groqApiKey
  if (fromExtra && fromExtra !== 'gsk_your_key_here') return fromExtra
  return ''
}

// ─── Result types ───────────────────────────────────────────
type SearchResult  = { id: string; title: string; justification: string }
type RecoResult    = { id: string; title: string; reason: string }
type PlanningSlot  = { day: string; time: string; eventId: string; title: string; location: string; note: string }
type AIResult =
  | { type: 'search';         items: SearchResult[] }
  | { type: 'recommendation'; items: RecoResult[] }
  | { type: 'planning';       slots: PlanningSlot[] }
  | { type: 'qa';             answer: string }

function parseResult(type: TabKey, outputText: string): AIResult | null {
  try {
    if (type === 'qa') return { type: 'qa', answer: outputText }
    const parsed = JSON.parse(outputText)
    if (type === 'search')         return { type: 'search',         items: parsed }
    if (type === 'recommendation') return { type: 'recommendation', items: parsed }
    if (type === 'planning')       return { type: 'planning',       slots: parsed }
  } catch {
    if (type === 'qa') return { type: 'qa', answer: outputText }
  }
  return null
}

// ─── Sub-renderers ──────────────────────────────────────────
function SearchResultCard({ item }: { item: SearchResult }) {
  const router = useRouter()
  const event = getEventById(item.id)
  return (
    <TouchableOpacity style={styles.resultCard} onPress={() => event && router.push(`/event/${item.id}`)} activeOpacity={0.85}>
      <View style={styles.resultCardHeader}>
        <Ionicons name="flash" size={14} color={Colors.primary} />
        <Text style={styles.resultCardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      {event && (
        <Text style={styles.resultCardMeta}>
          {event.category} · {event.locationName}
        </Text>
      )}
      <Text style={styles.resultCardJustification}>{item.justification}</Text>
    </TouchableOpacity>
  )
}

function RecoResultCard({ item }: { item: RecoResult }) {
  const router = useRouter()
  const event = getEventById(item.id)
  return (
    <TouchableOpacity style={styles.resultCard} onPress={() => event && router.push(`/event/${item.id}`)} activeOpacity={0.85}>
      <View style={styles.resultCardHeader}>
        <Ionicons name="star" size={14} color={Colors.warning} />
        <Text style={styles.resultCardTitle} numberOfLines={2}>{item.title}</Text>
      </View>
      {event && (
        <Text style={styles.resultCardMeta}>
          {event.category} · {event.locationName}
        </Text>
      )}
      <Text style={styles.resultCardJustification}>{item.reason}</Text>
    </TouchableOpacity>
  )
}

function PlanningSlotCard({ slot }: { slot: PlanningSlot }) {
  const router = useRouter()
  return (
    <TouchableOpacity style={[styles.resultCard, styles.planningCard]} onPress={() => router.push(`/event/${slot.eventId}`)} activeOpacity={0.85}>
      <View style={styles.planningTime}>
        <Text style={styles.planningDay}>{slot.day}</Text>
        <Text style={styles.planningHour}>{slot.time}</Text>
      </View>
      <View style={styles.planningBody}>
        <Text style={styles.resultCardTitle} numberOfLines={1}>{slot.title}</Text>
        <Text style={styles.resultCardMeta}>{slot.location}</Text>
        {slot.note ? <Text style={styles.planningNote}>{slot.note}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

function QAAnswer({ answer }: { answer: string }) {
  return (
    <View style={[styles.resultCard, styles.qaCard]}>
      <View style={styles.resultCardHeader}>
        <Ionicons name="chatbubble-ellipses" size={14} color={Colors.primary} />
        <Text style={[styles.resultCardTitle, { color: Colors.primary }]}>Réponse de l'IA</Text>
      </View>
      <Text style={styles.qaText}>{answer}</Text>
    </View>
  )
}

// ─── Main Screen ────────────────────────────────────────────
export default function AssistantScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()

  const [activeTab, setActiveTab] = useState<TabKey>('search')
  const [inputs, setInputs] = useState<Record<TabKey, string>>({
    search: '', recommendation: '', planning: '', qa: '',
  })
  const [results, setResults] = useState<Record<TabKey, AIResult | null>>({
    search: null, recommendation: null, planning: null, qa: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fromCache, setFromCache] = useState(false)

  const tab = TABS.find(t => t.key === activeTab)!
  const apiKey = getApiKey()

  async function handleSend(retrying = false) {
    const text = retrying ? inputs[activeTab] : inputs[activeTab].trim()
    if (!text || loading) return

    if (!apiKey) {
      setError('Clé API manquante. Configurez EXPO_PUBLIC_GROQ_API_KEY dans .env')
      return
    }

    setError('')
    setFromCache(false)
    setLoading(true)

    try {
      const { outputText, fromCache: cached } = await callLLM(
        user!.id,
        activeTab,
        text,
        apiKey
      )

      const parsed = parseResult(activeTab, outputText)
      setResults(prev => ({ ...prev, [activeTab]: parsed }))
      setFromCache(cached)

      if (!parsed) {
        setError('Réponse inattendue du modèle. Réessayez.')
      }
    } catch (e: any) {
      setError(e.message || 'Erreur de communication avec l\'IA')
    } finally {
      setLoading(false)
    }
  }

  function switchTab(key: TabKey) {
    if (loading) return
    setActiveTab(key)
    setError('')
  }

  function renderResult() {
    const result = results[activeTab]

    if (loading) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>L'IA réfléchit…</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View style={styles.centerState}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Une erreur s'est produite</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => handleSend(true)}>
            <Ionicons name="refresh" size={16} color={Colors.textWhite} />
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!result) {
      return (
        <View style={styles.centerState}>
          <Ionicons name={tab.icon as any} size={48} color={Colors.primaryLight} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'search' && 'Recherche sémantique'}
            {activeTab === 'recommendation' && 'Recommandations personnalisées'}
            {activeTab === 'planning' && 'Planning intelligent'}
            {activeTab === 'qa' && 'Questions sur le catalogue'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'search' && 'Trouvez des événements en langage naturel — même sans mots-clés exacts.'}
            {activeTab === 'recommendation' && 'L\'IA analyse vos favoris et inscriptions pour suggérer 3 événements pertinents.'}
            {activeTab === 'planning' && 'Décrivez vos contraintes horaires et obtenez un planning sans conflit.'}
            {activeTab === 'qa' && 'Posez n\'importe quelle question sur l\'ensemble du catalogue.'}
          </Text>
        </View>
      )
    }

    // Render structured results
    if (result.type === 'search') {
      if (result.items.length === 0) {
        return (
          <View style={styles.centerState}>
            <Ionicons name="search-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun événement trouvé</Text>
            <Text style={styles.emptySubtitle}>Essayez une formulation différente.</Text>
          </View>
        )
      }
      return (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {fromCache && <CacheBadge />}
          <Text style={styles.resultsCount}>{result.items.length} événement{result.items.length > 1 ? 's' : ''} trouvé{result.items.length > 1 ? 's' : ''}</Text>
          {result.items.map((item, i) => <SearchResultCard key={item.id ?? i} item={item} />)}
          <View style={{ height: 120 }} />
        </ScrollView>
      )
    }

    if (result.type === 'recommendation') {
      if (result.items.length === 0) {
        return (
          <View style={styles.centerState}>
            <Ionicons name="bulb-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Pas encore de recommandations</Text>
            <Text style={styles.emptySubtitle}>Ajoutez des favoris ou inscrivez-vous à des événements pour des suggestions personnalisées.</Text>
          </View>
        )
      }
      return (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {fromCache && <CacheBadge />}
          <Text style={styles.resultsCount}>3 suggestions pour vous</Text>
          {result.items.map((item, i) => <RecoResultCard key={item.id ?? i} item={item} />)}
          <View style={{ height: 120 }} />
        </ScrollView>
      )
    }

    if (result.type === 'planning') {
      if (result.slots.length === 0) {
        return (
          <View style={styles.centerState}>
            <Ionicons name="calendar-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun événement cette semaine</Text>
            <Text style={styles.emptySubtitle}>Il n'y a pas d'événements compatibles avec vos contraintes cette semaine.</Text>
          </View>
        )
      }
      return (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {fromCache && <CacheBadge />}
          <Text style={styles.resultsCount}>Planning suggéré — {result.slots.length} créneaux</Text>
          {result.slots.map((slot, i) => <PlanningSlotCard key={i} slot={slot} />)}
          <View style={{ height: 120 }} />
        </ScrollView>
      )
    }

    if (result.type === 'qa') {
      return (
        <ScrollView style={styles.resultsList} showsVerticalScrollIndicator={false}>
          {fromCache && <CacheBadge />}
          <QAAnswer answer={result.answer} />
          <View style={{ height: 120 }} />
        </ScrollView>
      )
    }

    return null
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.bottom}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Assistant IA</Text>
          <Text style={styles.subtitle}>Catalogue intelligent · Groq / LLaMA</Text>
        </View>
        <View style={styles.aiChip}>
          <Ionicons name="flash" size={12} color={Colors.primary} />
          <Text style={styles.aiChipText}>IA</Text>
        </View>
      </View>

      {/* Privacy warning */}
      <View style={styles.privacyBanner}>
        <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.privacyText}>Ne soumettez pas de données personnelles ou sensibles</Text>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive, loading && styles.tabDisabled]}
            onPress={() => switchTab(t.key)}
            disabled={loading}
          >
            <Ionicons name={t.icon as any} size={14} color={activeTab === t.key ? Colors.textWhite : Colors.textSecondary} />
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result area */}
      <View style={styles.resultArea}>
        {renderResult()}
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <TextInput
          style={styles.input}
          value={inputs[activeTab]}
          onChangeText={(v) => setInputs(prev => ({ ...prev, [activeTab]: v }))}
          placeholder={tab.placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputs[activeTab].trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputs[activeTab].trim() || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color={Colors.textWhite} />
            : <Ionicons name="send" size={18} color={Colors.textWhite} />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function CacheBadge() {
  return (
    <View style={styles.cacheBadge}>
      <Ionicons name="time-outline" size={12} color={Colors.textSecondary} />
      <Text style={styles.cacheText}>Résultat en cache</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
  },
  title: { fontSize: FontSize.heading, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.caption, color: Colors.textSecondary, marginTop: 2 },
  aiChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  aiChipText: { fontSize: 11, fontWeight: FontWeight.bold, color: Colors.primary },

  privacyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  privacyText: { fontSize: 11, color: Colors.textSecondary, flex: 1 },

  tabsScroll: { maxHeight: 44, flexGrow: 0 },
  tabsRow: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.sm },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabDisabled: { opacity: 0.5 },
  tabText: { fontSize: FontSize.caption, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textWhite, fontWeight: FontWeight.semibold },

  resultArea: { flex: 1 },

  centerState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, gap: Spacing.md,
  },
  loadingText: { fontSize: FontSize.body, color: Colors.textSecondary },
  emptyTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'center' },
  emptySubtitle: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },

  errorTitle: { fontSize: FontSize.subhead, fontWeight: FontWeight.semibold, color: Colors.error },
  errorMsg: { fontSize: FontSize.body, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  retryText: { color: Colors.textWhite, fontWeight: FontWeight.semibold, fontSize: FontSize.body },

  resultsList: { flex: 1, paddingHorizontal: Spacing.xl },
  resultsCount: {
    fontSize: FontSize.caption, fontWeight: FontWeight.semibold, color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },

  resultCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, marginBottom: Spacing.md,
    gap: Spacing.xs, ...Shadow.level1,
  },
  resultCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  resultCardTitle: { fontSize: FontSize.body, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  resultCardMeta: { fontSize: FontSize.caption, color: Colors.textSecondary },
  resultCardJustification: {
    fontSize: FontSize.label, color: Colors.textSecondary, lineHeight: 20,
    borderLeftWidth: 3, borderLeftColor: Colors.primaryBorder,
    paddingLeft: Spacing.sm, marginTop: Spacing.xs,
  },

  planningCard: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  planningTime: {
    backgroundColor: Colors.primaryBg, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    alignItems: 'center', minWidth: 64,
    borderWidth: 1, borderColor: Colors.primaryBorder,
  },
  planningDay: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary, textTransform: 'uppercase' },
  planningHour: { fontSize: FontSize.body, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  planningBody: { flex: 1, gap: 4 },
  planningNote: { fontSize: FontSize.caption, color: Colors.textMuted, fontStyle: 'italic' },

  qaCard: {},
  qaText: { fontSize: FontSize.body, color: Colors.textPrimary, lineHeight: 24, marginTop: Spacing.sm },

  cacheBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-end', marginTop: Spacing.sm, marginBottom: -Spacing.xs,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 2,
    borderWidth: 1, borderColor: Colors.border,
  },
  cacheText: { fontSize: 10, color: Colors.textSecondary },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
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
    borderWidth: 1, borderColor: Colors.border,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
})
