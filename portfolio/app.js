(() => {
  'use strict';
  const projects = window.PORTFOLIO_PROJECTS;
  const media = window.PORTFOLIO_MEDIA;
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const detail = document.querySelector('#detail-content');
  const lightbox = document.querySelector('#lightbox');
  const lightboxImage = document.querySelector('#lightbox-image');
  let activeProject = null;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let returnHash = '#works';
  const esc = (v) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const image = (key, alt, thumb = false, lazy = true) => {
    const a = media[key];
    if (!a) return '';
    return '<img src="' + a[thumb ? 'thumb' : 'src'] + '" alt="' + esc(alt) + '" width="' + a.width + '" height="' + a.height + '" loading="' + (lazy ? 'lazy' : 'eager') + '" decoding="async">';
  };

  function renderGrid(filter = 'all') {
    const visible = projects.filter(p => filter === 'all' || p.category === filter);
    grid.innerHTML = visible.map(p => {
      const featureLabel = p.featured ? '<span class="featured-label">FEATURED PROJECT / 主推项目</span>' : '';
      const proof = p.featured ? '<span class="featured-proof"><span>独立设计与持续迭代</span><span>34 页完整案例</span><span>真实用户反馈</span></span><span class="featured-cta">查看设计过程与成品 <span aria-hidden="true">↗</span></span>' : '';
      const fullCaseLink = p.externalCase ? '<a class="card-case-link" href="' + esc(p.externalCase) + '" onclick="event.stopPropagation()">直接翻完整 34 页案例 <span aria-hidden="true">↗</span></a>' : '';
      const fact = p.facts?.[0] ? '<span class="card-fact"><b>' + esc(p.facts[0][0]) + '</b>' + esc(p.facts[0][1]) + '</span>' : '';
      // 让卡片自己说明"里面还有多少" —— 不用点开也能看到后续内容
      const allItems = (p.sections || []).flatMap(s => s.images || []);
      const coverKeys = new Set(p.cover || []);
      const seenKeys = new Set();
      const thumbs = allItems
        .filter(([k]) => !coverKeys.has(k))
        .filter(([k]) => (seenKeys.has(k) ? false : (seenKeys.add(k), true)))
        .slice(0, 3);
      const totalImgs = new Set(allItems.map(([k]) => k)).size;
      const sectionCount = (p.sections || []).length;
      const thumbStrip = thumbs.length
        ? '<span class="card-thumbs" aria-hidden="true">' + thumbs.map(([k, alt]) => image(k, alt, true)).join('') + '</span>'
        : '';
      const depth = '<span class="card-depth"><b>' + totalImgs + '</b> 张过程图' +
        (sectionCount ? ' · <b>' + sectionCount + '</b> 个小节' : '') +
        (p.externalCase ? ' · <b>34</b> 页完整案例' : '') + '</span>';
      const openCue = '<span class="card-open">点开看完整过程 <span aria-hidden="true">↗</span></span>';
      return '<article class="project-card filter-enter' + (p.compact ? ' compact' : '') + (p.featured ? ' featured' : '') + '" data-category="' + esc(p.category) + '"><span class="card-button-wrap"><button class="card-button" data-project="' + p.id + '" aria-label="查看' + esc(p.title) + '项目详情，共 ' + totalImgs + ' 张图"><span class="card-visual ' + p.coverStyle + '">' + p.cover.map((k, i) => image(k, p.title + '作品预览 ' + (i + 1), true)).join('') + (p.video ? '<span class="play-label">▶ 观看短片 · 02:33</span>' : '') + '</span><span class="card-info">' + featureLabel + '<span class="card-topline"><span class="card-title">' + esc(p.title) + '</span><span class="card-number">' + p.number + '</span></span><span class="card-subtitle">' + esc(p.subtitle) + '</span><span class="card-lede">' + esc(p.intro) + '</span><span class="card-meta">' + esc(p.label) + '</span>' + fact + proof + thumbStrip + depth + openCue + '</span></button>' + fullCaseLink + '</span></article>';
    }).join('');
    document.querySelector('[data-filter="all"] small').textContent = projects.length;
    document.querySelector('.result-count').textContent = visible.length + ' 个项目';
    document.querySelectorAll('[data-filter]').forEach(b => {
      const selected = b.dataset.filter === filter;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    const cards = [...grid.querySelectorAll('.project-card')];
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {rootMargin:'0px 0px -8% 0px'});
      cards.forEach(card => observer.observe(card));
    } else {
      cards.forEach(card => card.classList.add('is-visible'));
    }
  }

  function sectionHTML(section, project) {
    let content = '';
    if (section.layout === 'video') {
      content = '<div class="video-wrap"><video controls playsinline preload="metadata" poster="' + media.a026.src + '" aria-label="画里星芒完整短片，合作作品"><source src="' + project.video + '" type="video/mp4">当前浏览器不支持视频播放，请使用新版 Edge、Chrome 或 Safari。</video></div>';
    } else if (section.layout === 'comparison') {
      content = '<div class="comparison"><div class="compare-stage">' + image(section.images[1][0], section.images[1][1]) + '<img class="compare-original" src="' + media[section.images[0][0]].src + '" alt="原始照片，对比视图左侧" loading="lazy"><span class="compare-divider" aria-hidden="true"></span><span class="compare-tag before">原图</span><span class="compare-tag after">秋季调色</span></div><label class="compare-control" for="compare-range"><span>对比位置</span><input id="compare-range" type="range" min="0" max="100" value="50" aria-label="原图与秋季调色分界位置"><output for="compare-range">50%</output></label></div>';
    } else {
      content = '<div class="detail-images ' + section.layout + '">' + section.images.map(([key, alt]) => '<figure class="detail-image"><button class="image-button" data-image="' + key + '" aria-label="放大查看：' + esc(alt) + '">' + image(key, alt) + '</button><figcaption>' + esc(alt) + '</figcaption></figure>').join('') + '</div>';
    }
    return '<section class="detail-section"><h3>' + esc(section.title) + '</h3>' + (section.text ? '<p>' + esc(section.text) + '</p>' : '') + content + '</section>';
  }

  function openProject(id, updateUrl = true) {
    const project = projects.find(p => p.id === id);
    if (!project || (activeProject?.id === id && dialog.open)) return;
    if (updateUrl) {
      if (!location.hash.startsWith('#project/')) returnHash = location.hash || '#works';
      history.pushState({project: id}, '', '#project/' + id);
    }
    detail.querySelectorAll('video').forEach(v => v.pause());
    if (lightbox.open) lightbox.close();
    activeProject = project;
    lightboxItems = project.sections.flatMap(s => s.layout === 'video' || s.layout === 'comparison' ? [] : s.images);
    const next = projects[(projects.indexOf(project) + 1) % projects.length];
    const fullCase = project.externalCase ? '<details class="full-case-embed" open><summary>完整 34 页设计案例</summary><iframe title="半步五子棋打谱完整 34 页设计案例" src="' + esc(project.externalCase) + '" loading="lazy"></iframe></details>' : '';
    detail.innerHTML = '<header class="detail-head"><p class="eyebrow">' + project.number + ' / ' + esc(project.categoryLabel) + ' · ' + esc(project.status) + '</p><h2 id="detail-title">' + esc(project.title) + '</h2><p class="detail-intro">' + esc(project.intro) + '</p><dl class="detail-facts">' + project.facts.map(([k,v]) => '<div><dt>' + esc(k) + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl></header><div class="detail-story">' + project.story.map(s => '<section><h3>' + esc(s.title) + '</h3><p>' + esc(s.text) + '</p></section>').join('') + '</div>' + project.sections.map(s => sectionHTML(s, project)).join('') + fullCase + '<aside class="detail-note"><strong>作品说明与署名</strong>' + esc(project.note) + '</aside><div class="detail-next"><span>继续浏览 / NEXT</span><button data-project="' + next.id + '">' + esc(next.title) + ' ↗</button></div>';
    if (project.externalCase) {
      const cta = '<div class="detail-cta"><a class="button primary" href="' + esc(project.externalCase) + '" target="_blank" rel="noopener">' + esc(project.externalLabel) + ' <span aria-hidden="true">↗</span></a><span>本页为重点概览，原版 34 页案例保留完整过程。</span></div>';
      detail.querySelector('.detail-intro').insertAdjacentHTML('afterend', cta);
    }
    if (project.stats) {
      detail.querySelector('.detail-facts').insertAdjacentHTML('afterend','<div class="case-stats">'+project.stats.map(([value,label])=>'<div><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>').join('')+'</div>');
    }
    document.body.classList.add('modal-open');
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    document.querySelector('.close-project').focus({preventScroll:true});
    document.title = project.title + ' · 肖振的设计作品集';
  }

  function closeProject(updateUrl = true) {
    if (lightbox.open) lightbox.close();
    detail.querySelectorAll('video').forEach(v => v.pause());
    if (dialog.open) dialog.close();
    activeProject = null;
    document.body.classList.remove('modal-open');
    document.title = '肖振 · 视觉设计与 AI 创作';
    if (updateUrl && location.hash.startsWith('#project/')) history.replaceState({}, '', returnHash);
  }

  function showImage(index) {
    if (!lightboxItems.length) return;
    lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
    const [key, label] = lightboxItems[lightboxIndex];
    lightboxImage.src = media[key].src;
    lightboxImage.alt = label;
    document.querySelector('#lightbox-caption').textContent = label;
    document.querySelector('#lightbox-counter').textContent = (lightboxIndex + 1) + ' / ' + lightboxItems.length;
    document.querySelectorAll('.lightbox-arrow').forEach(b => b.hidden = lightboxItems.length < 2);
    if (!lightbox.open) lightbox.showModal();
  }

  document.addEventListener('click', event => {
    const projectButton = event.target.closest('[data-project]');
    if (projectButton) { openProject(projectButton.dataset.project); return; }
    const filterButton = event.target.closest('[data-filter]');
    if (filterButton) {
      renderGrid(filterButton.dataset.filter);
      if (filterButton.classList.contains('category-card') || filterButton.classList.contains('portal-all')) {
        document.querySelector('#works').scrollIntoView({behavior:'smooth',block:'start'});
      }
      return;
    }
    const imageButton = event.target.closest('[data-image]');
    if (imageButton) { showImage(lightboxItems.findIndex(i => i[0] === imageButton.dataset.image)); }
  });
  document.querySelector('.close-project').addEventListener('click', () => closeProject());
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeProject(); });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeProject();
  });
  document.querySelector('.close-lightbox').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('cancel', event => {event.preventDefault();lightbox.close();});
  document.querySelector('.lightbox-arrow.prev').addEventListener('click', () => showImage(lightboxIndex - 1));
  document.querySelector('.lightbox-arrow.next').addEventListener('click', () => showImage(lightboxIndex + 1));
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') {event.preventDefault();showImage(lightboxIndex - 1);}
    if (event.key === 'ArrowRight') {event.preventDefault();showImage(lightboxIndex + 1);}
  });
  detail.addEventListener('input', event => {
    if (event.target.id !== 'compare-range') return;
    detail.querySelector('.compare-stage').style.setProperty('--split', event.target.value + '%');
    detail.querySelector('.compare-control output').textContent = event.target.value + '%';
  });
  function moveComparison(event) {
    const stage = event.target.closest('.compare-stage');
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    const value = Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 100)));
    stage.style.setProperty('--split', value + '%');
    detail.querySelector('#compare-range').value = value;
    detail.querySelector('.compare-control output').textContent = value + '%';
  }
  detail.addEventListener('pointerdown', event => {
    const stage = event.target.closest('.compare-stage');
    if (!stage) return;
    stage.setPointerCapture(event.pointerId);
    moveComparison(event);
  });
  detail.addEventListener('pointermove', event => {
    const stage = event.target.closest('.compare-stage');
    if (stage && stage.hasPointerCapture(event.pointerId)) moveComparison(event);
  });
  function syncHash() {
    const match = location.hash.match(/^#project\/([a-z0-9-]+)$/);
    if (match && projects.some(p => p.id === match[1])) openProject(match[1], false);
    else if (dialog.open) closeProject(false);
  }
  window.addEventListener('popstate', syncHash);
  window.addEventListener('hashchange', syncHash);
  renderGrid();
  syncHash();
})();
