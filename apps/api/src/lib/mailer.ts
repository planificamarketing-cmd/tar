import sgMail from '@sendgrid/mail';
import { env } from '../env';
import { logger } from './logger';

// Notificación de leads por SendGrid (§5.4). Sin API key (dev) → no-op.
const enabled = Boolean(env.SENDGRID_API_KEY && env.LEADS_NOTIFY_TO);
if (enabled) sgMail.setApiKey(env.SENDGRID_API_KEY as string);

export interface LeadEmailData {
  name: string;
  email: string;
  phone?: string | null;
  message?: string | null;
  type: string;
  propertyTitle?: string | null;
}

export async function sendNewLeadNotification(
  lead: LeadEmailData,
): Promise<void> {
  if (!enabled) {
    logger.debug('mailer deshabilitado (sin SENDGRID_API_KEY): se omite envío');
    return;
  }
  const to = env.LEADS_NOTIFY_TO as string;
  const lines = [
    `Nuevo ${lead.type} desde el portal TAR.`,
    '',
    `Nombre: ${lead.name}`,
    `Email: ${lead.email}`,
    lead.phone ? `Teléfono: ${lead.phone}` : '',
    lead.propertyTitle ? `Propiedad: ${lead.propertyTitle}` : '',
    lead.message ? `Mensaje: ${lead.message}` : '',
  ].filter(Boolean);

  try {
    // Envío best-effort: un fallo de email no debe tumbar la creación del lead.
    await sgMail.send({
      to,
      from: to, // remitente verificado (se ajusta al configurar SendGrid)
      subject: `Nuevo lead: ${lead.name}`,
      text: lines.join('\n'),
    });
  } catch (err) {
    logger.error({ err }, 'Falló el envío de notificación de lead');
  }
}
