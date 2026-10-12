/* ============================================================
   SVE Business Portal — Main Site JS
   (navbar, mobile menu, lang toggle, toasts, fade-in, footer)
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- LANGUAGE TOGGLE ---------------- */
  const LANG_KEY = 'sve_lang';
  const TRANSLATIONS = {
    // Navbar
    'brand.tag': { en: 'Business Portal', hi: 'बिज़नेस पोर्टल' },
    'nav.home':  { en: 'Home',  hi: 'होम' },
    'nav.brands':{ en: 'Brands', hi: 'ब्रांड्स' },
    'nav.benefits':{ en: 'Benefits', hi: 'लाभ' },
    'nav.how':   { en: 'How It Works', hi: 'कैसे काम करता है' },
    'nav.faq':   { en: 'FAQ', hi: 'सवाल-जवाब' },
    'nav.checkStatus':{ en: 'Check Status', hi: 'स्थिति देखें' },
    'nav.login': { en: 'Login', hi: 'लॉगिन' },
    'nav.apply': { en: 'Apply Now', hi: 'अभी आवेदन करें' },

    // Hero
    'hero.badge': { en: 'Authorized Distributor Program', hi: 'अधिकृत वितरक कार्यक्रम' },
    'hero.title': { en: 'Sell India\'s Trusted<br/><span class="grad-text">Detergent Brands.</span>',
                    hi: 'बेचें भारत के भरोसेमंद<br/><span class="grad-text">डिटर्जेंट ब्रांड्स।</span>' },
    'hero.sub':   { en: 'Join the SVE distributor network. Get wholesale pricing on Nikolux, Life Star & Sanjivni — with bulk supply, marketing support, and pan-India logistics.',
                    hi: 'SVE वितरक नेटवर्क से जुड़ें। Nikolux, Life Star और Sanjivni पर थोक मूल्य पाएं — बल्क सप्लाई, मार्केटिंग सपोर्ट और पैन-इंडिया डिलीवरी के साथ।' },
    'hero.ctaPrimary': { en: 'Apply as Distributor →', hi: 'वितरक के रूप में आवेदन करें →' },
    'hero.ctaSecondary': { en: 'View Brands', hi: 'ब्रांड्स देखें' },
    'hero.stat1': { en: 'Years in Industry', hi: 'वर्षों का अनुभव' },
    'hero.stat2': { en: 'Active Distributors', hi: 'सक्रिय वितरक' },
    'hero.stat3': { en: 'Premium Brands', hi: 'प्रीमियम ब्रांड्स' },
    'hero.stat4': { en: 'Happy Customers', hi: 'खुश ग्राहक' },
    'hero.cardLive': { en: 'Applications Open 2026', hi: '2026 के लिए आवेदन खुले' },
    'hero.cardTitle': { en: 'Become a Distributor', hi: 'वितरक बनें' },
    'hero.cardText': { en: 'Apply in 2 minutes. Our team verifies your business and activates your account within 48 hours.',
                       hi: '2 मिनट में आवेदन करें। हमारी टीम 48 घंटे में आपका खाता सक्रिय करती है।' },
    'hero.cardCta': { en: 'Start Application →', hi: 'आवेदन शुरू करें →' },
    'hero.cardLi1': { en: 'Wholesale pricing slabs', hi: 'थोक मूल्य स्लैब' },
    'hero.cardLi2': { en: 'GST invoicing + credit terms', hi: 'GST इनवॉइस + क्रेडिट टर्म्स' },
    'hero.cardLi3': { en: 'Marketing & POS material', hi: 'मार्केटिंग और POS सामग्री' },
    'hero.cardLi4': { en: 'Dedicated relationship manager', hi: 'समर्पित रिलेशनशिप मैनेजर' },

    // Trust bar
    'trust.1': { en: 'ISO Certified Manufacturing', hi: 'ISO प्रमाणित निर्माण' },
    'trust.2': { en: 'Lab Tested Every Batch', hi: 'हर बैच लैब टेस्टेड' },
    'trust.3': { en: 'Pan-India Delivery', hi: 'पैन-इंडिया डिलीवरी' },
    'trust.4': { en: 'Distributor First Policy', hi: 'वितरक-प्रथम नीति' },

    // Brands
    'brands.title': { en: 'Our Premium Brands', hi: 'हमारे प्रीमियम ब्रांड्स' },
    'brands.sub': { en: 'Three proven detergent lines trusted by millions of households across India.',
                    hi: 'भारत भर के लाखों घरों द्वारा भरोसेमंद तीन सिद्ध डिटर्जेंट लाइनें।' },
    'brands.nikolux.t': { en: 'Nikolux', hi: 'निकोलक्स' },
    'brands.nikolux.d': { en: 'Premium detergent powder for sparkling clean clothes. High-foam formula with superior stain removal.',
                          hi: 'चमकदार साफ कपड़ों के लिए प्रीमियम डिटर्जेंट पाउडर। उच्च झाग फॉर्मूला।' },
    'brands.lifestar.t': { en: 'Life Star', hi: 'लाइफ स्टार' },
    'brands.lifestar.d': { en: 'Economical detergent for everyday use. Best value-for-money for high-volume retail markets.',
                           hi: 'रोज़ाना उपयोग के लिए किफ़ायती डिटर्जेंट। हाई-वॉल्यूम बाज़ारों के लिए बेहतरीन वैल्यू।' },
    'brands.sanjivni.t': { en: 'Sanjivni', hi: 'संजीवनी' },
    'brands.sanjivni.d': { en: 'Herbal-based detergent for sensitive fabrics. Plant-derived formula trusted for baby clothes.',
                           hi: 'संवेदनशील कपड़ों के लिए हर्बल डिटर्जेंट। शिशु कपड़ों के लिए भरोसेमंद।' },
    'brands.sku': { en: 'SKUs', hi: 'SKU' },
    'brands.tier': { en: 'Tier', hi: 'श्रेणी' },
    'brands.viewCatalog': { en: 'View Wholesale Catalog (Login Required) →', hi: 'थोक कैटलॉग देखें (लॉगिन आवश्यक) →' },

    // Benefits
    'benefits.title': { en: 'Why Partner With SVE?', hi: 'SVE के साथ क्यों जुड़ें?' },
    'benefits.sub': { en: 'Distributor-first policies designed to grow your business.',
                      hi: 'आपके व्यापार को बढ़ाने के लिए वितरक-प्रथम नीतियां।' },
    'benefits.f1t': { en: 'Tiered Wholesale Pricing', hi: 'स्तरीय थोक मूल्य' },
    'benefits.f1d': { en: 'Volume-based slabs. The more you order, the better your margin.',
                      hi: 'वॉल्यूम आधारित स्लैब। जितना ज़्यादा ऑर्डर, उतना बेहतर मार्जिन।' },
    'benefits.f2t': { en: 'GST Invoicing', hi: 'GST इनवॉइसिंग' },
    'benefits.f2d': { en: 'Compliant GST invoices, easy input credit, transparent accounting.',
                      hi: 'अनुपालन GST इनवॉइस, आसान इनपुट क्रेडिट, पारदर्शी हिसाब।' },
    'benefits.f3t': { en: 'Reliable Supply Chain', hi: 'विश्वसनीय आपूर्ति श्रृंखला' },
    'benefits.f3d': { en: 'Stock guarantee, timely dispatch, tracking on every order.',
                      hi: 'स्टॉक गारंटी, समय पर डिस्पैच, हर ऑर्डर पर ट्रैकिंग।' },
    'benefits.f4t': { en: 'Marketing Support', hi: 'मार्केटिंग सपोर्ट' },
    'benefits.f4d': { en: 'POS material, posters, sample kits and digital assets — free with your first order.',
                      hi: 'POS सामग्री, पोस्टर, सैंपल किट और डिजिटल एसेट्स — पहले ऑर्डर पर मुफ़्त।' },
    'benefits.f5t': { en: 'Dedicated Manager', hi: 'समर्पित मैनेजर' },
    'benefits.f5d': { en: 'One point-of-contact for orders, payments, and support.',
                      hi: 'ऑर्डर, भुगतान और सपोर्ट के लिए एक ही संपर्क।' },
    'benefits.f6t': { en: 'Territory Protection', hi: 'क्षेत्र सुरक्षा' },
    'benefits.f6d': { en: 'Exclusive pincodes to prevent intra-network competition.',
                      hi: 'नेटवर्क के अंदर प्रतिस्पर्धा रोकने के लिए एक्सक्लूसिव पिनकोड।' },

    // How It Works
    'how.title': { en: 'How It Works', hi: 'कैसे काम करता है' },
    'how.sub': { en: 'From application to first order in 4 simple steps.',
                 hi: 'आवेदन से पहले ऑर्डर तक 4 आसान चरण।' },
    'how.s1t': { en: 'Apply Online', hi: 'ऑनलाइन आवेदन' },
    'how.s1d': { en: 'Fill the distributor form. Upload GST / ID proof. Takes 2 minutes.',
                 hi: 'वितरक फॉर्म भरें। GST / ID प्रूफ अपलोड करें। 2 मिनट लगेंगे।' },
    'how.s2t': { en: 'Verification', hi: 'सत्यापन' },
    'how.s2d': { en: 'Our team reviews your details and confirms territory availability.',
                 hi: 'हमारी टीम आपकी जानकारी जांचती है और क्षेत्र उपलब्धता की पुष्टि करती है।' },
    'how.s3t': { en: 'Account Activation', hi: 'खाता सक्रियकरण' },
    'how.s3d': { en: 'You get login credentials. Access your dashboard & wholesale catalog.',
                 hi: 'आपको लॉगिन क्रेडेंशियल मिलते हैं। डैशबोर्ड और थोक कैटलॉग एक्सेस करें।' },
    'how.s4t': { en: 'Start Ordering', hi: 'ऑर्डर शुरू करें' },
    'how.s4d': { en: 'Place bulk orders. Get GST invoices. Track delivery. Grow your business.',
                 hi: 'बल्क ऑर्डर दें। GST इनवॉइस पाएं। डिलीवरी ट्रैक करें। व्यापार बढ़ाएं।' },

    // CTA
    'cta.title': { en: 'Ready to become an SVE Distributor?', hi: 'SVE वितरक बनने के लिए तैयार हैं?' },
    'cta.sub': { en: 'Join 50+ successful distributors across India. Applications for 2026 are open.',
                 hi: 'भारत भर के 50+ सफल वितरकों से जुड़ें। 2026 के लिए आवेदन खुले हैं।' },
    'cta.btn': { en: 'Apply Now →', hi: 'अभी आवेदन करें →' },
    'cta.checkBtn': { en: 'Check Status', hi: 'स्थिति देखें' },

    // FAQ
    'faq.title': { en: 'Frequently Asked Questions', hi: 'अक्सर पूछे जाने वाले सवाल' },
    'faq.sub': { en: 'Everything distributors ask before applying.', hi: 'वितरक आवेदन से पहले जो सब पूछते हैं।' },
    'faq.q1': { en: 'Who can become an SVE distributor?', hi: 'SVE वितरक कौन बन सकता है?' },
    'faq.a1': { en: 'Any registered business — retailer, wholesaler, distributor, or super-stockist — with valid GST (or willingness to register) can apply. We also consider experienced traders without GST on a case-by-case basis.',
                hi: 'कोई भी पंजीकृत व्यवसाय — रिटेलर, थोक विक्रेता, वितरक — वैध GST के साथ आवेदन कर सकता है। अनुभवी व्यापारियों पर भी विचार किया जाता है।' },
    'faq.q2': { en: 'Is there an application fee?', hi: 'क्या आवेदन शुल्क है?' },
    'faq.a2': { en: 'No. Applying is completely free. Once approved, you only pay for the stock you order.',
                hi: 'नहीं। आवेदन पूरी तरह मुफ़्त है। मंज़ूरी के बाद आप केवल स्टॉक के लिए भुगतान करते हैं।' },
    'faq.q3': { en: 'What is the minimum order quantity (MOQ)?', hi: 'न्यूनतम ऑर्डर मात्रा (MOQ) क्या है?' },
    'faq.a3': { en: 'First order MOQ is ₹25,000. Subsequent orders can be smaller, based on your slab and territory.',
                hi: 'पहले ऑर्डर की MOQ ₹25,000 है। आगे के ऑर्डर आपके स्लैब अनुसार छोटे हो सकते हैं।' },
    'faq.q4': { en: 'How long does approval take?', hi: 'मंज़ूरी में कितना समय लगता है?' },
    'faq.a4': { en: 'Typically 24–48 working hours after all documents are submitted. You can track your application status anytime.',
                hi: 'आमतौर पर दस्तावेज़ जमा करने के बाद 24–48 कार्य घंटे। आप कभी भी स्थिति ट्रैक कर सकते हैं।' },
    'faq.q5': { en: 'Do you offer credit terms?', hi: 'क्या क्रेडिट शर्तें हैं?' },
    'faq.a5': { en: 'Yes. After the first 3 orders (prepaid), eligible distributors can apply for 15/30-day credit terms.',
                hi: 'हाँ। पहले 3 ऑर्डर (प्रीपेड) के बाद पात्र वितरक 15/30 दिन की क्रेडिट शर्तों के लिए आवेदन कर सकते हैं।' },
    'faq.q6': { en: 'Which areas do you currently serve?', hi: 'आप किन क्षेत्रों में सेवा देते हैं?' },
    'faq.a6': { en: 'We dispatch pan-India via our logistics partners. Territory exclusivity depends on pincode availability.',
                hi: 'हम लॉजिस्टिक्स पार्टनर्स के जरिए पैन-इंडिया डिस्पैच करते हैं। क्षेत्र विशेषता पिनकोड उपलब्धता पर निर्भर है।' },
    'faq.more': { en: 'Still have questions?', hi: 'अभी भी सवाल हैं?' },
    'faq.contactBtn': { en: 'Contact Us →', hi: 'संपर्क करें →' },

    // Footer
    'footer.desc': { en: 'The official B2B distributor portal of Siddhi Vinayak Enterprises — manufacturer of Nikolux, Life Star & Sanjivni detergents.',
                     hi: 'सिद्धि विनायक एंटरप्राइजेज का आधिकारिक B2B वितरक पोर्टल — Nikolux, Life Star और Sanjivni डिटर्जेंट के निर्माता।' },
    'footer.portal': { en: 'Portal', hi: 'पोर्टल' },
    'footer.legal': { en: 'Legal', hi: 'कानूनी' },
    'footer.privacy': { en: 'Privacy Policy', hi: 'गोपनीयता नीति' },
    'footer.terms': { en: 'Terms of Service', hi: 'सेवा की शर्तें' },
    'footer.contact': { en: 'Contact', hi: 'संपर्क' },
    'footer.rights': { en: 'All rights reserved.', hi: 'सर्वाधिकार सुरक्षित।' },
    'footer.mainSite': { en: 'Visit Main Website →', hi: 'मुख्य वेबसाइट देखें →' }
  };

  function applyLanguage(lang) {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
    document.body.classList.toggle('lang-hi', lang === 'hi');
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      const t = TRANSLATIONS[key];
      if (!t) return;
      el.innerHTML = t[lang] || t.en;
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  }

  function initLang() {
    let lang = 'en';
    try { lang = localStorage.getItem(LANG_KEY) || 'en'; } catch (e) {}
    applyLanguage(lang);
    const btn = document.getElementById('langToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        const cur = document.body.classList.contains('lang-hi') ? 'hi' : 'en';
        applyLanguage(cur === 'hi' ? 'en' : 'hi');
      });
    }
  }

  /* ---------------- MOBILE NAV ---------------- */
  function initNav() {
    const ham = document.getElementById('hamburger');
    const links = document.getElementById('navLinks');
    const navbar = document.getElementById('navbar');
    if (ham && links) {
      ham.addEventListener('click', function () {
        links.classList.toggle('open');
        ham.classList.toggle('open');
      });
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          links.classList.remove('open');
          ham.classList.remove('open');
        });
      });
    }
    if (navbar) {
      window.addEventListener('scroll', function () {
        navbar.classList.toggle('scrolled', window.scrollY > 10);
      }, { passive: true });
    }
  }

  /* ---------------- FADE-IN ON SCROLL ---------------- */
  function initFadeIn() {
    const els = document.querySelectorAll('.fade-in');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------------- TOASTS ---------------- */
  function showToast(msg, type) {
    const box = document.getElementById('toastBox');
    if (!box) return;
    const toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = msg;
    box.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('hide');
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }
  window.showToast = showToast;

  /* ---------------- FOOTER CONTACT (from settings) ---------------- */
  async function loadFooterContact() {
    const el = document.getElementById('footerContact');
    if (!el || !window.db) return;
    try {
      const doc = await window.db.collection('settings').doc('company').get();
      if (!doc.exists) { el.innerHTML = '<li>—</li>'; return; }
      const s = doc.data();
      const items = [];
      if (s.email)   items.push('<li>📧 <a href="mailto:' + s.email + '">' + s.email + '</a></li>');
      if (s.phone)   items.push('<li>📞 <a href="tel:' + s.phone + '">' + s.phone + '</a></li>');
      if (s.whatsapp)items.push('<li>💬 <a href="https://wa.me/' + s.whatsapp.replace(/\D/g,'') + '" target="_blank" rel="noopener">WhatsApp</a></li>');
      if (s.address) items.push('<li>📍 ' + s.address + '</li>');
      el.innerHTML = items.length ? items.join('') : '<li>—</li>';
    } catch (e) {
      console.warn('[SVE] footer contact load failed', e.message);
      el.innerHTML = '<li>—</li>';
    }
  }

  /* ---------------- BOOT ---------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initNav();
    initFadeIn();
    loadFooterContact();
  });

})();