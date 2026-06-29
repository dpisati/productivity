import { z } from 'zod';
import { reminderChannel, reminderStatus } from '../common/enums.js';
import { isoDateTime, uuid } from '../common/primitives.js';
import { paginationQuery } from '../common/pagination.js';

export const reminder = z.object({
  id: uuid,
  taskOccurrenceId: uuid.nullable(),
  channel: reminderChannel,
  scheduledFor: isoDateTime,
  status: reminderStatus,
  sentAt: isoDateTime.nullable(),
  externalId: z.string().nullable(),
  createdAt: isoDateTime,
});
export type Reminder = z.infer<typeof reminder>;

export const listRemindersQuery = paginationQuery.extend({
  status: reminderStatus.optional(),
  channel: reminderChannel.optional(),
});
export type ListRemindersQuery = z.infer<typeof listRemindersQuery>;
