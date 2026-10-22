(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.lucide) lucide.createIcons();
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  /* Header: scrolled state, back-to-top, active link */
  const header = document.getElementById('header'), toTop = document.getElementById('toTop');
  const links = [...document.querySelectorAll('.nav a')];
  const sections = links
    .map(a => a.getAttribute('href'))
    .filter(href => href && href.startsWith('#'))
    .map(href => document.querySelector(href))
    .filter(Boolean);
  function onScroll() {
    const y = window.scrollY;
    if (header) header.classList.toggle('scrolled', y > 24);
    if (toTop) toTop.classList.toggle('show', y > 700);
    let cur = null;
    sections.forEach(s => { if (s.getBoundingClientRect().top <= 140) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    if (!reduce) {
      const f = document.getElementById('footer'), footerBg = document.getElementById('footerBg');
      if (f && footerBg) {
        const r = f.getBoundingClientRect();
        if (r.top < innerHeight) footerBg.style.transform = `translateY(${(-r.top * 0.08).toFixed(1)}px)`;
      }
    }
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (toTop) toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));

  /* Mobile menu */
  const menu = document.getElementById('mobileMenu'), btn = document.getElementById('menuBtn');
  if (menu && btn) {
    function setMenu(o) {
      menu.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o);
      btn.innerHTML = '<i data-lucide="' + (o ? 'x' : 'menu') + '"></i>';
      if (window.lucide) lucide.createIcons();
      document.body.style.overflow = o ? 'hidden' : '';
    }
    btn.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  }

  /* Hero video: pause control, honour reduced motion */
  const vid = document.getElementById('heroVideo'), vbtn = document.getElementById('videoToggle');
  if (vid && vbtn) {
    function setVidIcon(p) {
      vbtn.innerHTML = '<i data-lucide="' + (p ? 'play' : 'pause') + '"></i>';
      vbtn.setAttribute('aria-label', p ? 'Play background video' : 'Pause background video');
      if (window.lucide) lucide.createIcons();
    }
    if (reduce) { vid.pause(); vid.removeAttribute('autoplay'); setVidIcon(true); }
    vbtn.addEventListener('click', () => { if (vid.paused) { vid.play(); setVidIcon(false); } else { vid.pause(); setVidIcon(true); } });
  }

  /* Scroll reveals (once) */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .14, rootMargin: '0px 0px -40px' });
  document.querySelectorAll('.reveal, .reveal-img').forEach(el => io.observe(el));

  /* Count-up (once) */
  const countIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; countIO.unobserve(e.target);
    const el = e.target, to = +el.dataset.to;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 900;
    (function step(t) { const p = Math.min((t - t0) / dur, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); })(t0);
  }), { threshold: .6 });
  document.querySelectorAll('.count').forEach(c => countIO.observe(c));

  /* Clients carousel */
  const track = document.getElementById('clientTrack');
  if (track) {
    const carousel = track.parentElement;
    const originalItems = [...track.children];
    function cloneItems() {
      const clones = document.createDocumentFragment();
      originalItems.forEach(item => {
        const clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
        clones.appendChild(clone);
      });
      return clones;
    }
    track.insertBefore(cloneItems(), track.firstChild);
    track.appendChild(cloneItems());
    let cycleWidth, stepWidth;
    function measure() {
      const originalStart = track.children[originalItems.length];
      const followingStart = track.children[originalItems.length * 2];
      cycleWidth = followingStart.offsetLeft - originalStart.offsetLeft;
      stepWidth = originalItems[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap);
      if (cycleWidth > 0) track.scrollLeft = cycleWidth + (track.scrollLeft % cycleWidth);
    }
    measure();
    let frame = 0, previousTime = 0, paused = false, resumeTimer;

    function animate(time) {
      if (previousTime) track.scrollLeft += Math.min(time - previousTime, 50) * 35 / 1000;
      previousTime = time;
      if (track.scrollLeft >= cycleWidth * 2) track.scrollLeft -= cycleWidth;
      else if (track.scrollLeft < cycleWidth) track.scrollLeft += cycleWidth;
      frame = requestAnimationFrame(animate);
    }
    function start() {
      if (reduce || paused || document.hidden || frame) return;
      previousTime = 0;
      frame = requestAnimationFrame(animate);
    }
    function stop() {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
    }
    function pause() {
      paused = true;
      stop();
      clearTimeout(resumeTimer);
    }
    function resume() {
      if (carousel.matches(':hover') || carousel.querySelector(':focus-visible')) return;
      paused = false;
      start();
    }
    function move(direction) {
      pause();
      if (direction > 0 && track.scrollLeft + stepWidth >= cycleWidth * 2) track.scrollLeft -= cycleWidth;
      if (direction < 0 && track.scrollLeft - stepWidth < cycleWidth) track.scrollLeft += cycleWidth;
      track.scrollTo({ left: track.scrollLeft + direction * stepWidth, behavior: reduce ? 'auto' : 'smooth' });
      resumeTimer = setTimeout(resume, reduce ? 0 : 700);
    }

    const next = document.getElementById('nextClient'), previous = document.getElementById('prevClient');
    if (next) next.addEventListener('click', () => move(1));
    if (previous) previous.addEventListener('click', () => move(-1));
    carousel.addEventListener('pointerenter', pause);
    carousel.addEventListener('pointerleave', resume);
    carousel.addEventListener('focusin', e => {
      if (e.target.matches(':focus-visible')) pause();
    });
    carousel.addEventListener('focusout', () => {
      if (!carousel.querySelector(':focus-visible')) resume();
    });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    const carouselObserver = new IntersectionObserver(([entry]) => entry.isIntersecting ? start() : stop());
    carouselObserver.observe(carousel);
    addEventListener('resize', measure);
  }

  /* Working group tabs (arrow-key accessible) */
  const tabs = [...document.querySelectorAll('.wg-tab')], panels = [...document.querySelectorAll('.wg-panel')];
  function pick(i) {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', k === i); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('show', k === i); });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => pick(i));
    t.addEventListener('keydown', e => {
      let n = null; if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length; if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (n !== null) { e.preventDefault(); pick(n); tabs[n].focus(); }
    });
  });

  /* Forms: validation + accessible errors (hook up to your backend/endpoint) */
  const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function check(input, valid) { const f = input.closest('.field'); f.classList.toggle('invalid', !valid); input.setAttribute('aria-invalid', !valid); return valid; }
  const contactForm = document.getElementById('contactForm');
  if (contactForm && contactForm.elements.namedItem('name') && contactForm.elements.namedItem('email') && contactForm.elements.namedItem('message')) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target, a = check(f.name, f.name.value.trim().length > 1), b = check(f.email, okEmail(f.email.value)), c = check(f.message, f.message.value.trim().length > 4);
      if (a && b && c) {
        /* TODO: fetch('/your-endpoint', { method:'POST', body:new FormData(f) }) */
        document.getElementById('formOk').classList.add('show'); f.reset();
      } else (f.querySelector('[aria-invalid="true"]')).focus();
    });
  }
  const newsForm = document.getElementById('newsForm');
  if (newsForm) {
    newsForm.addEventListener('submit', e => {
      e.preventDefault(); const i = document.getElementById('nl');
      if (i && check(i, okEmail(i.value))) { i.value = ''; i.placeholder = 'Thank you for subscribing!'; }
    });
  }
})();


/* =========================================================
   TIMELINE SCROLL ANIMATION (staggered reveal per item)
   ========================================================= */
(function () {
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length) {
    const tlIO = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          tlIO.unobserve(e.target);
        }
      }),
      { threshold: 0.2, rootMargin: '0px 0px -60px' }
    );
    timelineItems.forEach(item => tlIO.observe(item));
  }
})();

/* =========================================================
   CONTACT PAGE — FAQ ACCORDION
   ========================================================= */
(function () {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const btn = item.querySelector('.faq-q');
    const answer = item.querySelector('.faq-a');
    if (!btn || !answer) return;
    btn.setAttribute('aria-controls', answer.id);
    answer.setAttribute('role', 'region');
    answer.setAttribute('aria-labelledby', btn.id || (btn.id = `faq-question-${[...faqItems].indexOf(item) + 1}`));
    answer.setAttribute('aria-hidden', 'true');
    answer.style.maxHeight = '0px';
    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(i => {
        i.classList.remove('open');
        const question = i.querySelector('.faq-q');
        const panel = i.querySelector('.faq-a');
        if (question && panel) {
          question.setAttribute('aria-expanded', 'false');
          panel.setAttribute('aria-hidden', 'true');
          panel.style.maxHeight = '0px';
        }
      });
      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
        answer.style.maxHeight = `${answer.scrollHeight}px`;
      }
    });
  });
  addEventListener('resize', () => {
    faqItems.forEach(item => {
      const answer = item.querySelector('.faq-a');
      if (item.classList.contains('open') && answer) answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  });
})();

/* =========================================================
   CONTACT PAGE — MAP TAB SWITCHER
   ========================================================= */
