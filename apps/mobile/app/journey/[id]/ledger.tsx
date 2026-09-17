import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { Icon, motion, type IconName } from '@tripline/ui';
import {
  EXPENSE_CATEGORIES, ExpenseSchema, SCHEMA_VERSION, budgetSummary, categoryBreakdown, dailyExpenseTotals,
  type Expense, type ExpenseCategory, type Journey,
} from '@tripline/shared';
import { BouncyButton } from '../../../src/components/BouncyButton';
import { BouncyChip } from '../../../src/components/BouncyChip';
import { BottomSheet } from '../../../src/components/BottomSheet';
import { CascadeIn } from '../../../src/components/CascadeIn';
import { ConfettiCelebration } from '../../../src/components/ConfettiCelebration';
import { Page } from '../../../src/components/Page';
import { RollingNumber } from '../../../src/components/RollingNumber';
import { TripText } from '../../../src/components/TripText';
import { useFocusField } from '../../../src/components/formStyles';
import { groupThousands } from '../../../src/components/rollingNumberMath';
import { addExpense, deleteExpense, getJourney, listExpenses, updateJourney } from '../../../src/data/database';
import { ensureDemoExpenses } from '../../../src/data/demo';
import { chineseFont, useTriplineTheme } from '../../../src/theme';

const categoryColors = ['accent', 'primary', 'celebrate', 'success', 'shadow', 'textSecondary'] as const;
/** 账本六分类 → 图标映射（与 EXPENSE_CATEGORIES 顺序无关，按名称取） */
const categoryIcons: Record<ExpenseCategory, IconName> = {
  餐饮: 'food',
  住宿: 'home',
  交通: 'train',
  门票: 'ticket',
  购物: 'bag',
  其他: 'sparkle',
};
const feedbackDuration = 600;

function colorOf(category: string, theme: Record<string, string>): string {
  const index = (EXPENSE_CATEGORIES as readonly string[]).indexOf(category);
  return theme[categoryColors[index >= 0 ? index % categoryColors.length : categoryColors.length - 1]];
}

function iconOf(category: string): IconName {
  return (categoryIcons as Record<string, IconName>)[category] ?? 'sparkle';
}

function yuan(cents: number): string {
  return '¥' + (cents / 100).toLocaleString('zh-CN', { maximumFractionDigits: 2 });
}

function stamp(ms: number): string {
  const date = new Date(ms);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function ConfettiBurst() {
  const { theme } = useTriplineTheme();
  return <ConfettiCelebration top={6} right={10} colors={[theme.onPrimary, theme.celebrate, theme.accent]} />;
}

function TrendChart({ totals }: { totals: { date: string; amount: number }[] }) {
  const { theme } = useTriplineTheme();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    progress.value = reduceMotion ? 1 : withSpring(1, { duration: motion.expand, dampingRatio: motion.dampingRatio });
  }, [progress, reduceMotion, totals.length]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ translateY: (1 - progress.value) * 10 }] }));
  const height = 150;
  const pad = 18;
  const max = Math.max(...totals.map((item) => item.amount), 1);
  const inner = Math.max(width - pad * 2, 1);
  const points = totals.map((item, index) => ({
    x: totals.length === 1 ? pad + inner / 2 : pad + (inner * index) / (totals.length - 1),
    y: height - pad - ((height - pad * 2) * item.amount) / max,
    ...item,
  }));
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');
  return (
    <Animated.View style={style} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {points.length > 1 ? <Polyline points={polyline} fill="none" stroke={theme.primary} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" /> : null}
          {points.map((point) => (
            <Circle key={point.date} cx={point.x} cy={point.y} r={5.5} fill={theme.accent} stroke={theme.surface} strokeWidth={2.5} />
          ))}
        </Svg>
      ) : null}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: pad - 10, marginTop: 4 }}>
        {points.map((point) => (
          <TripText key={point.date} size={10} muted>{point.date.slice(5).replace('-', '/')}</TripText>
        ))}
      </View>
    </Animated.View>
  );
}

