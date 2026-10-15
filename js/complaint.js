/* ============================================================
   SVE Business Portal — Raise Complaint
   Generates SVE-CMP-YYYY-NNNN (sequential 0001, 0002, …)
   ============================================================ */

(function () {
  'use strict';

  const content = document.getElementById('cmpContent');
  if (!content) return;

  let USER = null;

  window.requireAuth(async function (profile) {
    USER = profile;
    render();
  });

  function render() {
    content.innerHTML = '<h1 style="font-size:1.4rem;font-weight:800;margin-bottom:6px;">Raise a Complaint</h1>'
      + '<p style="color:var(--slate-500);font-size:.9rem;margin-bottom:22px;">We usually respond within 24-48 hours.</p>'
      + '<form id="cmpForm">'
        + '<div class="field" style="margin-bottom:14px;">'
          + '<label>Complaint Type *</label>'
          + '<select id="cmpType" required>'
            + '<option value="">Select type</option>'
            + '<option value="product">Product Quality</option>'
            + '<option value="delivery">Delivery Issue</option>'
            + '<option value="payment">Payment Issue</option>'
            + '<option value="quantity">Quantity / Shortage</option>'
            + '<option value="damage">Damaged Goods</option>'
            + '<option value="other">Other</option>'
          + '</select>'
        + '</div>'
        + '<div class="field" style="margin-bottom:14px;">'
          + '<label>Subject *</label>'
          + '<input type="text" id="cmpSubject" placeholder="Short one-line title" required />'
        + '</div>'
        + '<div class="field" style="margin-bottom:14px;">'
          + '<label>Related Order ID (optional)</label>'
          + '<input type="text" id="cmpOrder" placeholder="e.g. SVE-ORD-2026-0007" />'
        + '</div>'
        + '<div class="field" style="margin-bottom:14px;">'
          + '<label>Describe your complaint *</label>'
          + '<textarea id="cmpMessage" placeholder="Explain what happened…" required style="min-height:140px;"></textarea>'
        + '</div>'
        + '<div id="cmpErr" class="alert alert-error" hidden></div>'
        + '<button type="submit" class="btn-primary btn-block btn-lg" id="cmpBtn">'
          + '<span class="btn-text">Submit Complaint →</span><span class="btn-spinner" hidden></span>'
        + '</button>'
      + '</form>';

    document.getElementById('cmpForm').addEventListener('submit', submit);
  }

  async function submit(e) {
    e.preventDefault();
    const btn = document.getElementById('cmpBtn');
    const spinner = btn.querySelector('.btn-spinner');
    const btnText = btn.querySelector('.btn-text');
    const errBox = document.getElementById('cmpErr');
    errBox.hidden = true;

    const type = document.getElementById('cmpType').value;
    const subject = document.getElementById('cmpSubject').value.trim();
    const orderId = document.getElementById('cmpOrder').value.trim();
    const message = document.getElementById('cmpMessage').value.trim();

    if (!type || !subject || !message) {
      errBox.textContent = 'Please fill all required fields.'; errBox.hidden = false; return;
    }

    btn.disabled = true; spinner.hidden = false; btnText.textContent = 'Submitting…';

    try {
      const year = new Date().getFullYear();
      const counterRef = window.db.collection('counters').doc('complaints_' + year);
      const num = await window.db.runTransaction(async function (tx) {
        const d = await tx.get(counterRef);
        const n = (d.exists ? (d.data().count || 0) : 0) + 1;
        tx.set(counterRef, { count: n, year: year, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return n;
      });
      const complaintId = 'SVE-CMP-' + year + '-' + String(num).padStart(4, '0');

      await window.db.collection('complaints').doc(complaintId).set({
        complaintId: complaintId,
        uid: USER.uid,
        userEmail: USER.email,
        userName: USER.name || '',
        phone: USER.phone || '',
        type: type,
        subject: subject,
        orderId: orderId || '',
        message: message,
        status: 'open',
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      if (window.sheetsSend) {
        window.sheetsSend('lead', {
          name: USER.name || '',
          phone: USER.phone || '',
          email: USER.email,
          message: 'Complaint ' + complaintId + ': ' + subject,
          source: 'complaint',
          appId: complaintId
        });
      }

      if (window.uiToast) window.uiToast('Complaint submitted!', 'success');
      content.innerHTML = '<div style="text-align:center;padding:30px 10px;">'
        + '<div style="font-size:4rem;margin-bottom:12px;">✅</div>'
        + '<h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;">Complaint Registered</h2>'
        + '<p style="color:var(--slate-500);margin-bottom:20px;">Your complaint ID:</p>'
        + '<div style="background:var(--blue-50);border:2px dashed var(--blue-400);border-radius:12px;padding:18px;margin-bottom:22px;">'
          + '<div style="font-family:monospace;font-size:1.3rem;font-weight:800;color:var(--slate-900);">' + complaintId + '</div>'
        + '</div>'
        + '<a href="my-complaints.html" class="btn-primary">View My Complaints →</a>'
      + '</div>';

    } catch (err) {
      console.error(err);
      errBox.textContent = 'Failed: ' + (err.message || 'Unknown error');
      errBox.hidden = false;
    } finally {
      btn.disabled = false; spinner.hidden = true; btnText.textContent = 'Submit Complaint →';
    }
  }

})();