(function () {
  const mapTabs = document.querySelectorAll('.map-tab');
  const mapFrame = document.getElementById('officeMap');
  if (!mapTabs.length || !mapFrame) return;
  const mapLink = document.getElementById('officeMapLink');
  const mapPanel = document.getElementById('officeMapPanel');

  const mapSources = {
    geneva: {
      embed: 'https://maps.google.com/maps?q=Rue%20du%20Rh%C3%B4ne%20114%2C%201204%20Geneva%2C%20Switzerland&output=embed',
      link: 'https://maps.google.com/?q=Rue%20du%20Rh%C3%B4ne%20114%2C%201204%20Geneva%2C%20Switzerland',
      title: 'Map of the GEA Geneva head office'
    },
    singapore: {
      embed: 'https://maps.google.com/maps?q=One%20Raffles%20Quay%2C%20North%20Tower%2C%20Singapore%20048583&output=embed',
      link: 'https://maps.google.com/?q=One%20Raffles%20Quay%2C%20North%20Tower%2C%20Singapore%20048583',
      title: 'Map of the GEA Singapore regional office'
    }
  };

  function selectMap(tab) {
    const location = mapSources[tab.dataset.location];
    if (!location) return;
    mapTabs.forEach(t => {
      const selected = t === tab;
      t.classList.toggle('active', selected);
      t.setAttribute('aria-selected', selected);
      t.tabIndex = selected ? 0 : -1;
    });
    if (mapPanel) mapPanel.setAttribute('aria-labelledby', tab.id);
    mapFrame.title = location.title;
    if (mapFrame.src !== location.embed) mapFrame.src = location.embed;
    if (mapLink) mapLink.href = location.link;
  }
  mapTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectMap(tab);
    });
    tab.addEventListener('keydown', event => {
      let nextIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % mapTabs.length;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + mapTabs.length) % mapTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = mapTabs.length - 1;
      if (nextIndex !== undefined) {
        event.preventDefault();
        mapTabs[nextIndex].focus();
        selectMap(mapTabs[nextIndex]);
      }
    });
  });
  const selectedMap = [...mapTabs].find(tab => tab.getAttribute('aria-selected') === 'true') || mapTabs[0];
  selectMap(selectedMap);
})();

/* =========================================================
   CONTACT PAGE — ENHANCED FORM VALIDATION
   ========================================================= */
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const okEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const okPhone = v => !v || /^[+\d\s\-().]{7,20}$/.test(v);

  function check(input, valid) {
    const field = input.closest('.field');
    if (field) {
      field.classList.toggle('invalid', !valid);
      input.setAttribute('aria-invalid', !valid);
    }
    return valid;
  }

  // Real-time validation on blur
  form.querySelectorAll('input, select, textarea').forEach(el => {
    el.addEventListener('blur', () => {
      if (el.type === 'checkbox') {
        check(el, el.checked);
      } else if (el.required) {
        if (el.type === 'email') check(el, okEmail(el.value));
        else if (el.type === 'tel') check(el, okPhone(el.value));
        else if (el.tagName === 'SELECT') check(el, !!el.value);
        else if (el.name === 'message') check(el, el.value.trim().length >= 10);
        else check(el, el.value.trim().length > 1);
      }
    });
  });
  form.addEventListener('input', () => {
    const status = document.getElementById('contactFormOk');
    if (status) status.classList.remove('show');
  });

  // Submit
  form.addEventListener('submit', e => {
    e.preventDefault();
    const firstName = check(form.firstName, form.firstName.value.trim().length > 1);
    const lastName = check(form.lastName, form.lastName.value.trim().length > 1);
    const email = check(form.email, okEmail(form.email.value));
    const phone = check(form.phone, okPhone(form.phone.value));
    const subject = check(form.subject, !!form.subject.value);
    const message = check(form.message, form.message.value.trim().length >= 10);
    const consent = check(form.consent, form.consent.checked);

    if (firstName && lastName && email && phone && subject && message && consent) {
      const details = [
        `Name: ${form.firstName.value.trim()} ${form.lastName.value.trim()}`,
        `Email: ${form.email.value.trim()}`,
        form.phone.value.trim() && `Phone: ${form.phone.value.trim()}`,
        form.company.value.trim() && `Company: ${form.company.value.trim()}`,
        `Subject: ${form.subject.selectedOptions[0].text}`,
        '',
        form.message.value.trim()
      ].filter(Boolean).join('\n');
      const draft = document.getElementById('contactEmailDraft');
      const okEl = document.getElementById('contactFormOk');
      const status = document.getElementById('contactFormStatus');
      if (draft && okEl && status) {
        draft.href = `mailto:info@gea-ethanol.org?subject=${encodeURIComponent(form.subject.selectedOptions[0].text)}&body=${encodeURIComponent(details)}`;
        status.textContent = 'Your email draft is ready. Open your email app to review and send it.';
        okEl.classList.add('show');
      }
    } else {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
    }
  });
})();



/* =========================================================
   NEWS & EVENTS — DATA
   ========================================================= */