export default function Ledger() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTriplineTheme();
  const [journey, setJourney] = useState<Journey | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('餐饮');
  const [note, setNote] = useState('');
  const [budgetEditing, setBudgetEditing] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState('');
  const [removing, setRemoving] = useState<Expense | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState('');
  const addingExpense = useRef(false);
  const noteRef = useRef<TextInput>(null);
  const amountField = useFocusField(!!error && adding);
  const noteField = useFocusField();
  const budgetField = useFocusField(!!error && budgetEditing);

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      await ensureDemoExpenses();
      const [loadedJourney, loadedExpenses] = await Promise.all([getJourney(id), listExpenses(id)]);
      setJourney(loadedJourney);
      setExpenses(loadedExpenses);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '账本加载失败');
    }
  }, [id]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const summary = budgetSummary(journey?.budget ?? 0, expenses);
  const slices = categoryBreakdown(expenses);
  const totals = dailyExpenseTotals(expenses);
  const warningText = summary.status === 'over'
    ? '已超支 ' + yuan(-summary.remaining) + '，松松手吧'
    : summary.status === 'warning'
      ? '预算已用 ' + summary.percent + '%，留意一下'
      : '';

  async function add() {
    if (!id || addingExpense.current) return;
    if (!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0) {
      setError('金额请填写大于 0 的数字，最多两位小数');
      return;
    }
    const now = Date.now();
    const parsed = ExpenseSchema.safeParse({
      id: Crypto.randomUUID(), journeyId: id,
      amount: Math.round(Number(amount) * 100), category, note: note.trim(), payer: null,
      createdAt: now, updatedAt: now, deletedAt: null, schemaVersion: SCHEMA_VERSION,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '请检查金额与分类');
      return;
    }
    addingExpense.current = true;
    try {
      await addExpense(parsed.data);
      setAmount('');
      setNote('');
      setCategory('餐饮');
      setAdding(false);
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), feedbackDuration);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '记账失败');
    } finally {
      addingExpense.current = false;
    }
  }

  async function saveBudget() {
    if (!journey) return;
    if (!/^\d+(\.\d{1,2})?$/.test(budgetDraft.trim())) {
      setError('预算请填写数字，最多两位小数');
      return;
    }
    try {
      await updateJourney({ ...journey, budget: Math.round(Number(budgetDraft) * 100), updatedAt: Date.now() });
      setBudgetEditing(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '预算保存失败');
    }
  }

  async function confirmRemove() {
    if (!removing) return;
    try {
      await deleteExpense(removing.id, Date.now());
      setRemoving(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '删除失败');
    }
  }

  return (
    <Page tabbed>
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <TripText size={29} weight="bold">花得开心，也花得明白</TripText>
          <Icon name="wallet" size={26} color={theme.primary} />
        </View>
        <TripText size={14} muted>{journey ? journey.name + ' · ' : ''}随手记一笔，预算心里有数。</TripText>
      </View>

      <View style={{ backgroundColor: theme.primary, borderRadius: 30, padding: 22, gap: 14, overflow: 'hidden' }}>
        {savedFlash ? <ConfettiBurst /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ backgroundColor: theme.onPrimary, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <TripText size={11} weight="bold" style={{ color: theme.primary }}>剩余预算</TripText>
          </View>
          <Pressable onPress={() => { setError(''); setBudgetDraft(String((journey?.budget ?? 0) / 100)); setBudgetEditing(true); }} hitSlop={8} style={{ flexShrink: 1, minWidth: 0 }}>
            <TripText size={12} weight="semibold" style={{ color: theme.onPrimary, textAlign: 'right' }}>总预算 {yuan(summary.budget)} · 修改</TripText>
          </Pressable>
        </View>
        <RollingNumber value={summary.remaining} size={38} format={yuan} style={{ color: theme.onPrimary }} />
        <View style={{ gap: 7 }}>
          <View style={{ height: 10, borderRadius: 999, backgroundColor: theme.primarySoft, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, summary.percent)}%`, height: '100%', borderRadius: 999, backgroundColor: summary.status === 'normal' ? theme.success : theme.accent }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <TripText size={12} style={{ color: theme.onPrimary }}>已花 {yuan(summary.spent)}</TripText>
            <TripText size={12} weight="semibold" style={{ color: theme.onPrimary }}>已用 {summary.percent}%</TripText>
          </View>
        </View>
        {warningText ? (
          <View style={{ backgroundColor: theme.accent, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8, alignSelf: 'flex-start' }}>
            <TripText size={12} weight="bold" style={{ color: theme.onAccent }}>{warningText}</TripText>
          </View>
        ) : null}
      </View>

      <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 18, gap: 13 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TripText size={17} weight="bold">钱花在哪</TripText>
          <TripText size={12} muted>分类占比</TripText>
        </View>
        {slices.length === 0 ? (
          <TripText size={13} muted>还没有账目，记下第一笔后这里会出现占比条。</TripText>
        ) : (
          <>
            <View style={{ flexDirection: 'row', height: 16, borderRadius: 999, overflow: 'hidden', backgroundColor: theme.surfaceAlt }}>
              {slices.map((slice) => (
                <View key={slice.category} style={{ flexGrow: slice.amount, backgroundColor: colorOf(slice.category, theme) }} />
              ))}
            </View>
            <View style={{ gap: 8 }}>
              {slices.map((slice) => (
                <View key={slice.category} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colorOf(slice.category, theme) }} />
                  <TripText size={13} weight="semibold" style={{ flex: 1 }}>{slice.category}</TripText>
                  <TripText size={13} numbers>{yuan(slice.amount)}</TripText>
                  <TripText size={12} muted style={{ width: 38, textAlign: 'right' }}>{slice.percent}%</TripText>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 18, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TripText size={17} weight="bold">每天花多少</TripText>
          <TripText size={12} muted>每日趋势</TripText>
        </View>
        {totals.length === 0 ? (
          <TripText size={13} muted>记两笔不同日期的账，就能看到这条小曲线。</TripText>
        ) : (
          <TrendChart totals={totals} />
        )}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TripText size={21} weight="bold">流水</TripText>
        <TripText size={12} muted>{expenses.length ? '共 ' + expenses.length + ' 笔' : '还没有账目'}</TripText>
      </View>

      {expenses.length === 0 ? (
        <View style={{ backgroundColor: theme.surface, borderRadius: 24, padding: 26, gap: 8, alignItems: 'flex-start' }}>
          <Icon name="bankcard" size={30} color={theme.celebrate} />
          <TripText size={17} weight="bold">从第一笔开始</TripText>
          <TripText size={13} muted>10 秒钟记一笔，结束不用补账。</TripText>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {expenses.map((expense, index) => (
            <CascadeIn key={expense.id} index={index} total={expenses.length}>
              <View style={{ backgroundColor: theme.surface, borderRadius: 21, paddingLeft: 14, paddingRight: 6, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: colorOf(expense.category, theme) + '1F', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={iconOf(expense.category)} size={19} color={colorOf(expense.category, theme)} />
                </View>
                <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
                  <TripText size={15} weight="semibold" numberOfLines={1}>
                    {expense.category}
                    {expense.note ? <TripText size={13} muted>{' · ' + expense.note}</TripText> : null}
                  </TripText>
                  <TripText size={11} muted>{stamp(expense.createdAt)}</TripText>
                </View>
                <TripText size={16} numbers>{yuan(expense.amount)}</TripText>
                <Pressable onPress={() => setRemoving(expense)} accessibilityRole="button" accessibilityLabel={'删除' + expense.category + ' ' + yuan(expense.amount)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trash" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            </CascadeIn>
          ))}
        </View>
      )}

      <BouncyButton onPress={() => { setError(''); setAdding(true); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 16, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Icon name="plus" size={17} color={theme.onAccent} />
          <TripText size={15} weight="bold" style={{ color: theme.onAccent }}>记一笔</TripText>
        </View>
      </BouncyButton>
      {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}

      <BottomSheet visible={adding} onClose={() => setAdding(false)} maxHeight="80%">
            <ScrollView contentContainerStyle={{ padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                <TripText size={24} weight="bold">记一笔</TripText>
                <Icon name="sparkle" size={21} color={theme.accent} />
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">金额（元）</TripText>
                <TextInput value={amountField.focused ? amount : groupThousands(amount)} onChangeText={(text) => setAmount(text.replace(/,/g, ''))}
                  placeholder="比如：86" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad"
                  returnKeyType="next" blurOnSubmit={false} onSubmitEditing={() => noteRef.current?.focus()} {...amountField.focusProps}
                  style={[{ backgroundColor: theme.bg, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }, amountField.borderStyle]} />
              </View>
              <TripText size={13} weight="semibold">花在哪一类？</TripText>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {EXPENSE_CATEGORIES.map((name) => (
                  <BouncyChip key={name} label={name} selected={category === name} onPress={() => setCategory(name)}
                    icon={iconOf(name)} iconColor={colorOf(name, theme)} />
                ))}
              </View>
              <View style={{ gap: 7 }}>
                <TripText size={13} weight="semibold">备注（可空）</TripText>
                <TextInput ref={noteRef} value={note} onChangeText={setNote} placeholder="比如：古城北门那家牦牛火锅" placeholderTextColor={theme.textSecondary}
                  returnKeyType="done" {...noteField.focusProps}
                  style={[{ backgroundColor: theme.bg, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }, noteField.borderStyle]} />
              </View>
              {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
              <BouncyButton onPress={() => { void add(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>存进账本</TripText>
              </BouncyButton>
            </ScrollView>
      </BottomSheet>

      <BottomSheet visible={budgetEditing} onClose={() => setBudgetEditing(false)}>
            <View style={{ padding: 24, gap: 14 }}>
              <TripText size={24} weight="bold">修改总预算</TripText>
              <TextInput value={budgetField.focused ? budgetDraft : groupThousands(budgetDraft)} onChangeText={(text) => setBudgetDraft(text.replace(/,/g, ''))}
                placeholder="例如 4500" placeholderTextColor={theme.textSecondary} keyboardType="decimal-pad"
                returnKeyType="done" onSubmitEditing={() => { void saveBudget(); }} {...budgetField.focusProps}
                style={[{ backgroundColor: theme.bg, borderRadius: 17, paddingHorizontal: 16, paddingVertical: 13, fontFamily: chineseFont, color: theme.text, fontSize: 16 }, budgetField.borderStyle]} />
              {error ? <TripText size={13} style={{ color: theme.accent }}>{error}</TripText> : null}
              <BouncyButton onPress={() => { void saveBudget(); }} style={{ backgroundColor: theme.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center' }}>
                <TripText size={16} weight="bold" style={{ color: theme.onAccent }}>保存预算</TripText>
              </BouncyButton>
            </View>
      </BottomSheet>

      <Modal visible={!!removing} transparent animationType="fade" onRequestClose={() => setRemoving(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 28 }}>
          <Pressable onPress={() => setRemoving(null)} style={{ position: 'absolute', inset: 0, backgroundColor: theme.shadow, opacity: 0.45 }} />
          <View style={{ backgroundColor: theme.surface, borderRadius: 28, padding: 24, gap: 14 }}>
            <TripText size={22} weight="bold">删除这笔账？</TripText>
            <TripText size={14} muted>「{removing?.category}{removing?.note ? ' · ' + removing.note : ''} {removing ? yuan(removing.amount) : ''}」会从流水与统计中移除。</TripText>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 22 }}>
              <Pressable onPress={() => setRemoving(null)}><TripText size={15}>取消</TripText></Pressable>
              <Pressable onPress={() => { void confirmRemove(); }}><TripText size={15} weight="bold" style={{ color: theme.accent }}>确认删除</TripText></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}
