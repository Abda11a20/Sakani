import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private phoneNumberId?: string;
  private accessToken?: string;
  private isEnabled = true;

  constructor(private config: ConfigService) {
    this.phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
    this.accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn('WhatsApp API credentials are not set in .env. WhatsApp will run in simulation mode.');
      this.isEnabled = false;
    }
  }

  async sendOtpTemplate(phone: string, otp: string) {
    if (!this.isEnabled) {
      this.logger.log(`[WhatsApp Simulation] Sending OTP ${otp} to ${phone}`);
      return;
    }

    // Convert local Egyptian number to international format without '+'
    // Assumes input is like 01xxxxxxxxx
    let formattedPhone = phone;
    if (phone.startsWith('0')) {
      formattedPhone = '2' + phone;
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedPhone,
          type: 'template',
          template: {
            name: 'sample_auth_code',
            language: {
              code: 'ar',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [
                  {
                    type: 'text',
                    text: otp,
                  },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      this.logger.log(`WhatsApp OTP sent successfully to ${formattedPhone}. Message ID: ${response.data?.messages?.[0]?.id}`);
    } catch (error: any) {
      this.logger.error(`Failed to send WhatsApp OTP to ${formattedPhone}`);
      if (error.response?.data) {
        this.logger.error(`WhatsApp API Response Error: ${JSON.stringify(error.response.data)}`);
      } else {
        this.logger.error(error.message, error.stack);
      }
    }
  }
}
