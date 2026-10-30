import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import { TransactionType } from '../../src/types/finance';
import { GENERAL_ICONS, SmartIcon } from '../../src/components/BrandIcon';

const COLOR_PALETTE = [
  '#E50914', // Netflix Red
  '#38BDF8', // Steam Blue
  '#1DB954', // Spotify Green
  '#FF9900', // Amazon Orange
  '#9146FF', // Twitch Purple
  '#5865F2', // Discord Indigo
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#14B8A6',
];

export default function CategoriesScreen() {
  const {
    categories,
    addCategory,
    deleteCategory,
    resetToZero,
    exportBackupJson,
    importBackupJson,
    backendUrl,
    setBackendUrl,
  } = useFinance();

  const [tabType, setTabType] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState(GENERAL_ICONS[0].icon);

  // Modal de Respaldo / Restauración y Host
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');
  const [customHostInput, setCustomHostInput] = useState(backendUrl);

  const filteredCategories = categories.filter((c) => c.type === tabType);

  const handleSaveCategory = async () => {
    if (!name.trim()) return;
    await addCategory({
      name: name.trim(),
      type: tabType,
      color: selectedColor,
      icon: selectedIcon,
    });
    setName('');
    setShowModal(false);
  };

  const handleShareBackup = async () => {
    const json = exportBackupJson();
    await Share.share({
      title: 'Respaldo Finanzas USA',
      message: json,
    });
  };

  const handleRestoreBackup = async () => {
    try {
      await importBackupJson(backupJsonInput);
      setBackupJsonInput('');
      setShowBackupModal(false);
      Alert.alert('Respaldo Restaurado', 'Tus cuentas, movimientos y categorías fueron restaurados con éxito.');
    } catch {
      Alert.alert('Error', 'El texto JSON pegado no tiene un formato de respaldo válido.');
    }
  };

  const handleResetZero = () => {
    Alert.alert(
      'Empezar desde Cero ($0.00)',
      '¿Seguro que deseas borrar todas las cuentas y movimientos de prueba para iniciar la app desde cero?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Empezar desde 0',
          style: 'destructive',
          onPress: async () => {
            await resetToZero();
            Alert.alert('Listo', 'La app quedó en $0.00 lista para tus cuentas reales.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Panel de Respaldo (Backup), Empezar desde 0 y Servidor Host */}
        <View style={styles.toolsCard}>
          <Text style={styles.toolsTitle}>Respaldo, Reinicio a Cero y Servidor</Text>
          <View style={styles.toolsButtonsRow}>
            <TouchableOpacity style={styles.toolBtnPrimary} onPress={handleShareBackup}>
              <Ionicons name="cloud-upload-outline" size={16} color="#0F172A" />
              <Text style={styles.toolBtnPrimaryText}>Exportar Respaldo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtnSecondary}
              onPress={() => {
                setCustomHostInput(backendUrl);
                setShowBackupModal(true);
              }}
            >
              <Ionicons name="settings-outline" size={16} color="#F8FAFC" />
              <Text style={styles.toolBtnSecondaryText}>Restaurar / Host</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.resetDangerBtn} onPress={handleResetZero}>
            <Ionicons name="trash-bin-outline" size={16} color="#FCA5A5" />
            <Text style={styles.resetDangerText}>
              Borrar datos de prueba y empezar desde 0 ($0.00)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pestañas Categorías de Gastos vs Categorías de Ingresos */}
        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tabType === 'expense' && styles.segmentExpenseActive,
            ]}
            onPress={() => setTabType('expense')}
          >
            <Text style={styles.segmentText}>Categorías de Gastos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tabType === 'income' && styles.segmentIncomeActive,
            ]}
            onPress={() => setTabType('income')}
          >
            <Text style={styles.segmentText}>Categorías de Ingresos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.headerSpread}>
          <Text style={styles.sectionTitle}>
            {tabType === 'expense' ? 'Gastos' : 'Ingresos'} ({filteredCategories.length})
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={18} color="#0F172A" />
            <Text style={styles.addBtnText}>Nueva Categoría</Text>
          </TouchableOpacity>
        </View>

        {filteredCategories.map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <View style={{ marginRight: 12 }}>
              <SmartIcon iconName={cat.icon} color={cat.color} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.catName}>{cat.name}</Text>
              <Text style={styles.catSub}>
                {cat.isCustom ? 'Categoría personalizada' : 'Categoría con ícono oficial'}
              </Text>
            </View>

            {cat.isCustom && (
              <TouchableOpacity onPress={() => deleteCategory(cat.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Modal para Crear Categoría con Íconos de Netflix, Steam, Spotify, PlayStation, etc. */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Nueva Categoría de {tabType === 'expense' ? 'Gasto' : 'Ingreso'}
            </Text>

            <Text style={styles.inputLabel}>Nombre de la Categoría</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Steam, Netflix, Mascotas, Gimnasio..."
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Color para la Gráfica</Text>
            <View style={styles.paletteRow}>
              {COLOR_PALETTE.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                />
              ))}
            </View>

            <Text style={styles.inputLabel}>Ícono (Incluye Netflix, Steam, Spotify, PS, Xbox...)</Text>
            <ScrollView style={{ maxHeight: 150 }} contentContainerStyle={styles.iconGrid}>
              {GENERAL_ICONS.map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === item.icon && {
                      borderColor: selectedColor,
                      backgroundColor: selectedColor + '25',
                    },
                  ]}
                  onPress={() => setSelectedIcon(item.icon)}
                >
                  <SmartIcon
                    iconName={item.icon}
                    color={selectedIcon === item.icon ? selectedColor : '#CBD5E1'}
                    size={18}
                    boxSize={30}
                  />
                  <Text style={styles.iconOptionLabel}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveCategory}>
                <Text style={styles.saveBtnText}>Crear Categoría</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Restaurar Respaldo JSON y Configurar URL del Host en la Nube */}
      <Modal visible={showBackupModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Servidor en Host y Restaurar Respaldo</Text>

            <Text style={styles.inputLabel}>
              URL de tu Servidor Backend (Render / Railway / VPS)
            </Text>
            <TextInput
              style={styles.input}
              placeholder="https://mi-servidor-plaid.onrender.com/api"
              placeholderTextColor="#64748B"
              value={customHostInput}
              onChangeText={setCustomHostInput}
            />
            <TouchableOpacity
              style={[styles.saveBtn, { flex: 0, marginTop: 8, paddingVertical: 10 }]}
              onPress={async () => {
                await setBackendUrl(customHostInput);
                Alert.alert('Guardado', 'URL del servidor actualizada.');
              }}
            >
              <Text style={styles.saveBtnText}>Guardar URL del Host</Text>
            </TouchableOpacity>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>
              Restaurar Respaldo (Pega aquí el JSON exportado)
            </Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder='{"version": 1, "accounts": [...]}'
              placeholderTextColor="#64748B"
              multiline
              value={backupJsonInput}
              onChangeText={setBackupJsonInput}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowBackupModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cerrar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleRestoreBackup}>
                <Text style={styles.saveBtnText}>Restaurar Datos</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  toolsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  toolsTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  toolsButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toolBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 10,
    borderRadius: 10,
  },
  toolBtnPrimaryText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  toolBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  toolBtnSecondaryText: { color: '#F8FAFC', fontWeight: '700', fontSize: 12 },
  resetDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#450A0A',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  resetDangerText: { color: '#FCA5A5', fontSize: 12, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  segmentExpenseActive: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  segmentIncomeActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  segmentText: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  headerSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 4,
  },
  addBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  catCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  catName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  catSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#1E293B',
  },
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 12 },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  paletteRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginVertical: 4,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#F8FAFC',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconOptionLabel: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  cancelBtnText: { color: '#94A3B8', fontWeight: '700' },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
  },
  saveBtnText: { color: '#0F172A', fontWeight: '800' },
});
