import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFinance } from '../../src/context/FinanceContext';
import {
  US_SANDBOX_BANKS,
  createPlaidLinkToken,
} from '../../src/services/plaidService';
import { AccountType } from '../../src/types/finance';

export default function AccountsScreen() {
  const {
    accounts,
    includedTotalBalance,
    excludedTotalBalance,
    toggleAccountIncludeInTotal,
    connectSandboxUSBank,
    addManualAccount,
    transferBetweenAccounts,
    deleteAccount,
  } = useFinance();

  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Estado para nueva cuenta manual
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [accountType] = useState<AccountType>('checking');
  const [includeInTotal, setIncludeInTotal] = useState(true);

  // Estado para transferir entre cuentas
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFee, setTransferFee] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const handleOpenRealPlaid = async () => {
    try {
      const linkToken = await createPlaidLinkToken();
      Alert.alert(
        'Plaid Link Token Generado',
        `Token listo (${linkToken.slice(0, 18)}...). En un APK Android compilado con react-native-plaid-link-sdk se abre la ventana nativa del banco.`
      );
    } catch {
      Alert.alert(
        'Modo Sandbox Local',
        'El servidor backend aún no tiene llaves de producción configuradas. Puedes vincular al instante cualquiera de los bancos de EE. UU. del simulador abajo.'
      );
    }
  };

  const handleCreateManualAccount = async () => {
    const parsedBalance = parseFloat(balance) || 0;
    if (!name.trim()) return;

    await addManualAccount({
      name: name.trim(),
      institution: institution.trim() || 'Cuenta Personal',
      type: accountType,
      balance: parsedBalance,
      currency: 'USD',
      includeInTotal,
      color: '#0284C7',
    });

    setName('');
    setInstitution('');
    setBalance('');
    setShowManualModal(false);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      Alert.alert('Necesitas al menos 2 cuentas', 'Crea o vincula al menos dos cuentas para transferir dinero entre ellas.');
      return;
    }
    setFromAccId(accounts[0].id);
    setToAccId(accounts[1].id);
    setTransferAmount('');
    setTransferFee('');
    setTransferNote('');
    setShowTransferModal(true);
  };

  const handleExecuteTransfer = async () => {
    const amt = parseFloat(transferAmount);
    const fee = parseFloat(transferFee) || 0;
    if (!amt || amt <= 0) return;
    if (fromAccId === toAccId) {
      Alert.alert('Error', 'Selecciona cuentas diferentes para origen y destino.');
      return;
    }

    await transferBetweenAccounts({
      fromAccountId: fromAccId,
      toAccountId: toAccId,
      amount: amt,
      fee,
      description: transferNote.trim() || undefined,
      date: new Date().toISOString().split('T')[0],
    });
    setShowTransferModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Resumen de separación de cuentas */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>SE SUMAN AL TOTAL</Text>
            <Text style={styles.summaryIncludedValue}>
              ${includedTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryCol}>
            <Text style={styles.summaryLabel}>SEPARADAS (NO SUMAN)</Text>
            <Text style={styles.summaryExcludedValue}>
              ${excludedTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Botones de Conexión Bancaria US, Transferir entre Cuentas y Cuenta Manual */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.plaidConnectBtn}
            onPress={() => setShowPlaidModal(true)}
          >
            <Ionicons name="link-outline" size={18} color="#0F172A" />
            <Text style={styles.plaidConnectBtnText}>Banco US (Plaid)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.transferBtn}
            onPress={openTransferModal}
          >
            <Ionicons name="swap-horizontal-outline" size={18} color="#38BDF8" />
            <Text style={styles.transferBtnText}>Pasar Dinero</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualBtn}
            onPress={() => setShowManualModal(true)}
          >
            <Ionicons name="add-outline" size={20} color="#F8FAFC" />
          </TouchableOpacity>
        </View>

        <Text style={styles.helperNote}>
          Usa el interruptor en cada cuenta para elegir cuáles se suman a tu Saldo Total principal y cuáles mantener separadas.
        </Text>

        {/* Lista de Cuentas */}
        {accounts.map((acc) => (
          <View
            key={acc.id}
            style={[
              styles.accountCard,
              !acc.includeInTotal && styles.accountCardExcluded,
            ]}
          >
            <View style={styles.accountTopRow}>
              <View style={[styles.bankBadge, { backgroundColor: acc.color }]}>
                <Ionicons
                  name={acc.isPlaidConnected ? 'shield-checkmark-outline' : 'wallet-outline'}
                  size={20}
                  color="#FFF"
                />
              </View>

              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  {acc.mask && <Text style={styles.accountMask}>•••• {acc.mask}</Text>}
                </View>
                <Text style={styles.accountInstitution}>
                  {acc.institution} • {acc.isPlaidConnected ? 'Conectado vía Plaid US' : 'Manual'}
                </Text>
              </View>

              <Text style={styles.accountBalance}>
                ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
            </View>

            <View style={styles.accountFooter}>
              <View style={styles.switchRow}>
                <Switch
                  value={acc.includeInTotal}
                  onValueChange={() => toggleAccountIncludeInTotal(acc.id)}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                  thumbColor={acc.includeInTotal ? '#38BDF8' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.switchLabel,
                    { color: acc.includeInTotal ? '#38BDF8' : '#94A3B8' },
                  ]}
                >
                  {acc.includeInTotal
                    ? 'Incluida en el Saldo Total'
                    : 'Separada (No se suma al total)'}
                </Text>
              </View>

              <TouchableOpacity onPress={() => deleteAccount(acc.id)}>
                <Ionicons name="trash-outline" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal para Transferir Dinero entre Cuentas con Comisión Opcional */}
      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pasar Dinero entre Cuentas</Text>
            <Text style={styles.modalSub}>
              Mueve saldo de una cuenta a otra. Si el banco te cobró comisión por la transferencia, agrégala opcionalmente.
            </Text>

            <Text style={styles.inputLabel}>De qué cuenta sale (Origen)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.chip,
                    fromAccId === acc.id && { borderColor: '#38BDF8', backgroundColor: '#0C4A6E' },
                  ]}
                  onPress={() => setFromAccId(acc.id)}
                >
                  <Text style={styles.chipText}>
                    {acc.name} (${acc.balance.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>A qué cuenta entra (Destino)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.chip,
                    toAccId === acc.id && { borderColor: '#4ADE80', backgroundColor: '#14532D' },
                  ]}
                  onPress={() => setToAccId(acc.id)}
                >
                  <Text style={styles.chipText}>
                    {acc.name} (${acc.balance.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Monto a Pasar ($ USD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={transferAmount}
                  onChangeText={setTransferAmount}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Comisión (Opcional $)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  value={transferFee}
                  onChangeText={setTransferFee}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Concepto / Nota (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ahorro mensual, Pago tarjeta, Zelle..."
              placeholderTextColor="#64748B"
              value={transferNote}
              onChangeText={setTransferNote}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setShowTransferModal(false)}
              >
                <Text style={styles.closeModalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.realPlaidBtn, { flex: 1, marginBottom: 0 }]}
                onPress={handleExecuteTransfer}
              >
                <Text style={styles.realPlaidBtnText}>Transferir Ahora</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Conexión Plaid US */}
      <Modal visible={showPlaidModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Conectar Banco en Estados Unidos</Text>
            <Text style={styles.modalSub}>
              Vincula cuentas de Chase, Bank of America, Wells Fargo, Capital One, Citi o American Express mediante Plaid para importar transacciones automáticamente.
            </Text>

            <TouchableOpacity style={styles.realPlaidBtn} onPress={handleOpenRealPlaid}>
              <Ionicons name="lock-closed-outline" size={18} color="#0F172A" />
              <Text style={styles.realPlaidBtnText}>Abrir Plaid Link Oficial (API Real)</Text>
            </TouchableOpacity>

            <Text style={styles.sandboxHeader}>
              O prueba ahora mismo con un Banco Sandbox de EE. UU.:
            </Text>

            {US_SANDBOX_BANKS.map((bank) => (
              <View key={bank.id} style={styles.sandboxBankRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sandboxBankTitle}>
                    {bank.institution} — {bank.accountName}
                  </Text>
                  <Text style={styles.sandboxBankSub}>
                    Saldo: ${bank.balance.toFixed(2)} • Incluye {bank.sampleTransactions.length} movimientos de prueba
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.sandboxAddBtn}
                  onPress={async () => {
                    await connectSandboxUSBank(bank.id, true);
                    setShowPlaidModal(false);
                  }}
                >
                  <Text style={styles.sandboxAddBtnText}>Vincular</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setShowPlaidModal(false)}
            >
              <Text style={styles.closeModalBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal para Agregar Cuenta Manual */}
      <Modal visible={showManualModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva Cuenta o Efectivo</Text>

            <Text style={styles.inputLabel}>Nombre de la cuenta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Ahorros Casa, Efectivo, Wells Fargo..."
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Banco o Institución</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Wells Fargo, Citibank, Efectivo..."
              placeholderTextColor="#64748B"
              value={institution}
              onChangeText={setInstitution}
            />

            <Text style={styles.inputLabel}>Saldo Inicial ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={setBalance}
            />

            <View style={[styles.switchRow, { marginTop: 14 }]}>
              <Switch
                value={includeInTotal}
                onValueChange={setIncludeInTotal}
                trackColor={{ false: '#334155', true: '#0284C7' }}
              />
              <Text style={styles.switchLabel}>Sumar esta cuenta al Saldo Total</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setShowManualModal(false)}
              >
                <Text style={styles.closeModalBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.realPlaidBtn, { flex: 1, marginBottom: 0 }]}
                onPress={handleCreateManualAccount}
              >
                <Text style={styles.realPlaidBtnText}>Guardar Cuenta</Text>
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
  summaryBanner: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14,
  },
  summaryCol: { flex: 1 },
  summaryDivider: { width: 1, backgroundColor: '#1E293B', marginHorizontal: 14 },
  summaryLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  summaryIncludedValue: { color: '#38BDF8', fontSize: 20, fontWeight: '800', marginTop: 4 },
  summaryExcludedValue: { color: '#A855F7', fontSize: 20, fontWeight: '800', marginTop: 4 },
  topButtonsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  plaidConnectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#38BDF8',
    paddingVertical: 12,
    borderRadius: 12,
  },
  plaidConnectBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 13 },
  transferBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0C4A6E',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  transferBtnText: { color: '#E0F2FE', fontWeight: '700', fontSize: 13 },
  manualBtn: {
    width: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  helperNote: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  accountCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  accountCardExcluded: {
    opacity: 0.82,
    borderColor: '#334155',
    borderStyle: 'dashed',
  },
  accountTopRow: { flexDirection: 'row', alignItems: 'center' },
  bankBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  accountName: { color: '#F8FAFC', fontSize: 16, fontWeight: '700' },
  accountMask: { color: '#94A3B8', fontSize: 12 },
  accountInstitution: { color: '#64748B', fontSize: 12, marginTop: 2 },
  accountBalance: { color: '#F8FAFC', fontSize: 18, fontWeight: '800' },
  accountFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    marginTop: 12,
    paddingTop: 10,
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { color: '#CBD5E1', fontSize: 13, fontWeight: '600' },
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
  modalTitle: { color: '#F8FAFC', fontSize: 19, fontWeight: '800', marginBottom: 6 },
  modalSub: { color: '#94A3B8', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  realPlaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  realPlaidBtnText: { color: '#052E16', fontWeight: '800', fontSize: 14 },
  sandboxHeader: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  sandboxBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sandboxBankTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '700' },
  sandboxBankSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  sandboxAddBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sandboxAddBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 12 },
  closeModalBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  closeModalBtnText: { color: '#94A3B8', fontWeight: '700' },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 6 },
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
});
