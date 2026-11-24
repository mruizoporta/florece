import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export type SendMailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

// Mismo patrón que Cifra: SMTP_* en .env; sin SMTP_HOST el correo solo va al log.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(this.config.get('SMTP_PORT') || 587),
        secure: String(this.config.get('SMTP_SECURE') || '') === 'true',
        auth: this.config.get('SMTP_USER')
          ? {
              user: this.config.get<string>('SMTP_USER'),
              pass: this.config.get<string>('SMTP_PASS'),
            }
          : undefined,
      });
    }
  }

  async send(input: SendMailInput) {
    const payload = {
      from: this.config.get<string>('MAIL_FROM') || 'Florece <noreply@floreceapp.com>',
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html || escapeHtml(input.text).replace(/\n/g, '<br/>'),
    };

    if (!this.transporter) {
      // El cuerpo puede llevar enlaces secretos: solo se imprime fuera de producción.
      if (this.config.get('NODE_ENV') === 'production') {
        this.logger.warn(`SMTP no configurado; no se envió "${payload.subject}" a ${payload.to}`);
      } else {
        this.logger.log(`[mail:console] to=${payload.to} subject=${payload.subject}\n${input.text}`);
      }
      return { ok: true, mode: 'console' as const };
    }

    await this.transporter.sendMail(payload);
    return { ok: true, mode: 'smtp' as const };
  }
}

// El texto lleva nombres que escribe cualquiera (lista de espera, reservas): nunca HTML crudo.
export function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
