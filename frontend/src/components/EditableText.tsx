import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAdmin } from '../context/AdminContext';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

interface EditableTextProps {
  value: string;
  field: string;
  entityType: 'recipe' | 'category' | 'about';
  entityId?: string;
  style?: any;
  multiline?: boolean;
  numberOfLines?: number;
  onUpdate?: (newValue: string) => void;
}

export default function EditableText({
  value,
  field,
  entityType,
  entityId,
  style,
  multiline = false,
  numberOfLines,
  onUpdate,
}: EditableTextProps) {
  const { isAdmin, updateRecipe, updateCategory, updateAbout } = useAdmin();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [saving, setSaving] = useState(false);
  const [displayValue, setDisplayValue] = useState(value);

  if (!isAdmin) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {displayValue || value}
      </Text>
    );
  }

  const handleSave = async () => {
    if (editValue === displayValue) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    let success = false;

    try {
      if (entityType === 'recipe' && entityId) {
        success = await updateRecipe(entityId, field, editValue);
      } else if (entityType === 'category' && entityId) {
        success = await updateCategory(entityId, field, editValue);
      } else if (entityType === 'about') {
        success = await updateAbout(field, editValue);
      }

      if (success) {
        setDisplayValue(editValue);
        setIsEditing(false);
        onUpdate?.(editValue);
      } else {
        Alert.alert('❌', 'فشل الحفظ');
      }
    } catch (e) {
      Alert.alert('❌', 'خطأ في الاتصال');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditValue(displayValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <View style={styles.editContainer}>
        <TextInput
          style={[styles.editInput, multiline && styles.editInputMultiline, style && { fontSize: style.fontSize }]}
          value={editValue}
          onChangeText={setEditValue}
          multiline={multiline}
          autoFocus
          textAlignVertical={multiline ? 'top' : 'center'}
        />
        <View style={styles.editActions}>
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.goldDark} />
          ) : (
            <>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark" size={18} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                <Ionicons name="close" size={18} color="#FFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.editableWrapper}
      onPress={() => {
        setEditValue(displayValue || value);
        setIsEditing(true);
      }}
      activeOpacity={0.7}
    >
      <Text style={style} numberOfLines={numberOfLines}>
        {displayValue || value}
      </Text>
      <View style={styles.editIcon}>
        <Ionicons name="pencil" size={12} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  editableWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    position: 'relative',
  },
  editIcon: {
    backgroundColor: COLORS.goldDark,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginRight: 4,
    marginTop: 2,
  },
  editContainer: {
    borderWidth: 2,
    borderColor: COLORS.goldDark,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFF',
    padding: SPACING.sm,
  },
  editInput: {
    fontFamily: 'NotoNaskhArabic_400Regular',
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    padding: SPACING.xs,
    minHeight: 36,
  },
  editInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  saveBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F44336',
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
