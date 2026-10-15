/* ============================================================
   SVE Business Portal — Main Site JS
   Nav, lang toggle, toasts, footer, cart badge sync
   ============================================================ */

(function () {
  'use strict';

  /* ---------- LANGUAGE ---------- */
  const LANG_KEY = 'sve_lang';
  const TRANSLATIONS = {
    'brand.tag': { en: 'Business Portal', hi: 'बिज़नेस पोर्टल' },
    'nav.home':  { en: 'Home', hi: 'होम' },
    'nav.products': { en: 'Products', hi: 'उत्पाद' },
    'nav.about': { en: 'About', hi: 'परिचय' },
    'nav.contact': { en: 'Contact', hi: 'संपर्क' },
    'nav.login': { en: 'Login', hi: 'लॉगिन' },
    'nav.signup': { en: 'Sign Up', hi: 'साइन अप' },
    'nav.apply': { en: 'Apply Now', hi: 'अभी आवेदन करें' },
    'nav.checkStatus': { en: 'Check Status', hi: 'स्थिति देखें' },
    'nav.brands': { en: 'Brands', hi: 'ब्रांड्स' },
    'nav.benefits': { en: 'Benefits', hi: 'लाभ' },
    'nav.how': { en: 'How It Works', hi: 'कैसे काम करता है' },
    'nav.faq': { en: 'FAQ', hi: 'सवाल-जवाब' },

    'hero.badge': { en: 'Wholesale Detergent Supplier', hi: 'थोक डिटर्जेंट आपूर्तिकर्ता' },
    'hero.title': { en: 'Powerful Clean.<br/><span class="grad-text">Trusted Wholesale.</span>',
                    hi: 'शक्तिशाली सफाई।<br/><span class="grad-text">भरोसेमंद थोक।</span>' },
    'hero.sub': { en: 'SVE Business Portal — order premium detergents (Nikolux, Life Star, Sanjivni) at wholesale pricing. Verified partners only.',
                  hi: 'SVE बिज़नेस पोर्टल — थोक मूल्य पर प्रीमियम डिटर्जेंट ऑर्डर करें। केवल सत्यापित पार्टनर।' },
    'hero.ctaPrimary': { en: 'Create Account →', hi: 'खाता बनाएं →' },
    'hero.ctaSecondary': { en: 'Apply as Distributor', hi: 'वितरक के रूप में आवेदन' },
    'hero.stat1': { en: 'Years in Industry', hi: 'वर्षों का अनुभव' },
    'hero.stat2': { en: 'Active Partners', hi: 'सक्रिय पार्टनर' },
    'hero.stat3': { en: 'Premium Brands', hi: 'प्रीमियम ब्रांड्स' },
    'hero.stat4': { en: 'Happy Customers', hi: 'खुश ग्राहक' },
    'hero.cardLive': { en: 'Applications Open 2026', hi: '2026 के लिए आवेदन खुले' },
    'hero.cardTitle': { en: 'Two Ways to Start', hi: 'शुरू करने के दो तरीके' },
    'hero.cardText': { en: 'Sign up instantly with phone OTP or apply as a full distributor with business details.',
                       hi: 'फ़ोन OTP से तुरंत साइन अप करें या वितरक आवेदन भरें।' },
    'hero.cardCtaPrimary': { en: 'Sign Up Now →', hi: 'अभी साइन अप करें →' },
    'hero.cardCtaSecondary': { en: 'Full Distributor Application', hi: 'पूर्ण वितरक आवेदन' },
    'hero.cardLi1': { en: 'Wholesale pricing', hi: 'थोक मूल्य' },
    'hero.cardLi2': { en: 'GST invoicing', hi: 'GST इनवॉइस' },
    'hero.cardLi3': { en: 'Pan-India delivery', hi: 'पैन-इंडिया डिलीवरी' },

    'trust.1': { en: 'ISO Certified', hi: 'ISO प्रमाणित' },
    'trust.2': { en: 'Lab Tested', hi: 'लैब टेस्टेड' },
    'trust.3': { en: 'Pan-India Delivery', hi: 'पैन-इंडिया डिलीवरी' },
    'trust.4': { en: 'Distributor First', hi: 'वितरक-प्रथम' },

    'brands.title': { en: 'Our Brands', hi: 'हमारे ब्रांड्स' },
    'brands.sub': { en: 'Three proven detergent lines trusted across India.', hi: 'भारत भर में भरोसेमंद तीन डिटर्जेंट लाइनें।' },
    'brands.nikolux.d': { en: 'Premium detergent powder for sparkling clean clothes. High-foam formula with superior stain removal.',
                          hi: 'चमकदार साफ कपड़ों के लिए प्रीमियम डिटर्जेंट पाउडर।' },
    'brands.lifestar.d': { en: 'Economical detergent for everyday use. Best value-for-money for high-volume retail markets.',
                           hi: 'रोज़ाना उपयोग के लिए किफ़ायती डिटर्जेंट।' },
    'brands.sanjivni.d': { en: 'Herbal-based detergent for sensitive fabrics. Plant-derived formula trusted for baby clothes.',
                           hi: 'संवेदनशील कपड़ों के लिए हर्बल डिटर्जेंट।' },
    'brands.sku': { en: 'SKUs', hi: 'SKU' },
    'brands.tier': { en: 'Tier', hi: 'श्रेणी' },
    'brands.viewAll': { en: 'View All Products →', hi: 'सभी उत्पाद देखें →' },

    'how.title': { en: 'How It Works', hi: 'कैसे काम करता है' },
    'how.sub': { en: 'Get ordering in 3 simple steps.', hi: '3 आसान चरणों में ऑर्डर शुरू करें।' },
    'how.s1t': { en: 'Create Account', hi: 'खाता बनाएं' },
    'how.s1d': { en: 'Sign up with phone OTP and set your password in 2 minutes.', hi: 'फ़ोन OTP से 2 मिनट में साइन अप करें।' },
    'how.s2t': { en: 'Browse & Order', hi: 'ब्राउज़ और ऑर्डर' },
    'how.s2d': { en: 'Pick products, add to cart, place your wholesale order.', hi: 'उत्पाद चुनें, कार्ट में डालें, ऑर्डर करें।' },
    'how.s3t': { en: 'Track & Receive', hi: 'ट्रैक और प्राप्त करें' },
    'how.s3d': { en: 'Track your order status live, receive with GST invoice.', hi: 'ऑर्डर ट्रैक करें, GST इनवॉइस के साथ प्राप्त करें।' },

    'cta.title': { en: 'Ready to grow with SVE?', hi: 'SVE के साथ बढ़ने के लिए तैयार?' },
    'cta.sub': { en: 'Join hundreds of successful partners across India.', hi: 'भारत भर के सैकड़ों सफल पार्टनर्स से जुड़ें।' },
    'cta.btn': { en: 'Sign Up Now →', hi: 'अभी साइन अप करें →' },
    'cta.apply': { en: 'Full Application', hi: 'पूर्ण आवेदन' },

    'footer.desc': { en: 'Official B2B portal of Siddhi Vinayak Enterprises — manufacturer of Nikolux, Life Star & Sanjivni detergents.',
                     hi: 'सिद्धि विनायक एंटरप्राइजेज का आधिकारिक B2B पोर्टल।' },
    'footer.quick': { en: 'Quick Links', hi: 'त्वरित लिंक' },
    'footer.account': { en: 'Account', hi: 'खाता' },
    'footer.legal': { en: 'Legal', hi: 'कानूनी' },
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

  /* ---------- MOBILE NAV ---------- */
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

  /* ---------- FADE-IN ---------- */
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

  /* ---------- TOAST (fallback if ui.js not loaded) ---------- */
  if (!window.uiToast) {
    window.uiToast = function (msg, type) {
      let box = document.getElementById('toastBox');
      if (!box) {
        box = document.createElement('div');
        box.id = 'toastBox';
        box.className = 'toast-box';
        document.body.appendChild(box);
      }
      const t = document.createElement('div');
      t.className = 'toast ' + (type || '');
      t.textContent = msg;
      box.appendChild(t);
      setTimeout(function () {
        t.classList.add('hide');
        setTimeout(function () { t.remove(); }, 300);
      }, 3500);
    };
  }

  /* ---------- CART BADGE SYNC ---------- */
  function syncCartBadge() {
    if (!window.cartGet) return;
    const count = window.cartGet().reduce(function (s, i) { return s + (i.qty || 0); }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.setAttribute('data-count', count);
    });
  }
  window.syncCartBadge = syncCartBadge;
  window.addEventListener('storage', function (e) {
    if (e.key === 'sve_cart_v1') syncCartBadge();
  });

  /* ---------- FOOTER CONTACT ---------- */
  async function loadFooterContact() {
    const el = document.getElementById('footerContact');
    if (!el || !window.db) return;
    try {
      const doc = await window.db.collection('settings').doc('company').get();
      if (!doc.exists) { el.innerHTML = '<li>—</li>'; return; }
      const s = doc.data();
      const items = [];
      if (s.email)    items.push('<li>📧 <a href="mailto:' + s.email + '">' + s.email + '</a></li>');
      if (s.phone)    items.push('<li>📞 <a href="tel:' + s.phone + '">' + s.phone + '</a></li>');
      if (s.whatsapp) items.push('<li>💬 <a href="https://wa.me/' + String(s.whatsapp).replace(/\D/g,'') + '" target="_blank" rel="noopener">WhatsApp</a></li>');
      el.innerHTML = items.length ? items.join('') : '<li>—</li>';
    } catch (e) { el.innerHTML = '<li>—</li>'; }
  }

  /* ---------- BOOT ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    initLang();
    initNav();
    initFadeIn();
    syncCartBadge();
    loadFooterContact();
  });

})();