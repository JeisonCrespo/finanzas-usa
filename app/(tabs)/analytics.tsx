import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import { DonutChart } from '../../src/components/DonutChart';
import { GENERAL_ICONS, SmartIcon } from '../../src/components/BrandIcon';
import { KeyboardSafeModal } from '../../src/components/KeyboardSafeModal';

export default function AnalyticsAndBudgetsScreen() {
  const {
    accounts,
    categories,
    transactions,
    monthlyBudgets,
    addMonthlyBudget,
    addManualSpendToBudget,
    deleteMonthlyBudget,
    getBudgetSpentAmount,
    getCategoryBreakdown,
  } = useFinance();

  const [viewMode, setViewMode] = useState<'budgets' | 'chart'>('budgets');
  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (viewMode === 'chart') {
        setViewMode('budgets');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [viewMode]);

  // Modal para Crear un Presupuesto Mensual Independiente
  const [showAddBudgetModal, setShowAddBudgetModal] = useState(false);
  const [budgetTitle, setBudgetTitle] = useState('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [linkedCategoryId, setLinkedCategoryId] = useState<string>('');
  const [budgetIcon, setBudgetIcon] = useState('cart-outline');
  const [budgetColor, setBudgetColor] = useState('#10B981');

  // Modal para sumar un gasto rápido directo a un presupuesto
  const [addingSpendBudgetId, setAddingSpendBudgetId] = useState<string | null>(null);
  const [manualSpendInput, setManualSpendInput] = useState('');

  const breakdown = getCategoryBreakdown(selectedType, selectedAccountId);

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && (selectedAccountId === 'all' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && (selectedAccountId === 'all' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  const handleSaveNewBudget = async () => {
    const parsedLimit = parseFloat(budgetLimit);
    if (!budgetTitle.trim() || !parsedLimit || parsedLimit <= 0) return;

    await addMonthlyBudget({
      title: budgetTitle.trim(),
      limitAmount: parsedLimit,
      categoryId: linkedCategoryId || undefined,
      color: budgetColor,
      icon: budgetIcon,
    });
    setBudgetTitle('');
    setBudgetLimit('');
    setLinkedCategoryId('');
    setShowAddBudgetModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Selector Superior: Presupuestos del Mes vs Gráfica Circular */}
      <View style={styles.topSwitchRow}>
        <TouchableOpacity
          style={[
            styles.topSwitchBtn,
            viewMode === 'budgets' && styles.topSwitchBtnActive,
          ]}
          onPress={() => setViewMode('budgets')}
        >
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={viewMode === 'budgets' ? '#0F172A' : '#94A3B8'}
          />
          <Text
            style={[
              styles.topSwitchText,
              viewMode === 'budgets' && styles.topSwitchTextActive,
            ]}
          >
            Presupuesto del Mes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.topSwitchBtn,
            viewMode === 'chart' && styles.topSwitchBtnActive,
          ]}
          onPress={() => setViewMode('chart')}
        >
          <Ionicons
            name="pie-chart-outline"
            size={16}
            color={viewMode === 'chart' ? '#0F172A' : '#94A3B8'}
          />
          <Text
            style={[
              styles.topSwitchText,
              viewMode === 'chart' && styles.topSwitchTextActive,
            ]}
          >
            Gráfica de Gastos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {viewMode === 'budgets' ? (
          <>
            <View style={styles.infoBanner}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#38BDF8" />
              <Text style={styles.infoBannerText}>
                Aquí agregas todos los presupuestos mensuales que quieras (ej. Comida $200, Salidas $100) separados de tus categorías. Si te pasas del monto no pasa nada ni se bloquea nada, solo te avisa para tu control.
              </Text>
            </View>

            <View style={styles.headerSpread}>
              <Text style={styles.sectionTitle}>
                Mis Presupuestos ({monthlyBudgets.length})
              </Text>
              <TouchableOpacity
                style={styles.newBudgetBtn}
                onPress={() => setShowAddBudgetModal(true)}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
                <Text style={styles.newBudgetBtnText}>Agregar Presupuesto</Text>
              </TouchableOpacity>
            </View>

            {monthlyBudgets.map((b) => {
              const spent = getBudgetSpentAmount(b);
              const limit = b.limitAmount;
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const isOver = spent > limit;
              const linkedCat = categories.find((c) => c.id === b.categoryId);

              return (
                <View key={b.id} style={styles.budgetCard}>
                  <View style={styles.breakdownTop}>
                    <View style={styles.breakdownLeft}>
                      <SmartIcon iconName={b.icon} color={b.color} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.budgetTitleText}>{b.title}</Text>
                        <Text style={styles.catCount}>
                          {linkedCat
                            ? `Suma automático gastos de: ${linkedCat.name}`
                            : 'Presupuesto libre / manual'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => deleteMonthlyBudget(b.id)}>
                      <Ionicons name="trash-outline" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.budgetNumbersRow}>
                    <Text style={styles.budgetSpentBig}>
                      ${spent.toFixed(2)}{' '}
                      <Text style={styles.budgetLimitSmall}>
                        / ${limit.toFixed(2)} ({pct.toFixed(0)}%)
                      </Text>
                    </Text>

                    <Text
                      style={[
                        styles.budgetStatusBadge,
                        { color: isOver ? '#F87171' : '#4ADE80' },
                      ]}
                    >
                      {isOver
                        ? `Sobrepasado por $${(spent - limit).toFixed(2)}`
                        : `Disponibles: $${(limit - spent).toFixed(2)}`}
                    </Text>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isOver
                            ? '#EF4444'
                            : pct > 80
                            ? '#F59E0B'
                            : '#22C55E',
                        },
                      ]}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.addManualSpendBtn}
                    onPress={() => {
                      setAddingSpendBudgetId(b.id);
                      setManualSpendInput('');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={15} color="#CBD5E1" />
                    <Text style={styles.addManualSpendText}>
                      Anote rápido al presupuesto
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        ) : (
          <>
            {/* Selector de Filtro por Cuenta */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.accountFilterScroll}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedAccountId === 'all' && styles.filterChipActive,
                ]}
                onPress={() => setSelectedAccountId('all')}
              >
                <Text style={styles.filterChipText}>Todas las Cuentas</Text>
              </TouchableOpacity>

              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.filterChip,
                    selectedAccountId === acc.id && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedAccountId(acc.id)}
                >
                  <Text style={styles.filterChipText}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Tarjeta Comparativa Ingresos vs Gastos */}
            <View style={styles.cashflowCard}>
              <View style={styles.cashflowCol}>
                <Text style={styles.cashflowLabel}>INGRESOS</Text>
                <Text style={[styles.cashflowVal, { color: '#4ADE80' }]}>
                  +${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.cashflowDivider} />
              <View style={styles.cashflowCol}>
                <Text style={styles.cashflowLabel}>GASTOS</Text>
                <Text style={[styles.cashflowVal, { color: '#F87171' }]}>
                  -${totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.cashflowDivider} />
              <View style={styles.cashflowCol}>
                <Text style={styles.cashflowLabel}>FLUJO NETO</Text>
                <Text
                  style={[
                    styles.cashflowVal,
                    { color: totalIncome - totalExpense >= 0 ? '#38BDF8' : '#FB923C' },
                  ]}
                >
                  ${(totalIncome - totalExpense).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {/* Selector Gastos vs Ingresos para la Gráfica Circular */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  selectedType === 'expense' && styles.toggleExpenseActive,
                ]}
                onPress={() => setSelectedType('expense')}
              >
                <Text style={styles.toggleText}>¿Dónde se va el dinero? (Gastos)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleBtn,
                  selectedType === 'income' && styles.toggleIncomeActive,
                ]}
                onPress={() => setSelectedType('income')}
              >
                <Text style={styles.toggleText}>Origen de Ingresos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartCard}>
              <DonutChart
                data={breakdown}
                centerLabel={selectedType === 'expense' ? 'Total Gastado' : 'Total Ingresado'}
              />

              {breakdown.length === 0 ? (
                <Text style={styles.emptyText}>
                  No hay movimientos registrados para este filtro.
                </Text>
              ) : (
                <View style={styles.legendList}>
                  {breakdown.map((item) => (
                    <View key={item.categoryId} style={styles.breakdownRow}>
                      <View style={styles.breakdownTop}>
                        <View style={styles.breakdownLeft}>
                          <SmartIcon
                            iconName={item.icon}
                            color={item.color}
                            size={18}
                            boxSize={38}
                          />
                          <View>
                            <Text style={styles.catName}>{item.categoryName}</Text>
                            <Text style={styles.catCount}>
                              {item.count} {item.count === 1 ? 'movimiento' : 'movimientos'}
                            </Text>
                          </View>
                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.catTotal}>
                            ${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </Text>
                          <Text style={[styles.catPercent, { color: item.color }]}>
                            {item.percentage.toFixed(1)}%
                          </Text>
                        </View>
                      </View>

                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(item.percentage, 100)}%`,
                              backgroundColor: item.color,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal para Agregar Presupuesto Mensual Independiente */}
      <KeyboardSafeModal
        visible={showAddBudgetModal}
        animationType="slide"
        onClose={() => setShowAddBudgetModal(false)}
      >
        <Text style={styles.modalTitle}>Nuevo Presupuesto para el Mes</Text>

        <Text style={styles.inputLabel}>
          Nombre del Presupuesto (Ej. Comida, Salidas, Juegos...)
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Comida del mes"
          placeholderTextColor="#64748B"
          value={budgetTitle}
          onChangeText={setBudgetTitle}
        />

        <Text style={styles.inputLabel}>Tope / Meta Mensual ($ USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 200.00"
          placeholderTextColor="#64748B"
          keyboardType="decimal-pad"
          value={budgetLimit}
          onChangeText={setBudgetLimit}
        />

        <Text style={styles.inputLabel}>
          Opcional: ¿Vincular automáticamente con una categoría de gastos?
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              linkedCategoryId === '' && styles.filterChipActive,
            ]}
            onPress={() => setLinkedCategoryId('')}
          >
            <Text style={styles.filterChipText}>No vincular (Solo manual)</Text>
          </TouchableOpacity>

          {categories
            .filter((c) => c.type === 'expense')
            .map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  linkedCategoryId === cat.id && styles.filterChipActive,
                ]}
                onPress={() => {
                  setLinkedCategoryId(cat.id);
                  setBudgetIcon(cat.icon);
                  setBudgetColor(cat.color);
                  if (!budgetTitle.trim()) setBudgetTitle(cat.name);
                }}
              >
                <Text style={styles.filterChipText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>

        <Text style={styles.inputLabel}>Ícono</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
          {GENERAL_ICONS.slice(0, 24).map((item) => (
            <TouchableOpacity
              key={item.icon}
              style={[
                styles.filterChip,
                budgetIcon === item.icon && styles.filterChipActive,
              ]}
              onPress={() => setBudgetIcon(item.icon)}
            >
              <Text style={styles.filterChipText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setShowAddBudgetModal(false)}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNewBudget}>
            <Text style={styles.saveBtnText}>Guardar Presupuesto</Text>
          </TouchableOpacity>
        </View>
      </KeyboardSafeModal>

      {/* Modal para Anotar Gasto Manual a un Presupuesto */}
      <KeyboardSafeModal
        visible={Boolean(addingSpendBudgetId)}
        animationType="fade"
        onClose={() => setAddingSpendBudgetId(null)}
      >
        <Text style={styles.modalTitle}>Sumar al Presupuesto</Text>
        <Text style={styles.inputLabel}>Monto a sumar a lo gastado este mes ($ USD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. 25.00"
          placeholderTextColor="#64748B"
          keyboardType="decimal-pad"
          value={manualSpendInput}
          onChangeText={setManualSpendInput}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => setAddingSpendBudgetId(null)}
          >
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={async () => {
              if (addingSpendBudgetId) {
                const amt = parseFloat(manualSpendInput);
                if (!isNaN(amt) && amt !== 0) {
                  await addManualSpendToBudget(addingSpendBudgetId, amt);
                }
                setAddingSpendBudgetId(null);
              }
            }}
          >
            <Text style={styles.saveBtnText}>Sumar</Text>
          </TouchableOpacity>
        </View>
      </KeyboardSafeModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  topSwitchRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 8,
  },
  topSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  topSwitchBtnActive: {
    backgroundColor: '#38BDF8',
    borderColor: '#38BDF8',
  },
  topSwitchText: { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  topSwitchTextActive: { color: '#0F172A', fontWeight: '800' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0F172A',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#0369A1',
    marginBottom: 16,
  },
  infoBannerText: { flex: 1, color: '#CBD5E1', fontSize: 12, lineHeight: 17 },
  headerSpread: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { color: '#F8FAFC', fontSize: 17, fontWeight: '700' },
  newBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    gap: 4,
  },
  newBudgetBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  budgetCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  budgetTitleText: { color: '#F8FAFC', fontSize: 16, fontWeight: '800' },
  budgetNumbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 10,
    marginBottom: 6,
  },
  budgetSpentBig: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  budgetLimitSmall: { color: '#94A3B8', fontSize: 13, fontWeight: '600' },
  budgetStatusBadge: { fontSize: 12, fontWeight: '700' },
  addManualSpendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  addManualSpendText: { color: '#CBD5E1', fontSize: 12, fontWeight: '600' },
  accountFilterScroll: { marginBottom: 14 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  filterChipText: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  cashflowCard: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  cashflowCol: { flex: 1, alignItems: 'center' },
  cashflowDivider: { width: 1, backgroundColor: '#1E293B' },
  cashflowLabel: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  cashflowVal: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  toggleExpenseActive: { backgroundColor: '#7F1D1D', borderColor: '#EF4444' },
  toggleIncomeActive: { backgroundColor: '#14532D', borderColor: '#22C55E' },
  toggleText: { color: '#F8FAFC', fontSize: 12, fontWeight: '700' },
  chartCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    marginVertical: 20,
  },
  legendList: { marginTop: 12 },
  breakdownRow: {
    marginBottom: 16,
  },
  breakdownTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  catName: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  catCount: { color: '#64748B', fontSize: 11, marginTop: 1, fontWeight: '600' },
  catTotal: { color: '#F8FAFC', fontSize: 15, fontWeight: '800' },
  catPercent: { fontSize: 12, fontWeight: '700', marginTop: 1 },
  progressTrack: {
    height: 7,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
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