const NEWS_ARTICLES = [
  {
    id: 1,
    slug: "ethanol-marine-fuel-breakthrough-2025",
    title: "Ethanol-Powered Vessels Achieve Major Milestone in Maritime Decarbonisation",
    excerpt: "A landmark trial demonstrates that ethanol-blended marine fuel can reduce greenhouse gas emissions by up to 45% compared to conventional bunker fuel, marking a significant step forward for sustainable shipping.",
    category: "industry-news",
    categoryLabel: "Industry News",
    tags: ["marine-fuel", "decarbonisation", "sustainability"],
    author: "Morten Jacobsen",
    authorRole: "Secretary General & Co-Founder",
    authorImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&q=80",
    date: "2025-11-18",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=1200&q=80",
    featured: true,
    content: `
      <h2>A Watershed Moment for Sustainable Shipping</h2>
      <p>The maritime industry has long sought a scalable, commercially viable alternative to conventional bunker fuel. This month, a consortium of shipping companies, fuel suppliers, and engine manufacturers announced the successful completion of a six-month trial using ethanol-blended marine fuel on commercial cargo routes — and the results are remarkable.</p>
      <p>The trial, conducted across three major trade routes in the Atlantic and Pacific, demonstrated a <strong>45% reduction in well-to-wake greenhouse gas emissions</strong> compared to standard very low sulphur fuel oil (VLSFO), with no significant modifications required to existing engine infrastructure.</p>

      <blockquote>
        "This is not a theoretical exercise. This is real-world, commercial-scale proof that ethanol can deliver immediate, meaningful emissions reductions for the shipping industry."
        <cite>— Morten Jacobsen, Secretary General, GEA</cite>
      </blockquote>

      <h2>Key Findings from the Trial</h2>
      <p>The consortium's report highlights several critical outcomes that position ethanol as a frontrunner in the marine fuel transition:</p>
      <ul>
        <li><strong>Emissions reduction:</strong> 42–48% lower CO₂ equivalent emissions across all tested blends</li>
        <li><strong>Engine compatibility:</strong> No adverse effects on engine performance or maintenance intervals at E20 and E30 blends</li>
        <li><strong>Supply chain readiness:</strong> Existing port infrastructure can accommodate ethanol bunkering with minor modifications</li>
        <li><strong>Cost competitiveness:</strong> At current prices, ethanol blends offer a cost-per-tonne-mile within 8% of VLSFO</li>
      </ul>

      <h2>What This Means for the Industry</h2>
      <p>The implications of this trial extend far beyond a single shipping lane. With the International Maritime Organization's (IMO) revised GHG strategy targeting net-zero emissions by 2050, the industry urgently needs solutions that are available now — not in a decade.</p>
      <p>Ethanol offers a unique combination of immediate availability, established production capacity, and a global supply chain that has been refined over decades. Unlike some alternative fuels that require entirely new infrastructure, ethanol can be integrated into existing maritime operations with manageable adjustments.</p>

      <div class="highlight-box">
        <h4><i data-lucide="lightbulb"></i> Key Insight</h4>
        <p>The global ethanol industry currently produces over 110 billion litres annually. Diverting just 5% of this capacity to marine fuel would be sufficient to meet the bunkering needs of the entire global container fleet.</p>
      </div>

      <h2>GEA's Role in Accelerating Adoption</h2>
      <p>At GEA, we have been advocating for ethanol as a marine fuel for years, and this trial validates what we have long believed: the technology is ready, the supply chain exists, and the economics are increasingly compelling.</p>
      <p>Our working groups are now focused on three priorities:</p>
      <ol>
        <li>Working with classification societies to formalise ethanol fuel standards for marine applications</li>
        <li>Facilitating partnerships between ethanol producers and bunker suppliers in key ports worldwide</li>
        <li>Engaging with regulators to ensure ethanol is fairly represented in incentive programmes for low-carbon fuels</li>
      </ol>

      <h2>Looking Ahead</h2>
      <p>The consortium plans to expand the trial to include additional vessel classes and routes in early 2026, with a particular focus on short-sea shipping and ferry operations where the benefits of ethanol are most pronounced.</p>
      <p>For shipowners and operators evaluating their decarbonisation strategies, the message is clear: ethanol is not a future possibility — it is a present-day solution that delivers measurable results.</p>
    `
  },
  {
    id: 2,
    slug: "gea-annual-summit-2025-recap",
    title: "GEA Annual Summit 2025 Brings Together 400+ Industry Leaders in Geneva",
    excerpt: "The Global Ethanol Association's flagship event featured keynote addresses, panel discussions, and the launch of our new Maritime Fuel Initiative — here's everything you missed.",
    category: "events",
    categoryLabel: "Events",
    tags: ["events", "partnerships", "policy"],
    author: "GEA Communications",
    authorRole: "Global Ethanol Association",
    authorImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    date: "2025-10-28",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
    featured: false,
    eventDate: "2025-10-15",
    eventLocation: "Geneva, Switzerland",
    content: `
      <h2>A Record-Breaking Gathering</h2>
      <p>On October 15, 2025, the Global Ethanol Association hosted its most successful Annual Summit to date, welcoming over 400 delegates from 42 countries to the Palexpo Convention Centre in Geneva. The event brought together ethanol producers, shipowners, technology providers, investors, and policymakers for a full day of dialogue, deal-making, and strategic planning.</p>

      <h2>Keynote Highlights</h2>
      <p>The summit opened with a keynote address from GEA President Sylvain Zurcher, who outlined the association's vision for the next three years:</p>
      <blockquote>
        "Our industry stands at an inflection point. The technology is proven, the demand is growing, and the policy landscape is shifting in our favour. What we need now is coordinated action — and that is exactly what GEA was built to deliver."
        <cite>— Sylvain Zurcher, President & Co-Founder, GEA</cite>
      </blockquote>

      <p>Other notable speakers included the Director of the IMO's Marine Environment Division, who provided an update on the implementation timeline for the revised GHG strategy, and the CEO of a leading European ethanol producer who shared insights on scaling production to meet marine fuel demand.</p>

      <h2>Launch of the Maritime Fuel Initiative</h2>
      <p>The summit's headline announcement was the official launch of GEA's Maritime Fuel Initiative — a coordinated programme designed to accelerate the adoption of ethanol as a marine fuel through:</p>
      <ul>
        <li>A dedicated working group bringing together shipowners, fuel suppliers, and engine manufacturers</li>
        <li>A series of pilot projects in five major ports: Rotterdam, Singapore, Houston, Santos, and Shanghai</li>
        <li>A market intelligence platform providing real-time pricing, availability, and regulatory data</li>
        <li>An advocacy programme targeting key maritime regulators and classification societies</li>
      </ul>

      <h2>Networking & Partnerships</h2>
      <p>Beyond the formal programme, the summit provided ample opportunities for networking. Over 60 bilateral meetings were facilitated through GEA's matchmaking service, resulting in at least a dozen new partnership agreements announced during or immediately after the event.</p>
      <p>The exhibition area featured 28 exhibitors showcasing the latest technologies in ethanol production, fuel handling, and marine engine optimisation.</p>

      <h2>Save the Date: 2026</h2>
      <p>Planning is already underway for the GEA Annual Summit 2026, which will be held in Singapore on October 21–22. The event will have a special focus on Asia-Pacific markets and will include a site visit to one of the region's largest ethanol storage and bunkering facilities.</p>
      <p>Early bird registration will open in January 2026. GEA members receive a 30% discount on all registration tiers.</p>
    `
  },
  {
    id: 3,
    slug: "eu-renewable-energy-directive-ethanol-opportunities",
    title: "New EU Renewable Energy Directive Opens Significant Opportunities for Ethanol",
    excerpt: "The revised RED III framework introduces ambitious targets for advanced biofuels and recognises ethanol's role in hard-to-abate sectors, creating new market pathways for producers.",
    category: "policy-regulation",
    categoryLabel: "Policy & Regulation",
    tags: ["policy", "sustainability", "decarbonisation"],
    author: "Daniel C. Weiss",
    authorRole: "Board Member, VALE",
    authorImage: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=200&q=80",
    date: "2025-09-22",
    readTime: "7 min read",
    image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200&q=80",
    featured: false,
    content: `
      <h2>Understanding RED III</h2>
      <p>The European Union's Renewable Energy Directive III (RED III), which entered into force in late 2024 and is now being transposed into national law across member states, represents the most significant policy shift for renewable fuels in over a decade. The directive raises the EU's overall renewable energy target to 42.5% by 2030, with a specific sub-target of 5.5% for advanced biofuels and biogas.</p>

      <h2>What Changed for Ethanol</h2>
      <p>Several key provisions in RED III directly benefit the ethanol sector:</p>
      <ul>
        <li><strong>Advanced biofuel recognition:</strong> Certain ethanol production pathways, particularly those using waste and residue feedstocks, now qualify as "advanced biofuels" with double counting towards member state targets</li>
        <li><strong>Transport sector targets:</strong> The directive mandates a 29% reduction in transport emissions by 2030, creating substantial demand for low-carbon liquid fuels</li>
        <li><strong>Maritime inclusion:</strong> For the first time, the directive explicitly includes maritime transport in its scope, opening a new demand channel for ethanol marine fuel</li>
        <li><strong>Multipliers for aviation and maritime:</strong> Fuels used in aviation and maritime applications receive a 1.2x multiplier towards national targets, improving the economics of ethanol supply to these sectors</li>
      </ul>

      <h2>National Implementation: A Mixed Picture</h2>
      <p>While the directive sets the overall framework, individual member states have significant flexibility in how they implement RED III. GEA has been actively monitoring the transposition process across all 27 member states and engaging with national authorities to ensure ethanol is fairly represented.</p>

      <div class="highlight-box">
        <h4><i data-lucide="alert-circle"></i> GEA Policy Watch</h4>
        <p>GEA's policy team has published a comprehensive country-by-country analysis of RED III implementation, available exclusively to members through the GEA Policy Portal.</p>
      </div>

      <h2>Market Implications</h2>
      <p>The revised directive is expected to create an additional 8–12 billion litres of annual ethanol demand in the EU by 2030, according to independent analysis commissioned by GEA. This represents a growth opportunity of approximately 35% over current production levels.</p>
      <p>The maritime sector is particularly promising. With the directive's inclusion of shipping for the first time, and the IMO's parallel GHG strategy creating regulatory pressure at the global level, ethanol producers who can meet marine fuel specifications are positioned to capture a significant share of this new demand.</p>

      <h2>Recommendations for Producers</h2>
      <p>Based on our analysis, GEA recommends that ethanol producers take the following steps to capitalise on RED III:</p>
      <ol>
        <li>Assess your current production pathways against the directive's sustainability criteria to determine eligibility for advanced biofuel status</li>
        <li>Engage with national authorities during the transposition process to advocate for favourable implementation</li>
        <li>Explore partnerships with marine fuel suppliers and bunker operators in key EU ports</li>
        <li>Invest in certification schemes (ISCC, RSB) to demonstrate compliance with RED III sustainability requirements</li>
      </ol>

      <h2>Looking Forward</h2>
      <p>RED III is just the beginning. The European Commission is already consulting on a successor framework (RED IV) that could raise ambitions further. GEA will continue to advocate for policies that recognise ethanol's full potential as a decarbonisation solution across all sectors.</p>
    `
  },
  {
    id: 4,
    slug: "gea-welcomes-three-new-members-october-2025",
    title: "GEA Welcomes Three New Members, Expanding Global Reach Across Three Continents",
    excerpt: "A Brazilian ethanol producer, a Singapore-based maritime fuel supplier, and a German engine technology firm join the association, strengthening GEA's value chain coverage.",
    category: "association-updates",
    categoryLabel: "Association Updates",
    tags: ["partnerships", "sustainability"],
    author: "GEA Communications",
    authorRole: "Global Ethanol Association",
    authorImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&q=80",
    date: "2025-10-08",
    readTime: "3 min read",
    image: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200&q=80",
    featured: false,
    content: `
      <h2>Growing Our Global Community</h2>
      <p>The Global Ethanol Association is pleased to announce the addition of three new member organisations, further strengthening our representation across the entire ethanol value chain and expanding our geographic footprint.</p>

      <h2>Meet Our New Members</h2>

      <h3>BioEnergia Brasil</h3>
      <p>One of South America's largest ethanol producers, BioEnergia Brasil operates four production facilities with a combined annual capacity of 1.2 billion litres. The company has been a pioneer in second-generation ethanol production from sugarcane bagasse and is now exploring opportunities in the marine fuel sector.</p>
      <p>"Joining GEA gives us a platform to connect with the global maritime industry and position Brazilian ethanol as a premier marine fuel," said the company's CEO at the signing ceremony.</p>

      <h3>MarineFuel Solutions Pte Ltd</h3>
      <p>Based in Singapore — the world's largest bunkering hub — MarineFuel Solutions specialises in the supply and logistics of alternative marine fuels. The company operates storage and blending facilities at the Port of Singapore and is actively developing ethanol bunkering capabilities.</p>
      <p>Their membership strengthens GEA's presence in the critical Asia-Pacific maritime market and provides a practical link between ethanol producers and shipowners in the region.</p>

      <h3>TecMarine Engineering GmbH</h3>
      <p>A German engineering firm specialising in marine propulsion systems, TecMarine brings technical expertise to GEA's working groups. The company has developed retrofit solutions that enable existing marine engines to operate on ethanol blends of up to E50.</p>
      <p>TecMarine's Managing Director will join GEA's Maritime Fuel Initiative working group, contributing to the development of technical standards and best practices.</p>

      <h2>What This Means for GEA Members</h2>
      <p>Each new member strengthens the network effect that makes GEA valuable to all its members. With these additions, GEA now represents:</p>
      <ul>
        <li>Over 45 member organisations across 22 countries</li>
        <li>A combined ethanol production capacity exceeding 15 billion litres annually</li>
        <li>Direct access to 8 of the world's 10 largest bunkering ports</li>
        <li>Technical expertise spanning production, distribution, and end-use applications</li>
      </ul>

      <h2>Join GEA</h2>
      <p>If your organisation is active in the ethanol value chain — whether in production, distribution, technology, or end-use applications — we invite you to explore GEA membership. Visit our membership page or contact our team to learn more about the benefits and application process.</p>
    `
  },
  {
    id: 5,
    slug: "second-generation-ethanol-commercial-viability",
    title: "Second-Generation Ethanol Reaches Commercial Viability: What It Means for the Industry",
    excerpt: "After years of pilot projects and technological refinement, cellulosic ethanol is finally achieving cost parity with first-generation production — and the implications are profound.",
    category: "thought-leadership",
    categoryLabel: "Thought Leadership",
    tags: ["innovation", "sustainability", "decarbonisation"],
    author: "Brian D. Thome",
    authorRole: "Board Member, Edeniq",
    authorImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80",
    date: "2025-08-30",
    readTime: "8 min read",
    image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=1200&q=80",
    featured: false,
    content: `
      <h2>The Long Road to Commercialisation</h2>
      <p>For nearly two decades, the biofuels industry has talked about the promise of second-generation (2G) ethanol — fuel produced from non-food feedstocks such as agricultural residues, forestry waste, and dedicated energy crops. The potential has always been clear: expand production without competing with food, reduce greenhouse gas emissions by 80–90% compared to fossil fuels, and unlock value from waste streams.</p>
      <p>Yet commercialisation has been frustratingly slow. High capital costs, enzymatic efficiency challenges, and feedstock logistics have kept 2G ethanol production costs 30–50% above first-generation benchmarks — until now.</p>

      <h2>The Tipping Point</h2>
      <p>Recent data from operating 2G facilities in Brazil, the United States, and Europe indicates that production costs have fallen dramatically — by as much as 40% over the past five years. Several facilities are now reporting costs at or below parity with first-generation ethanol in their respective markets.</p>
      <p>Several converging factors explain this breakthrough:</p>
      <ul>
        <li><strong>Enzyme cost reduction:</strong> The cost of cellulase enzymes — historically the single largest operating expense — has fallen by over 70% due to improved microbial strains and production processes</li>
        <li><strong>Process integration:</strong> Co-locating 2G facilities with existing first-generation plants enables shared infrastructure, utilities, and feedstock handling, reducing capital requirements by 25–35%</li>
        <li><strong>Feedstock optimisation:</strong> Improved collection, storage, and pre-treatment systems have reduced feedstock costs and improved conversion yields</li>
        <li><strong>Policy support:</strong> Advanced biofuel mandates in the EU, US, and Brazil have created premium markets that justify the remaining cost differential</li>
      </ul>

      <blockquote>
        "We are witnessing the moment when 2G ethanol transitions from a promising technology to a mainstream production pathway. This changes everything — for producers, for policymakers, and for the industries that depend on scalable, sustainable liquid fuels."
        <cite>— Brian D. Thome, Board Member, GEA</cite>
      </blockquote>

      <h2>Implications for Marine Fuel</h2>
      <p>The commercialisation of 2G ethanol has particularly significant implications for the maritime sector. Shipowners and regulators have been hesitant to embrace ethanol as a marine fuel partly due to concerns about the sustainability of first-generation production. 2G ethanol addresses these concerns directly:</p>
      <ul>
        <li>Lifecycle GHG emissions reductions of 85–90% compared to fossil marine fuels</li>
        <li>No competition with food production or agricultural land use</li>
        <li>Potential for negative emissions when combined with carbon capture and storage (CCS)</li>
        <li>Scalable production potential exceeding 50 billion litres annually by 2035</li>
      </ul>

      <div class="highlight-box">
        <h4><i data-lucide="trending-up"></i> Market Projection</h4>
        <p>GEA's analysis projects that 2G ethanol could supply up to 30% of global marine fuel demand by 2035, representing a market opportunity of over $25 billion annually.</p>
      </div>

      <h2>Challenges Remain</h2>
      <p>Despite the progress, significant challenges must be addressed to fully realise 2G ethanol's potential:</p>
      <ol>
        <li><strong>Capital availability:</strong> 2G plants still require 2–3x the capital investment of equivalent first-generation capacity</li>
        <li><strong>Feedstock logistics:</strong> Seasonal availability and geographic dispersion of cellulosic feedstocks complicate supply chain planning</li>
        <li><strong>Technology risk:</strong> While improving, 2G processes remain more complex and less proven at scale than conventional ethanol production</li>
        <li><strong>Policy uncertainty:</strong> Inconsistent definitions and sustainability criteria across jurisdictions create market fragmentation</li>
      </ol>

      <h2>GEA's Commitment</h2>
      <p>GEA is committed to supporting the continued growth of 2G ethanol through our working groups, policy advocacy, and market development initiatives. We believe that 2G ethanol will play a critical role in meeting the world's decarbonisation targets — not just in transport, but across all sectors where liquid fuels remain essential.</p>
      <p>Our Innovation Working Group is currently developing a best-practice guide for 2G project development, which will be published in Q1 2026 and made available to all GEA members.</p>
    `
  },
  {
    id: 6,
    slug: "ethanol-storage-safety-best-practices",
    title: "Ethanol Storage and Handling: Best Practices for Port Infrastructure",
    excerpt: "As more ports evaluate ethanol bunkering capabilities, understanding the safety and operational requirements for ethanol storage becomes critical. Here's what you need to know.",
    category: "thought-leadership",
    categoryLabel: "Thought Leadership",
    tags: ["marine-fuel", "innovation", "sustainability"],
    author: "Wenbin Han",
    authorRole: "Board Member, SQ GROUP",
    authorImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&q=80",
    date: "2025-08-12",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1200&q=80",
    featured: false,
    content: `
      <h2>The Infrastructure Challenge</h2>
      <p>One of the most common questions GEA receives from port authorities and terminal operators is: "What does it take to store and handle ethanol safely?" It's a fair question — and one that has a more reassuring answer than many expect.</p>
      <p>Ethanol has been stored, transported, and handled at industrial scale for over a century. The fuel ethanol industry has developed comprehensive standards and best practices that can be readily adapted to marine bunkering applications.</p>

      <h2>Key Safety Considerations</h2>
      <p>While ethanol is less flammable than gasoline and far less hazardous than LNG or methanol, it requires specific handling protocols:</p>
      <ul>
        <li><strong>Flammability range:</strong> Ethanol has a flammability range of 3.3–19% in air, compared to 1.4–7.6% for gasoline — meaning it is actually harder to ignite</li>
        <li><strong>Flash point:</strong> At 13°C, ethanol's flash point is higher than gasoline's (-43°C), reducing ignition risk during handling</li>
        <li><strong>Water miscibility:</strong> Ethanol is fully miscible with water, which simplifies spill response but requires careful tank design to prevent water contamination</li>
        <li><strong>Material compatibility:</strong> Ethanol is compatible with carbon steel, stainless steel, and most elastomers commonly used in fuel infrastructure</li>
      </ul>

      <h2>Storage Tank Design</h2>
      <p>Ethanol storage tanks should follow these key design principles:</p>
      <ol>
        <li>Use vertical cylindrical tanks with floating roofs or internal floating covers to minimise vapour space and emissions</li>
        <li>Ensure tank vents are equipped with flame arresters and pressure/vacuum relief valves</li>
        <li>Implement water bottom monitoring to detect and remove any accumulated water</li>
        <li>Use nitrogen blanketing for long-term storage to prevent moisture absorption and oxidation</li>
        <li>Install appropriate level gauging, temperature monitoring, and overfill protection systems</li>
      </ol>

      <h2>Bunkering Operations</h2>
      <p>Ethanol bunkering can be conducted using modified versions of existing marine fuel infrastructure. Key operational considerations include:</p>
      <ul>
        <li>Dedicated or segregated lines to prevent cross-contamination with petroleum products</li>
        <li>Static electricity grounding during all transfer operations</li>
        <li>Appropriate personal protective equipment (PPE) including chemical-resistant gloves and eye protection</li>
        <li>Emergency response plans that account for ethanol's water-miscible nature (foam-based fire suppression is less effective; alcohol-resistant foam or water spray should be used)</li>
      </ul>

      <div class="highlight-box">
        <h4><i data-lucide="check-circle-2"></i> Good News for Ports</h4>
        <p>Most existing fuel terminals can be adapted for ethanol storage with modifications representing less than 15% of total facility capital cost, according to GEA's infrastructure assessment framework.</p>
      </div>

      <h2>Regulatory Framework</h2>
      <p>Several international standards govern ethanol storage and handling, including NFPA 30 (Flammable Liquids Code), API 650 (Welded Tanks for Oil Storage), and various national regulations. GEA is working with classification societies to develop marine-specific guidelines that will provide clear, consistent requirements for port authorities and terminal operators.</p>

      <h2>GEA Resources</h2>
      <p>GEA members have access to our comprehensive Ethanol Infrastructure Toolkit, which includes detailed engineering specifications, safety checklists, regulatory compliance guides, and case studies from ports that have successfully implemented ethanol bunkering capabilities.</p>
      <p>For more information or to request a technical consultation, contact our Maritime Fuel Initiative working group through the GEA member portal.</p>
    `
  }
];

