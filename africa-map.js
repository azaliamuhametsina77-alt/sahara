(function () {
  const currentScript = document.currentScript;
  const baseUrl = new URL('.', currentScript.src).href;
  const mount = document.getElementById('africa-map-loader') || document.getElementById('africa-scroll-nav');

  function showError(message) {
    if (!mount) return;
    mount.innerHTML = '<div style="font-family:Montserrat,Arial,sans-serif;padding:24px;border:1px solid #d99696;color:#212121;background:rgba(217,150,150,.12);border-radius:14px;">Карта не загрузилась: ' + message + '</div>';
  }

  if (!mount) {
    console.warn('[Africa map] Не найден контейнер #africa-map-loader или #africa-scroll-nav');
    return;
  }

  // CSS подключается автоматически, чтобы в Tilda было меньше мест для ошибки.
  if (!document.querySelector('link[data-africa-map-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = baseUrl + 'africa-map.css?v=' + Date.now();
    link.setAttribute('data-africa-map-css', '1');
    document.head.appendChild(link);
  }

  fetch(baseUrl + 'africa-map.html?v=' + Date.now(), { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('не удалось загрузить africa-map.html, статус ' + response.status);
      return response.text();
    })
    .then(html => {
      mount.innerHTML = html;
      initAfricaScrollMap();
    })
    .catch(error => {
      console.error('[Africa map]', error);
      showError(error.message || String(error));
    });

  function initAfricaScrollMap() {
  const root = document.getElementById('africa-scroll-nav');
  if (!root) {
    showError('в africa-map.html не найден #africa-scroll-nav');
    return;
  }

  const isMobile = () => window.innerWidth <= 980;

  // ---------- Общие элементы ----------
  const selectedText = root.querySelector('.af-scroll-map__default-text .af-scroll-map__selected');
  const stageButtons = root.querySelectorAll('.af-scroll-map__stage-btn');

  // ---------- Десктопная логика (без изменений) ----------
  function setStageDesktop(stage) {
    root.classList.toggle('is-ssa', stage === 1);
    root.classList.toggle('is-project', stage === 2);
  }

  function updateStageByScroll() {
    if (isMobile()) return;
    const rect = root.getBoundingClientRect();
    const scrollable = Math.max(1, root.offsetHeight - window.innerHeight);
    const passed = Math.min(Math.max(-rect.top, 0), scrollable);
    const progress = passed / scrollable;

    if (progress < 0.30) setStageDesktop(0);
    else if (progress < 0.62) setStageDesktop(1);
    else setStageDesktop(2);
  }

  // ---------- Мобильная логика (свайп + клик) ----------
  function initMobile() {
    window.removeEventListener('scroll', updateStageByScroll);
    window.removeEventListener('resize', updateStageByScroll);
    root.classList.remove('is-sahel-hover');

    const caption = root.querySelector('.af-scroll-map__caption');
    let currentStage = 0;

    function setStageMobile(stage) {
      stage = Math.min(2, Math.max(0, stage));
      root.classList.toggle('is-ssa', stage === 1);
      root.classList.toggle('is-project', stage === 2);
      currentStage = stage;

      stageButtons.forEach(btn => {
        const btnStage = parseInt(btn.dataset.stage, 10);
        btn.classList.toggle('active', btnStage === stage);
      });
    }

    stageButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const stage = parseInt(btn.dataset.stage, 10);
        setStageMobile(stage);
      });
    });

    let touchStartX = 0;
    let touchStartY = 0;

    caption.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    caption.addEventListener('touchend', (e) => {
      if (touchStartX === 0) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (absDx > absDy && absDx > 40) {
        if (dx > 0) {
          setStageMobile(currentStage - 1);
        } else {
          setStageMobile(currentStage + 1);
        }
      }
      touchStartX = 0;
    });

    // --- Клик по стране: подсказка + навигация ---
    const svg = root.querySelector('.af-scroll-map__svg');
    let activeTooltip = null;

    function removeTooltip() {
      if (activeTooltip) {
        activeTooltip.remove();
        activeTooltip = null;
      }
    }

    function showTooltip(country, name) {
      removeTooltip();
      const tooltip = document.createElement('div');
      tooltip.className = 'af-country-tooltip';
      tooltip.textContent = name;
      svg.style.position = 'relative';
      svg.appendChild(tooltip);

      const rect = country.getBoundingClientRect();
      const svgRect = svg.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - svgRect.left;
      const y = rect.top - svgRect.top - 8;
      tooltip.style.left = x + 'px';
      tooltip.style.top = y + 'px';

      activeTooltip = tooltip;
    }

    function handleCountryClick(event) {
      const country = event.target.closest('.af-country');
      if (!country) {
        removeTooltip();
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const name = country.dataset.name || '';
      showTooltip(country, name);

      if (country.classList.contains('is-project') && country.dataset.target) {
        const targetEl = document.querySelector(country.dataset.target);
        if (targetEl) {
          const y = targetEl.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }
    }

    svg.addEventListener('click', handleCountryClick);

    document.addEventListener('click', function(e) {
      if (!e.target.closest('.af-country')) {
        removeTooltip();
      }
    });

    setStageMobile(0);
  }

  // ---------- Выбор режима ----------
  if (isMobile()) {
    initMobile();
  } else {
    updateStageByScroll();
    window.addEventListener('scroll', updateStageByScroll, { passive: true });
    window.addEventListener('resize', updateStageByScroll);

    function isSahelCountry(country) {
      return country && country.classList.contains('is-sahel');
    }

    root.addEventListener('mouseover', function (event) {
      const country = event.target.closest && event.target.closest('.af-country.is-project');
      if (!country) return;
      if (isSahelCountry(country)) {
        root.classList.add('is-sahel-hover');
        return;
      }
      root.classList.remove('is-sahel-hover');
      if (selectedText) {
        selectedText.textContent = (country.dataset.name || '') + ' — нажмите, чтобы перейти к конкретному разделу.';
      }
    });

    root.addEventListener('mouseout', function (event) {
      const country = event.target.closest && event.target.closest('.af-country.is-project');
      if (!country) return;
      const related = event.relatedTarget;
      if (related && related.closest && related.closest('.af-country.is-sahel') && isSahelCountry(country)) {
        return;
      }
      root.classList.remove('is-sahel-hover');
      if (selectedText) {
        selectedText.textContent = 'Наведите курсор на страну или нажмите на нее, чтобы перейти к конкретному разделу. Либо продолжайте листать дальше.';
      }
    });

    document.addEventListener('click', function (event) {
      const country = event.target.closest && event.target.closest('#africa-scroll-nav .af-country.is-project');
      if (!country) return;
      event.preventDefault();
      event.stopPropagation();
      const targetSelector = country.getAttribute('data-target');
      if (targetSelector && targetSelector !== '#rec') {
        const target = document.querySelector(targetSelector);
        if (target) {
          const y = target.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({ top: y, behavior: 'smooth' });
        } else {
          window.location.hash = targetSelector.slice(1);
        }
      }
    }, true);
  }
}
})();
