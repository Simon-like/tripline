import { z } from 'zod';

export const SCHEMA_VERSION = 1 as const;

const EntityFields = {
  id: z.uuid(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  deletedAt: z.number().int().nonnegative().nullable(),
  schemaVersion: z.literal(SCHEMA_VERSION),
};

const DateSchema = z.iso.date();
const MoneySchema = z.number().int().nonnegative(); // 人民币分，避免浮点误差

export const JourneySchema = z.object({
  ...EntityFields,
  name: z.string().trim().min(1).max(80),
  startDate: DateSchema,
  endDate: DateSchema,
  budget: MoneySchema,
  companions: z.array(z.string().trim().min(1)),
  tags: z.array(z.string().trim().min(1)),
}).refine((value) => value.startDate <= value.endDate, {
  message: '返程日期不能早于出发日期',
  path: ['endDate'],
});

export const ChecklistItemSchema = z.object({
  ...EntityFields,
  journeyId: z.uuid(),
  phase: z.enum(['preparation', 'return']),
  category: z.string().trim().min(1),
  title: z.string().trim().min(1),
  checked: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
});

export const ItineraryItemSchema = z.object({
  ...EntityFields,
  journeyId: z.uuid(),
  date: DateSchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '时间需为 HH:mm'),
  content: z.string().trim().min(1),
  note: z.string(),
  state: z.enum(['planned', 'visited', 'cancelled']),
});

export const ExpenseSchema = z.object({
  ...EntityFields,
  journeyId: z.uuid(),
  amount: MoneySchema.positive(),
  category: z.string().trim().min(1),
  note: z.string(),
  payer: z.string().trim().min(1).nullable(),
});

export const JournalEntrySchema = z.object({
  ...EntityFields,
  journeyId: z.uuid(),
  text: z.string().trim().min(1),
  photoPaths: z.array(z.string().min(1).refine((path) => !path.startsWith('/') && !path.includes('..'), '照片必须使用沙盒相对路径')),
  tags: z.array(z.string().trim().min(1)),
  mood: z.string().trim().min(1).nullable(),
  timestamp: z.number().int().nonnegative(),
});

export const JourneyBundleSchema = z.object({
  journey: JourneySchema,
  checklistItems: z.array(ChecklistItemSchema),
  itineraryItems: z.array(ItineraryItemSchema),
  expenses: z.array(ExpenseSchema),
  journalEntries: z.array(JournalEntrySchema),
}).superRefine((bundle, context) => {
  for (const key of ['checklistItems', 'itineraryItems', 'expenses', 'journalEntries'] as const) {
    if (bundle[key].some((item) => item.journeyId !== bundle.journey.id)) {
      context.addIssue({ code: 'custom', message: `${key} 含其他旅程的数据`, path: [key] });
    }
  }
});

export type Journey = z.infer<typeof JourneySchema>;
export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;
export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type JourneyBundle = z.infer<typeof JourneyBundleSchema>;
