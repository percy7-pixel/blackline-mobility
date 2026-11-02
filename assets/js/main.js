/* ==========================================================================
   BLACKLINE MOBILITY — site behaviour
   Vanilla JS, no dependencies. Everything configurable lives in CONFIG.
   ========================================================================== */

var CONFIG = {
  /* ------------------------------------------------------------------
     THE ONLY PLACE THE NUMBER EXISTS.
     Full international format, digits only (no +, no spaces).
     Change it here and every WhatsApp link, the footer, the menu and the
     booking button follow automatically.
     ------------------------------------------------------------------ */
  whatsappNumber: '237653317507',

  brandName: 'Blackline Mobility',
  currency: 'XAF',
  /* Opening line of every WhatsApp message built by this site. */
  greeting: 'Hello Blackline Mobility, I would like to book a vehicle.'
};

(function () {
  'use strict';

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var WA_NUMBER = String(CONFIG.whatsappNumber || '').replace(/[^\d]/g, '');

  /* ---------- WhatsApp plumbing ---------- */

  function formatNumber(digits) {
    var m = digits.match(/^(\d{3})(\d{3})(\d{3})(\d{3})$/);
    return m ? '+' + m[1] + ' ' + m[2] + ' ' + m[3] + ' ' + m[4] : '+' + digits;
  }

  function waLink(message) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message);
  }

  function wireStaticLinks() {
    if (!WA_NUMBER) {
      console.warn('[Blackline] CONFIG.whatsappNumber is empty — WhatsApp links disabled.');
      return;
    }
    $$('.js-wa-display').forEach(function (el) {
      el.textContent = formatNumber(WA_NUMBER);
    });
    $$('a.js-wa').forEach(function (link) {
      var kind = link.getAttribute('data-wa');
      var msg = kind === 'general'
        ? CONFIG.greeting + '\n\n(Sent from the ' + CONFIG.brandName + ' demonstration website.)'
        : CONFIG.greeting;
      link.href = waLink(msg);
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  /* ---------- Header state + mobile menu ---------- */

  function initHeader() {
    var head = $('#masthead');
    if (!head) return;
    var onScroll = function () {
      head.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = $('#menuToggle');
    var menu = $('#siteMenu');
    if (!toggle || !menu) return;

    var open = false;

    function setMenu(next) {
      open = next;
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) {
        menu.hidden = false;
        requestAnimationFrame(function () { menu.classList.add('is-open'); });
      } else {
        menu.classList.remove('is-open');
        window.setTimeout(function () { if (!open) menu.hidden = true; }, 260);
      }
    }

    toggle.addEventListener('click', function () { setMenu(!open); });
    $$('.menu__link, .menu .js-wa', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener('resize', function () {
      if (open && window.innerWidth >= 900) setMenu(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */

  function initReveal() {
    var targets = $$('.sec-head, .veh, .svc__item, .why__list, .why__media, .book__form, .summary, .route, .final__inner');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    targets.forEach(function (el) { el.setAttribute('data-reveal', ''); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Active section in nav ---------- */

  function initActiveNav() {
    var links = $$('.nav a');
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (link) {
      var id = link.getAttribute('href');
      var section = id && id.charAt(0) === '#' ? $(id) : null;
      if (section) map[section.id] = link;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (l) { l.classList.remove('is-active'); });
        var link = map[entry.target.id];
        if (link) link.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe($('#' + id)); });
  }

  /* ---------- Dates ---------- */

  function todayISO() {
    var d = new Date();
    return [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');
  }
  function pad(n) { return String(n).length < 2 ? '0' + n : String(n); }

  function parseISO(value) {
    if (!value) return null;
    var parts = value.split('-');
    if (parts.length !== 3) return null;
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return isNaN(d.getTime()) ? null : d;
  }

  function humanDate(value) {
    var d = parseISO(value);
    if (!d) return '';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  function dayDiff(fromValue, toValue) {
    var a = parseISO(fromValue);
    var b = parseISO(toValue);
    if (!a || !b) return 0;
    var ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
    return Math.round(ms / 86400000);
  }

  function money(n) {
    return n.toLocaleString('en-US') + ' ' + CONFIG.currency;
  }

  /* ---------- Booking form ---------- */

  function initBooking() {
    var form = $('#bookingForm');
    if (!form) return;

    var vehicle = $('#vehicle');
    var pickup = $('#pickup');
    var destination = $('#destination');
    var pickupDate = $('#pickupDate');
    var returnDate = $('#returnDate');
    var passengers = $('#passengers');
    var notes = $('#notes');
    var alertBox = $('#formAlert');
    var cta = $('#bookingCta');

    var sumTitle = $('#sumTitle');
    var sumRoute = $('#sumRoute');
    var sumDates = $('#sumDates');
    var sumDays = $('#sumDays');
    var sumPax = $('#sumPax');
    var sumTotal = $('#sumTotal');

    /* date floors */
    pickupDate.min = todayISO();
    returnDate.min = todayISO();

    pickupDate.addEventListener('change', function () {
      if (!pickupDate.value) return;
      var min = new Date(pickupDate.value);
      min.setDate(min.getDate() + 1);
      returnDate.min = [min.getFullYear(), pad(min.getMonth() + 1), pad(min.getDate())].join('-');
      if (returnDate.value && dayDiff(pickupDate.value, returnDate.value) < 1) {
        returnDate.value = '';
      }
      updateSummary();
    });

    /* ---------- summary ---------- */
    function rateOf() {
      var opt = vehicle.options[vehicle.selectedIndex];
      var rate = Number(opt && opt.getAttribute('data-rate'));
      return isNaN(rate) ? 0 : rate;
    }

    function updateSummary() {
      var v = vehicle.value;
      var days = dayDiff(pickupDate.value, returnDate.value);

      sumTitle.textContent = v || 'No vehicle selected';
      sumRoute.textContent = (pickup.value && destination.value.trim())
        ? pickup.value + ' \u2192 ' + destination.value.trim()
        : (pickup.value || destination.value.trim() || '\u2014');
      sumDates.textContent = (pickupDate.value && returnDate.value)
        ? humanDate(pickupDate.value) + ' \u2192 ' + humanDate(returnDate.value)
        : (humanDate(pickupDate.value) || '\u2014');
      sumDays.textContent = days > 0 ? days + (days === 1 ? ' day' : ' days') : '\u2014';
      sumPax.textContent = passengers.value ? passengers.value + (passengers.value === '1' ? ' passenger' : ' passengers') : '\u2014';

      var rate = rateOf();
      if (rate > 0 && days > 0) {
        sumTotal.textContent = money(rate * days);
      } else if (v === 'Not sure yet') {
        sumTotal.textContent = 'To be advised';
      } else {
        sumTotal.textContent = '\u2014';
      }
    }

    [vehicle, pickup, destination, pickupDate, returnDate, passengers].forEach(function (el) {
      el.addEventListener('input', updateSummary);
      el.addEventListener('change', updateSummary);
    });
    updateSummary();

    /* ---------- validation ---------- */
    function fieldOf(el) { return el.closest('.field'); }

    function setError(el, message) {
      var field = fieldOf(el);
      var err = field ? $('.field__err', field) : null;
      if (field) field.classList.add('is-invalid');
      if (err) { err.textContent = message; err.hidden = false; }
    }

    function clearError(el) {
      var field = fieldOf(el);
      var err = field ? $('.field__err', field) : null;
      if (field) field.classList.remove('is-invalid');
      if (err) err.hidden = true;
    }

    function clearAll() {
      $$('.field.is-invalid').forEach(function (f) { f.classList.remove('is-invalid'); });
      $$('.field__err').forEach(function (e) { e.hidden = true; });
      alertBox.hidden = true;
    }

    [vehicle, pickup, destination, pickupDate, returnDate, passengers].forEach(function (el) {
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { clearError(el); });
    });

    function validate() {
      var errors = [];

      if (!vehicle.value) {
        setError(vehicle, 'Choose a vehicle, or \u201cNot sure yet\u201d.');
        errors.push(vehicle);
      }
      if (!pickup.value) {
        setError(pickup, 'Tell us where to meet you.');
        errors.push(pickup);
      }
      if (!destination.value.trim()) {
        setError(destination, 'Enter a destination.');
        errors.push(destination);
      }
      var today = todayISO();
      if (!pickupDate.value) {
        setError(pickupDate, 'Choose a pickup date.');
        errors.push(pickupDate);
      } else if (pickupDate.value < today) {
        setError(pickupDate, 'Pickup must be today or later.');
        errors.push(pickupDate);
      }
      if (!returnDate.value) {
        setError(returnDate, 'Choose a return date.');
        errors.push(returnDate);
      } else if (pickupDate.value && dayDiff(pickupDate.value, returnDate.value) < 1) {
        setError(returnDate, 'Return must be at least one day after pickup.');
        errors.push(returnDate);
      }
      if (!passengers.value) {
        setError(passengers, 'Select the number of passengers.');
        errors.push(passengers);
      }
      return errors;
    }

    /* ---------- message ---------- */
    function buildMessage() {
      var lines = [CONFIG.greeting, ''];
      lines.push('Vehicle: ' + vehicle.value);
      lines.push('Pickup: ' + pickup.value);
      lines.push('Destination: ' + destination.value.trim());
      lines.push('Pickup date: ' + humanDate(pickupDate.value));
      lines.push('Return date: ' + humanDate(returnDate.value));
      lines.push('Rental days: ' + dayDiff(pickupDate.value, returnDate.value));
      lines.push('Passengers: ' + passengers.value);
      if (notes.value.trim()) lines.push('Instructions: ' + notes.value.trim());
      lines.push('');
      lines.push('(Sent from the ' + CONFIG.brandName + ' demonstration website.)');
      return lines.join('\n');
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearAll();
      var errors = validate();
      if (errors.length) {
        alertBox.textContent = errors.length === 1
          ? 'Please complete the highlighted field.'
          : 'Please complete the ' + errors.length + ' highlighted fields.';
        alertBox.hidden = false;
        errors[0].focus({ preventScroll: false });
        errors[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      if (!WA_NUMBER) {
        alertBox.textContent = 'WhatsApp number is not configured. Set CONFIG.whatsappNumber.';
        alertBox.hidden = false;
        return;
      }
      var url = waLink(buildMessage());
      cta.setAttribute('data-last-url', url);
      var win = window.open(url, '_blank', 'noopener');
      if (!win) window.location.href = url;
    });

    /* ---------- per-vehicle CTA preselect ---------- */
    $$('.js-vehicle').forEach(function (button) {
      button.addEventListener('click', function () {
        var wanted = button.getAttribute('data-vehicle');
        var matched = false;
        Array.prototype.forEach.call(vehicle.options, function (opt) {
          if (opt.value === wanted) { vehicle.value = wanted; matched = true; }
        });
        if (!matched) vehicle.value = '';
        clearError(vehicle);
        updateSummary();
        var target = $('#booking');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(function () { vehicle.focus({ preventScroll: true }); }, 420);
      });
    });
  }

  /* ---------- Footer year ---------- */
  function initYear() {
    var el = $('#year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  /* ---------- Boot ---------- */
  function boot() {
    wireStaticLinks();
    initHeader();
    initReveal();
    initActiveNav();
    initBooking();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
