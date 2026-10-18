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
      readingLoading: 'activityStart', millie: 'activityStart', transferRecord: 'millie', transferSaved: 'transferRecord', lockScreen: 'transferSaved',
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
    if (path === 'placeDraft') { state.placeSelected = false; App.refreshPlaceAdd(); }      // typing again clears "선택됨"
    if (path === 'pageDraft') App.refreshTransferSave();
    if (path.indexOf('account.') === 0) App.refreshAccount();
    if (state.screen === 'progress') App.refreshProgress(path);
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
  /* required-field hints appear when the user leaves a field, not while still typing */
  document.addEventListener('focusout', function (event) {
    var el = event.target; if (!el.dataset || !el.dataset.bind || el.dataset.bind.indexOf('account.') !== 0) return;
    state.accountTouched = state.accountTouched || {}; state.accountTouched[el.dataset.bind.split('.')[1]] = true; App.refreshAccount();
  });
  window.addEventListener('beforeunload', function () { App.save(); });

  /* ---------- reading clock (compressed test time) ----------
     While the reading screen stays put, only the Dynamic Island changes (counted in stops, not minutes):
       활동 중 → 환승 3정거장 전 → 2정거장 전 → 다음 역에서 환승해요 → 곧 환승해요 → (transfer passes) → 도착 3정거장 전 … → 곧 도착해요 → 도착 감지
     "읽은 위치 기록" or the simulator buttons can interrupt at any time. If nobody interacts, the clock still moves on, so there is no dead end. */
  var AUTO = params.get('auto') !== '0';
  var SPEED = Number(params.get('speed')) > 0 ? Number(params.get('speed')) : 1; // QA only: ?speed=4 plays the clock 4× faster
  var PHASES = ['active', '3', '2', '1', 'soon'];
  var DWELL = { active: 3500, '3': 4500, '2': 4500, '1': 4500, soon: 7000 };
  function onReader(s) { return s === 'millie' || s === 'resume'; }
  function tick() {
    var screen = state.screen;
    if (!AUTO || !onReader(screen)) return;
    if (screen === 'resume' && state.resumePending) return; // wait for the user to confirm "이어 읽기"
    clearTimeout(App.timers.reader);
    App.timers.reader = setTimeout(function () { if (state.screen === screen) advance(); }, DWELL[state.readerPhase || 'active'] / SPEED);
  }
  function advance() {
    var i = PHASES.indexOf(state.readerPhase || 'active');
    App.hideToast(); // a stale message must never sit next to the new island state
    if (i < PHASES.length - 1) state.readerPhase = PHASES[i + 1];
    else if (state.readerTarget !== 'destination') {
      // the transfer announcement was ignored: the user kept reading, boarding is detected on its own and the trip goes on
      state.readerTarget = 'destination'; state.transferHandled = true; state.readerPhase = 'active';
      App.toast('환승 역을 지났어요. 계속 읽는 중이에요.');
    } else { App.buildSummary('arrival'); App.go('arrivalNotice'); return; } // destination reached → arrival flow
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

  /* ---------- asset preload ----------
     Every image used by a later screen is requested right away (and the heavy maps are now compressed JPEGs),
     so maps / icons are already in the cache when their screen opens instead of appearing late. */
  App.data.assets = [
    'assets/images/places/map.jpg',
    'assets/images/place-add/map.jpg',
    'assets/images/route/imgImage7.png',
    'assets/images/services/logos.png',
    'assets/images/services/coupang.jpg',
    'assets/icons/activities/imgAddCircle.svg',
    'assets/icons/activities/imgAssignment.svg',
    'assets/icons/activities/imgBook4.svg',
    'assets/icons/activities/imgBookRibbon.svg',
    'assets/icons/activities/imgEditSquare.svg',
    'assets/icons/activities/imgEventAvailable.svg',
    'assets/icons/activities/imgFullCoverage.svg',
    'assets/icons/activities/imgHeadphones.svg',
    'assets/icons/activities/imgLightbulb2.svg',
    'assets/icons/activities/imgLocalCafe.svg',
    'assets/icons/activities/imgMarkAsUnread.svg',
    'assets/icons/activities/imgMobileHandLeft.svg',
    'assets/icons/activities/imgMovie.svg',
    'assets/icons/activities/imgMusicNote.svg',
    'assets/icons/activities/imgSensors.svg',
    'assets/icons/activities/imgSpa.svg',
    'assets/icons/activities/imgStadiaController.svg',
    'assets/icons/activities/imgTrip.svg',
    'assets/icons/island/location.svg',
    'assets/icons/island/train.svg',
    'assets/icons/login/auto-login.svg',
    'assets/icons/login/battery.svg',
    'assets/icons/login/location.svg',
    'assets/icons/login/signal.svg',
    'assets/icons/login/wifi.svg',
    'assets/icons/map-apps/loading.svg',
    'assets/icons/map-apps/selected.svg',
    'assets/icons/map-apps/unselected.svg',
    'assets/icons/permissions/imgCheckCircle.svg',
    'assets/icons/permissions/imgDirectionsRun.svg',
    'assets/icons/permissions/imgLocationOn.svg',
    'assets/icons/permissions/imgMobileHandLeft.svg',
    'assets/icons/permissions/imgNotificationsActive.svg',
    'assets/icons/place-add/area.svg',
    'assets/icons/place-add/pin.svg',
    'assets/icons/places/add.svg',
    'assets/icons/places/home.svg',
    'assets/icons/places/location.svg',
    'assets/icons/places/marker.svg',
    'assets/icons/places/search.svg',
    'assets/icons/places/work.svg',
    'assets/icons/progress/toggle-off.svg',
    'assets/icons/progress/toggle-on.svg',
    'assets/icons/route/imgGriddyIconsEnterpriseFilled.svg',
    'assets/icons/route/imgVector4Stroke.svg',
    'assets/icons/services/add.svg',
    'assets/icons/services/remove.svg',
    'assets/icons/transfer/train.svg'
  ];
  App.data.assets.forEach(function (src) { var img = new Image(); img.src = './' + src; });
  if (document.fonts && document.fonts.load) ['300', '400', '500', '600', '700'].forEach(function (w) { document.fonts.load(w + ' 16px Pretendard'); });

  /* ---------- QA entry points ---------- */
  // Jump to any screen with consistent demo data (never persisted). Used by ?screen=… and by the layout audit.
  // opts: { fresh, expanded, phase, target, photoSheet, rated }
  App.qaOpen = function (target, opts) {
    opts = opts || {};
    App.enterProfile(opts.fresh ? 'fresh' : 'existing', !!opts.fresh);
    App.profile = null; // QA jumps never overwrite stored profiles
    if (opts.fresh && App.data.protectedScreens.indexOf(target) >= 0) {
      state.onboardingCompleted = true; state.accountRegistered = true; state.selectedActivities = ['책 읽기']; state.departure = '집'; state.destination = '회사';
      state.places = [{ kind: 'home', name: '집', address: '세본동' }, { kind: 'work', name: '회사', address: '강남역' }];
      state.progressItems.bookOn = true; state.progressItems.bookTitle = '데미안'; state.currentReadingPage = '120';
    }
    var journeyScreens = ['activityStart', 'readingLoading', 'millie', 'transferRecord', 'transferSaved', 'lockScreen', 'boardingNotice', 'resume', 'arrivalNotice', 'arrival', 'record', 'end'];
    var afterTransfer = ['transferSaved', 'lockScreen', 'boardingNotice', 'resume', 'arrivalNotice', 'arrival', 'record', 'end'];
    if (state.onboardingCompleted && journeyScreens.indexOf(target) >= 0) {
      App.prepareJourney();
      if (target === 'transferRecord') { state.transferStopped = true; state.pageDraft = String(U.page() || ''); }
      if (afterTransfer.indexOf(target) >= 0) { state.currentReadingPage = '144'; state.transferStopped = true; state.transferHandled = true; } // the 120 → 144 test scenario
      if (['resume', 'arrivalNotice', 'arrival', 'record', 'end'].indexOf(target) >= 0) state.resumeCount = 1;
      if (['arrival', 'record', 'end'].indexOf(target) >= 0) App.buildSummary('arrival');
      if (target === 'millie' || target === 'resume') {
        if (opts.expanded) state.islandExpanded = true;
        if (opts.phase) state.readerPhase = opts.phase; // active | 3 | 2 | 1 | soon
        state.readerTarget = opts.target === 'destination' || target === 'resume' ? 'destination' : 'transfer';
        if (target === 'resume') state.resumePending = !opts.phase && !opts.expanded;
      }
      if (target === 'record') { state.endPositionInput = String(U.page() || ''); if (opts.photoSheet) { state.recordPhotoOpen = true; state.recordPhotoSheet = true; } if (opts.rated) state.satisfaction = Number(opts.rated); }
    }
    if ((target === 'result' || target === 'calendar') && state.onboardingCompleted) {
      // demo a just-finished trip so the report screens show real numbers
      App.prepareJourney(); state.currentReadingPage = '144'; state.transferStopped = true; state.resumeCount = 1;
      var done = Object.assign({}, App.buildSummary('arrival'), { rating: 4, resumeCount: 1 });
      state.records.unshift(done); state.lastSummary = done; state.selectedDate = done.dateKey; state.journeyStarted = false; state.transferStopped = false;
    }
    state.screen = target;
    App.render();
  };
  function boot() {
    if (params.get('reset') === '1') { try { localStorage.removeItem('wk6-revised-profile-existing-v1'); localStorage.removeItem('wk6-revised-profile-new-v1'); } catch (e) {} }
    var target = params.get('screen');
    if (target && App.screens[target]) {
      App.qaOpen(target, { fresh: params.get('profile') === 'fresh', expanded: params.get('expanded') === '1', phase: params.get('phase'), target: params.get('target'), photoSheet: params.get('photo') === 'sheet', rated: params.get('rated') });
      return;
    }
    App.save(); App.render();
  }
  boot();
})();