(function () {
  'use strict';

  /* =========================================================
     HELPERS
     ========================================================= */

  const escapeHTML = (value = '') =>
    String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char]));

  const formatDate = dateString => {
    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const articleUrl = article =>
    `news-detail.html?slug=${encodeURIComponent(article.slug)}`;

  const reducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const renderIcons = (scope = document) => {
    if (
      window.lucide &&
      typeof window.lucide.createIcons === 'function'
    ) {
      window.lucide.createIcons({ root: scope });
    }
  };

  /* =========================================================
     NEWS ARTICLE CARD
     ========================================================= */

  const articleCard = article => `
    <article class="news-card reveal">
      <a
        class="nc-img-wrap"
        href="${articleUrl(article)}"
        aria-label="Read ${escapeHTML(article.title)}"
      >
        <img
          src="${escapeHTML(article.image)}"
          alt="${escapeHTML(article.title)}"
          loading="lazy"
        >

        <span class="nc-category">
          ${escapeHTML(article.categoryLabel)}
        </span>
      </a>

      <div class="nc-body">
        <div class="nc-meta">
          <span>
            <i data-lucide="calendar-days"></i>
            ${escapeHTML(formatDate(article.date))}
          </span>

          <span>
            <i data-lucide="clock-3"></i>
            ${escapeHTML(article.readTime)}
          </span>
        </div>

        <h3>
          <a href="${articleUrl(article)}">
            ${escapeHTML(article.title)}
          </a>
        </h3>

        <p class="nc-excerpt">${escapeHTML(article.excerpt)}</p>

        <a class="nc-read-more" href="${articleUrl(article)}">
          Read article
          <i data-lucide="arrow-up-right"></i>
        </a>
      </div>
    </article>
  `;

  /* =========================================================
     FEATURED ARTICLE
     ========================================================= */

  const featuredMarkup = article => `
    <img
      class="fa-bg"
      src="${escapeHTML(article.image)}"
      alt=""
      loading="lazy"
    >

    <div class="fa-content">
      <span class="fa-badge">
        <i data-lucide="star"></i>
        Featured Story
      </span>

      <div class="fa-meta">
        <span>
          <i data-lucide="calendar-days"></i>
          ${escapeHTML(formatDate(article.date))}
        </span>

        <span>
          <i data-lucide="clock-3"></i>
          ${escapeHTML(article.readTime)}
        </span>
      </div>

      <span class="featured-category">
        ${escapeHTML(article.categoryLabel)}
      </span>

      <h2>
        <a href="${articleUrl(article)}">
          ${escapeHTML(article.title)}
        </a>
      </h2>

      <p class="fa-excerpt">${escapeHTML(article.excerpt)}</p>

      <a class="fa-read-btn" href="${articleUrl(article)}">
        Read Featured Story
        <i data-lucide="arrow-right"></i>
      </a>
    </div>
  `;

  /* =========================================================
     NEWS & EVENTS LISTING PAGE
     ========================================================= */

  function initNewsListing() {
    const newsGrid = document.getElementById('newsGrid');

    if (!newsGrid || typeof NEWS_ARTICLES === 'undefined') {
      return;
    }

    const searchInput = document.getElementById('newsSearch');
    const searchClear = document.getElementById('newsSearchClear');
    const categoryFilter = document.getElementById('newsCategoryFilter');
    const sortFilter = document.getElementById('newsSortFilter');
    const tagButtons = Array.from(
      document.querySelectorAll('.news-tag')
    );

    const newsCount = document.getElementById('newsCount');
    const noResults = document.getElementById('newsNoResults');
    const loadMoreWrap = document.getElementById('newsLoadMoreWrap');
    const loadMoreBtn = document.getElementById('newsLoadMore');
    const resetBtn = document.getElementById('newsResetFilters');
    const featuredContainer = document.getElementById('featuredArticle');

    let currentSearch = '';
    let currentCategory = 'all';
    let currentTag = '';
    let currentSort = 'latest';

    let visibleCount = 6;
    const pageSize = 6;

    /* Filter and sort articles */

    function getFilteredArticles() {
      const query = currentSearch.trim().toLowerCase();

      const articles = NEWS_ARTICLES.filter(article => {
        const searchableContent = [
          article.title,
          article.excerpt,
          article.categoryLabel,
          article.author,
          article.authorRole,
          ...(article.tags || [])
        ]
          .join(' ')
          .toLowerCase();

        const matchesSearch =
          !query || searchableContent.includes(query);

        const matchesCategory =
          currentCategory === 'all' ||
          article.category === currentCategory;

        const matchesTag =
          !currentTag ||
          (article.tags || []).includes(currentTag);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesTag
        );
      });

      articles.sort((a, b) => {
        if (currentSort === 'oldest') {
          return new Date(a.date) - new Date(b.date);
        }

        if (currentSort === 'title-az') {
          return a.title.localeCompare(b.title);
        }

        return new Date(b.date) - new Date(a.date);
      });

      return articles;
    }

    /* Update popular tag states */

    function updateActiveTags() {
      tagButtons.forEach(button => {
        const active = button.dataset.tag === currentTag;

        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    }

    /* Render listing */

    function renderNews() {
      const filteredArticles = getFilteredArticles();
      const visibleArticles = filteredArticles.slice(0, visibleCount);

      const featuredArticle =
        NEWS_ARTICLES.find(article => article.featured) ||
        NEWS_ARTICLES[0];

      const filtersAreActive = Boolean(
        currentSearch ||
        currentCategory !== 'all' ||
        currentTag
      );

      /* Featured article */

      if (featuredContainer) {
        if (!filtersAreActive && featuredArticle) {
          featuredContainer.innerHTML =
            featuredMarkup(featuredArticle);

          featuredContainer.hidden = false;
        } else {
          featuredContainer.innerHTML = '';
          featuredContainer.hidden = true;
        }
      }

      /* News cards */

      newsGrid.innerHTML = visibleArticles
        .map(articleCard)
        .join('');

      /* Article count */

      if (newsCount) {
        const noun =
          filteredArticles.length === 1 ? 'article' : 'articles';

        newsCount.textContent =
          `Showing ${visibleArticles.length} of ` +
          `${filteredArticles.length} ${noun}`;
      }

      /* Empty state */

      if (noResults) {
        noResults.style.display =
          filteredArticles.length === 0 ? 'block' : 'none';
      }

      /* Load more */

      if (loadMoreWrap) {
        loadMoreWrap.style.display =
          filteredArticles.length > visibleArticles.length
            ? 'flex'
            : 'none';
      }

      if (loadMoreBtn) {
        loadMoreBtn.disabled =
          visibleArticles.length >= filteredArticles.length;
      }

      /* Search clear button */

      if (searchClear) {
        searchClear.style.display =
          currentSearch ? 'inline-flex' : 'none';
      }

      updateActiveTags();

      renderIcons(newsGrid);

      if (featuredContainer && !featuredContainer.hidden) {
        renderIcons(featuredContainer);
      }

      observeReveals(newsGrid);
    }

    function resetPagination() {
      visibleCount = pageSize;
      renderNews();
    }

    /* Search */

    searchInput?.addEventListener('input', () => {
      currentSearch = searchInput.value;
      resetPagination();
    });

    searchClear?.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        currentSearch = '';
        searchInput.focus();
      }

      resetPagination();
    });

    /* Category filter */

    categoryFilter?.addEventListener('change', () => {
      currentCategory = categoryFilter.value || 'all';
      resetPagination();
    });

    /* Sorting */

    sortFilter?.addEventListener('change', () => {
      currentSort = sortFilter.value || 'latest';
      resetPagination();
    });

    /* Popular tags */

    tagButtons.forEach(button => {
      button.addEventListener('click', () => {
        currentTag =
          currentTag === button.dataset.tag
            ? ''
            : button.dataset.tag || '';

        resetPagination();
      });
    });

    /* Load more articles */

    loadMoreBtn?.addEventListener('click', () => {
      visibleCount += pageSize;
      renderNews();
    });

    /* Reset all filters */

    resetBtn?.addEventListener('click', () => {
      currentSearch = '';
      currentCategory = 'all';
      currentTag = '';
      currentSort = 'latest';
      visibleCount = pageSize;

      if (searchInput) {
        searchInput.value = '';
      }

      if (categoryFilter) {
        categoryFilter.value = 'all';
      }

      if (sortFilter) {
        sortFilter.value = 'latest';
      }

      renderNews();
    });

    /* Initial render */

    renderNews();

    /* Allow article detail links to filter by tag */

    const requestedTag =
      new URLSearchParams(window.location.search).get('tag');

    if (requestedTag) {
      const matchingTag = tagButtons.find(
        button => button.dataset.tag === requestedTag
      );

      if (matchingTag) {
        matchingTag.click();
      } else if (searchInput) {
        searchInput.value = requestedTag.replace(/-/g, ' ');
        searchInput.dispatchEvent(
          new Event('input', { bubbles: true })
        );
      }
    }
  }

  /* =========================================================
     NEWS ARTICLE DETAIL PAGE
     ========================================================= */

  function initNewsDetail() {
    const hero = document.getElementById('articleHero');
    const main = document.getElementById('articleMain');

    if (!hero || !main || typeof NEWS_ARTICLES === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    const requestedSlug =
      params.get('slug') || params.get('article');

    const article = requestedSlug
      ? NEWS_ARTICLES.find(item => item.slug === requestedSlug)
      : NEWS_ARTICLES.find(item => item.featured) || NEWS_ARTICLES[0];

    if (!article) {
      document.title = 'Article Not Found | Global Ethanol Association';

      const breadcrumbTitle =
        document.getElementById('breadcrumbTitle');

      if (breadcrumbTitle) {
        breadcrumbTitle.textContent = 'Article Not Found';
      }

      hero.innerHTML = `
        <div class="container article-hero-inner">
          <h1>Article not found</h1>
          <p>This article may have been moved or is no longer available.</p>
          <a class="fa-read-btn" href="news-events.html">
            Return to News &amp; Events
            <i data-lucide="arrow-right"></i>
          </a>
        </div>
      `;

      main.innerHTML = `
        <div class="article-content">
          <p>Please use the News &amp; Events page to browse the available articles.</p>
        </div>
      `;

      document.querySelector('.article-sidebar')?.setAttribute('hidden', '');
      renderIcons(hero);
      return;
    }

    /* Page title */

    document.title =
      `${article.title} | Global Ethanol Association`;

    const breadcrumbTitle =
      document.getElementById('breadcrumbTitle');

    if (breadcrumbTitle) {
      breadcrumbTitle.textContent = article.title;
    }

    /* Article hero */

    hero.innerHTML = `
      <img
        class="article-hero-bg"
        src="${escapeHTML(article.image)}"
        alt=""
        fetchpriority="high"
      >

      <div class="container article-hero-inner">
        <a class="article-back-link" href="news-events.html">
          <i data-lucide="arrow-left"></i>
          Back to News &amp; Events
        </a>

        <span class="article-hero-cat">
          ${escapeHTML(article.categoryLabel)}
        </span>

        <h1>${escapeHTML(article.title)}</h1>

        <p class="article-hero-excerpt">
          ${escapeHTML(article.excerpt)}
        </p>

        <div class="article-hero-meta">
          <span class="ahm-item">
            <i data-lucide="calendar-days"></i>
            ${escapeHTML(formatDate(article.date))}
          </span>

          <span class="ahm-item">
            <i data-lucide="clock-3"></i>
            ${escapeHTML(article.readTime)}
          </span>

          <span class="ahm-author">
            <img
              src="${escapeHTML(article.authorImage || '')}"
              alt=""
              loading="lazy"
            >
            ${escapeHTML(article.author)}
          </span>
        </div>
      </div>
    `;

    /* Article content */

    main.innerHTML = `
      <div class="author-box">
        <img
          src="${escapeHTML(article.authorImage || '')}"
          alt="${escapeHTML(article.author)}"
          loading="lazy"
        >

        <div class="author-box-info">
          <strong>${escapeHTML(article.author)}</strong>

          <div class="ab-role">
            ${escapeHTML(
      article.authorRole || 'Global Ethanol Association'
    )}
          </div>
          <p>${escapeHTML(article.excerpt)}</p>
        </div>
      </div>

      <div class="article-content">
        ${article.content ||
      `<p>${escapeHTML(article.excerpt)}</p>`
      }
      </div>

      <div class="article-end-note">
        <i data-lucide="leaf"></i>

        <p>
          Stay connected with the Global Ethanol Association for more
          industry news, research, and perspectives.
        </p>
      </div>
    `;

    /* Table of contents */

    const headingElements = Array.from(
      main.querySelectorAll(
        '.article-content h2, .article-content h3'
      )
    );

    const tocNav = document.getElementById('tocNav');
    const tocWidget = document.getElementById('tocWidget');

    if (tocNav && headingElements.length) {
      tocNav.innerHTML = headingElements
        .map((heading, index) => {
          const id = `article-section-${index + 1}`;

          heading.id = id;

          const className = [
            'toc-link',
            heading.tagName.toLowerCase() === 'h3' ? 'toc-subitem' : ''
          ]
            .filter(Boolean)
            .join(' ');

          return `
            <a href="#${id}" class="${className}">
              ${escapeHTML(heading.textContent.trim())}
            </a>
          `;
        })
        .join('');

      /* Smooth scrolling */

      tocNav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', event => {
          const target = document.querySelector(
            link.getAttribute('href')
          );

          if (!target) return;

          event.preventDefault();

          target.scrollIntoView({
            behavior: reducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });

          history.replaceState(
            null,
            '',
            link.getAttribute('href')
          );
        });
      });
    } else if (tocWidget) {
      tocWidget.hidden = true;
    }

    /* Related articles */

    const relatedArticles = NEWS_ARTICLES.filter(item => {
      if (item.id === article.id) {
        return false;
      }

      const sameCategory = item.category === article.category;

      const sharedTag = item.tags?.some(tag =>
        article.tags?.includes(tag)
      );

      return sameCategory || sharedTag;
    }).slice(0, 3);

    const fallbackArticles = NEWS_ARTICLES
      .filter(item => item.id !== article.id)
      .slice(0, 3);

    const relatedItems =
      relatedArticles.length > 0
        ? relatedArticles
        : fallbackArticles;

    const relatedList = document.getElementById('relatedList');

    if (relatedList) {
      relatedList.innerHTML = relatedItems
        .map(item => `
          <a class="related-item" href="${articleUrl(item)}">
            <img
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(item.title)}"
              loading="lazy"
            >

            <span class="related-item-info">
              <strong>${escapeHTML(item.title)}</strong>

              <span>
                <i data-lucide="calendar-days"></i>
                ${escapeHTML(formatDate(item.date))}
              </span>
            </span>
          </a>
        `)
        .join('');
    }

    /* Article tags */

    const tagsCloud = document.getElementById('tagsCloud');

    if (tagsCloud) {
      tagsCloud.innerHTML = (article.tags || [])
        .map(tag => `
          <a
            class="tc-tag"
            href="news-events.html?tag=${encodeURIComponent(tag)}"
          >
            ${escapeHTML(tag.replace(/-/g, ' '))}
          </a>
        `)
        .join('');
    }

    /* More articles */

    const moreGrid = document.getElementById('moreArticlesGrid');

    if (moreGrid) {
      const moreArticles = NEWS_ARTICLES
        .filter(item => item.id !== article.id)
        .slice(0, 3);

      moreGrid.innerHTML = moreArticles
        .map(articleCard)
        .join('');

      renderIcons(moreGrid);
    }

    /* Social sharing */

    const shareUrl = window.location.href;
    const shareText = article.title;

    function setShareLink(id, url) {
      const link = document.getElementById(id);

      if (link) {
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
    }

    setShareLink(
      'shareLinkedIn',
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    );

    setShareLink(
      'shareTwitter',
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    );

    setShareLink(
      'shareFacebook',
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    );

    /* Copy article URL */

    const copyLink = document.getElementById('shareCopy');

    copyLink?.addEventListener('click', async event => {
      event.preventDefault();

      try {
        await navigator.clipboard.writeText(shareUrl);
      } catch (error) {
        const temporaryTextarea =
          document.createElement('textarea');

        temporaryTextarea.value = shareUrl;
        temporaryTextarea.setAttribute('readonly', '');
        temporaryTextarea.style.position = 'absolute';
        temporaryTextarea.style.left = '-9999px';

        document.body.appendChild(temporaryTextarea);
        temporaryTextarea.select();

        document.execCommand('copy');
        temporaryTextarea.remove();
      }

      const feedback = document.getElementById('copyFeedback');

      if (feedback) {
        feedback.classList.add('show');

        window.setTimeout(() => {
          feedback.classList.remove('show');
        }, 1800);
      }
    });

    renderIcons(hero);
    renderIcons(main);

    renderIcons(
      document.querySelector('.article-sidebar') || document
    );
  }

  /* =========================================================
     SCROLL-TRIGGERED REVEAL ANIMATIONS
     ========================================================= */

  let revealObserver;

  function observeReveals(scope = document) {
    const elements = scope.querySelectorAll?.(
      '.reveal:not(.is-visible), .rise:not(.is-visible)'
    );

    if (!elements?.length) {
      return;
    }

    if (
      reducedMotion ||
      !('IntersectionObserver' in window)
    ) {
      elements.forEach(element => {
        element.classList.add('is-visible');
      });

      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');

              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: '0px 0px -35px 0px'
        }
      );
    }

    elements.forEach(element => {
      revealObserver.observe(element);
    });
  }

  /* =========================================================
     HEADER, MOBILE MENU AND BACK TO TOP
     ========================================================= */

  function initHeaderAndNavigation() {
    const header = document.querySelector('.header');
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    const toTop = document.getElementById('toTop');

    /* Header and back-to-top scroll states */

    function updateScrollState() {
      const scrollPosition =
        window.scrollY || window.pageYOffset;

      header?.classList.toggle(
        'scrolled',
        scrollPosition > 24
      );

      toTop?.classList.toggle(
        'visible',
        scrollPosition > 450
      );
    }

    updateScrollState();

    window.addEventListener(
      'scroll',
      updateScrollState,
      { passive: true }
    );

    /* Close mobile menu */

    function closeMenu() {
      if (!mobileMenu || !menuBtn) {
        return;
      }

      mobileMenu.classList.remove('open');
      mobileMenu.setAttribute('aria-hidden', 'true');

      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.setAttribute('aria-label', 'Open menu');

      document.body.classList.remove('menu-open');

      const icon = menuBtn.querySelector('i');

      if (icon) {
        icon.setAttribute('data-lucide', 'menu');
      }

      renderIcons(menuBtn);
    }

    /* Toggle mobile menu */

    menuBtn?.addEventListener('click', () => {
      if (!mobileMenu) {
        return;
      }

      const opening =
        !mobileMenu.classList.contains('open');

      mobileMenu.classList.toggle('open', opening);

      mobileMenu.setAttribute(
        'aria-hidden',
        String(!opening)
      );

      menuBtn.setAttribute(
        'aria-expanded',
        String(opening)
      );

      menuBtn.setAttribute(
        'aria-label',
        opening ? 'Close menu' : 'Open menu'
      );

      document.body.classList.toggle(
        'menu-open',
        opening
      );

      const icon = menuBtn.querySelector('i');

      if (icon) {
        icon.setAttribute(
          'data-lucide',
          opening ? 'x' : 'menu'
        );
      }

      renderIcons(menuBtn);
    });

    /* Close menu when a link is selected */

    mobileMenu?.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    /* Close menu with Escape */

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    });

    /* Close menu on desktop resize */

    window.addEventListener('resize', () => {
      if (window.innerWidth > 900) {
        closeMenu();
      }
    });

    /* Back-to-top button */

    toTop?.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* =========================================================
     NEWSLETTER FORM — MAIN NEWS PAGE
     ========================================================= */

  function initNewsletterForms() {
    const newsletterForm =
      document.getElementById('newsletterForm');

    const newsletterEmail =
      document.getElementById('newsletterEmail');

    const newsletterOk =
      document.getElementById('newsletterOk');

    newsletterForm?.addEventListener('submit', event => {
      event.preventDefault();

      const email =
        newsletterEmail?.value.trim() || '';

      const field =
        newsletterEmail?.closest('.field');

      const valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      field?.classList.toggle('invalid', !valid);

      if (!valid) {
        newsletterEmail?.setAttribute(
          'aria-invalid',
          'true'
        );

        newsletterEmail?.focus();

        return;
      }

      newsletterEmail?.removeAttribute('aria-invalid');

      if (newsletterOk) {
        newsletterOk.style.display = 'flex';
      }

      newsletterForm.reset();

      /*
       * IMPORTANT:
       * Connect this form to your newsletter provider or backend
       * to save subscriptions permanently.
       */
    });

    newsletterEmail?.addEventListener('input', () => {
      newsletterEmail
        .closest('.field')
        ?.classList.remove('invalid');

      newsletterEmail.removeAttribute('aria-invalid');

      if (newsletterOk) {
        newsletterOk.style.display = 'none';
      }
    });

    /* =======================================================
       NEWSLETTER FORM — ARTICLE FOOTER
       ======================================================= */

    const footerForm = document.getElementById('newsForm');
    const footerEmail = document.getElementById('nl');
    const footerError = document.getElementById('e-nl');

    footerForm?.addEventListener('submit', event => {
      event.preventDefault();

      const email = footerEmail?.value.trim() || '';

      const valid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      footerEmail
        ?.closest('.field')
        ?.classList.toggle('invalid', !valid);

      if (footerError) {
        footerError.style.display =
          valid ? 'none' : 'block';
      }

      if (!valid) {
        footerEmail?.setAttribute(
          'aria-invalid',
          'true'
        );

        footerEmail?.focus();

        return;
      }

      footerEmail?.removeAttribute('aria-invalid');

      const button = footerForm.querySelector(
        'button[type="submit"]'
      );

      if (button) {
        const originalHTML = button.innerHTML;

        button.innerHTML = `
          <span class="ico">
            <i data-lucide="check"></i>
          </span>
          Thank you!
        `;

        button.disabled = true;

        renderIcons(button);

        window.setTimeout(() => {
          button.innerHTML = originalHTML;
          button.disabled = false;

          renderIcons(button);
        }, 2500);
      }

      footerForm.reset();

      /*
       * IMPORTANT:
       * Connect this form to your newsletter provider or backend
       * to save subscriptions permanently.
       */
    });

    footerEmail?.addEventListener('input', () => {
      footerEmail
        .closest('.field')
        ?.classList.remove('invalid');

      footerEmail.removeAttribute('aria-invalid');

      if (footerError) {
        footerError.style.display = 'none';
      }
    });
  }

  /* =========================================================
     FOOTER YEAR
     ========================================================= */

  function initFooterYear() {
    const yearElement = document.getElementById('year');

    if (yearElement) {
      yearElement.textContent =
        String(new Date().getFullYear());
    }
  }

  /* =========================================================
     INITIALIZE WEBSITE
     ========================================================= */

  function initWebsite() {
    initNewsListing();
    initNewsDetail();
    initHeaderAndNavigation();
    initNewsletterForms();
    initFooterYear();

    observeReveals(document);
    renderIcons(document);
  }

  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      initWebsite,
      { once: true }
    );
  } else {
    initWebsite();
  }
})();



