import type { WhatsAppProvider, WhatsAppVerificationResult } from '@mms/shared';
import pkg from 'whatsapp-web.js';
// @ts-expect-error qrcode-terminal ships without TypeScript declarations
import qrcode from 'qrcode-terminal';

const { Client, LocalAuth } = pkg;

interface WhatsAppWebClient {
  on(event: string, listener: (...args: unknown[]) => void): void;
  initialize(): Promise<void>;
  getNumberId(number: string): Promise<{ id: unknown } | null>;
}

/**
 * Production WhatsApp verification engine wrapping whatsapp-web.js and Puppeteer.
 * Launches a headless browser, prints session QR codes to the terminal, and queries real servers.
 */
export class PuppeteerWhatsAppProvider implements WhatsAppProvider {
  private client: WhatsAppWebClient | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeClient().catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('PuppeteerWhatsAppProvider failed to initialize client session:', msg);
    });
  }

  private async initializeClient(): Promise<void> {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'mms-whatsapp-session'
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      }) as WhatsAppWebClient;

      this.client.on('qr', (qr: unknown) => {
        if (typeof qr !== 'string') return;
        console.log('\n--- SCAN THIS QR CODE WITH WHATSAPP TO CONNECT ---');
        qrcode.generate(qr, { small: true });
        console.log('--------------------------------------------------\n');
      });

      this.client.on('ready', () => {
        console.log('WhatsApp Web Client Session is successfully ready and authenticated!');
        this.isInitialized = true;
      });

      this.client.on('auth_failure', (msg: unknown) => {
        console.error('WhatsApp authentication failed:', String(msg));
        this.isInitialized = false;
      });

      this.client.on('disconnected', (reason: unknown) => {
        console.warn('WhatsApp client was disconnected:', String(reason));
        this.isInitialized = false;
      });

      await this.client.initialize();
    } catch (error: unknown) {
      this.isInitialized = false;
      const msg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to instantiate WhatsApp web engine: ${msg}`);
    }
  }

  async verifyPhoneNumber(phoneNumber: string): Promise<WhatsAppVerificationResult> {
    try {
      if (!this.isInitialized || !this.client) {
        return {
          status: 'FAILED',
          checkedAt: new Date().toISOString(),
          error: 'WhatsApp client is not ready or authenticated. Please scan the QR code in the terminal logs.'
        };
      }

      const cleanNumber = phoneNumber.replace(/\D/g, '');
      const numberId = await this.client.getNumberId(cleanNumber);
      const isRegistered = Boolean(numberId);

      return {
        status: isRegistered ? 'REGISTERED' : 'NOT_REGISTERED',
        checkedAt: new Date().toISOString()
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'WhatsApp web check failed';
      return {
        status: 'FAILED',
        checkedAt: new Date().toISOString(),
        error: msg
      };
    }
  }
}
