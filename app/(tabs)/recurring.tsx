import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import { LoanDirection, RecurrenceFrequency } from '../../src/types/finance';
import { BRAND_PRESETS, GENERAL_ICONS, SmartIcon } from '../../src/components/BrandIcon';
import { sendTestNotificationNow } from '../../src/services/notificationService';

type ControlSubTab = 'recurring' | 'loans' | 'goals';

export default function ControlScreen() {
  const {
    recurringItems,
    accounts,
    categories,
    loans,
    savingsGoals,
    addRecurringItem,
    updateRecurringReminderDays,
    confirmRecurringItem,
    postponeRecurringItem,
    skipRecurringCycle,
    deleteRecurringItem,
    addLoanRecord,
    registerLoanPayment,
    deleteLoanRecord,
    addSavingsGoal,
    updateSavingsGoalAmount,
    deleteSavingsGoal,
  } = useFinance();

  const [subTab, setSubTab] = useState<ControlSubTab>('recurring');

  // --- Estados Recurrentes ---
  const [showAddRecModal, setShowAddRecModal] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [reminderDaysBefore, setReminderDaysBefore] = useState<number>(1);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [confirmingItemId, setConfirmingItemId] = useState<string | null>(null);
  const [customConfirmAmount, setCustomConfirmAmount] = useState('');

  // --- Estados Préstamos (Me deben / Yo debo) ---
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [personName, setPersonName] = useState('');
  const [loanDirection, setLoanDirection] = useState<LoanDirection>('lent');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanNotes, setLoanNotes] = useState('');
  const [payingLoanId, setPayingLoanId] = useState<string | null>(null);
  const [loanPaymentInput, setLoanPaymentInput] = useState('');

  // --- Estados Metas de Ahorro (#2) ---
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState('');
  const [goalSaved, setGoalSaved] = useState('');
  const [goalIcon, setGoalIcon] = useState('mci:piggy-bank-outline');
  const [goalColor, setGoalColor] = useState('#10B981');
  const [contributingGoalId, setContributingGoalId] = useState<string | null>(null);
  const [goalContributionInput, setGoalContributionInput] = useState('');

  const openAddRecurringModal = () => {
    setSelectedAccountId(accounts[0]?.id || '');
    const defaultCat = categories.find((c) => c.type === 'expense');
    setSelectedCategoryId(defaultCat?.id || '');
    setTitle('');
    setAmount('');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setShowAddRecModal(true);
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
      reminderDaysBefore,
    });
    setShowAddRecModal(false);
  };

  const handleSaveLoan = async () => {
    const parsed = parseFloat(loanAmount);
    if (!personName.trim() || !parsed || parsed <= 0) return;

    await addLoanRecord({
      personName: personName.trim(),
      direction: loanDirection,
      totalAmount: parsed,
      notes: loanNotes.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    });
    setPersonName('');
    setLoanAmount('');
    setLoanNotes('');
    setShowLoanModal(false);
  };

  const handleSaveGoal = async () => {
    const target = parseFloat(goalTarget);
    const saved = parseFloat(goalSaved) || 0;
    if (!goalTitle.trim() || !target || target <= 0) return;

    await addSavingsGoal({
      title: goalTitle.trim(),
      targetAmount: target,
      savedAmount: saved,
      color: goalColor,
      icon: goalIcon,
    });
    setGoalTitle('');
    setGoalTarget('');
    setGoalSaved('');
    setShowGoalModal(false);
  };

  const frequencyLabel: Record<RecurrenceFrequency, string> = {
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    monthly: 'Mensual',
    yearly: 'Anual',
  };

  // Totales de préstamos pendientes
  const totalOwedToMe = loans
    .filter((l) => l.direction === 'lent' && !l.isSettled)
    .reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);

  const totalIOwe = loans
    .filter((l) => l.direction === 'borrowed' && !l.isSettled)
    .reduce((sum, l) => sum + (l.totalAmount - l.paidAmount), 0);

  return (
    <View style={styles.container}>
      {/* Sub-pestañas Superiores: Recurrentes | Préstamos | Metas de Ahorro */}
      <View style={styles.topTabsRow}>
        <TouchableOpacity
          style={[styles.topTabBtn, subTab === 'recurring' && styles.topTabBtnActive]}
          onPress={() => setSubTab('recurring')}
        >
          <Ionicons
            name="calendar-outline"
            size={15}
            color={subTab === 'recurring' ? '#0F172A' : '#94A3B8'}
          />
          <Text
            style={[
              styles.topTabText,
              subTab === 'recurring' && styles.topTabTextActive,
            ]}
          >
            Recurrentes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, subTab === 'loans' && styles.topTabBtnActive]}
          onPress={() => setSubTab('loans')}
        >
          <Ionicons
            name="people-outline"
            size={15}
            color={subTab === 'loans' ? '#0F172A' : '#94A3B8'}
          />
          <Text
            style={[styles.topTabText, subTab === 'loans' && styles.topTabTextActive]}
          >
            Préstamos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, subTab === 'goals' && styles.topTabBtnActive]}
          onPress={() => setSubTab('goals')}
        >
          <Ionicons
            name="trophy-outline"
            size={15}
            color={subTab === 'goals' ? '#0F172A' : '#94A3B8'}
          />
          <Text
            style={[styles.topTabText, subTab === 'goals' && styles.topTabTextActive]}
          >
            Metas Ahorro
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ================= VISTA 1: RECURRENTES ================= */}
        {subTab === 'recurring' && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="notifications-outline" size={24} color="#38BDF8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>
                  Control Manual + Recordatorio en Android (1 o 2 días antes)
                </Text>
                <Text style={styles.infoDesc}>
                  Ningún gasto se descuenta solo. Tu teléfono Android te enviará una notificación 1 o 2 días antes del vencimiento para que lo confirmes o pospongas.
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 8,
                    alignSelf: 'flex-start',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    backgroundColor: '#0369A1',
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                  }}
                  onPress={async () => {
                    const ok = await sendTestNotificationNow();
                    if (ok) {
                      Alert.alert(
                        '🔔 Notificación Enviada',
                        'En 2 segundos verás el recordatorio de prueba en la barra superior de tu teléfono Android.'
                      );
                    } else {
                      Alert.alert(
                        'Permiso de Notificaciones',
                        'Asegúrate de permitir las notificaciones de Finanzas USA / Expo Go en los ajustes de tu Android.'
                      );
                    }
                  }}
                >
                  <Ionicons name="notifications" size={14} color="#F8FAFC" />
                  <Text style={{ color: '#F8FAFC', fontSize: 11, fontWeight: '700' }}>
                    Probar Notificación en Android Ahora
                  </Text>
                </TouchableOpacity>
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
              const remDays = item.reminderDaysBefore ?? 1;

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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.itemTitle}>{item.title}</Text>
                        <View style={styles.freqBadge}>
                          <Text style={styles.freqBadgeText}>{frequencyLabel[item.frequency]}</Text>
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.freqBadge,
                            { backgroundColor: '#0C4A6E', borderWidth: 1, borderColor: '#0284C7' },
                          ]}
                          onPress={() => {
                            const nextVal = remDays === 1 ? 2 : remDays === 2 ? 0 : 1;
                            updateRecurringReminderDays(item.id, nextVal);
                          }}
                        >
                          <Text style={[styles.freqBadgeText, { color: '#38BDF8' }]}>
                            🔔 {remDays === 0 ? 'El mismo día' : `${remDays} ${remDays === 1 ? 'día' : 'días'} antes`}
                          </Text>
                        </TouchableOpacity>
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
          </>
        )}

        {/* ================= VISTA 2: PRÉSTAMOS (ME DEBEN / YO DEBO) ================= */}
        {subTab === 'loans' && (
          <>
            <View style={styles.loansSummaryCard}>
              <View style={styles.loansSummaryCol}>
                <Text style={styles.loansSummaryLabel}>ME DEBEN (PRESTÉ)</Text>
                <Text style={[styles.loansSummaryVal, { color: '#4ADE80' }]}>
                  +${totalOwedToMe.toFixed(2)}
                </Text>
              </View>
              <View style={styles.loansSummaryDivider} />
              <View style={styles.loansSummaryCol}>
                <Text style={styles.loansSummaryLabel}>YO DEBO (PEDÍ PRESTADO)</Text>
                <Text style={[styles.loansSummaryVal, { color: '#F87171' }]}>
                  -${totalIOwe.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.headerSpread}>
              <Text style={styles.sectionTitle}>Registro de Préstamos ({loans.length})</Text>
              <TouchableOpacity
                style={styles.newBtn}
                onPress={() => setShowLoanModal(true)}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
                <Text style={styles.newBtnText}>Anote Préstamo</Text>
              </TouchableOpacity>
            </View>

            {loans.map((loan) => {
              const remaining = Math.max(0, loan.totalAmount - loan.paidAmount);
              const pct = loan.totalAmount > 0 ? (loan.paidAmount / loan.totalAmount) * 100 : 0;
              const isLent = loan.direction === 'lent';

              return (
                <View key={loan.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ marginRight: 12 }}>
                      <SmartIcon
                        iconName={isLent ? 'arrow-up-circle-outline' : 'arrow-down-circle-outline'}
                        color={isLent ? '#4ADE80' : '#F87171'}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.itemTitle}>{loan.personName}</Text>
                        <View
                          style={[
                            styles.freqBadge,
                            { backgroundColor: isLent ? '#14532D' : '#7F1D1D' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.freqBadgeText,
                              { color: isLent ? '#86EFAC' : '#FCA5A5' },
                            ]}
                          >
                            {isLent ? 'Me debe' : 'Le debo'}
                          </Text>
                        </View>
                      </View>

                      {loan.notes ? <Text style={styles.itemSub}>{loan.notes}</Text> : null}
                      <Text style={styles.dueText}>
                        Abonado: ${loan.paidAmount.toFixed(2)} de ${loan.totalAmount.toFixed(2)} •{' '}
                        <Text style={styles.dueHighlight}>
                          {loan.isSettled ? '¡Pagado completo!' : `Faltan $${remaining.toFixed(2)}`}
                        </Text>
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text
                        style={[
                          styles.itemAmount,
                          { color: isLent ? '#4ADE80' : '#F87171' },
                        ]}
                      >
                        ${remaining.toFixed(2)}
                      </Text>
                      <TouchableOpacity
                        style={{ marginTop: 6 }}
                        onPress={() => deleteLoanRecord(loan.id)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#64748B" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isLent ? '#22C55E' : '#38BDF8',
                        },
                      ]}
                    />
                  </View>

                  {!loan.isSettled && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      <TouchableOpacity
                        style={[styles.confirmPrimaryBtn, { flex: 1, marginBottom: 0 }]}
                        onPress={() => {
                          setPayingLoanId(loan.id);
                          setLoanPaymentInput(String(remaining));
                        }}
                      >
                        <Ionicons name="cash-outline" size={16} color="#052E16" />
                        <Text style={styles.confirmPrimaryText}>
                          Registrar Abono / Pago
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* ================= VISTA 3: METAS DE AHORRO (#2) ================= */}
        {subTab === 'goals' && (
          <>
            <View style={styles.infoBox}>
              <Ionicons name="trophy-outline" size={22} color="#4ADE80" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: '#4ADE80' }]}>
                  Metas de Ahorro (Savings Goals)
                </Text>
                <Text style={styles.infoDesc}>
                  Crea metas para tu Fondo de Emergencia, un viaje, un auto o una PC Gamer y ve cuánto llevas ahorrado en cada una.
                </Text>
              </View>
            </View>

            <View style={styles.headerSpread}>
              <Text style={styles.sectionTitle}>Mis Metas ({savingsGoals.length})</Text>
              <TouchableOpacity
                style={styles.newBtn}
                onPress={() => setShowGoalModal(true)}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
                <Text style={styles.newBtnText}>Nueva Meta</Text>
              </TouchableOpacity>
            </View>

            {savingsGoals.map((goal) => {
              const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
              const missing = Math.max(0, goal.targetAmount - goal.savedAmount);

              return (
                <View key={goal.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ marginRight: 12 }}>
                      <SmartIcon iconName={goal.icon} color={goal.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{goal.title}</Text>
                      <Text style={styles.dueText}>
                        Ahorrado: <Text style={{ color: '#4ADE80', fontWeight: '700' }}>${goal.savedAmount.toFixed(2)}</Text> de ${goal.targetAmount.toFixed(2)} ({pct.toFixed(0)}%)
                      </Text>
                      <Text style={styles.itemSub}>
                        {missing === 0 ? '¡Meta completada!' : `Te faltan $${missing.toFixed(2)}`}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => deleteSavingsGoal(goal.id)}>
                      <Ionicons name="trash-outline" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: goal.color,
                        },
                      ]}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                    <TouchableOpacity
                      style={[styles.confirmPrimaryBtn, { flex: 1, marginBottom: 0 }]}
                      onPress={() => {
                        setContributingGoalId(goal.id);
                        setGoalContributionInput('');
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={16} color="#052E16" />
                      <Text style={styles.confirmPrimaryText}>Abonar a esta Meta</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

      {/* Modal Confirmar Recurrente */}
      <Modal visible={Boolean(confirmingItemId)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmar Movimiento Recurrente</Text>
            <Text style={styles.inputLabel}>
              Ajusta el monto si este mes varió antes de aplicarlo a tu saldo:
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

      {/* Modal Abonar a Préstamo */}
      <Modal visible={Boolean(payingLoanId)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Registrar Abono o Pago Total</Text>
            <Text style={styles.inputLabel}>Monto abonado ($ USD)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={loanPaymentInput}
              onChangeText={setLoanPaymentInput}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPayingLoanId(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (payingLoanId) {
                    const amt = parseFloat(loanPaymentInput);
                    if (amt > 0) await registerLoanPayment(payingLoanId, amt);
                    setPayingLoanId(null);
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Guardar Abono</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Abonar a Meta de Ahorro */}
      <Modal visible={Boolean(contributingGoalId)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Abonar a Meta de Ahorro</Text>
            <Text style={styles.inputLabel}>Monto a sumar a tu ahorro ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 100.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={goalContributionInput}
              onChangeText={setGoalContributionInput}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setContributingGoalId(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={async () => {
                  if (contributingGoalId) {
                    const amt = parseFloat(goalContributionInput);
                    if (!isNaN(amt) && amt !== 0) {
                      await updateSavingsGoalAmount(contributingGoalId, amt);
                    }
                    setContributingGoalId(null);
                  }
                }}
              >
                <Text style={styles.saveBtnText}>Sumar al Ahorro</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Nuevo Préstamo (Me deben / Yo debo) */}
      <Modal visible={showLoanModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nuevo Registro de Préstamo</Text>

            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  loanDirection === 'lent' && styles.segmentIncomeActive,
                ]}
                onPress={() => setLoanDirection('lent')}
              >
                <Text style={styles.segmentText}>Presté Dinero (Me deben)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  loanDirection === 'borrowed' && styles.segmentExpenseActive,
                ]}
                onPress={() => setLoanDirection('borrowed')}
              >
                <Text style={styles.segmentText}>Pedí Prestado (Yo debo)</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre de la Persona o Entidad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Juan, Hermano, Amigo..."
              placeholderTextColor="#64748B"
              value={personName}
              onChangeText={setPersonName}
            />

            <Text style={styles.inputLabel}>Monto Total ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={loanAmount}
              onChangeText={setLoanAmount}
            />

            <Text style={styles.inputLabel}>Nota o motivo (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Cena, Pasaje, Zelle..."
              placeholderTextColor="#64748B"
              value={loanNotes}
              onChangeText={setLoanNotes}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowLoanModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveLoan}>
                <Text style={styles.saveBtnText}>Guardar Préstamo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Nueva Meta de Ahorro */}
      <Modal visible={showGoalModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva Meta de Ahorro</Text>

            <Text style={styles.inputLabel}>Nombre de la Meta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Viaje, PC Gamer, Fondo de Emergencia..."
              placeholderTextColor="#64748B"
              value={goalTitle}
              onChangeText={setGoalTitle}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Meta Total ($ USD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1500.00"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={goalTarget}
                  onChangeText={setGoalTarget}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Ya Ahorrado ($ USD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={goalSaved}
                  onChangeText={setGoalSaved}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Ícono</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {GENERAL_ICONS.slice(0, 20).map((item) => (
                <TouchableOpacity
                  key={item.icon}
                  style={[
                    styles.brandQuickChip,
                    goalIcon === item.icon && { borderColor: '#38BDF8', backgroundColor: '#0C4A6E' },
                  ]}
                  onPress={() => setGoalIcon(item.icon)}
                >
                  <SmartIcon iconName={item.icon} color="#38BDF8" size={16} boxSize={26} />
                  <Text style={styles.brandQuickText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowGoalModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGoal}>
                <Text style={styles.saveBtnText}>Crear Meta</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Crear Nuevo Recurrente */}
      <Modal visible={showAddRecModal} animationType="slide" transparent>
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
                <Text style={styles.inputLabel}>Atajos de Marcas y Servicios</Text>
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

            <Text style={styles.inputLabel}>🔔 Recordatorio en Android antes del vencimiento</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
              {[
                { days: 1, label: '1 día antes' },
                { days: 2, label: '2 días antes' },
                { days: 3, label: '3 días antes' },
                { days: 0, label: 'El mismo día' },
              ].map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  style={[
                    styles.chip,
                    { marginRight: 0, flex: 1, alignItems: 'center', paddingHorizontal: 6 },
                    reminderDaysBefore === opt.days && {
                      borderColor: '#38BDF8',
                      backgroundColor: '#0C4A6E',
                    },
                  ]}
                  onPress={() => setReminderDaysBefore(opt.days)}
                >
                  <Text style={[styles.chipText, { fontSize: 11 }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

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
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddRecModal(false)}>
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
  topTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
    gap: 8,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topTabBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  topTabText: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  topTabTextActive: { color: '#0F172A', fontWeight: '800' },
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
  loansSummaryCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
  },
  loansSummaryCol: { flex: 1, alignItems: 'center' },
  loansSummaryDivider: { width: 1, backgroundColor: '#1E293B', marginHorizontal: 12 },
  loansSummaryLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  loansSummaryVal: { fontSize: 20, fontWeight: '800', marginTop: 4 },
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
  progressTrack: {
    height: 7,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: { height: '100%', borderRadius: 999 },
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
  segmentText: { color: '#F8FAFC', fontWeight: '700', fontSize: 12 },
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
