import type { FastifyBaseLogger } from 'fastify';

export interface AlexaReminderInput {
  userId: string;
  text: string;
  scheduledFor: Date;
}

/**
 * Contract for creating/updating/deleting Alexa reminders. The real
 * implementation (Alexa Reminders API + account linking) is added in a later
 * milestone; until then a stub records synthetic external ids so the rest of
 * the reminder pipeline can be built and tested.
 */
export interface AlexaReminderService {
  create(input: AlexaReminderInput): Promise<{ externalId: string }>;
  update(externalId: string, input: AlexaReminderInput): Promise<void>;
  delete(externalId: string): Promise<void>;
}

export function createStubAlexaService(log: FastifyBaseLogger): AlexaReminderService {
  return {
    async create(input) {
      const externalId = `alexa-stub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      log.info({ ...input, externalId }, '[alexa-stub] create reminder');
      return { externalId };
    },
    async update(externalId, input) {
      log.info({ externalId, ...input }, '[alexa-stub] update reminder');
    },
    async delete(externalId) {
      log.info({ externalId }, '[alexa-stub] delete reminder');
    },
  };
}