/* =========================================================
   SERVICES PAGE: EXTRA JS
   Paste at the END of main.js (after your existing code), or load as a separate
   <script src="services-extra.js"></script> AFTER main.js on the services page.
   All service content below is DUMMY text: edit the SERVICES array freely.
   ========================================================= */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cards = [...document.querySelectorAll('.svc-card[data-service]')];
  if (!cards.length) return;

  /* ---------------- DATA (dummy content) ---------------- */
  const SERVICES = [
    {
      id: 'market', icon: 'trending-up', title: 'Market Development & Advocacy',
      tagline: 'Build awareness, confidence and demand for sustainable fuels.',
      img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=900&q=80',
      meta: { Format: 'Programme', Duration: '3 to 12 months', 'Best for': 'Producers, operators' },
      lead: 'We help the market understand, trust and ask for sustainable fuel solutions.',
      body: ['Growing demand is the strongest driver of change. This service combines industry outreach, targeted communication and stakeholder engagement to move interest from curiosity to commitment.',
        'We work with you to identify the audiences that matter, craft credible messages and open doors with the people who can make decisions.'],
      includes: ['Market and stakeholder mapping', 'Positioning and key messages', 'Industry briefings and events', 'Policy and regulatory input', 'Media and publication support', 'Progress reporting'],
      process: [['Discover', 'Understand your goals, audiences and current market position.'],
      ['Plan', 'Define priorities, messages and the engagement roadmap.'],
      ['Engage', 'Run briefings, meetings and outreach with key stakeholders.'],
      ['Review', 'Measure response and refine the approach.']],
      benefits: [['megaphone', 'Stronger voice', 'Your position is heard by the right people.'],
      ['users', 'Wider reach', 'Access to a broad industry network.'],
      ['trending-up', 'Growing demand', 'Interest converts into real enquiries.']],
      ideal: ['Fuel producers', 'Shipowners', 'Technology providers', 'Industry bodies'],
      faqs: [['Is this a one-off or ongoing service?', 'Both are possible. Many members start with a focused campaign and continue as a programme.'],
      ['Can it be tailored to one region?', 'Yes. Scope can be set by region, segment or topic.']]
    },
    {
      id: 'supply', icon: 'fuel', title: 'Fuel Supply Chain Development',
      tagline: 'Design the links that make reliable supply possible.',
      img: 'https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?auto=format&fit=crop&w=900&q=80',
      meta: { Format: 'Project-based', Duration: '4 to 9 months', 'Best for': 'Producers, ports' },
      lead: 'We map and build the production, logistics and bunkering links between fuel and customer.',
      body: ['A fuel is only useful if it can be delivered where and when it is needed. We help partners assess supply options and shape practical, scalable supply models.',
        'By bringing producers, logistics providers and terminals into the same conversation early, we reduce friction later.'],
      includes: ['Supply and demand assessment', 'Logistics route analysis', 'Terminal and port readiness review', 'Supplier and buyer introductions', 'Supply model options', 'Implementation roadmap'],
      process: [['Assess', 'Review volumes, locations and existing infrastructure.'],
      ['Model', 'Compare supply options and select the best fit.'],
      ['Align', 'Bring producers, logistics and ports into agreement.'],
      ['Roadmap', 'Set out steps, owners and timing for delivery.']],
      benefits: [['route', 'Clear pathway', 'A realistic route from production to use.'],
      ['shield-check', 'Lower risk', 'Issues surface early, before commitments.'],
      ['gauge', 'Scalable supply', 'Models built to grow with demand.']],
      ideal: ['Producers', 'Ports & terminals', 'Logistics providers', 'Fuel buyers'],
      faqs: [['Do you operate the supply chain?', 'No. We design, convene and advise. Operations stay with the partners involved.'],
      ['Can this cover multiple ports?', 'Yes. Scope can include several locations and routes.']]
    },
    {
      id: 'projects', icon: 'git-branch', title: 'Project Origination & Structuring',
      tagline: 'Turn complex opportunities into execution-ready projects.',
      img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80',
      meta: { Format: 'Advisory', Duration: '3 to 8 months', 'Best for': 'Developers, investors' },
      lead: 'We shape ideas into commercially viable projects that investors and partners can back.',
      body: ['Good ideas stall when the structure is unclear. We help define scope, roles, commercial terms and financing routes so a concept can move toward delivery.',
        'Our approach brings together investors, lenders, industrial companies and technology providers around a clear, well-structured proposition.'],
      includes: ['Opportunity screening', 'Commercial structuring', 'Stakeholder and partner alignment', 'Financing route options', 'Project documentation support', 'Execution planning'],
      process: [['Screen', 'Test the opportunity against commercial and technical criteria.'],
      ['Structure', 'Define scope, roles, terms and financing options.'],
      ['Align', 'Bring in partners, investors and lenders.'],
      ['Execute', 'Prepare for delivery with a clear plan.']],
      benefits: [['target', 'Clarity', 'A clear proposition everyone understands.'],
      ['landmark', 'Financeable', 'Structured to attract capital.'],
      ['rocket', 'Faster progress', 'Less time lost on unclear scope.']],
      ideal: ['Project developers', 'Investors', 'Lenders', 'Industrial companies'],
      faqs: [['Do you provide funding?', 'No. We help structure projects and connect you to potential partners and capital.'],
      ['How early can we start?', 'As early as the concept stage.']]
    },
    {
      id: 'partnerships', icon: 'handshake', title: 'Strategic Partnerships & Matchmaking',
      tagline: 'Connect with the right counterparts across the value chain.',
      img: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=900&q=80',
      meta: { Format: 'Introductions', Duration: '1 to 6 months', 'Best for': 'All members' },
      lead: 'We introduce the people and organisations who can help you move forward.',
      body: ['The right partner can change the pace of a project. We use our network to match organisations with complementary needs and capabilities.',
        'Each introduction is prepared in advance so conversations start with context, trust and a clear purpose.'],
      includes: ['Needs and capability profiling', 'Curated introductions', 'Meeting preparation and facilitation', 'Member roundtables', 'Partnership framing support', 'Follow-up and tracking'],
      process: [['Profile', 'Clarify what you offer and what you are looking for.'],
      ['Match', 'Identify suitable counterparts in the network.'],
      ['Introduce', 'Facilitate prepared, purposeful first meetings.'],
      ['Follow up', 'Support next steps and track outcomes.']],
      benefits: [['network', 'Quality network', 'Introductions to relevant decision makers.'],
      ['clock', 'Saves time', 'Skip the cold outreach.'],
      ['handshake', 'Trusted start', 'Warm, well-prepared conversations.']],
      ideal: ['Members', 'Start-ups', 'Shipping companies', 'Technology providers'],
      faqs: [['Is membership required?', 'Matchmaking is primarily a member service. Contact us to discuss other options.'],
      ['Are introductions confidential?', 'Yes. We only share information with your agreement.']]
    },
    {
      id: 'advisory', icon: 'flask-conical', title: 'Research, Standards & Technical Advisory',
      tagline: 'Evidence and guidance for confident decisions.',
      img: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80',
      meta: { Format: 'Advisory & reports', Duration: '2 to 6 months', 'Best for': 'Technical teams' },
      lead: 'We provide reliable technical insight and shared standards that support decision making.',
      body: ['Decisions are easier when everyone works from the same facts. We gather research, coordinate technical working groups and share guidance that reflects real-world conditions.',
        'Our advisory work helps teams understand options, risks and best practice without starting from scratch.'],
      includes: ['Literature and data reviews', 'Technical working groups', 'Best-practice guidance', 'Standards and safety discussions', 'Briefing papers', 'Expert Q&A sessions'],
      process: [['Scope', 'Agree the questions that need answers.'],
      ['Research', 'Collect and review relevant data and expertise.'],
      ['Consult', 'Test findings with technical experts.'],
      ['Share', 'Deliver clear, usable guidance.']],
      benefits: [['book-open', 'Reliable evidence', 'Facts you can base decisions on.'],
      ['shield-check', 'Reduced risk', 'Informed choices on safety and design.'],
      ['users', 'Shared language', 'Common understanding across partners.']],
      ideal: ['Engineers', 'Operators', 'Regulators', 'Researchers'],
      faqs: [['Are reports public?', 'It depends on the project. We agree distribution with you upfront.'],
      ['Can you support a specific question?', 'Yes. Advisory scope can be tailored to a single topic.']]
    }
  ];

  /* ---------------- helpers ---------------- */
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icons = () => { if (window.lucide) lucide.createIcons(); };
  const pad = n => String(n).padStart(2, '0');

  /* ---------------- card hover spotlight ---------------- */
  cards.forEach(card => {
    card.addEventListener('pointermove', e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------------- build modal shell once ---------------- */
  const modal = document.createElement('div');
  modal.className = 'svc-modal';
  modal.hidden = true;
  modal.innerHTML =
    '<div class="svc-backdrop" data-close></div>' +
    '<div class="svc-dialog" role="dialog" aria-modal="true" aria-labelledby="svcTitle" tabindex="-1">' +
    '<button class="icon-btn svc-close" type="button" data-close aria-label="Close service details"><i data-lucide="x"></i></button>' +
    '<aside class="svc-side" id="svcSide"></aside>' +
    '<div class="svc-right">' +
    '<div class="svc-progress" aria-hidden="true"><span id="svcBar"></span></div>' +
    '<div class="svc-main" id="svcMain"></div>' +
    '<div class="svc-foot" id="svcFoot"></div>' +
    '</div>' +
    '</div>';
  document.body.appendChild(modal);
  const dialog = modal.querySelector('.svc-dialog');
  const side = modal.querySelector('#svcSide'), main = modal.querySelector('#svcMain'),
    foot = modal.querySelector('#svcFoot'), bar = modal.querySelector('#svcBar');

  let index = 0, lastFocus = null, io = null, closing = null;

  /* ---------------- render ---------------- */
  function render(i) {
    const s = SERVICES[i];
    side.innerHTML =
      '<img class="svc-side-img" src="' + esc(s.img) + '" alt="" onerror="this.remove()">' +
      '<span class="svc-side-badge"><i data-lucide="' + s.icon + '"></i></span>' +
      '<div class="svc-side-text">' +
      '<div class="svc-side-count">Service ' + pad(i + 1) + ' / ' + pad(SERVICES.length) + '</div>' +
      '<h2 id="svcTitle">' + esc(s.title) + '</h2>' +
      '<p class="svc-side-tag">' + esc(s.tagline) + '</p>' +
      '</div>' +
      '<dl class="svc-meta">' + Object.entries(s.meta).map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl>';

    main.innerHTML =
      '<section class="svc-sec svc-overview svc-rv" style="--i:0"><h3><i data-lucide="info"></i> Overview</h3>' +
      '<p class="lead">' + esc(s.lead) + '</p>' + s.body.map(p => '<p>' + esc(p) + '</p>').join('') + '</section>' +
      '<section class="svc-sec svc-rv" style="--i:1"><h3><i data-lucide="package-check"></i> What\'s included</h3>' +
      '<ul class="svc-incl">' + s.includes.map(t => '<li><i data-lucide="check-circle-2"></i>' + esc(t) + '</li>').join('') + '</ul></section>' +
      '<section class="svc-sec svc-rv"><h3><i data-lucide="route"></i> How it works</h3>' +
      '<ol class="svc-steps svc-rv">' + s.process.map((p, k) => '<li style="--i:' + k + '"><span class="sn">' + (k + 1) + '</span><div><h4>' + esc(p[0]) + '</h4><p>' + esc(p[1]) + '</p></div></li>').join('') + '</ol></section>' +
      '<section class="svc-sec svc-rv"><h3><i data-lucide="sparkles"></i> Key benefits</h3>' +
      '<div class="svc-bens">' + s.benefits.map(b => '<div class="svc-ben"><i data-lucide="' + b[0] + '"></i><h4>' + esc(b[1]) + '</h4><p>' + esc(b[2]) + '</p></div>').join('') + '</div></section>' +
      '<section class="svc-sec svc-rv"><h3><i data-lucide="users"></i> Ideal for</h3>' +
      '<div class="svc-tags">' + s.ideal.map(t => '<span>' + esc(t) + '</span>').join('') + '</div></section>' +
      '<section class="svc-sec svc-rv svc-mfaq"><h3><i data-lucide="help-circle"></i> Common questions</h3>' +
      s.faqs.map(f => '<details><summary>' + esc(f[0]) + ' <i data-lucide="chevron-down"></i></summary><p>' + esc(f[1]) + '</p></details>').join('') + '</section>';

    const prev = SERVICES[(i - 1 + SERVICES.length) % SERVICES.length], next = SERVICES[(i + 1) % SERVICES.length];
    foot.innerHTML =
      '<div class="svc-nav">' +
      '<button type="button" data-step="-1" aria-label="Previous service: ' + esc(prev.title) + '"><i data-lucide="arrow-left"></i><span>Previous</span></button>' +
      '<button type="button" data-step="1" aria-label="Next service: ' + esc(next.title) + '"><span>Next</span><i data-lucide="arrow-right"></i></button>' +
      '</div>' +
      '<a class="btn btn-primary btn-orbit" href="contact.html?service=' + encodeURIComponent(s.id) + '">Request this service <span class="ico"><i data-lucide="arrow-right"></i></span></a>';

    icons();
    main.scrollTop = 0; bar.style.transform = 'scaleX(0)';
    observe();
  }

  /* reveal items as they scroll inside the modal (once) */
  function observe() {
    if (io) io.disconnect();
    const items = main.querySelectorAll('.svc-rv');
    if (reduce) { items.forEach(el => el.classList.add('in')); return; }
    io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: main, threshold: .15 });
    items.forEach(el => io.observe(el));
  }

  main.addEventListener('scroll', () => {
    const max = main.scrollHeight - main.clientHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? main.scrollTop / max : 0) + ')';
  }, { passive: true });

  /* ---------------- open / close ---------------- */
  function lockScroll(on) {
    const root = document.documentElement;
    if (on) {
      const sb = window.innerWidth - root.clientWidth;
      root.classList.add('svc-lock');
      if (sb > 0) root.style.paddingRight = sb + 'px';
    } else {
      root.classList.remove('svc-lock'); root.style.paddingRight = '';
    }
  }

  function open(id, origin) {
    const i = SERVICES.findIndex(s => s.id === id);
    if (i < 0) return;
    clearTimeout(closing);
    index = i; lastFocus = origin || document.activeElement;
    render(index);
    if (origin && origin.getBoundingClientRect) {
      const r = origin.getBoundingClientRect();
      dialog.style.setProperty('--ox', Math.round(r.left + r.width / 2) + 'px');
      dialog.style.setProperty('--oy', Math.round(r.top + r.height / 2) + 'px');
    }
    modal.hidden = false; lockScroll(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('is-open'); dialog.focus({ preventScroll: true });
    }));
    history.replaceState(null, '', '#svc-' + id);
  }

  function close() {
    if (modal.hidden) return;
    modal.classList.remove('is-open');
    closing = setTimeout(() => {
      modal.hidden = true; lockScroll(false);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }, reduce ? 0 : 380);
    history.replaceState(null, '', location.pathname + location.search);
  }

  function step(d) {
    index = (index + d + SERVICES.length) % SERVICES.length;
    history.replaceState(null, '', '#svc-' + SERVICES[index].id);
    if (reduce) { render(index); return; }
    main.classList.add('is-switching');
    setTimeout(() => { render(index); main.classList.remove('is-switching'); }, 220);
  }

  /* ---------------- events ---------------- */
  cards.forEach(card => {
    const btn = card.querySelector('.svc-open');
    const go = () => open(card.dataset.service, card);
    btn.addEventListener('click', go);
  });

  modal.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return close();
    const st = e.target.closest('[data-step]');
    if (st) step(+st.dataset.step);
  });

  document.addEventListener('keydown', e => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); return close(); }
    if (e.key === 'ArrowRight' && !e.target.closest('input,textarea,summary')) step(1);
    if (e.key === 'ArrowLeft' && !e.target.closest('input,textarea,summary')) step(-1);
    if (e.key === 'Tab') {            /* focus trap */
      const f = [...dialog.querySelectorAll('a[href],button:not([disabled]),summary,[tabindex]:not([tabindex="-1"])')].filter(el => el.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* deep link: services.html#svc-supply opens that service on load */
  const m = location.hash.match(/^#svc-(\w+)$/);
  if (m) setTimeout(() => open(m[1], null), 400);
})();