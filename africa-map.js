(function () {
  const currentScript = document.currentScript;
  const baseUrl = new URL('.', currentScript.src).href;
  const mount = document.getElementById('africa-map-loader') || document.getElementById('africa-scroll-nav');

  if (!mount) return;

  fetch(baseUrl + 'africa-map.html')
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

  updateStageByScroll();
  window.addEventListener('scroll', updateStageByScroll, { passive: true });
  window.addEventListener('resize', updateStageByScroll);

  function scrollToTarget(selector) {
    if (!selector) return;
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
  }
})();
