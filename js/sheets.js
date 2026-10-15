/* ============================================================
   SVE Business Portal — Google Sheets Integration
   Sends data to Google Apps Script webhook.
   Usage (from any page):
     sheetsSend('application', { ...data });
     sheetsSend('lead', { ... });
     sheetsSend('order', { ... });
   ============================================================ */

(function () {
  'use strict';

  // ---- YOUR GOOGLE APPS SCRIPT WEBHOOK ----
  const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwIB8ZOtkU_5vZkuCnAdshf82HRP6wj_NwDZiXjpHg3tbt_c9z5IhfaWQ_XpjMI-l5znw/exec';

  // ---- SHARED SECRET (must match Apps Script code) ----
  const SHARED_SECRET = 'sve_portal_2026_xK9mP3qR';

  /**
   * Send data to Google Sheet.
   * @param {string} type - 'application' | 'lead' | 'order'
   * @param {object} data - data object to append as a row
   * @returns {Promise<{success:boolean}>}
   */
  async function sheetsSend(type, data) {
    if (!WEBHOOK_URL || WEBHOOK_URL.indexOf('PASTE') !== -1) {
      console.warn('[Sheets] Webhook URL not configured.');
      return { success: false, error: 'Not configured' };
    }

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        // text/plain avoids CORS preflight — Apps Script accepts this
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          secret: SHARED_SECRET,
          type: type,
          data: data
        })
      });

      const json = await res.json();
      console.log('[Sheets] Response:', json);
      return json;

    } catch (err) {
      console.warn('[Sheets] Send failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Expose globally
  window.sheetsSend = sheetsSend;
  console.log('[Sheets] Ready. Webhook:', WEBHOOK_URL.slice(0, 60) + '…');

})();