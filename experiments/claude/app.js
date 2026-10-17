/* Bootstrap: event delegation, input binding, reader timeline, simulator, QA entry points. */
(function () {
  'use strict';
  var App = window.App, U = App.util, state = App.state, A = App.actions;
  var params = new URLSearchParams(window.location.search);

  /* ---------- back navigation ---------- */
  function backScreen(s) {
    var prev = {
      account: 'services', favorites: 'login', placeAdd: 'favorites', activities: state.editingActivities ? 'home' : 'favorites', progress: 'activities', services: 'progress', serviceSearch: 'services', permissions: 'account',
      homePlace: 'home', departureNotice: 'home', route: state.journeyStarted ? 'activityStart' : 'home', routeConfirm: 'route', mapApps: 'route', journeyActivity: 'routeConfirm', activityStart: 'journeyActivity',
      readingLoading: 'activityStart', millie: 'activityStart', transferRecord: 'millie', transferSaved: 'transferRecord', boarding: 'transferSaved', lockScreen: 'boarding',
      boardingNotice: 'lockScreen', resume: 'lockScreen', arrivalNotice: 'resume', arrival: 'resume', record: 'arrival', result: 'home', calendar: 'home', end: 'home'
    };
    return prev[s] || 'home';
  }
  A.back = function () { App.go(backScreen(state.screen)); };
  A['close-modal'] = function () { App.closeModal(); };
  A.noop = function () {};
  A.reset = function () {
    if (window.confirm('이 기기에 저장된 프로토타입 데이터를 모두 지우고 처음부터 시작할까요?')) { App.closeModal(); App.resetAll(); App.toast('초기 상태로 돌아왔습니다.'); }
  };

  /* ---------- delegated events ---------- */
  document.addEventListener('click', function (event) {
    var target = event.target.closest('[data-action]');
    if (!target) return;
    if (target.hasAttribute('data-scrim') && event.target !== target) return; // only a tap on the dim area closes a sheet
    var name = target.dataset.action;
    if (name === 'noop') { return; }
    var fn = A[name];
    if (!fn) return;
    event.preventDefault();
    fn(target, event);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.dataset && event.target.dataset.bind === 'loginPassword') { event.preventDefault(); A['login-existing'](); }
    if (event.key === 'Escape') {
      var scrim = document.querySelector('[data-scrim]'); if (scrim) { var fn = A[scrim.dataset.action]; if (fn) fn(scrim); }
    }
  });

  function bindSet(path, value) {
    if (path === 'photoFile') return;
    if (path === 'autoLogin') { state.autoLogin = Boolean(value); App.save(); return; }
    var parts = path.split('.'), obj = state;
    for (var i = 0; i < parts.length - 1; i++) { if (!obj[parts[i]]) obj[parts[i]] = {}; obj = obj[parts[i]]; }
    obj[parts[parts.length - 1]] = value;
    App.save();
    if (path === 'serviceQuery') App.refreshServiceSearch();
    if (path === 'homePlaceQuery') { state.homePlaceChoice = ''; App.refreshHomePlaceResults(); }
    if (state.screen === 'progress' && path.indexOf('progressItems.') === 0) {
      var p = state.progressItems, next = document.querySelector('[data-action="to-services"]');
      if (next) next.textContent = (p.bookOn || p.ottOn || p.workOn || p.bookTitle || p.ottTitle || p.workTitle) ? '다음' : '건너뛰기';
    }
  }
  document.addEventListener('input', function (event) {
    var el = event.target; if (!el.dataset || !el.dataset.bind || el.type === 'file') return;
    bindSet(el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
  });
  document.addEventListener('change', function (event) {
    var el = event.target; if (!el.dataset || !el.dataset.bind) return;
    if (el.dataset.bind === 'photoFile' && el.files && el.files[0]) {
      var file = el.files[0];
      if (file.size > 2 * 1024 * 1024) { App.toast('사진은 2MB 이하로 선택해 주세요.'); el.value = ''; return; }
      var reader = new FileReader();
      reader.onload = function () { state.photo = reader.result; state.recordPhotoSheet = false; state.recordPhotoOpen = false; App.save(); App.render(); App.toast('사진을 선택했어요.'); };
      reader.readAsDataURL(file);
    } else if (el.type === 'checkbox') bindSet(el.dataset.bind, el.checked);
  });
  window.addEventListener('beforeunload', function () { App.save(); });

  /* ---------- reading clock (compressed test time) ----------
     While the reading screen stays put, only the Dynamic Island changes:
       활동 중 → 활동 중 · 환승 3분 → 2분 → 1분 → 곧 환승해요 → (transfer passes) → 활동 중 · 도착 3분 … → 곧 도착해요 → 도착 감지
     Stopping (■) or the simulator buttons can interrupt at any time. If nobody interacts, the clock still moves on, so there is no dead end. */
  var AUTO = params.get('auto') !== '0';
  var SPEED = Number(params.get('speed')) > 0 ? Number(params.get('speed')) : 1; // QA only: ?speed=4 plays the clock 4× faster
  var PHASES = ['active', '3', '2', '1', 'soon'];
  var DWELL = { active: 3500, '3': 4500, '2': 4500, '1': 4500, soon: 7000 };
  function onReader(s) { return s === 'millie' || s === 'resume'; }
  function tick() {
    var screen = state.screen;
    if (!AUTO || !onReader(screen)) return;
    clearTimeout(App.timers.reader);
    App.timers.reader = setTimeout(function () { if (state.screen === screen) advance(); }, DWELL[state.readerPhase || 'active'] / SPEED);
  }
  function advance() {
    var i = PHASES.indexOf(state.readerPhase || 'active');
    if (i < PHASES.length - 1) state.readerPhase = PHASES[i + 1];
    else if (state.readerTarget !== 'destination') {
      // the transfer announcement was ignored: the user kept reading, boarding is detected on its own and the trip goes on
      state.readerTarget = 'destination'; state.transferHandled = true; state.readerPhase = 'active';
      App.toast('환승 지점을 지났어요. 계속 읽는 중이에요.');
    } else { App.buildSummary(); App.go('arrivalNotice'); return; } // destination reached → arrival flow
    App.save(); App.renderIsland(); tick();
  }
  App.restartReaderClock = function () { clearTimeout(App.timers.reader); tick(); };
  App.hooks.render.push(function (screen) {
    clearTimeout(App.timers.flow);
    if (onReader(screen)) { if (App.timers.readerScreen !== screen) { App.timers.readerScreen = screen; App.restartReaderClock(); } return; }
    clearTimeout(App.timers.reader); App.timers.readerScreen = null;
    if (!AUTO) return;
    var delay = 0, next = null;
    if (screen === 'lockScreen') { delay = 6000 / SPEED; next = function () { App.go('boardingNotice'); }; }
    else if (screen === 'arrivalNotice') { delay = 9000 / SPEED; next = function () { A['show-arrival-summary'](); }; }
    if (next) App.timers.flow = setTimeout(function () { if (state.screen === screen) next(); }, delay);
  });

  /* ---------- keep the 402 × 874 frame fully visible on short desktop windows ---------- */
  if (params.get('bare') === '1') document.body.classList.add('bare'); // QA view: frame only, no workbench
  function fitDevice() {
    var device = document.getElementById('device');
    if (document.body.classList.contains('bare')) { device.style.transform = ''; device.style.marginBottom = ''; return; }
    var phone = window.innerWidth <= 760;
    var scale = phone ? Math.min(window.innerWidth / 402, window.innerHeight / 874, 1.15) : Math.min(1, (window.innerHeight - 56) / 874);
    device.style.transform = scale !== 1 ? 'scale(' + scale + ')' : '';
    device.style.marginBottom = scale !== 1 ? (874 * (scale - 1)) + 'px' : '';
  }
  window.addEventListener('resize', fitDevice);
  fitDevice();

  /* ---------- QA entry points ---------- */
  // Jump to any screen with consistent demo data (never persisted). Used by ?screen=… and by the layout audit.
  // opts: { fresh, expanded, phase, target, photoSheet, rated }
  App.qaOpen = function (target, opts) {
    opts = opts || {};
    App.enterProfile(opts.fresh ? 'fresh' : 'existing', !!opts.fresh);
    App.profile = null; // QA jumps never overwrite stored profiles
    if (opts.fresh && App.data.protectedScreens.indexOf(target) >= 0) {
      state.onboardingCompleted = true; state.accountRegistered = true; state.selectedActivities = ['책 읽기']; state.departure = '집'; state.destination = '회사';
      state.places = [{ kind: 'home', name: '집', address: '서울특별시 가온구 새봄동 123-45' }, { kind: 'work', name: '회사', address: '강남역' }];
    }
    var journeyScreens = ['activityStart', 'readingLoading', 'millie', 'transferRecord', 'transferSaved', 'boarding', 'lockScreen', 'boardingNotice', 'resume', 'arrivalNotice', 'arrival', 'record', 'end'];
    if (state.onboardingCompleted && journeyScreens.indexOf(target) >= 0) {
      App.prepareJourney();
      if (['transferSaved', 'boarding', 'lockScreen', 'boardingNotice', 'resume', 'arrivalNotice', 'arrival', 'record', 'end'].indexOf(target) >= 0) { state.pausePosition = U.startPos() + 14; state.transferHandled = true; }
      if (['resume', 'arrivalNotice', 'arrival', 'record', 'end'].indexOf(target) >= 0) state.resumeCount = 1;
      if (['arrival', 'record', 'end'].indexOf(target) >= 0) App.buildSummary();
      if (target === 'millie' || target === 'resume') {
        if (opts.expanded) state.islandExpanded = true;
        if (opts.phase) state.readerPhase = opts.phase; // active | 3 | 2 | 1 | soon
        state.readerTarget = opts.target === 'destination' || target === 'resume' ? 'destination' : 'transfer';
      }
      if (target === 'record') { if (opts.photoSheet) { state.recordPhotoOpen = true; state.recordPhotoSheet = true; } if (opts.rated) state.satisfaction = Number(opts.rated); }
    }
    if ((target === 'result' || target === 'calendar') && state.onboardingCompleted) {
      // demo a just-finished trip so the report screens show real numbers
      App.prepareJourney(); state.pausePosition = U.startPos() + 14; state.resumeCount = 1;
      var done = Object.assign({}, App.buildSummary(), { rating: 4, helpfulness: 4, resumeCount: 1 });
      state.records.unshift(done); state.lastSummary = done; state.selectedDate = done.dateKey; state.journeyStarted = false;
    }
    state.screen = target;
    App.render();
  };
  function boot() {
    if (params.get('reset') === '1') { try { localStorage.removeItem('wk6-commute-profile-existing-v1'); localStorage.removeItem('wk6-commute-profile-new-v1'); } catch (e) {} }
    var target = params.get('screen');
    if (target && App.screens[target]) {
      App.qaOpen(target, { fresh: params.get('profile') === 'fresh', expanded: params.get('expanded') === '1', phase: params.get('phase'), target: params.get('target'), photoSheet: params.get('photo') === 'sheet', rated: params.get('rated') });
      return;
    }
    App.save(); App.render();
  }
  boot();
})();
