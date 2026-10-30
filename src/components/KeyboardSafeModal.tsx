import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Dimensions,
} from 'react-native';

interface KeyboardSafeModalProps {
  visible: boolean;
  onClose: () => void;
  animationType?: 'none' | 'slide' | 'fade';
  children: React.ReactNode;
}

export const KeyboardSafeModal: React.FC<KeyboardSafeModalProps> = ({
  visible,
  onClose,
  animationType = 'slide',
  children,
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Altura máxima disponible para la tarjeta cuando el teclado está abierto
  const maxCardHeight =
    keyboardHeight > 0
      ? Math.max(260, screenHeight - keyboardHeight - 36)
      : screenHeight * 0.9;

  return (
    <Modal
      visible={visible}
      animationType={animationType}
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.modalOverlay,
          Platform.OS === 'android' && keyboardHeight > 0
            ? { paddingBottom: keyboardHeight }
            : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { maxHeight: maxCardHeight }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollInner}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  scrollInner: {
    paddingBottom: 12,
  },
});
