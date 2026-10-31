import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const WEEKDAY_NAMES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'];

export interface DatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  date: string; // Formato YYYY-MM-DD
  onSelectDate: (date: string) => void;
  title?: string;
}

export const formatDateToSpanish = (dateStr: string): string => {
  if (!dateStr || !dateStr.includes('-')) return dateStr || 'Sin fecha';
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return dateStr;
  }
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString('es-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const DatePickerModal: React.FC<DatePickerModalProps> = ({
  visible,
  onClose,
  date,
  onSelectDate,
  title = 'Seleccionar Fecha',
}) => {
  const { colors, isDark } = useTheme();

  // Parsing fecha inicial
  const initialDate = useMemo(() => {
    if (date && date.includes('-')) {
      const parts = date.split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
      }
    }
    return new Date();
  }, [date]);

  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState(
    date || new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    if (visible) {
      const parts = (date || new Date().toISOString().split('T')[0]).split('-').map(Number);
      if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        setCurrentYear(parts[0]);
        setCurrentMonth(parts[1] - 1);
        setSelectedDateStr(date || new Date().toISOString().split('T')[0]);
      }
    }
  }, [visible, date]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Navegación meses
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Matriz de días del mes
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Do
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const cells: {
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
    }[] = [];

    // Días del mes anterior (padding inicial)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevM = currentMonth === 0 ? 12 : currentMonth;
      const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${prevY}-${String(prevM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    // Días del mes actual
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    // Días del siguiente mes (padding final para completar semanas)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextM = currentMonth === 11 ? 1 : currentMonth + 2;
      const nextY = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${nextY}-${String(nextM).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDateStr,
      });
    }

    return cells;
  }, [currentYear, currentMonth, selectedDateStr, todayStr]);

  const selectPresetDays = (daysOffset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const str = `${y}-${m}-${day}`;
    setCurrentYear(y);
    setCurrentMonth(d.getMonth());
    setSelectedDateStr(str);
  };

  const selectFirstOfNextMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = '01';
    const str = `${y}-${m}-${day}`;
    setCurrentYear(y);
    setCurrentMonth(d.getMonth());
    setSelectedDateStr(str);
  };

  const handleConfirm = () => {
    onSelectDate(selectedDateStr);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[
          styles.overlay,
          { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(15, 23, 42, 0.55)' },
        ]}
        onPress={onClose}
      >
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="calendar" size={20} color={isDark ? '#38BDF8' : '#0284C7'} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Presets Rápidos */}
          <View style={styles.presetRow}>
            {[
              { label: 'Hoy', action: () => selectPresetDays(0) },
              { label: 'Mañana', action: () => selectPresetDays(1) },
              { label: '+7 días', action: () => selectPresetDays(7) },
              { label: '+15 días', action: () => selectPresetDays(15) },
              { label: '1° próx. mes', action: selectFirstOfNextMonth },
            ].map((p) => (
              <TouchableOpacity
                key={p.label}
                style={[
                  styles.presetChip,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
                onPress={p.action}
              >
                <Text style={[styles.presetText, { color: isDark ? '#E2E8F0' : '#334155' }]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Navegación de Mes y Año */}
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              style={[styles.navArrow, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={[styles.navArrow, { borderColor: isDark ? '#334155' : '#E2E8F0' }]}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Días de la semana */}
          <View style={styles.weekdaysRow}>
            {WEEKDAY_NAMES.map((w, idx) => (
              <Text
                key={idx}
                style={[
                  styles.weekdayText,
                  { color: idx === 0 || idx === 6 ? (isDark ? '#F87171' : '#DC2626') : colors.textMuted },
                ]}
              >
                {w}
              </Text>
            ))}
          </View>

          {/* Matriz del Calendario */}
          <View style={styles.daysGrid}>
            {calendarCells.map((cell, idx) => {
              const isSelected = cell.isSelected;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedDateStr(cell.dateStr);
                    if (!cell.isCurrentMonth) {
                      const parts = cell.dateStr.split('-').map(Number);
                      setCurrentYear(parts[0]);
                      setCurrentMonth(parts[1] - 1);
                    }
                  }}
                  style={[
                    styles.dayCell,
                    isSelected && {
                      backgroundColor: isDark ? '#0284C7' : '#0284C7',
                      borderRadius: 10,
                    },
                    cell.isToday && !isSelected && {
                      borderWidth: 1.5,
                      borderColor: isDark ? '#38BDF8' : '#0284C7',
                      borderRadius: 10,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : cell.isCurrentMonth
                          ? colors.text
                          : isDark
                          ? '#475569'
                          : '#CBD5E1',
                        fontWeight: isSelected || cell.isToday ? '800' : '500',
                      },
                    ]}
                  >
                    {cell.day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Fecha Seleccionada Preview */}
          <View
            style={[
              styles.selectedPreview,
              {
                backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            <Ionicons name="time-outline" size={16} color={isDark ? '#38BDF8' : '#0284C7'} />
            <Text style={[styles.previewText, { color: colors.text }]}>
              {formatDateToSpanish(selectedDateStr)}
            </Text>
          </View>

          {/* Acciones */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.cancelBtn,
                { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' },
              ]}
              onPress={onClose}
            >
              <Text style={[styles.cancelText, { color: colors.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.confirmText}>Seleccionar</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export interface DateFieldProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  title?: string;
  placeholder?: string;
}

export const DateField: React.FC<DateFieldProps> = ({
  label,
  value,
  onChange,
  title,
  placeholder = 'Toca para elegir fecha...',
}) => {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={{ marginBottom: 12 }}>
      {label && <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.fieldTouch,
          {
            backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
            borderColor: isDark ? '#334155' : '#CBD5E1',
          },
        ]}
        onPress={() => setModalVisible(true)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Ionicons name="calendar-outline" size={18} color={isDark ? '#38BDF8' : '#0284C7'} />
          <Text
            style={[
              styles.fieldText,
              { color: value ? colors.text : colors.textMuted },
            ]}
            numberOfLines={1}
          >
            {value ? formatDateToSpanish(value) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </TouchableOpacity>

      <DatePickerModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        date={value}
        onSelectDate={onChange}
        title={title || label || 'Seleccionar Fecha'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  dayText: {
    fontSize: 13,
  },
  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 14,
  },
  previewText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#0284C7',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  fieldTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
