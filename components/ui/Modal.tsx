import { Modal as RNModal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ModalProps {
  visible: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ visible, onClose, title, children }: ModalProps) {
  const { theme } = useTheme()

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.content,
            { backgroundColor: theme.colors.surfaceElevated },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 20,
  },
})
