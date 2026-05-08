(function () {
  const currentScript = document.currentScript;
  const baseUrl = new URL('.', currentScript.src).href;
  const mount = document.getElementById('africa-map-loader') || document.getElementById('africa-scroll-nav');

  if (!mount) {
    console.warn('[Africa map] Не найден контейнер #africa-map-loader или #africa-scroll-nav');
    return;
  }

  fetch(baseUrl + 'africa-map.html', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Не удалось загрузить africa-map.html');
      return response.text();
    })
    .then(html => {
      mount.innerHTML = html;
      initAfricaScrollMap();
    })
    .catch(error => {
      console.error('[Africa map]', error);
    });

  function initAfricaScrollMap() {
    const root = document.getElementById('africa-scroll-nav');
    if (!root) return;

    const selectedText = root.querySelector('.af-scroll-map__selected');

    function setStage(stage) {
      root.classList.toggle('is-ssa', stage === 1);
      root.classList.toggle('is-project', stage === 2);
    }

    function updateStageByScroll() {
      const rect = root.getBoundingClientRect();
      const scrollable = Math.max(1, root.offsetHeight - window.innerHeight);
      const passed = Math.min(Math.max(-rect.top, 0), scrollable);
      const progress = passed / scrollable;

      if (progress < 0.30) setStage(0);
      else if (progress < 0.62) setStage(1);
      else setStage(2);
    }

    updateStageByScroll();
    window.addEventListener('scroll', updateStageByScroll, { passive: true });
    window.addEventListener('resize', updateStageByScroll);

    function findTarget(selector) {
      if (!selector) return null;
      const id = selector.charAt(0) === '#' ? selector.slice(1) : selector;
      return document.getElementById(id) || document.querySelector(selector);
    }

    function scrollToTarget(selector) {
      if (!selector || selector === '#rec') {
        console.warn('[Africa map] У страны не указан настоящий data-target:', selector);
        return;
      }

      const id = selector.charAt(0) === '#' ? selector.slice(1) : selector;
      const target = findTarget(selector);

      if (target) {
        const y = target.getBoundingClientRect().top + window.pageYOffset - 20;
        window.scrollTo({ top: y, behavior: 'smooth' });
        return;
      }

      // Fallback для Tilda: если блок ещё не найден JS-ом, меняем hash.
      // Tilda обычно умеет прокручивать к собственным #rec-блокам по hash.
      console.warn('[Africa map] JS не нашёл блок, пробую переход через hash:', selector);
      window.location.hash = id;
    }

    // Делегирование на document: работает даже после fetch-подгрузки HTML.
    document.addEventListener('click', function (event) {
      const country = event.target.closest && event.target.closest('#africa-scroll-nav .af-country.is-project');
      if (!country) return;
      event.preventDefault();
      event.stopPropagation();
      scrollToTarget(country.getAttribute('data-target'));
    }, true);

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
        selectedText.textContent = (country.dataset.name || '') + ' — нажмите, чтобы перейти к разделу.';
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
        selectedText.textContent = 'Наведите курсор на страну или нажмите на неё, чтобы перейти к разделу.';
      }
    });
  }
})();
