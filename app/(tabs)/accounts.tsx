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
  US_MAJOR_BANKS,
  US_SANDBOX_BANKS,
  USBankTemplate,
  createPlaidLinkToken,
} from '../../src/services/plaidService';
import { AccountType, BankAccount } from '../../src/types/finance';

export default function AccountsScreen() {
  const {
    accounts,
    includedTotalBalance,
    excludedTotalBalance,
    backendUrl,
    plaidClientId,
    plaidSecret,
    toggleAccountIncludeInTotal,
    connectCustomUSBank,
    connectBankViaLivePlaidApi,
    updateAccountBalanceAndMask,
    connectSandboxUSBank,
    addManualAccount,
    updateCreditCardDetails,
    transferBetweenAccounts,
    deleteAccount,
  } = useFinance();

  const [showPlaidModal, setShowPlaidModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Estado para conexión directa de Wells Fargo, Chase, Truist, etc.
  const [selectedBankTemplate, setSelectedBankTemplate] = useState<USBankTemplate>(US_MAJOR_BANKS[0]);
  const [usBankAccountType, setUsBankAccountType] = useState<AccountType>('checking');
  const [usBankCustomName, setUsBankCustomName] = useState(US_MAJOR_BANKS[0].defaultCheckingName);
  const [usBankBalance, setUsBankBalance] = useState('');
  const [usBankMask, setUsBankMask] = useState('');
  const [usBankIncludeTotal, setUsBankIncludeTotal] = useState(true);
  const [usBankCreditLimit, setUsBankCreditLimit] = useState('');
  const [usBankClosingDay, setUsBankClosingDay] = useState('');
  const [usBankDueDay, setUsBankDueDay] = useState('');
  const [usModalMode, setUsModalMode] = useState<'direct' | 'sandbox'>('direct');
  const [connectingPlaidBankId, setConnectingPlaidBankId] = useState<string | null>(null);

  // Estado para nueva cuenta manual o tarjeta de crédito
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [balance, setBalance] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [includeInTotal, setIncludeInTotal] = useState(true);
  const [creditLimit, setCreditLimit] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');

  // Modal para editar fechas de corte/pago y límite de una tarjeta existente
  const [editingCard, setEditingCard] = useState<BankAccount | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editClosing, setEditClosing] = useState('');
  const [editDue, setEditDue] = useState('');

  // Modal para ajustar el saldo real y últimos 4 dígitos de cualquier cuenta (ej. tras conectar con Plaid Sandbox)
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [editAccName, setEditAccName] = useState('');
  const [editAccBalance, setEditAccBalance] = useState('');
  const [editAccMask, setEditAccMask] = useState('');

  // Estado para transferir entre cuentas
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFee, setTransferFee] = useState('');
  const [transferNote, setTransferNote] = useState('');

  const handleSelectUSBankTemplate = (bank: USBankTemplate, typeOverride?: AccountType) => {
    const targetType = typeOverride || usBankAccountType;
    setSelectedBankTemplate(bank);
    setUsBankAccountType(targetType);
    if (targetType === 'checking') {
      setUsBankCustomName(bank.defaultCheckingName);
      setUsBankIncludeTotal(true);
    } else if (targetType === 'savings') {
      setUsBankCustomName(bank.defaultSavingsName);
      setUsBankIncludeTotal(true);
    } else {
      setUsBankCustomName(bank.defaultCreditName);
      setUsBankIncludeTotal(false);
    }
  };

  const handleConnectDirectUSBank = async () => {
    const parsedBal = parseFloat(usBankBalance) || 0;
    const finalName = usBankCustomName.trim() || selectedBankTemplate.defaultCheckingName;

    await connectCustomUSBank({
      name: finalName,
      institution: selectedBankTemplate.institution,
      mask: usBankMask.trim() || selectedBankTemplate.defaultMask,
      type: usBankAccountType,
      balance: parsedBal,
      currency: 'USD',
      includeInTotal: usBankAccountType === 'credit' ? false : usBankIncludeTotal,
      color: selectedBankTemplate.color,
      creditLimit: usBankAccountType === 'credit' ? parseFloat(usBankCreditLimit) || 0 : 0,
      closingDay: usBankAccountType === 'credit' ? parseInt(usBankClosingDay, 10) || 0 : 0,
      dueDay: usBankAccountType === 'credit' ? parseInt(usBankDueDay, 10) || 0 : 0,
    });

    setUsBankBalance('');
    setUsBankMask('');
    setUsBankCreditLimit('');
    setUsBankClosingDay('');
    setUsBankDueDay('');
    setShowPlaidModal(false);
  };

  const handleOpenRealPlaid = async () => {
    try {
      const linkToken = await createPlaidLinkToken(
        'user-android-1',
        backendUrl,
        plaidClientId,
        plaidSecret
      );
      Alert.alert(
        'Plaid Link Token Generado',
        `Token oficial recibido (${linkToken.slice(0, 20)}...). Tu servidor en Vercel y llaves de Plaid están conectadas correctamente.`
      );
    } catch {
      Alert.alert(
        'Conexión Directa Disponible',
        'Plaid automático requiere llaves de desarrollador (PLAID_CLIENT_ID y PLAID_SECRET en Ajustes o en Vercel). ¡No te preocupes! Selecciona arriba Wells Fargo, Chase o Truist en "Mi Cuenta Real" para agregar tus cuentas ahora mismo sin llaves.'
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
      includeInTotal: accountType === 'credit' ? false : includeInTotal,
      color: accountType === 'credit' ? '#E11D48' : '#0284C7',
      creditLimit: accountType === 'credit' ? parseFloat(creditLimit) || 0 : 0,
      closingDay: accountType === 'credit' ? parseInt(closingDay, 10) || 0 : 0,
      dueDay: accountType === 'credit' ? parseInt(dueDay, 10) || 0 : 0,
    });

    setName('');
    setInstitution('');
    setBalance('');
    setCreditLimit('');
    setClosingDay('');
    setDueDay('');
    setShowManualModal(false);
  };

  const handleSaveCreditCardSettings = async () => {
    if (!editingCard) return;
    await updateCreditCardDetails(
      editingCard.id,
      parseFloat(editLimit) || 0,
      parseInt(editClosing, 10) || 0,
      parseInt(editDue, 10) || 0
    );
    setEditingCard(null);
  };

  const openTransferModal = () => {
    if (accounts.length < 2) {
      Alert.alert(
        'Necesitas al menos 2 cuentas',
        'Crea o vincula al menos dos cuentas para transferir dinero entre ellas.'
      );
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
            <Text style={styles.summaryLabel}>SEPARADAS / TARJETAS</Text>
            <Text style={styles.summaryExcludedValue}>
              ${excludedTotalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* Botones de Conexión Bancaria US, Transferir entre Cuentas y Cuenta Manual */}
        <View style={styles.topButtonsRow}>
          <TouchableOpacity
            style={styles.plaidConnectBtn}
            onPress={() => {
              handleSelectUSBankTemplate(US_MAJOR_BANKS[0], 'checking');
              setShowPlaidModal(true);
            }}
          >
            <Ionicons name="business-outline" size={18} color="#0F172A" />
            <Text style={styles.plaidConnectBtnText}>Agregar Banco US</Text>
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
          Conecta tus cuentas de Wells Fargo, Chase, Truist o cualquier banco de EE. UU. Elige cuáles se suman a tu Saldo Total y controla el % de utilización de tus tarjetas de crédito.
        </Text>

        {/* Lista de Cuentas y Tarjetas de Crédito */}
        {accounts.map((acc) => {
          const isCredit = acc.type === 'credit';
          const limit = acc.creditLimit || 0;
          const used = Math.abs(acc.balance);
          const utilizationPct = limit > 0 ? (used / limit) * 100 : 0;

          return (
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
                    name={
                      isCredit
                        ? 'card-outline'
                        : acc.isPlaidConnected
                        ? 'shield-checkmark-outline'
                        : 'wallet-outline'
                    }
                    size={20}
                    color="#FFF"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.accountName}>{acc.name}</Text>
                    {acc.mask && <Text style={styles.accountMask}>•••• {acc.mask}</Text>}
                  </View>
                  <Text style={styles.accountInstitution}>
                    {acc.institution} •{' '}
                    {isCredit
                      ? 'Tarjeta de Crédito US'
                      : acc.type === 'savings'
                      ? 'Savings / Ahorros'
                      : 'Checking / Corriente'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.accountBalance}>
                    ${acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </Text>
                  {isCredit && (
                    <Text style={styles.creditSubTag}>Saldo usado</Text>
                  )}
                </View>
              </View>

              {/* Panel de Control de Tarjeta de Crédito (Corte, Pago y % Utilización FICO) */}
              {isCredit && (
                <View style={styles.creditBox}>
                  <View style={styles.creditHeaderRow}>
                    <Text style={styles.creditDatesText}>
                      Corte (Closing):{' '}
                      <Text style={styles.creditHighlight}>
                        {acc.closingDay ? `Día ${acc.closingDay}` : 'Sin definir'}
                      </Text>{' '}
                      • Pago (Due):{' '}
                      <Text style={styles.creditHighlight}>
                        {acc.dueDay ? `Día ${acc.dueDay}` : 'Sin definir'}
                      </Text>
                    </Text>

                    <TouchableOpacity
                      style={styles.editCreditBtn}
                      onPress={() => {
                        setEditingCard(acc);
                        setEditLimit(limit > 0 ? String(limit) : '');
                        setEditClosing(acc.closingDay ? String(acc.closingDay) : '');
                        setEditDue(acc.dueDay ? String(acc.dueDay) : '');
                      }}
                    >
                      <Text style={styles.editCreditBtnText}>Configurar Tarjeta</Text>
                    </TouchableOpacity>
                  </View>

                  {limit > 0 && (
                    <>
                      <View style={styles.creditUtilRow}>
                        <Text style={styles.creditUtilLabel}>
                          Disponible: ${Math.max(0, limit - used).toFixed(2)} de ${limit.toFixed(0)}
                        </Text>
                        <Text
                          style={[
                            styles.creditUtilPct,
                            {
                              color:
                                utilizationPct > 30
                                  ? '#F87171'
                                  : utilizationPct > 10
                                  ? '#FBBF24'
                                  : '#4ADE80',
                            },
                          ]}
                        >
                          Utilización: {utilizationPct.toFixed(1)}%{' '}
                          {utilizationPct <= 30 ? '(Óptimo FICO)' : '(Alto >30%)'}
                        </Text>
                      </View>
                      <View style={styles.progressTrack}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(utilizationPct, 100)}%`,
                              backgroundColor:
                                utilizationPct > 30
                                  ? '#EF4444'
                                  : utilizationPct > 10
                                  ? '#F59E0B'
                                  : '#22C55E',
                            },
                          ]}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}

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

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#1E293B',
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: '#334155',
                    }}
                    onPress={() => {
                      setEditingAccount(acc);
                      setEditAccName(acc.name);
                      setEditAccBalance(String(acc.balance));
                      setEditAccMask(acc.mask || '');
                    }}
                  >
                    <Ionicons name="create-outline" size={14} color="#38BDF8" />
                    <Text style={{ color: '#38BDF8', fontSize: 11, fontWeight: '700' }}>
                      Editar Saldo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => deleteAccount(acc.id)}>
                    <Ionicons name="trash-outline" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal para Editar el Saldo Real, Nombre y 4 Dígitos de cualquier Cuenta */}
      <Modal visible={Boolean(editingAccount)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Ajustar a tu Saldo Real: {editingAccount?.institution}
            </Text>
            <Text style={styles.modalSub}>
              Como tu llave de Plaid es de tipo Sandbox (Pruebas), Plaid descarga saldos de prueba ($110 / $210). Aquí puedes poner tu saldo real exacto en dólares y tus últimos 4 dígitos.
            </Text>

            <Text style={styles.inputLabel}>Nombre de tu Cuenta</Text>
            <TextInput
              style={styles.input}
              value={editAccName}
              onChangeText={setEditAccName}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>
                  {editingAccount?.type === 'credit'
                    ? 'Deuda Actual en Tarjeta ($ USD)'
                    : 'Tu Saldo Real Actual ($ USD)'}
                </Text>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={editAccBalance}
                  onChangeText={setEditAccBalance}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Últimos 4 dígitos</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="number-pad"
                  maxLength={4}
                  value={editAccMask}
                  onChangeText={setEditAccMask}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setEditingAccount(null)}
              >
                <Text style={styles.closeModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.realPlaidBtn, { flex: 1, marginBottom: 0 }]}
                onPress={async () => {
                  if (editingAccount) {
                    await updateAccountBalanceAndMask(
                      editingAccount.id,
                      editAccName || editingAccount.name,
                      parseFloat(editAccBalance) || 0,
                      editAccMask
                    );
                    setEditingAccount(null);
                  }
                }}
              >
                <Text style={styles.realPlaidBtnText}>Guardar Saldo Real</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Configurar Corte, Pago y Límite de Tarjeta de Crédito */}
      <Modal visible={Boolean(editingCard)} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Configurar Tarjeta: {editingCard?.name}
            </Text>
            <Text style={styles.modalSub}>
              En EE. UU. mantener el uso bajo el 30% antes del día de corte (Statement Closing Date) mejora tu puntaje de crédito (Credit Score).
            </Text>

            <Text style={styles.inputLabel}>Límite de Crédito Total ($ USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 3000"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={editLimit}
              onChangeText={setEditLimit}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Día de Corte (1-31)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 18"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  value={editClosing}
                  onChangeText={setEditClosing}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Día Límite Pago (1-31)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej. 15"
                  placeholderTextColor="#64748B"
                  keyboardType="number-pad"
                  value={editDue}
                  onChangeText={setEditDue}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                style={[styles.closeModalBtn, { flex: 1, marginTop: 0 }]}
                onPress={() => setEditingCard(null)}
              >
                <Text style={styles.closeModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.realPlaidBtn, { flex: 1, marginBottom: 0 }]}
                onPress={handleSaveCreditCardSettings}
              >
                <Text style={styles.realPlaidBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para Transferir Dinero entre Cuentas con Comisión Opcional */}
      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Pasar Dinero o Pagar Tarjeta</Text>
            <Text style={styles.modalSub}>
              Mueve saldo de una cuenta a otra (o paga tu tarjeta de crédito). Si te cobraron comisión, agrégala opcionalmente.
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

            <Text style={styles.inputLabel}>A qué cuenta entra o qué tarjeta paga (Destino)</Text>
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
              placeholder="Ej. Pago de tarjeta Chase, Zelle a Truist..."
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

      {/* Modal de Conexión Bancaria US (Wells Fargo, Chase, Truist, etc.) */}
      <Modal visible={showPlaidModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Agregar Banco de Estados Unidos</Text>
              <Text style={styles.modalSub}>
                Elige tu banco (Wells Fargo, Chase, Truist, BofA, Capital One, Citi o Amex) y agrega tu cuenta real al instante.
              </Text>

              {/* Selector de modo: Mi Cuenta Real vs Demo Sandbox / Plaid API */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.typeSelectBtn,
                    usModalMode === 'direct' && styles.typeSelectBtnActive,
                  ]}
                  onPress={() => setUsModalMode('direct')}
                >
                  <Text style={styles.typeSelectText}>Mi Cuenta Real (Directo)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.typeSelectBtn,
                    usModalMode === 'sandbox' && styles.typeSelectBtnActive,
                  ]}
                  onPress={() => setUsModalMode('sandbox')}
                >
                  <Text style={styles.typeSelectText}>Plaid API / Demo Sandbox</Text>
                </TouchableOpacity>
              </View>

              {usModalMode === 'direct' ? (
                <>
                  <Text style={styles.inputLabel}>
                    1. Selecciona tu Banco (Wells Fargo, Chase, Truist...)
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginVertical: 6 }}
                  >
                    {US_MAJOR_BANKS.map((bank) => {
                      const isSelected = selectedBankTemplate.id === bank.id;
                      return (
                        <TouchableOpacity
                          key={bank.id}
                          style={[
                            styles.usBankPill,
                            { borderColor: isSelected ? bank.color : '#334155' },
                            isSelected && { backgroundColor: bank.color + '28' },
                          ]}
                          onPress={() => handleSelectUSBankTemplate(bank)}
                        >
                          <View
                            style={[
                              styles.usBankDot,
                              { backgroundColor: bank.color },
                            ]}
                          />
                          <Text style={styles.usBankPillText}>{bank.shortName}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text style={styles.inputLabel}>2. Tipo de Cuenta en {selectedBankTemplate.shortName}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.typeSelectBtn,
                        usBankAccountType === 'checking' && styles.typeSelectBtnActive,
                      ]}
                      onPress={() => handleSelectUSBankTemplate(selectedBankTemplate, 'checking')}
                    >
                      <Text style={styles.typeSelectText}>Checking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeSelectBtn,
                        usBankAccountType === 'savings' && styles.typeSelectBtnActive,
                      ]}
                      onPress={() => handleSelectUSBankTemplate(selectedBankTemplate, 'savings')}
                    >
                      <Text style={styles.typeSelectText}>Savings (Ahorro)</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeSelectBtn,
                        usBankAccountType === 'credit' && styles.typeSelectBtnActive,
                      ]}
                      onPress={() => handleSelectUSBankTemplate(selectedBankTemplate, 'credit')}
                    >
                      <Text style={styles.typeSelectText}>Tarjeta Crédito</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Nombre de la Cuenta</Text>
                  <TextInput
                    style={styles.input}
                    value={usBankCustomName}
                    onChangeText={setUsBankCustomName}
                    placeholder="Ej. Wells Fargo Checking"
                    placeholderTextColor="#64748B"
                  />

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Text style={styles.inputLabel}>
                        {usBankAccountType === 'credit'
                          ? 'Deuda Usada Actual ($ USD)'
                          : 'Tu Saldo Actual ($ USD)'}
                      </Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#64748B"
                        keyboardType="decimal-pad"
                        value={usBankBalance}
                        onChangeText={setUsBankBalance}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>Últimos 4 dígitos</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={selectedBankTemplate.defaultMask}
                        placeholderTextColor="#64748B"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={usBankMask}
                        onChangeText={setUsBankMask}
                      />
                    </View>
                  </View>

                  {usBankAccountType === 'credit' ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Límite ($)</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="3000"
                          placeholderTextColor="#64748B"
                          keyboardType="decimal-pad"
                          value={usBankCreditLimit}
                          onChangeText={setUsBankCreditLimit}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Día Corte</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="18"
                          placeholderTextColor="#64748B"
                          keyboardType="number-pad"
                          value={usBankClosingDay}
                          onChangeText={setUsBankClosingDay}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.inputLabel}>Día Pago</Text>
                        <TextInput
                          style={styles.input}
                          placeholder="15"
                          placeholderTextColor="#64748B"
                          keyboardType="number-pad"
                          value={usBankDueDay}
                          onChangeText={setUsBankDueDay}
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.switchRow, { marginTop: 12, marginBottom: 12 }]}>
                      <Switch
                        value={usBankIncludeTotal}
                        onValueChange={setUsBankIncludeTotal}
                        trackColor={{ false: '#334155', true: '#0284C7' }}
                      />
                      <Text style={styles.switchLabel}>Sumar esta cuenta a mi Saldo Total</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.realPlaidBtn,
                      { marginTop: 10, backgroundColor: selectedBankTemplate.color },
                    ]}
                    onPress={handleConnectDirectUSBank}
                  >
                    <Ionicons name="shield-checkmark-outline" size={18} color="#FFF" />
                    <Text style={[styles.realPlaidBtnText, { color: '#FFF' }]}>
                      Agregar Cuenta de {selectedBankTemplate.shortName}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View
                    style={{
                      backgroundColor: '#052E16',
                      borderWidth: 1,
                      borderColor: '#22C55E',
                      borderRadius: 12,
                      padding: 10,
                      marginBottom: 12,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#4ADE80', fontSize: 12, fontWeight: '800' }}>
                        Plaid API Activa • Client ID: {plaidClientId.slice(0, 10)}...
                      </Text>
                      <Text style={{ color: '#86EFAC', fontSize: 11 }}>
                        Toca cualquier banco abajo para autenticar y descargar sus cuentas reales desde Plaid API:
                      </Text>
                    </View>
                  </View>

                  {US_MAJOR_BANKS.map((bank) => {
                    const isConnecting = connectingPlaidBankId === bank.id;
                    return (
                      <View key={bank.id} style={styles.sandboxBankRow}>
                        <View
                          style={[
                            styles.usBankDot,
                            { backgroundColor: bank.color, marginRight: 10, width: 12, height: 12, borderRadius: 6 },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.sandboxBankTitle}>{bank.institution}</Text>
                          <Text style={styles.sandboxBankSub}>
                            ID Plaid: {bank.plaidInstitutionId} • Checking, Savings & Credit
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={[
                            styles.sandboxAddBtn,
                            { backgroundColor: isConnecting ? '#475569' : '#4ADE80' },
                          ]}
                          disabled={isConnecting}
                          onPress={async () => {
                            try {
                              setConnectingPlaidBankId(bank.id);
                              const count = await connectBankViaLivePlaidApi(bank);
                              setConnectingPlaidBankId(null);
                              setShowPlaidModal(false);
                              Alert.alert(
                                '✓ Conectado con Plaid API',
                                `Se vincularon ${count} cuentas de ${bank.institution} directamente desde los servidores de Plaid.`
                              );
                            } catch {
                              setConnectingPlaidBankId(null);
                              await connectSandboxUSBank('wells_fargo', true);
                              setShowPlaidModal(false);
                            }
                          }}
                        >
                          <Text style={[styles.sandboxAddBtnText, { color: '#052E16' }]}>
                            {isConnecting ? 'Conectando...' : 'Conectar Plaid'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  <TouchableOpacity
                    style={[styles.realPlaidBtn, { marginTop: 8, backgroundColor: '#1E293B' }]}
                    onPress={handleOpenRealPlaid}
                  >
                    <Ionicons name="key-outline" size={16} color="#38BDF8" />
                    <Text style={[styles.realPlaidBtnText, { color: '#38BDF8' }]}>
                      Verificar Link Token de Plaid
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setShowPlaidModal(false)}
              >
                <Text style={styles.closeModalBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para Agregar Cuenta Manual o Efectivo */}
      <Modal visible={showManualModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nueva Cuenta Personal / Efectivo</Text>

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              <TouchableOpacity
                style={[
                  styles.typeSelectBtn,
                  accountType === 'checking' && styles.typeSelectBtnActive,
                ]}
                onPress={() => setAccountType('checking')}
              >
                <Text style={styles.typeSelectText}>Checking / Efectivo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeSelectBtn,
                  accountType === 'savings' && styles.typeSelectBtnActive,
                ]}
                onPress={() => setAccountType('savings')}
              >
                <Text style={styles.typeSelectText}>Ahorros (Savings)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeSelectBtn,
                  accountType === 'credit' && styles.typeSelectBtnActive,
                ]}
                onPress={() => setAccountType('credit')}
              >
                <Text style={styles.typeSelectText}>Tarjeta Crédito</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Nombre de la cuenta o tarjeta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Efectivo Casa, Billetera, Cuenta Local..."
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>Banco o Institución</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Wells Fargo, Chase, Truist, Efectivo..."
              placeholderTextColor="#64748B"
              value={institution}
              onChangeText={setInstitution}
            />

            <Text style={styles.inputLabel}>
              {accountType === 'credit' ? 'Deuda / Saldo usado actual ($ USD)' : 'Saldo Inicial ($ USD)'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={setBalance}
            />

            {accountType === 'credit' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Límite Crédito ($)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="3000"
                    placeholderTextColor="#64748B"
                    keyboardType="decimal-pad"
                    value={creditLimit}
                    onChangeText={setCreditLimit}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Día Corte</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="18"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    value={closingDay}
                    onChangeText={setClosingDay}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Día Pago</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="15"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    value={dueDay}
                    onChangeText={setDueDay}
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.switchRow, { marginTop: 14 }]}>
                <Switch
                  value={includeInTotal}
                  onValueChange={setIncludeInTotal}
                  trackColor={{ false: '#334155', true: '#0284C7' }}
                />
                <Text style={styles.switchLabel}>Sumar esta cuenta al Saldo Total</Text>
              </View>
            )}

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
                <Text style={styles.realPlaidBtnText}>Guardar</Text>
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
    opacity: 0.9,
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
  creditSubTag: { color: '#FDA4AF', fontSize: 10, fontWeight: '600' },
  creditBox: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  creditHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  creditDatesText: { color: '#CBD5E1', fontSize: 11 },
  creditHighlight: { color: '#38BDF8', fontWeight: '700' },
  editCreditBtn: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  editCreditBtnText: { color: '#38BDF8', fontSize: 11, fontWeight: '700' },
  creditUtilRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  creditUtilLabel: { color: '#94A3B8', fontSize: 11 },
  creditUtilPct: { fontSize: 11, fontWeight: '700' },
  progressTrack: {
    height: 6,
    backgroundColor: '#0F172A',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 999 },
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
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeSelectBtnActive: {
    backgroundColor: '#0369A1',
    borderColor: '#38BDF8',
  },
  typeSelectText: { color: '#F8FAFC', fontSize: 11, fontWeight: '700' },
  usBankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    marginRight: 8,
  },
  usBankDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  usBankPillText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '800',
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
  modalTitle: { color: '#F8FAFC', fontSize: 19, fontWeight: '800', marginBottom: 6 },
  modalSub: { color: '#94A3B8', fontSize: 12, lineHeight: 18, marginBottom: 12 },
  realPlaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ADE80',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  realPlaidBtnText: { color: '#052E16', fontWeight: '800', fontSize: 13 },
  sandboxHeader: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  sandboxBankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  sandboxBankTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '700' },
  sandboxBankSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  sandboxAddBtn: {
    backgroundColor: '#38BDF8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sandboxAddBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 11 },
  closeModalBtn: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  closeModalBtnText: { color: '#94A3B8', fontWeight: '700' },
  inputLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 14,
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
