import { useState, useEffect, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { ErrorState } from '../../components/ui/ErrorState'
import { AiWarning } from '../../components/AiWarning'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { callLLM } from '../../services/llm'

type AiTab = 'search' | 'recommendation' | 'planning' | 'qa'

const API_KEY_STORAGE = '@campus.api_key'

export default function AssistantScreen() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<AiTab>('search')
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fromCache, setFromCache] = useState(false)
  const [showApiSettings, setShowApiSettings] = useState(false)
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    AsyncStorage.getItem(API_KEY_STORAGE).then((stored) => {
      if (stored) setApiKey(stored)
    })
  }, [])

  const getApiKey = (): string => {
    const envKey = Constants.expoConfig?.extra?.groqApiKey as string | undefined
    if (envKey && envKey !== 'gsk_your_key_here') return envKey
    if (apiKey) return apiKey
    throw new Error('Clé API non configurée. Configurez votre clé Groq API dans les paramètres ⚙️')
  }

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une clé API valide')
      return
    }
    await AsyncStorage.setItem(API_KEY_STORAGE, apiKey.trim())
    setShowApiSettings(false)
    Alert.alert('Succès', 'Clé API sauvegardée !')
  }

  const handleSubmit = async () => {
    if (!inputText.trim() || !user || loading) return
    setLoading(true)
    setError(null)
    setResult(null)
    setFromCache(false)

    try {
      const key = getApiKey()
      const response = await callLLM(user.email, activeTab, inputText.trim(), key)
      setResult(response.outputText)
      setFromCache(response.fromCache)
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'appel à l\'IA')
    }
    setLoading(false)
  }

  const renderSearchResults = (text: string) => {
    try {
      const items = JSON.parse(text)
      if (Array.isArray(items)) {
        return (
          <View>
            {items.length === 0 ? (
              <Text style={[styles.resultEmpty, { color: theme.colors.textSecondary }]}>
                Aucun événement pertinent trouvé.
              </Text>
            ) : (
              items.map((item: any, idx: number) => (
                <Card key={idx} style={styles.resultCard}>
                  <Text style={[styles.resultTitle, { color: theme.colors.text }]}>{item.title || item.eventId || 'Événement'}</Text>
                  <Text style={[styles.resultReason, { color: theme.colors.textSecondary }]}>
                    {item.reason || ''}
                  </Text>
                </Card>
              ))
            )}
          </View>
        )
      }
    } catch {}
    return (
      <Text style={[styles.resultText, { color: theme.colors.text }]}>{text}</Text>
    )
  }

  const renderResult = () => {
    if (!result) return null
    if (activeTab === 'search' || activeTab === 'recommendation') {
      return renderSearchResults(result)
    }
    return (
      <Text style={[styles.resultText, { color: theme.colors.text }]}>{result}</Text>
    )
  }

  const tabs: { key: AiTab; label: string; icon: string; placeholder: string; labelText: string }[] = [
    { key: 'search', label: 'Recherche', icon: '🔍', placeholder: 'Ex: quelque chose sur l\'IA ce weekend', labelText: 'Recherche en langage naturel' },
    { key: 'recommendation', label: 'Recommandation', icon: '🎯', placeholder: 'Ex: recommande-moi des événements', labelText: 'Recommandation personnalisée' },
    { key: 'planning', label: 'Planning', icon: '🗓️', placeholder: 'Ex: J\'ai cours lundi et mercredi matin', labelText: 'Assistant de planification' },
    { key: 'qa', label: 'Questions', icon: '💬', placeholder: 'Ex: Quels clubs sont actifs ce mois-ci ?', labelText: 'Questions sur le catalogue' },
  ]

  const currentTab = tabs.find((t) => t.key === activeTab)!

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.headerRow}>
        <AiWarning />
        <TouchableOpacity onPress={() => setShowApiSettings(!showApiSettings)} style={styles.settingsBtn}>
          <Text style={{ fontSize: 20 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {showApiSettings && (
        <Card style={styles.apiCard}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Clé API Groq</Text>
          <Text style={[styles.apiHint, { color: theme.colors.textSecondary }]}>
            Obtenez votre clé gratuitement sur console.groq.com
          </Text>
          <Input
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="gsk_..."
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.apiButtons}>
            <Button title="Sauvegarder" onPress={saveApiKey} size="sm" style={{ flex: 1 }} />
            <Button title="Annuler" onPress={() => setShowApiSettings(false)} variant="secondary" size="sm" style={{ flex: 1, marginLeft: 8 }} />
          </View>
        </Card>
      )}

      <View style={styles.tabsRow}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => { setActiveTab(tab.key); setResult(null); setError(null) }}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? theme.colors.primary : theme.colors.chipBackground,
                borderColor: activeTab === tab.key ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? theme.colors.textInverse : theme.colors.chipText },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Card style={styles.inputCard}>
        <Text style={[styles.inputLabel, { color: theme.colors.text }]}>{currentTab.labelText}</Text>
        <Input
          value={inputText}
          onChangeText={setInputText}
          placeholder={currentTab.placeholder}
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
        <Button
          title={loading ? 'Réflexion en cours...' : 'Envoyer à l\'assistant'}
          onPress={handleSubmit}
          loading={loading}
          disabled={loading || !inputText.trim()}
          style={{ width: '100%' }}
        />
      </Card>

      {loading && (
        <Card style={styles.resultCard}>
          <LoadingSpinner message="L'assistant analyse le catalogue..." size="small" />
        </Card>
      )}

      {error && <ErrorState message={error} onRetry={handleSubmit} />}

      {result && !loading && (
        <View style={styles.resultSection}>
          <View style={styles.resultHeader}>
            <Text style={[styles.resultSectionTitle, { color: theme.colors.text }]}>Résultat</Text>
            {fromCache && (
              <Text style={[styles.cacheBadge, { color: theme.colors.textSecondary }]}>📦 Résultat mis en cache</Text>
            )}
          </View>
          {renderResult()}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  settingsBtn: {
    padding: 4,
    marginTop: -4,
  },
  apiCard: {
    marginBottom: 16,
  },
  apiHint: {
    fontSize: 12,
    marginBottom: 8,
  },
  apiButtons: {
    flexDirection: 'row',
    marginTop: 4,
  },
  tabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  tabIcon: {
    fontSize: 14,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputCard: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  resultSection: {
    marginBottom: 24,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cacheBadge: {
    fontSize: 11,
  },
  resultCard: {
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  resultReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  resultText: {
    fontSize: 14,
    lineHeight: 22,
  },
  resultEmpty: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 24,
  },
})
