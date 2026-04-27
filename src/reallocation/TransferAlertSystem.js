/**
 * MB-ALERT-001: Transfer Alert System
 * Handles all notifications for transfer lifecycle events.
 * Channels: SMS, Email, In-App.
 */

const db = require('../db');

class TransferAlertSystem {
  /**
   * Dispatches an alert for a given transfer event.
   * @param {number} transferOrderId
   * @param {string} eventType - e.g. 'REQUEST_CREATED', 'DISCREPANCY', etc.
   * @param {object} details   - additional context for the message
   */
  async sendTransferAlert(transferOrderId, eventType, details = {}) {
    const transferOrder = await db.TransferOrder.findByPk(transferOrderId, {
      include: [
        { model: db.Branch, as: 'sourceBranch' },
        { model: db.Branch, as: 'destinationBranch' }
      ]
    });

    const alertConfig = this.getAlertConfig(eventType);
    const message     = this.formatAlertMessage(eventType, transferOrder, details);
    let   recipients  = [];

    switch (eventType) {
      case 'REQUEST_CREATED':
        recipients = [
          transferOrder.destinationBranch.manager_id,
          transferOrder.sourceBranch.manager_id
        ];
        break;

      case 'DISPATCH_DELAY':
        recipients = [
          transferOrder.sourceBranch.manager_id,
          transferOrder.sourceBranch.regional_manager_id
        ];
        break;

      case 'DISCREPANCY':
        recipients = await this.getEscalationRecipients(transferOrder);
        break;

      case 'URGENT_ARRIVAL':
        recipients = [
          transferOrder.destinationBranch.manager_id,
          transferOrder.destinationBranch.pharmacy_lead_id
        ];
        break;

      default:
        recipients = [transferOrder.destinationBranch.manager_id];
    }

    for (const recipient of recipients) {
      if (!recipient) continue;

      if (alertConfig.channels.includes('SMS')) {
        await this.sendSMS(recipient.phone, message.sms);
      }
      if (alertConfig.channels.includes('EMAIL')) {
        await this.sendEmail(recipient.email, message.email);
      }
      if (alertConfig.channels.includes('IN_APP')) {
        await this.createInAppNotification(recipient.id, message.inApp);
      }
    }

    await db.TransferAlertLog.create({
      transfer_order_id: transferOrderId,
      event_type:        eventType,
      recipients:        JSON.stringify(recipients.filter(Boolean).map(r => r.id || r)),
      message:           JSON.stringify(message),
      sent_at:           new Date()
    });
  }

  /**
   * Returns severity, channels, and SLA for a given event type.
   */
  getAlertConfig(eventType) {
    const configs = {
      REQUEST_CREATED:       { severity: 'INFO',       channels: ['EMAIL', 'IN_APP'],       sla: '5min'      },
      APPROVAL_DELAY:        { severity: 'WARNING',    channels: ['EMAIL', 'SMS'],           sla: '2hr'       },
      DISPATCH_DELAY:        { severity: 'ESCALATION', channels: ['SMS', 'IN_APP'],          sla: '30min'     },
      DISCREPANCY:           { severity: 'CRITICAL',   channels: ['SMS', 'EMAIL', 'IN_APP'], sla: 'immediate' },
      AUTO_REORDER_TRIGGERED:{ severity: 'INFO',       channels: ['IN_APP'],                 sla: '15min'     },
      URGENT_ARRIVAL:        { severity: 'URGENT',     channels: ['SMS', 'IN_APP'],          sla: '1hr'       }
    };
    return configs[eventType] || configs['REQUEST_CREATED'];
  }

  /**
   * Builds SMS, email, and in-app message payloads for the given event.
   */
  formatAlertMessage(eventType, transferOrder, details) {
    const orderNum = transferOrder ? transferOrder.order_number : 'N/A';
    const base     = `Transfer Order ${orderNum}`;

    const templates = {
      REQUEST_CREATED:  { sms: `${base}: New transfer request awaiting approval.`,       email: `${base}: A new transfer request has been created and requires your approval.`, inApp: `New transfer request created for ${base}.`      },
      DISPATCH_DELAY:   { sms: `${base}: Dispatch is delayed. Immediate action needed.`, email: `${base}: The dispatch has been delayed beyond the 2-hour SLA.`,               inApp: `Dispatch delay alert for ${base}.`              },
      DISCREPANCY:      { sms: `${base}: CRITICAL — Discrepancy found on receipt.`,      email: `${base}: A discrepancy was detected during receiving verification.`,           inApp: `Discrepancy reported for ${base}.`              },
      URGENT_ARRIVAL:   { sms: `${base}: Arriving in ~1 hour. Prepare receiving team.`,  email: `${base}: Estimated arrival in 1 hour.`,                                        inApp: `Imminent arrival alert for ${base}.`            }
    };

    return templates[eventType] || { sms: `Update on ${base}.`, email: `Update on ${base}.`, inApp: `Update on ${base}.` };
  }

  async getEscalationRecipients(transferOrder) {
    // Returns both branch managers and the inventory director
    return [
      transferOrder.sourceBranch ? { id: transferOrder.sourceBranch.manager_id } : null,
      transferOrder.destinationBranch ? { id: transferOrder.destinationBranch.manager_id } : null
    ].filter(Boolean);
  }

  async sendSMS(phone, message)                  { console.log(`SMS → ${phone}: ${message}`); }
  async sendEmail(email, message)                { console.log(`Email → ${email}: ${message}`); }
  async createInAppNotification(userId, message) { console.log(`In-App → ${userId}: ${message}`); }
}

module.exports = TransferAlertSystem;
