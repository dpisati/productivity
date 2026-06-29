import type { FastifyBaseLogger } from 'fastify';
import { env } from '../config/env.js';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export interface Mailer {
  send(mail: Mail): Promise<void>;
}

/**
 * Development mailer — logs emails (including action links) to the server log
 * instead of sending. Swap for an SMTP/provider implementation in production.
 */
export function createDevMailer(log: FastifyBaseLogger): Mailer {
  return {
    async send(mail) {
      log.info(
        { to: mail.to, from: env.MAIL_FROM, subject: mail.subject },
        `📧 [dev-mail] ${mail.subject}\n${mail.text}`,
      );
    },
  };
}
