import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { useLanguage } from '../src/context/LanguageContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/constants/theme';
import AppHeader from '../src/components/AppHeader';
import BottomTabBar from '../src/components/BottomTabBar';

interface JournalEntry {
  id: string;
  date: string;
  recipeName: string;
  note: string;
  ingredients?: string;
  instructions?: string;
  isCustom: boolean;
  createdAt: number;
}

const JOURNAL_KEY = '@ask_cooking_journal';

export default function CookingJournalScreen() {
  const router = useRouter();
  const { language, t, isRTL } = useLanguage();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Form state
  const [recipeName, setRecipeName] = useState('');
  const [note, setNote] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');

  const labels = {
    ar: {
      title: 'خبرينا ماذا طبخت اليوم',
      subtitle: 'اجمعي كتابك هنا',
      addEntry: 'أضيفي طبخة جديدة',
      recipeName: 'اسم الطبخة',
      note: 'ملاحظاتك (اختياري)',
      ingredients: 'المكونات (اختياري)',
      instructions: 'طريقة التحضير (اختياري)',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      share: 'مشاركة',
      noEntries: 'لم تسجلي أي طبخة بعد',
      noEntriesHint: 'ابدئي بتسجيل أول طبخة لك!',
      today: 'اليوم',
      yesterday: 'أمس',
      confirmDelete: 'هل تريدين حذف هذه الطبخة؟',
      yes: 'نعم',
      no: 'لا',
      myRecipe: 'وصفتي',
      shared: 'من سجل طبخي في تطبيق ASK',
    },
    en: {
      title: 'Tell us what you cooked today',
      subtitle: 'Build your cookbook here',
      addEntry: 'Add a new dish',
      recipeName: 'Dish name',
      note: 'Your notes (optional)',
      ingredients: 'Ingredients (optional)',
      instructions: 'Instructions (optional)',
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      share: 'Share',
      noEntries: 'No entries yet',
      noEntriesHint: 'Start by logging your first dish!',
      today: 'Today',
      yesterday: 'Yesterday',
      confirmDelete: 'Delete this entry?',
      yes: 'Yes',
      no: 'No',
      myRecipe: 'My Recipe',
      shared: 'From my cooking journal in ASK app',
    },
    sv: {
      title: 'Berätta vad du lagade idag',
      subtitle: 'Bygg din kokbok här',
      addEntry: 'Lägg till en ny rätt',
      recipeName: 'Rättens namn',
      note: 'Dina anteckningar (valfritt)',
      ingredients: 'Ingredienser (valfritt)',
      instructions: 'Instruktioner (valfritt)',
      save: 'Spara',
      cancel: 'Avbryt',
      delete: 'Radera',
      share: 'Dela',
      noEntries: 'Inga inlägg ännu',
      noEntriesHint: 'Börja med att logga din första rätt!',
      today: 'Idag',
      yesterday: 'Igår',
      confirmDelete: 'Radera detta inlägg?',
      yes: 'Ja',
      no: 'Nej',
      myRecipe: 'Mitt recept',
      shared: 'Från min matdagbok i ASK-appen',
    },
  };

  const L = labels[language] || labels.en;

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await AsyncStorage.getItem(JOURNAL_KEY);
      if (data) {
        setEntries(JSON.parse(data));
      }
    } catch (e) {
      console.log('Error loading journal:', e);
    }
  };

  const saveEntries = async (newEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(JOURNAL_KEY, JSON.stringify(newEntries));
      setEntries(newEntries);
    } catch (e) {
      console.log('Error saving journal:', e);
    }
  };

  const addEntry = () => {
    if (!recipeName.trim()) {
      Alert.alert('', isRTL ? 'الرجاء إدخال اسم الطبخة' : 'Please enter dish name');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      recipeName: recipeName.trim(),
      note: note.trim(),
      ingredients: ingredients.trim(),
      instructions: instructions.trim(),
      isCustom: true,
      createdAt: Date.now(),
    };

    const updated = [newEntry, ...entries];
    saveEntries(updated);
    resetForm();
    setShowAddModal(false);
  };

  const deleteEntry = (id: string) => {
    Alert.alert('', L.confirmDelete, [
      { text: L.no, style: 'cancel' },
      {
        text: L.yes,
        style: 'destructive',
        onPress: () => {
          const updated = entries.filter(e => e.id !== id);
          saveEntries(updated);
          setShowDetailModal(false);
        },
      },
    ]);
  };

  const shareEntry = async (entry: JournalEntry) => {
    let text = `${entry.recipeName}\n`;
    text += `${entry.date}\n\n`;
    if (entry.ingredients) text += `${isRTL ? 'المكونات' : 'Ingredients'}:\n${entry.ingredients}\n\n`;
    if (entry.instructions) text += `${isRTL ? 'طريقة التحضير' : 'Instructions'}:\n${entry.instructions}\n\n`;
    if (entry.note) text += `${isRTL ? 'ملاحظات' : 'Notes'}: ${entry.note}\n\n`;
    text += `${L.shared}`;

    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({ title: entry.recipeName, text });
        } else {
          await navigator.clipboard.writeText(text);
          Alert.alert('', isRTL ? 'تم النسخ!' : 'Copied!');
        }
      } else {
        const { Share } = require('react-native');
        await Share.share({ message: text, title: entry.recipeName });
      }
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const resetForm = () => {
    setRecipeName('');
    setNote('');
    setIngredients('');
    setInstructions('');
  };

  const formatDate = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (dateStr === today) return L.today;
    if (dateStr === yesterday) return L.yesterday;
    return dateStr;
  };

  const openDetail = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showBack={true} />

      {/* Hero Section — compact, single row */}
      <View style={[styles.hero, isRTL && styles.rtlRow]}>
        <Text style={{ fontSize: 22, color: COLORS.goldDark }}>?</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.heroTitle, isRTL && styles.rtlText]} numberOfLines={1}>{L.title}</Text>
          <Text style={[styles.heroSubtitle, isRTL && styles.rtlText]} numberOfLines={1}>{L.subtitle}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 64, color: COLORS.border }}>?</Text>
            <Text style={[styles.emptyText, isRTL && styles.rtlText]}>{L.noEntries}</Text>
            <Text style={[styles.emptyHint, isRTL && styles.rtlText]}>{L.noEntriesHint}</Text>
          </View>
        ) : (
          entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              style={styles.entryCard}
              onPress={() => openDetail(entry)}
              activeOpacity={0.7}
            >
              <View style={[styles.entryHeader, isRTL && styles.rtlRow]}>
                <View style={styles.entryIcon}>
                  <Text style={{ fontSize: 20, color: COLORS.goldDark }}>?</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.entryName, isRTL && styles.rtlText]} numberOfLines={1}>
                    {entry.recipeName}
                  </Text>
                  <Text style={[styles.entryDate, isRTL && styles.rtlText]}>
                    {formatDate(entry.date)}
                  </Text>
                </View>
                <View style={[styles.entryActions, isRTL && styles.rtlRow]}>
                  <TouchableOpacity onPress={() => shareEntry(entry)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={{ fontSize: 20, color: COLORS.textLight }}>?</Text>
                  </TouchableOpacity>
                </View>
              </View>
              {entry.note ? (
                <Text style={[styles.entryNote, isRTL && styles.rtlText]} numberOfLines={2}>
                  {entry.note}
                </Text>
              ) : null}
              {entry.ingredients || entry.instructions ? (
                <View style={[styles.recipeBadge, isRTL && { alignSelf: 'flex-end' }]}>
                  <Text style={{ fontSize: 12, color: COLORS.goldDark }}>?</Text>
                  <Text style={styles.recipeBadgeText}>{L.myRecipe}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB - Add Button — vibrant gold with bulletproof Unicode "+" glyph */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { resetForm(); setShowAddModal(true); }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={L.addEntry}
      >
        <Text style={styles.fabPlus}>+</Text>
      </TouchableOpacity>

      {/* Add Entry Modal */}
      <Modal visible={showAddModal} transparent animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isRTL && styles.rtlText]}>{L.addEntry}</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Text style={{ fontSize: 26, color: COLORS.textPrimary, fontWeight: '700' }}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.formScroll}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{L.recipeName} *</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  value={recipeName}
                  onChangeText={setRecipeName}
                  placeholder={isRTL ? 'مثال: كبة بالصينية' : 'e.g. Kibbeh bil Sayniyeh'}
                  placeholderTextColor="#AAA"
                  textAlign={isRTL ? 'right' : 'left'}
                />

                <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{L.note}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, isRTL && styles.rtlInput]}
                  value={note}
                  onChangeText={setNote}
                  placeholder={isRTL ? 'أضفت ليمون إضافي...' : 'Added extra lemon...'}
                  placeholderTextColor="#AAA"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  textAlign={isRTL ? 'right' : 'left'}
                />

                <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{L.ingredients}</Text>
                <TextInput
                  style={[styles.input, styles.textAreaLarge, isRTL && styles.rtlInput]}
                  value={ingredients}
                  onChangeText={setIngredients}
                  placeholder={isRTL ? 'كيلو لحم مفروم\nبصلة كبيرة...' : '1 kg minced meat\n1 large onion...'}
                  placeholderTextColor="#AAA"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  textAlign={isRTL ? 'right' : 'left'}
                />

                <Text style={[styles.inputLabel, isRTL && styles.rtlText]}>{L.instructions}</Text>
                <TextInput
                  style={[styles.input, styles.textAreaLarge, isRTL && styles.rtlInput]}
                  value={instructions}
                  onChangeText={setInstructions}
                  placeholder={isRTL ? 'نخلط اللحم مع البرغل...' : 'Mix meat with bulgur...'}
                  placeholderTextColor="#AAA"
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                  textAlign={isRTL ? 'right' : 'left'}
                />

                <TouchableOpacity style={styles.saveButton} onPress={addEntry}>
                  <Text style={{ fontSize: 22, color: '#FFF', fontWeight: '700' }}>✓</Text>
                  <Text style={styles.saveButtonText}>{L.save}</Text>
                </TouchableOpacity>
                <View style={{ height: 60 }} />
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={showDetailModal} transparent animationType="slide" onRequestClose={() => setShowDetailModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedEntry && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isRTL && styles.rtlText]} numberOfLines={1}>
                    {selectedEntry.recipeName}
                  </Text>
                  <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                    <Text style={{ fontSize: 24, color: COLORS.textPrimary }}>×</Text>
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.detailDate, isRTL && styles.rtlText]}>
                    {formatDate(selectedEntry.date)}
                  </Text>

                  {selectedEntry.note ? (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>
                        {isRTL ? 'ملاحظات' : 'Notes'}
                      </Text>
                      <Text style={[styles.detailText, isRTL && styles.rtlText]}>
                        {selectedEntry.note}
                      </Text>
                    </View>
                  ) : null}

                  {selectedEntry.ingredients ? (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>
                        {isRTL ? 'المكونات' : 'Ingredients'}
                      </Text>
                      <Text style={[styles.detailText, isRTL && styles.rtlText]}>
                        {selectedEntry.ingredients}
                      </Text>
                    </View>
                  ) : null}

                  {selectedEntry.instructions ? (
                    <View style={styles.detailSection}>
                      <Text style={[styles.detailLabel, isRTL && styles.rtlText]}>
                        {isRTL ? 'طريقة التحضير' : 'Instructions'}
                      </Text>
                      <Text style={[styles.detailText, isRTL && styles.rtlText]}>
                        {selectedEntry.instructions}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.detailActions}>
                    <TouchableOpacity 
                      style={[styles.detailBtn, styles.shareBtn]}
                      onPress={() => shareEntry(selectedEntry)}
                    >
                      <Text style={{ fontSize: 20, color: "#FFF" }}>?</Text>
                      <Text style={styles.detailBtnText}>{L.share}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.detailBtn, styles.deleteBtn]}
                      onPress={() => deleteEntry(selectedEntry.id)}
                    >
                      <Text style={{ fontSize: 20, color: "#FFF" }}>🗑</Text>
                      <Text style={styles.detailBtnText}>{L.delete}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ height: 30 }} />
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      <BottomTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.goldLight,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.goldDark,
  },
  heroTitle: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  scrollView: { flex: 1, paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: COLORS.textLight,
    marginTop: SPACING.lg,
  },
  emptyHint: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.goldDark,
    ...SHADOWS.small,
  },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  entryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryName: {
    fontSize: FONTS.sizes.lg,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
  },
  entryDate: {
    fontSize: FONTS.sizes.sm,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textLight,
    marginTop: 2,
  },
  entryActions: { flexDirection: 'row', gap: SPACING.md },
  entryNote: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  recipeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: SPACING.sm,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  recipeBadgeText: {
    fontSize: FONTS.sizes.xs,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: COLORS.goldDark,
  },
  rtlText: { textAlign: 'right' },
  rtlRow: { flexDirection: 'row-reverse' },
  rtlInput: { textAlign: 'right' },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2.5,
    borderColor: COLORS.goldDark,
    ...SHADOWS.large,
    zIndex: 100,
  },
  fabPlus: {
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '900',
    color: '#1A1A2E',
    includeFontPadding: false,
    textAlign: 'center',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFF0',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  formScroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.lg },
  inputLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: SPACING.md,
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textPrimary,
  },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  textAreaLarge: { minHeight: 120, textAlignVertical: 'top' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    ...SHADOWS.medium,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  detailDate: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textLight,
    marginBottom: SPACING.md,
  },
  detailSection: {
    marginBottom: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: '#FFF',
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.goldDark,
  },
  detailLabel: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_700Bold',
    fontWeight: FONTS.weights.bold,
    color: COLORS.goldDark,
    marginBottom: SPACING.sm,
  },
  detailText: {
    fontSize: FONTS.sizes.md,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: COLORS.textPrimary,
    lineHeight: 24,
  },
  detailActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  detailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small,
  },
  shareBtn: { backgroundColor: '#2196F3' },
  deleteBtn: { backgroundColor: '#F44336' },
  detailBtnText: {
    color: '#FFF',
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
});
