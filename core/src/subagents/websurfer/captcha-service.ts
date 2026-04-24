
import axios from 'axios';
import { humanDelay } from './human-behavior.js';
import { Page } from 'playwright';

/**
 * Common interface for all CAPTCHA solving providers.
 */
export interface CaptchaService {
    /**
     * Solves a CAPTCHA for a given URL and sitekey.
     * @param url The page URL where the CAPTCHA is located.
     * @param sitekey The sitekey/data-sitekey of the CAPTCHA widget.
     * @param type The type of CAPTCHA (recaptcha, hcaptcha, turnstile).
     * @param page Optional Playwright page (required for ManualTokenAdapter).
     */
    solve(url: string, sitekey: string, type?: 'recaptcha' | 'hcaptcha' | 'turnstile', page?: Page): Promise<string>;
}

/**
 * Adapter that asks the human user to solve the CAPTCHA in the browser.
 * Polls the DOM for the solution token.
 */
export class ManualTokenAdapter implements CaptchaService {
    async solve(url: string, sitekey: string, type: 'recaptcha' | 'hcaptcha' | 'turnstile' = 'recaptcha', page?: Page): Promise<string> {
        if (!page) throw new Error("ManualTokenAdapter requires the 'page' argument to poll for success.");

        console.log(`\n\n🚨🚨🚨 ⚠️  CAPTCHA DETECTED ⚠️ 🚨🚨🚨`);
        console.log(`👉 Please SOLVE the CAPTCHA in the browser window NOW.`);
        console.log(`   I am watching for the solution token...`);
        console.log(`   (Waiting up to 300 seconds)\n`);

        const startTime = Date.now();
        while (Date.now() - startTime < 300_000) { // 5 minutes wait
            // Check for filled response tokens
            const token = await page.evaluate(() => {
                const r = document.querySelector('[name="g-recaptcha-response"]') as HTMLTextAreaElement;
                if (r && r.value) return r.value;

                const h = document.querySelector('[name="h-captcha-response"]') as HTMLTextAreaElement;
                if (h && h.value) return h.value;

                const t = document.querySelector('[name="cf-turnstile-response"]') as HTMLInputElement;
                if (t && t.value) return t.value;

                return null;
            });

            if (token) {
                console.log(`✅ CAPTCHA Solved! Token detected.`);
                return token;
            }

            await humanDelay(1000, 1500);
        }

        throw new Error("Manual CAPTCHA solve timed out.");
    }
}

/**
 * Adapter for 2Captcha service (2captcha.com).
 */
export class TwoCaptchaAdapter implements CaptchaService {
    private apiKey: string;
    private baseUrl = 'http://2captcha.com';

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    async solve(url: string, sitekey: string, type: 'recaptcha' | 'hcaptcha' | 'turnstile' = 'recaptcha', page?: Page): Promise<string> {
        console.log(`🧩 [2Captcha] Requesting solve for ${type} on ${url}`);

        // 1. Submit request
        const submitUrl = `${this.baseUrl}/in.php`;
        const params: any = {
            key: this.apiKey,
            method: 'userrecaptcha', // default for reCAPTCHA v2
            googlekey: sitekey,
            pageurl: url,
            json: 1,
        };

        if (type === 'hcaptcha') {
            params.method = 'hcaptcha';
            params.sitekey = sitekey;
        } else if (type === 'turnstile') {
            params.method = 'turnstile';
            params.sitekey = sitekey;
        }

        try {
            const submitResponse = await axios.post(submitUrl, null, { params });
            const submitData = submitResponse.data;

            if (submitData.status !== 1) {
                throw new Error(`2Captcha submit failed: ${submitData.request}`);
            }

            const requestId = submitData.request;
            console.log(`🧩 [2Captcha] Task submitted. ID: ${requestId}. Waiting for solution...`);

            // 2. Poll for result
            let attempts = 0;
            while (attempts < 60) { // 3 minutes timeout
                await humanDelay(3000, 5000); // Wait 3-5s between checks

                const resultResponse = await axios.get(`${this.baseUrl}/res.php`, {
                    params: {
                        key: this.apiKey,
                        action: 'get',
                        id: requestId,
                        json: 1,
                    }
                });

                const resultData = resultResponse.data;

                if (resultData.status === 1) {
                    console.log(`🧩 [2Captcha] Solution received!`);
                    return resultData.request; // This is the token
                }

                if (resultData.request !== 'CAPCHA_NOT_READY') {
                    throw new Error(`2Captcha error: ${resultData.request}`);
                }

                attempts++;
            }

            throw new Error('2Captcha timeout');

        } catch (error) {
            console.error('🧩 [2Captcha] Error:', error);
            throw error;
        }
    }
}

/**
 * Factory to create the service based on env vars.
 */
export function createCaptchaService(): CaptchaService {
    if (process.env.TWO_CAPTCHA_KEY) {
        return new TwoCaptchaAdapter(process.env.TWO_CAPTCHA_KEY);
    }
    // Fallback or explicit manual mode
    console.log("⚠️ No TWO_CAPTCHA_KEY found. Defaulting to MANUAL HANDOFF mode.");
    return new ManualTokenAdapter();
}
