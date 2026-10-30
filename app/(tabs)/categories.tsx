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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useFinance } from '../../src/context/FinanceContext';
import { GENERAL_ICONS, SmartIcon } from '../../src/components/BrandIcon';
import { sendTestNotificationNow } from '../../src/services/notificationService';
import { KeyboardSafeModal } from '../../src/components/KeyboardSafeModal';

const COLOR_PALETTE = [
  '#E50914',
  '#38BDF8',
  '#1DB954',
  '#FF9900',
  '#9146FF',
  '#5865F2',
  '#F59E0B',
  '#10B981',
  '#EC4899',
  '#14B8A6',
  '#6366F1',
  '#F43F5E',
];

export default function SettingsAndCategoriesScreen() {
  const {
    accounts,
    transactions,
    recurringItems,
    categories,
    addCategory,
    deleteCategory,
    resetToZero,
    exportBackupJson,
    importBackupJson,
    lastDriveBackupAt,
    recordDriveBackupTimestamp,
  } = useFinance();

  const [tabType, setTabType] = useState<'expense' | 'income'>('expense');
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState(GENERAL_ICONS[0].icon);
  const [iconSearch, setIconSearch] = useState('');

  // Modal de Restauración de Respaldo (.json)
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupJsonInput, setBackupJsonInput] = useState('');

  const filteredCategories = categories.filter((c) => c.type === tabType);

  const filteredIcons = GENERAL_ICONS.filter(
    (item) =>
      !iconSearch.trim() ||
      item.label.toLowerCase().includes(iconSearch.toLowerCase()) ||
      item.group.toLowerCase().includes(iconSearch.toLowerCase())
  );

  const handleSaveCategory = async () => {
    if (!name.trim()) return;
    await addCategory({
      name: name.trim(),
      type: tabType,
      color: selectedColor,
      icon: selectedIcon,
    });
    setName('');
    setIconSearch('');
    setShowModal(false);
  };

  /**
   * Genera un archivo real .json y abre el menú nativo de Android para guardarlo directo en Google Drive
   */
  const handleBackupToGoogleDrive = async () => {
    try {
      const json = exportBackupJson();
      const today = new Date().toISOString().split('T')[0];
      const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;

      if (baseDir) {
        const fileUri = `${baseDir}finanzas-usa-backup-${today}.json`;
        await FileSystem.writeAsStringAsync(fileUri, json, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await recordDriveBackupTimestamp();
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/json',
            dialogTitle: 'Guardar Respaldo en Google Drive',
            UTI: 'public.json',
          });
          return;
        }
      }

      await recordDriveBackupTimestamp();
      await Share.share({
        title: `finanzas-usa-backup-${today}.json`,
        message: json,
      });
    } catch {
      Alert.alert(
        'Error al crear archivo',
        'No se pudo preparar el archivo de respaldo para Google Drive.'
      );
    }
  };

  const handleRestoreBackup = async () => {
    try {
      await importBackupJson(backupJsonInput);
      setBackupJsonInput('');
      setShowBackupModal(false);
      Alert.alert(
        'Respaldo Restaurado',
        'Tus cuentas, movimientos, préstamos, metas y categorías fueron restaurados con éxito.'
      );
    } catch {
      Alert.alert('Error', 'El texto JSON pegado no tiene un formato de respaldo válido.');
    }
  };

  const handleResetZero = () => {
    Alert.alert(
      'Empezar desde Cero ($0.00)',
      '¿Seguro que deseas borrar todas las cuentas, préstamos, metas y movimientos de prueba para iniciar la app desde cero?',
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
        {/* Bloque 1: Respaldo con Google Drive y Restauración */}
        <View style={styles.toolsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="logo-google" size={18} color="#4ADE80" />
            <Text style={styles.toolsTitle}>Respaldo en Google Drive y Datos</Text>
          </View>
          <Text style={styles.driveHelperText}>
            Guarda una copia completa de tus cuentas, préstamos, presupuestos y movimientos como archivo{' '}
            <Text style={{ color: '#38BDF8', fontWeight: '700' }}>.json</Text> directamente en tu{' '}
            <Text style={{ color: '#4ADE80', fontWeight: '700' }}>Google Drive</Text>.
          </Text>

          {lastDriveBackupAt && (
            <Text style={styles.lastBackupText}>
              ✓ Último respaldo generado: {new Date(lastDriveBackupAt).toLocaleString()}
            </Text>
          )}

          <View style={styles.toolsButtonsRow}>
            <TouchableOpacity
              style={[styles.toolBtnPrimary, { backgroundColor: '#22C55E' }]}
              onPress={handleBackupToGoogleDrive}
            >
              <Ionicons name="cloud-upload-outline" size={16} color="#052E16" />
              <Text style={[styles.toolBtnPrimaryText, { color: '#052E16' }]}>
                Guardar en Google Drive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolBtnSecondary}
              onPress={() => setShowBackupModal(true)}
            >
              <Ionicons name="cloud-download-outline" size={16} color="#F8FAFC" />
              <Text style={styles.toolBtnSecondaryText}>Restaurar Copia (.json)</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.toolBtnSecondary, { flex: 1 }]}
              onPress={async () => {
                const ok = await sendTestNotificationNow();
                if (ok) {
                  Alert.alert(
                    '🔔 Notificación Programada',
                    'En 2 segundos sonará la notificación de prueba en tu Android.'
                  );
                } else {
                  Alert.alert(
                    'Permiso Requerido',
                    'Activa los permisos de notificación para Finanzas USA en los ajustes de Android.'
                  );
                }
              }}
            >
              <Ionicons name="notifications-outline" size={15} color="#38BDF8" />
              <Text style={[styles.toolBtnSecondaryText, { color: '#38BDF8' }]}>
                Probar Notificación Android
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resetDangerBtn, { flex: 1 }]}
              onPress={handleResetZero}
            >
              <Ionicons name="trash-bin-outline" size={15} color="#FCA5A5" />
              <Text style={styles.resetDangerText}>Reiniciar a $0.00</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bloque 2 de Ajustes: Gestión de Categorías (Separadas de Presupuestos) */}
        <View style={styles.headerSpread}>
          <Text style={styles.sectionTitle}>Categorías de la App</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowModal(true)}
          >
            <Ionicons name="add" size={18} color="#0F172A" />
            <Text style={styles.addBtnText}>Agregar Categoría</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tabType === 'expense' && styles.segmentExpenseActive,
            ]}
            onPress={() => setTabType('expense')}
          >
            <Text style={styles.segmentText}>
              Categorías de Gastos ({categories.filter((c) => c.type === 'expense').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentBtn,
              tabType === 'income' && styles.segmentIncomeActive,
            ]}
            onPress={() => setTabType('income')}
          >
            <Text style={styles.segmentText}>
              Categorías de Ingresos ({categories.filter((c) => c.type === 'income').length})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredCategories.map((cat) => (
          <View key={cat.id} style={styles.catCard}>
            <View style={styles.catTopRow}>
              <View style={{ marginRight: 12 }}>
                <SmartIcon iconName={cat.icon} color={cat.color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.catName}>{cat.name}</Text>
                <Text style={styles.catSub}>
                  {cat.isCustom ? 'Categoría personalizada' : 'Categoría base de la app'}
                </Text>
              </View>

              {cat.isCustom && (
                <TouchableOpacity
                  style={{ marginLeft: 8 }}
                  onPress={() => deleteCategory(cat.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* Bloque 3: Información de la App, Versión 1.0.3 y Estado */}
        <View style={styles.versionCard}>
          <View style={styles.versionHeader}>
            <View style={styles.appLogoCircle}>
              <Ionicons name="wallet" size={20} color="#0F172A" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.versionAppName}>Finanzas USA • Personal Finance</Text>
              <Text style={styles.versionSub}>
                Versión 1.0.3 (Build 4 • Expo SDK 58 • Android)
              </Text>
            </View>
            <View style={styles.statusOnlineBadge}>
              <Text style={styles.statusOnlineText}>v1.0.3</Text>
            </View>
          </View>

          <View style={styles.versionDivider} />

          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Bancos US Soportados:</Text>
            <Text style={styles.versionValue}>Wells Fargo, Chase, Truist, PayPal, Uber, BofA, Citi</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Importador Inteligente:</Text>
            <Text style={styles.versionValue}>Alertas Bancarias / SMS / CSV ($0 Gratis)</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Respaldo Cloud:</Text>
            <Text style={styles.versionValue}>Google Drive (.json) + SQLite Local</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Notificaciones Android:</Text>
            <Text style={styles.versionValue}>Recordatorios 1 o 2 días antes (09:00 AM)</Text>
          </View>
          <View style={styles.versionRow}>
            <Text style={styles.versionLabel}>Estadísticas actuales:</Text>
            <Text style={styles.versionValue}>
              {accounts.length} cuentas • {transactions.length} mov. • {recurringItems.length} recurrentes
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Modal para Crear Nueva Categoría con 65+ Íconos y Buscador */}
      <KeyboardSafeModal
        visible={showModal}
        animationType="slide"
        onClose={() => setShowModal(false)}
      >
        <Text style={styles.modalTitle}>
          Nueva Categoría de {tabType === 'expense' ? 'Gasto' : 'Ingreso'}
        </Text>

        <Text style={styles.inputLabel}>Nombre de la Categoría</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Comida, Steam, Mascotas, Gimnasio..."
          placeholderTextColor="#64748B"
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.inputLabel}>Color</Text>
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

        <Text style={styles.inputLabel}>
          Buscar Ícono ({filteredIcons.length} disponibles: Netflix, Steam, Walmart, Zelle, Gym...)
        </Text>
        <TextInput
          style={[styles.input, { marginBottom: 8, paddingVertical: 8 }]}
          placeholder="Filtrar ícono (ej. juego, comida, auto, banco...)"
          placeholderTextColor="#64748B"
          value={iconSearch}
          onChangeText={setIconSearch}
        />

        <ScrollView style={{ maxHeight: 180 }} contentContainerStyle={styles.iconGrid} nestedScrollEnabled>
          {filteredIcons.map((item) => (
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

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
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
      </KeyboardSafeModal>

      {/* Modal para Restaurar Respaldo de Google Drive (.json) */}
      <KeyboardSafeModal
        visible={showBackupModal}
        animationType="slide"
        onClose={() => setShowBackupModal(false)}
      >
        <Text style={styles.modalTitle}>Restaurar Respaldo desde Google Drive</Text>
        <Text style={styles.inputLabel}>
          Abre tu archivo .json guardado en Google Drive, copia su contenido y pégalo aquí:
        </Text>
        <TextInput
          style={[styles.input, { height: 130, textAlignVertical: 'top', marginTop: 4 }]}
          placeholder='{"version": 2, "accounts": [...]}'
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
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: '#22C55E' }]}
            onPress={handleRestoreBackup}
          >
            <Text style={[styles.saveBtnText, { color: '#052E16' }]}>
              Restaurar Copia Ahora
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardSafeModal>
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
    marginBottom: 20,
  },
  toolsTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  driveHelperText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  lastBackupText: {
    color: '#4ADE80',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },
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
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#7F1D1D',
  },
  resetDangerText: { color: '#FCA5A5', fontSize: 12, fontWeight: '700' },
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
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
  segmentText: { color: '#F8FAFC', fontWeight: '700', fontSize: 12 },
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
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  catTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catName: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  catSub: { color: '#64748B', fontSize: 12, marginTop: 2 },
  versionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionAppName: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  versionSub: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  statusOnlineBadge: {
    backgroundColor: '#14532D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusOnlineText: { color: '#4ADE80', fontSize: 10, fontWeight: '800' },
  versionDivider: {
    height: 1,
    backgroundColor: '#1E293B',
    marginVertical: 12,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  versionLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  versionValue: { color: '#CBD5E1', fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
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
  modalTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
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
    width: 30,
    height: 30,
    borderRadius: 15,
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
