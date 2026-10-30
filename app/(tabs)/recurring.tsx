import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import { RecurrenceFrequency, TransactionType } from '../../src/types/finance';
import { BRAND_PRESETS, SmartIcon } from '../../src/components/BrandIcon';

export default function RecurringScreen() {
  const {
    recurringItems,
    accounts,
    categories,
    addRecurringItem,
    confirmRecurringItem,
    postponeRecurringItem,
    skipRecurringCycle,
    deleteRecurringItem,
  } = useFinance();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [customConfirmAmount, setCustomConfirmAmount] = useState('');

  const openAddRecurringModal = () => {
    setSelectedAccountId(accounts[0]?.id || '');
    const defaultCat = categories.find((c) => c.type === 'expense');
    setSelectedCategoryId(defaultCat?.id || '');
    setTitle('');
    setAmount('');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setShowAddModal(true);
  };

  const handleSaveRecurring = async () => {
    const parsed = parseFloat(amount);
    if (!title.trim() || !parsed || parsed <= 0 || !selectedAccountId || !selectedCategoryId) {
      return;
    }

    await addRecurringItem({
      title: title.trim(),
      amount: parsed,
      type,
      categoryId: selectedCategoryId,
      accountId: selectedAccountId,
      frequency,
      nextDueDate,
    });
    setShowAddModal(false);
  };

  const frequencyLabel: Record<RecurrenceFrequency, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    yearly: 'Anual',
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoBox}>
          <Ionicons name="hand-left-outline" size={22} color="#38BDF8" />
          <View style={{ flex: 1 }}>
            <Text style={styles.infoTitle}>Control Manual Garantizado</Text>
            <Text style={styles.infoDesc}>
              Ningún gasto o ingreso recurrente se descuenta ni se suma automáticamente. Tú decides cuándo confirmarlo o cuánto tiempo posponerlo.
            </Text>
          </View>
        </View>

        <View style={styles.headerSpread}>
          <Text style={styles.sectionTitle}>Programados ({recurringItems.length})</Text>
          <TouchableOpacity style={styles.newBtn} onPress={openAddRecurringModal}>
            <Ionicons name="add" size={18} color="#0F172A" />
            <Text style={styles.newBtnText}>Nuevo Recurrente</Text>
          </TouchableOpacity>
        </View>

        {recurringItems.map((item) => {
          const acc = accounts.find((a) => a.id === item.accountId);
          const cat = categories.find((c) => c.id === item.categoryId);

          return (
            <View key={item.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ marginRight: 12 }}>
                  <SmartIcon
                    iconName={cat?.icon}
                    color={cat?.color}
                    titleForAutoBrand={item.title}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <View style={styles.freqBadge}>
                      <Text style={styles.freqBadgeText}>{frequencyLabel[item.frequency]}</Text>
                    </View>
                  </View>

                  <Text style={styles.itemSub}>
                    {cat?.name || 'Categoría'} • Cuenta: {acc?.name || 'General'}
                  </Text>
                  <Text style={styles.dueText}>
                    Próxima fecha: <Text style={styles.dueHighlight}>{item.nextDueDate}</Text>
                    {item.postponedUntil ? ' (Pospuesto)' : ''}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.itemAmount,
                      { color: item.type === 'income' ? '#4ADE80' : '#F87171' },
                    ]}
                  >
                    {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 6 }}
                    onPress={() => deleteRecurringItem(item.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botonera de Confirmación y Posposición */}
              <View style={styles.actionsBox}>
                <TouchableOpacity
                  style={styles.confirmPrimaryBtn}
                  onPress={() => {
                    setConfirmingItemId(item.id);
                    setCustomConfirmAmount(String(item.amount));
                  }}
                >
                  <Ionicons name="checkmark-done-outline" size={18} color="#052E16" />
                  <Text style={styles.confirmPrimaryText}>Confirmar y Aplicar</Text>
                </TouchableOpacity>

                <View style={styles.postponeRow}>
                  <Text style={styles.postponeLabel}>Posponer:</Text>
                  <TouchableOpacity
                    style={styles.postponeChip}
                    onPress={() => postponeRecurringItem(item.id, 1)}
                  >
                    <Text style={styles.postponeChipText}>+1 día</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.postponeChip}
                    onPress={() => postponeRecurringItem(item.id, 3)}
                  >
                    <Text style={styles.postponeChipText}>+3 días</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.postponeChip}
                    onPress={() => postponeRecurringItem(item.id, 7)}
                  >
                    <Text style={styles.postponeChipText}>+1 sem</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.postponeChip, { borderColor: '#F59E0B' }]}
                    onPress={() => skipRecurringCycle(item.id)}
                  >
                    <Text style={[styles.postponeChipText, { color: '#FBBF24' }]}>
                      Saltar ciclo
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal para confirmar el monto exacto */}
      <Modal visible={Boolean(confirmingItemId)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar Movimiento Recurrente</Text>
            <Text style={styles.inputLabel}>
              Puedes ajustar el monto si este mes varió antes de aplicarlo a tu saldo:
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={customConfirmAmount}
              onChangeText={setCustomConfirmAmount}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmingItemId(null)}
              >
                <Text style={styles.cancelBtnText}>Todavía no</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (confirmingItemId) {
                    const parsed = parseFloat(customConfirmAmount);
                    await confirmRecurringItem(
                      confirmingItemId,
                      !isNaN(parsed) && parsed > 0 ? parsed : undefined
                    );
                    setConfirmingItemId(null);
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Confirmar Ahora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Crear Nuevo Gasto o Ingreso Recurrente con Selector Rápido de Marcas */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo Gasto / Ingreso Recurrente</Text>

            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[styles.segmentBtn, type === 'expense' && styles.segmentExpenseActive]}
                onPress={() => {
                  setType('expense');
                  const first = categories.find((c) => c.type === 'expense');
                  if (first) setSelectedCategoryId(first.id);
                }}
              >
                <Text style={styles.segmentText}>Gasto Recurrente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, type === 'income' && styles.segmentIncomeActive]}
                onPress={() => {
                  setType('income');
                  const first = categories.find((c) => c.type === 'income');
                  if (first) setSelectedCategoryId(first.id);
                }}
              >
                <Text style={styles.segmentText}>Ingreso Recurrente</Text>
              </TouchableOpacity>
            </View>

            {type === 'expense' && (
              <>
                <Text style={styles.inputLabel}>Atajos de Suscripciones (Netflix, Steam, Spotify...)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                  {BRAND_PRESETS.map((brand) => (
                    <TouchableOpacity
                      key={brand.id}
                      style={[
                        styles.brandQuickChip,
                        title === brand.label && {
                          borderColor: brand.color,
                          backgroundColor: brand.color + '28',
                        },
                      ]}
                      onPress={() => setTitle(brand.label)}
                    >
                      <SmartIcon
                        titleForAutoBrand={brand.label}
                        size={16}
                        boxSize={26}
                      />
                      <Text style={styles.brandQuickText}>{brand.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <Text style={styles.inputLabel}>Concepto (Ej. Netflix, Steam, Renta, Quincena)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre del gasto o ingreso"
              placeholderTextColor="#64748B"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Monto Estimado ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={styles.inputLabel}>Fecha del Próximo Vencimiento (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />

            <Text style={styles.inputLabel}>Frecuencia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {(['weekly', 'biweekly', 'monthly', 'yearly'] as RecurrenceFrequency[]).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.chip,
                    frequency === freq && { borderColor: '#38BDF8', backgroundColor: '#0C4A6E' },
                  ]}
                  onPress={() => setFrequency(freq)}
                >
                  <Text style={styles.chipText}>{frequencyLabel[freq]}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Cuenta donde se aplicará al confirmar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.chip,
                    selectedAccountId === acc.id && {
                      borderColor: '#38BDF8',
                      backgroundColor: '#0C4A6E',
                    },
                  ]}
                  onPress={() => setSelectedAccountId(acc.id)}
                >
                  <Text style={styles.chipText}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>Categoría</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {categories
                .filter((c) => c.type === type)
                .map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      selectedCategoryId === cat.id && {
                        borderColor: cat.color,
                        backgroundColor: cat.color + '33',
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text style={styles.chipText}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveRecurring}>
                <Text style={styles.saveBtnText}>Programar</Text>
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#0369A1',
    marginBottom: 18,
  },
  infoTitle: { color: '#38BDF8', fontSize: 14, fontWeight: '700' },
  infoDesc: { color: '#94A3B8', fontSize: 12, marginTop: 2, lineHeight: 17 },
  headerSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 4,
  },
  newBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 13 },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  freqBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  freqBadgeText: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  itemSub: { color: '#64748B', fontSize: 12, marginTop: 4 },
  dueText: { color: '#CBD5E1', fontSize: 12, marginTop: 4 },
  dueHighlight: { color: '#FBBF24', fontWeight: '700' },
  itemAmount: { fontSize: 18, fontWeight: '800' },
  actionsBox: {
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 12,
    paddingTop: 12,
  },
  confirmPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#4ADE80',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  confirmPrimaryText: { color: '#052E16', fontWeight: '800', fontSize: 13 },
  postponeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  postponeLabel: { color: '#94A3B8', fontSize: 12, marginRight: 4 },
  postponeChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  postponeChipText: { color: '#E2E8F0', fontSize: 12, fontWeight: '600' },
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
  segmentRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  segmentExpenseActive: { backgroundColor: '#EF4444' },
  segmentIncomeActive: { backgroundColor: '#22C55E' },
  segmentText: { color: '#F8FAFC', fontWeight: '700', fontSize: 13 },
  brandQuickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    backgroundColor: '#1E293B',
  },
  brandQuickText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
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
