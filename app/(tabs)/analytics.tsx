import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFinance } from '../../src/context/FinanceContext';
import { DonutChart } from '../../src/components/DonutChart';
import { SmartIcon } from '../../src/components/BrandIcon';

export default function AnalyticsScreen() {
  const {
    accounts,
    categories,
    transactions,
    getCategoryBreakdown,
    getCategorySpentThisMonth,
  } = useFinance();

  const [selectedType, setSelectedType] = useState<'expense' | 'income'>('expense');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');

  const breakdown = getCategoryBreakdown(selectedType, selectedAccountId);

  const totalIncome = transactions
    .filter((t) => t.type === 'income' && (selectedAccountId === 'all' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense' && (selectedAccountId === 'all' || t.accountId === selectedAccountId))
    .reduce((sum, t) => sum + t.amount, 0);

  // Categorías con presupuesto mensual configurado
  const budgetedCategories = categories.filter(
    (c) => c.type === 'expense' && (c.monthlyBudget || 0) > 0
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
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

        {/* Tarjeta de Control de Presupuestos del Mes */}
        {budgetedCategories.length > 0 && (
          <View style={styles.budgetsCard}>
            <Text style={styles.budgetsCardTitle}>
              Presupuestos del Mes (Informativos — Sin bloqueo)
            </Text>

            {budgetedCategories.map((cat) => {
              const spent = getCategorySpentThisMonth(cat.id);
              const limit = cat.monthlyBudget || 0;
              const pct = limit > 0 ? (spent / limit) * 100 : 0;
              const over = spent > limit;

              return (
                <View key={cat.id} style={styles.budgetItemRow}>
                  <View style={styles.breakdownTop}>
                    <View style={styles.breakdownLeft}>
                      <SmartIcon
                        iconName={cat.icon}
                        color={cat.color}
                        size={16}
                        boxSize={32}
                      />
                      <View>
                        <Text style={styles.catName}>{cat.name}</Text>
                        <Text
                          style={[
                            styles.catCount,
                            { color: over ? '#F87171' : '#4ADE80' },
                          ]}
                        >
                          {over
                            ? `Sobrepasado por $${(spent - limit).toFixed(2)}`
                            : `Te quedan $${(limit - spent).toFixed(2)} este mes`}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.catTotal}>
                        ${spent.toFixed(2)} / ${limit.toFixed(0)}
                      </Text>
                      <Text
                        style={[
                          styles.catPercent,
                          { color: over ? '#EF4444' : '#38BDF8' },
                        ]}
                      >
                        {pct.toFixed(0)}%
                      </Text>
                    </View>
                  </View>

                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: over
                            ? '#EF4444'
                            : pct > 80
                            ? '#F59E0B'
                            : '#22C55E',
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

        {/* Gráfica Circular Interactiva (DonutChart) */}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { padding: 16, paddingBottom: 40 },
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
  filterChipText: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
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
  budgetsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  budgetsCardTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  budgetItemRow: {
    marginBottom: 14,
  },
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
  breakdownLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
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
});
