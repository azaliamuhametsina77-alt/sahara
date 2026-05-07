(function () {
  const root = document.getElementById('africa-scroll-nav');
  if (!root) return;

  const BASE_URL = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/\/[^\/]*$/, '/')
    : './';

  root.className = 'af-scroll-map';
  root.innerHTML = `
    <div class="af-scroll-map__sticky">
      <div class="af-scroll-map__svg-holder" aria-hidden="false"></div>
      <aside class="af-scroll-map__caption" aria-live="polite">
        <div class="af-scroll-map__caption-ssa">
          <div class="af-scroll-map__eyebrow">Регион</div>
          <div class="af-scroll-map__text">Африка южнее Сахары — часть континента к югу от Сахары. Сахара — пустыня на севере Африки. Иногда можно встретить название «Чёрная Африка».</div>
        </div>
        <div class="af-scroll-map__caption-project">
          <div class="af-scroll-map__eyebrow">Страны проекта</div>
          <div class="af-scroll-map__text">Судан, ДР Конго, Сомали, Мали, Нигер и Буркина-Фасо.</div>
          <div class="af-scroll-map__selected">Наведите курсор на страну или нажмите на неё, чтобы перейти к разделу.</div>
        </div>
      </aside>
    </div>
    <div class="af-scroll-map__step" data-stage="0"></div>
    <div class="af-scroll-map__step" data-stage="1"></div>
    <div class="af-scroll-map__step" data-stage="2"></div>
  `;

  const svgHolder = root.querySelector('.af-scroll-map__svg-holder');

  fetch(BASE_URL + 'africa-map.svg')
    .then(response => {
      if (!response.ok) throw new Error('Не удалось загрузить africa-map.svg');
      return response.text();
    })
    .then(svgText => {
      svgHolder.innerHTML = svgText;
      initMapInteractions();
    })
    .catch(error => {
      console.error('[africa-scroll-nav]', error);
      svgHolder.innerHTML = '<div style="font-family:Montserrat,Arial,sans-serif;font-size:14px;color:#777;">Карта не загрузилась. Проверьте, что africa-map.svg лежит рядом с africa-map.js на GitHub Pages.</div>';
    });

  function initMapInteractions() {
    const selectedText = root.querySelector('.af-scroll-map__selected');
    const projectCountries = Array.from(root.querySelectorAll('.af-country.is-project'));

    function setStage(stage) {
      root.classList.toggle('is-ssa', stage === 1);
      root.classList.toggle('is-project', stage === 2);
    }

    function updateStageByScroll() {
      const rect = root.getBoundingClientRect();
      const scrollable = Math.max(1, root.offsetHeight - window.innerHeight);
      const passed = Math.min(Math.max(-rect.top, 0), scrollable);
      const progress = passed / scrollable;

      if (progress < 0.30) {
        setStage(0);
      } else if (progress < 0.62) {
        setStage(1);
      } else {
        setStage(2);
      }
    }

    function scrollToTarget(selector) {
      if (!selector || selector === '#rec') return;
      const target = document.querySelector(selector);
      if (!target) return;
      const y = target.getBoundingClientRect().top + window.pageYOffset - 20;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }

    projectCountries.forEach(country => {
      country.addEventListener('mouseenter', () => {
        if (!root.classList.contains('is-project') || !selectedText) return;
        selectedText.textContent = (country.dataset.name || '') + ' — нажмите, чтобы перейти к разделу.';
      });

      country.addEventListener('mouseleave', () => {
        if (!selectedText) return;
        selectedText.textContent = 'Наведите курсор на страну или нажмите на неё, чтобы перейти к разделу.';
      });

      country.addEventListener('click', () => {
        if (!root.classList.contains('is-project')) return;
        scrollToTarget(country.dataset.target);
      });
    });

    updateStageByScroll();
    window.addEventListener('scroll', updateStageByScroll, { passive: true });
    window.addEventListener('resize', updateStageByScroll);
  }
})();
