(function () {
  const container = document.getElementById('africa-scroll-nav');
  if (!container) return;

  // ЗАМЕНИ ЗАГЛУШКИ #rec НА РЕАЛЬНЫЕ ID БЛОКОВ TILDA: #rec123456789
  const COUNTRY_TARGETS = {
    SDN: '#rec', // Судан
    COD: '#rec', // ДР Конго
    SOM: '#rec', // Сомали
    MLI: '#rec', // Мали
    NER: '#rec', // Нигер
    BFA: '#rec'  // Буркина-Фасо
  };

  const PROJECT_ISO = new Set(Object.keys(COUNTRY_TARGETS));
  const NORTH_AFRICA_ISO = new Set(['DZA', 'EGY', 'LBY', 'MAR', 'TUN', 'ESH']);

  const RU_NAMES = {
    DZA: 'Алжир', AGO: 'Ангола', BEN: 'Бенин', BWA: 'Ботсвана', BFA: 'Буркина-Фасо',
    BDI: 'Бурунди', CMR: 'Камерун', CPV: 'Кабо-Верде', CAF: 'ЦАР', TCD: 'Чад',
    COM: 'Коморы', COG: 'Респ. Конго', COD: 'ДР Конго', CIV: 'Кот-д’Ивуар', DJI: 'Джибути',
    EGY: 'Египет', GNQ: 'Экв. Гвинея', ERI: 'Эритрея', SWZ: 'Эсватини', ETH: 'Эфиопия',
    GAB: 'Габон', GMB: 'Гамбия', GHA: 'Гана', GIN: 'Гвинея', GNB: 'Гвинея-Бисау',
    KEN: 'Кения', LSO: 'Лесото', LBR: 'Либерия', LBY: 'Ливия', MDG: 'Мадагаскар',
    MWI: 'Малави', MLI: 'Мали', MRT: 'Мавритания', MUS: 'Маврикий', MAR: 'Марокко',
    MOZ: 'Мозамбик', NAM: 'Намибия', NER: 'Нигер', NGA: 'Нигерия', RWA: 'Руанда',
    STP: 'Сан-Томе и Принсипи', SEN: 'Сенегал', SYC: 'Сейшелы', SLE: 'Сьерра-Леоне',
    SOM: 'Сомали', ZAF: 'ЮАР', SSD: 'Южный Судан', SDN: 'Судан', TZA: 'Танзания',
    TGO: 'Того', TUN: 'Тунис', UGA: 'Уганда', ZMB: 'Замбия', ZWE: 'Зимбабве',
    ESH: 'Западная Сахара'
  };

  const LABEL_OFFSETS = {
    CPV: [-10, 0], GMB: [-7, 0], GNB: [-4, 7], GNQ: [8, 10], STP: [-6, 12],
    COM: [12, 4], MUS: [12, 8], SYC: [18, -4], LSO: [10, 8], SWZ: [14, 2],
    RWA: [10, -8], BDI: [13, 5], DJI: [16, 0]
  };

  const scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : window.location.href;
  const geojsonUrl = new URL('countries.geojson', scriptUrl).href;

  container.innerHTML = `
    <div class="af-map-sticky">
      <div class="af-map-copy" aria-live="polite">
        <p class="af-map-copy__text af-map-copy__text--ssa">«Африка южнее Сахары» — иногда можно встретить название «Чёрная Африка» — часть континента к югу от Сахары. Сахара — пустыня на севере Африки.</p>
        <p class="af-map-copy__text af-map-copy__text--project">Нажмите на страну, чтобы перейти к её разделу.</p>
      </div>
      <div class="af-map-canvas" aria-label="Карта Африки"></div>
    </div>
  `;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (window.d3) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function getISO(feature) {
    const p = feature.properties || {};
    return p.iso_a3 || p.ISO_A3 || p.ADM0_A3 || p['ISO3166-1-Alpha-3'] || p.shapeGroup || p.shapeISO || '';
  }

  function isSSA(iso) {
    return iso && !NORTH_AFRICA_ISO.has(iso);
  }

  function scrollToTarget(selector) {
    if (!selector || selector === '#rec') return;
    const target = document.querySelector(selector);
    if (!target) return;
    const y = target.getBoundingClientRect().top + window.pageYOffset - 12;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  function setStage(stage) {
    container.classList.toggle('is-stage-0', stage === 0);
    container.classList.toggle('is-stage-1', stage === 1);
    container.classList.toggle('is-stage-2', stage === 2);
  }

  function updateStageByScroll() {
    const rect = container.getBoundingClientRect();
    const total = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.min(1, Math.max(0, -rect.top / total));

    if (progress < 0.34) setStage(0);
    else if (progress < 0.68) setStage(1);
    else setStage(2);
  }

  function drawMap(geojson) {
    const canvas = container.querySelector('.af-map-canvas');
    const width = Math.max(320, canvas.clientWidth || 900);
    const height = Math.max(380, canvas.clientHeight || 720);

    canvas.innerHTML = '';

    const svg = d3.select(canvas)
      .append('svg')
      .attr('class', 'af-map-svg')
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'img')
      .attr('aria-label', 'Карта Африки');

    const projection = d3.geoMercator().fitExtent([[12, 12], [width - 12, height - 12]], geojson);
    const path = d3.geoPath(projection);

    svg.append('g')
      .attr('class', 'af-countries')
      .selectAll('path')
      .data(geojson.features)
      .join('path')
      .attr('class', d => {
        const iso = getISO(d);
        return ['af-country', isSSA(iso) ? 'is-ssa' : '', PROJECT_ISO.has(iso) ? 'is-project' : ''].join(' ').trim();
      })
      .attr('d', path)
      .attr('data-iso', d => getISO(d))
      .attr('data-name', d => RU_NAMES[getISO(d)] || (d.properties && d.properties.name) || '')
      .attr('data-target', d => COUNTRY_TARGETS[getISO(d)] || '')
      .on('click', function (event, d) {
        if (!container.classList.contains('is-stage-2')) return;
        const iso = getISO(d);
        if (!PROJECT_ISO.has(iso)) return;
        scrollToTarget(COUNTRY_TARGETS[iso]);
      });

    const labelGroup = svg.append('g').attr('class', 'af-labels');

    labelGroup.selectAll('text')
      .data(geojson.features)
      .join('text')
      .attr('class', d => {
        const iso = getISO(d);
        return ['af-label', isSSA(iso) ? 'is-ssa' : '', PROJECT_ISO.has(iso) ? 'is-project' : ''].join(' ').trim();
      })
      .attr('x', d => {
        const iso = getISO(d);
        const c = path.centroid(d);
        const off = LABEL_OFFSETS[iso] || [0, 0];
        return c[0] + off[0];
      })
      .attr('y', d => {
        const iso = getISO(d);
        const c = path.centroid(d);
        const off = LABEL_OFFSETS[iso] || [0, 0];
        return c[1] + off[1];
      })
      .text(d => RU_NAMES[getISO(d)] || '');

    updateStageByScroll();
  }

  Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js'),
    fetch(geojsonUrl).then(r => {
      if (!r.ok) throw new Error('Не удалось загрузить countries.geojson');
      return r.json();
    })
  ]).then(([, geojson]) => {
    drawMap(geojson);
    window.addEventListener('scroll', updateStageByScroll, { passive: true });
    window.addEventListener('resize', () => drawMap(geojson));
    updateStageByScroll();
  }).catch((error) => {
    const canvas = container.querySelector('.af-map-canvas') || container;
    canvas.innerHTML = `<div class="af-map-error">Карта не загрузилась. Проверьте, что рядом с africa-map.js лежит файл countries.geojson и что GitHub Pages включён.<br><br>${String(error.message || error)}</div>`;
  });
})();
