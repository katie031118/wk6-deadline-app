/* Core: shared namespace, user-state model, persistence, router, helpers.
   Screens live in screens-*.js, actions + boot live in app.js. */
(function () {
  'use strict';

  var App = window.App = { screens: {}, sheets: {}, islands: {}, tones: {}, actions: {}, data: {}, util: {}, hooks: { render: [] } };
  var U = App.util;
  var state = App.state = {};

  /* ---------- constants ---------- */
  App.SIM_TODAY = '2026-10-15'; // Thursday — matches the Figma lock-screen date
  App.data.activities = ['SNS 보기','OTT 보기','웹툰 보기','게임하기','음악 듣기','팟캐스트 듣기','책 읽기','뉴스 보기','외국어 학습','강의 듣기','시험 공부','업무 · 과제','글 쓰기','생각 정리','일정 정리','메시지 답장','명상하기','휴식'];
  App.data.activityIcons = ['imgMobileHandLeft','imgMovie','imgBookRibbon','imgStadiaController','imgMusicNote','imgSensors','imgBook4','imgFullCoverage','imgBook4','imgHeadphones','imgAssignment','imgTrip','imgEditSquare','imgLightbulb2','imgEventAvailable','imgMarkAsUnread','imgSpa','imgLocalCafe'];
  App.data.serviceGroups = [
    { key: 'book', label: '책 읽기', options: [{ name: '밀리의 서재' }, { name: '교보 e-Book' }] },
    { key: 'ott', label: 'OTT 보기', options: [{ name: 'YouTube' }, { name: 'Netflix' }, { name: 'Coupang Play' }] },
    { key: 'work', label: '업무 · 과제', options: [] }
  ];
  App.data.mockPlaces = ['우리 집', '회사', '서울역', '강남역', '홍대입구역', '카페 온도'];
  App.data.setupScreens = ['account', 'favorites', 'placeAdd', 'activities', 'progress', 'services', 'serviceSearch', 'permissions'];
  App.data.protectedScreens = ['home', 'homePlace', 'route', 'routeConfirm', 'mapApps', 'journeyActivity', 'activityStart', 'readingLoading', 'millie', 'transferRecord', 'transferSaved', 'boarding', 'lockScreen', 'boardingNotice', 'resume', 'arrivalNotice', 'arrival', 'record', 'result', 'calendar', 'end', 'departureNotice'];
  App.data.screenLabels = { login: '로그인', favorites: '장소 등록', placeAdd: '집 추가', activities: '활동 등록', progress: '진행도 등록', services: '서비스 등록', serviceSearch: '서비스 검색', account: '계정 정보', permissions: '권한 허용', home: '홈', homePlace: '즐겨찾는 장소 추가', departureNotice: '출발 알림', route: '경로 선택', routeConfirm: '저장된 경로 확인', mapApps: '지도 앱 선택', journeyActivity: '이동 중 활동 선택', activityStart: '이동 시작', readingLoading: '앱 전환', millie: '독서 중', transferRecord: '읽은 위치 기록', transferSaved: '기록 저장 완료', boarding: '이어 읽기 선택', lockScreen: '탑승 대기', boardingNotice: '탑승 감지 알림', resume: '전자책 복귀', arrivalNotice: '도착 알림', arrival: '목적지 도착', record: '오늘의 기록', result: '결과', calendar: '캘린더', end: '이용 종료' };

  /* ---------- util ---------- */
  U.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  U.esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  U.pad2 = function (n) { return String(n).padStart(2, '0'); };
  U.dateKey = function (d) { return d.getFullYear() + '-' + U.pad2(d.getMonth() + 1) + '-' + U.pad2(d.getDate()); };
  U.parseKey = function (k) { return new Date(k + 'T12:00:00'); };
  U.shiftDate = function (key, delta) { var d = U.parseKey(key); d.setDate(d.getDate() + delta); return U.dateKey(d); };
  U.activityLabel = function (a) { return a === '책 읽기' || a === '독서' ? '전자책 읽기' : (a || '전자책 읽기'); };
  U.isBook = function (a) { return !a || a === '책 읽기' || a === '독서'; };
  U.btn = function (label, action, cls, extra) { return '<button type="button" class="' + (cls || 'btn btn-primary') + '" data-action="' + action + '" ' + (extra || '') + '>' + label + '</button>'; };
  U.back = function (action) { return '<button type="button" class="fx-back" data-action="' + (action || 'back') + '" aria-label="뒤로"><img src="./assets/icons/route/imgVector4Stroke.svg" alt="" width="13" height="23"></button>'; };
  /* Millie app icon: cropped from the service-logo sprite so it stays a real asset. */
  U.logo = function (size, cls) { return '<span class="app-logo ' + (cls || '') + '" style="width:' + size + 'px;height:' + size + 'px"><img src="./assets/images/services/logos.png" alt="밀리의 서재"></span>'; };
  /* Bottom sheet: optional dim scrim (tap outside = close action) + sheet with handle. */
  U.sheet = function (inner, o) {
    o = o || {};
    return (o.dim === false ? '' : '<div class="scrim" data-scrim data-action="' + (o.close || 'noop') + '"></div>') +
      '<section class="sheet ' + (o.cls || '') + '" role="dialog" aria-modal="' + (o.dim === false ? 'false' : 'true') + '" aria-label="' + U.esc(o.label || '') + '"><i class="sheet-handle"></i>' + inner + '</section>';
  };
  U.actions = function (primary, a1, secondary, a2, o) {
    o = o || {};
    return '<div class="' + (o.inSheet ? 'sheet-actions' : 'fx-cta') + '">' + U.btn(primary, a1, 'btn btn-primary') + (secondary ? U.btn(secondary, a2, o.secondaryCls || 'btn btn-text') : '') + '</div>';
  };

  /* ---------- user state model ---------- */
  var KEYS = { existing: 'wk6-commute-profile-existing-v1', fresh: 'wk6-commute-profile-new-v1' };
  App.profile = null; // 'existing' | 'fresh'

  function blank() {
    return {
      screen: 'login',
      // user status
      isExistingUser: false, onboardingCompleted: false, hasPreviousActivity: false, hasActiveJourney: false,
      accountRegistered: false, onboardingPlacesComplete: false, onboardingProgressComplete: false, onboardingServicesComplete: false,
      loginEmail: '', loginPassword: '', autoLogin: false, placeQuery: '', placeDraft: '', pendingPlaceKind: 'custom',
      places: [], selectedActivities: [], customActivities: [], editingActivities: false,
      progressItems: { bookOn: false, bookTitle: '', bookPosition: '', ottOn: false, ottTitle: '', ottEpisode: '', workOn: false, workTitle: '', workLast: '' },
      selectedServices: [], customServices: [], customServiceCategories: {}, pendingServiceKind: 'book', serviceQuery: '',
      account: { nickname: '', email: '', password: '', passwordConfirm: '' },
      permissions: { location: true, motion: true, screen: true, notification: false },
      // journey
      departure: '', destination: '', route: 0, mapApp: '네이버 지도', homePlaceQuery: '', homePlaceChoice: '',
      journeyActivity: '', journeyStarted: false, resumeCount: 0, elapsed: 0, islandExpanded: false, readerPhase: 'active', readerTarget: 'transfer', transferHandled: false,
      transferRecordMode: 'image', startPosition: 0, pausePosition: 0, photo: '', recordPhotoOpen: false, recordPhotoSheet: false, endPositionInput: '',
      satisfaction: 0, helpfulness: 0, lastSummary: null, records: [], selectedDate: ''
    };
  }
  App.blankState = blank;

  function rec(dateKey, start, end, minutes, endPos) {
    return { dateKey: dateKey, activity: '책 읽기', contentTitle: '데미안', minutes: minutes, rating: 4, helpfulness: 4, departure: '집', destination: '회사', startTime: start, endTime: end, position: endPos + ' 페이지', service: '밀리의 서재', resumeCount: 0, photo: '', note: '' };
  }
  /* Existing user: restored demo data — '데미안' activity + previous trips. */
  function seedExisting() {
    var s = blank();
    s.isExistingUser = true; s.onboardingCompleted = true; s.accountRegistered = true;
    s.onboardingPlacesComplete = s.onboardingProgressComplete = s.onboardingServicesComplete = true;
    s.account = { nickname: '', email: 'nari@example.com', password: '', passwordConfirm: '' };
    s.places = [{ kind: 'home', name: '집', address: '서울특별시 가온구 새봄동 123-45' }, { kind: 'work', name: '회사', address: '강남역' }];
    s.departure = '집'; s.destination = '회사';
    s.selectedActivities = ['책 읽기']; s.selectedServices = ['밀리의 서재'];
    s.progressItems.bookOn = true; s.progressItems.bookTitle = '데미안'; s.progressItems.bookPosition = '130';
    s.journeyActivity = '책 읽기';
    s.records = [rec('2026-10-15', '08:19', '08:31', 12, 130), rec('2026-10-14', '08:05', '08:56', 51, 118), rec('2026-10-13', '08:10', '08:36', 26, 79), rec('2026-10-12', '08:00', '08:48', 48, 53)];
    s.hasPreviousActivity = true;
    return s;
  }

  function normalize(saved) {
    var s = Object.assign(blank(), saved || {});
    ['progressItems', 'account', 'permissions'].forEach(function (k) { s[k] = Object.assign(blank()[k], (saved || {})[k] || {}); });
    s.records = s.records || []; s.places = s.places || [];
    return s;
  }
  function setState(next) {
    Object.keys(state).forEach(function (k) { delete state[k]; });
    Object.assign(state, next);
  }
  App.syncFlags = function () {
    state.hasPreviousActivity = (state.records || []).length > 0;
    state.hasActiveJourney = !!state.journeyStarted;
  };
  App.loadProfile = function (name) {
    try { var raw = localStorage.getItem(KEYS[name]); return raw ? normalize(JSON.parse(raw)) : null; } catch (e) { return null; }
  };
  /* Enter a user profile. Existing user → restored/seeded demo data. Fresh user → blank slate. */
  App.enterProfile = function (name, forceBlank) {
    var next;
    if (name === 'existing') next = App.loadProfile('existing') || seedExisting();
    else next = forceBlank ? blank() : (App.loadProfile('fresh') || blank());
    next.isExistingUser = name === 'existing';
    next.loginEmail = state.loginEmail || ''; next.loginPassword = '';
    setState(next); App.profile = name; App.syncFlags();
  };
  App.save = function () {
    App.syncFlags();
    if (App.profile) {
      try {
        var p = U.clone(state); p.account.password = ''; p.account.passwordConfirm = ''; p.loginPassword = ''; p.screen = 'login';
        localStorage.setItem(KEYS[App.profile], JSON.stringify(p));
      } catch (e) { App.toast('저장 공간이 부족합니다. 사진을 줄여 주세요.'); }
    }
    App.updateWorkbench();
  };
  App.resetAll = function () {
    try { localStorage.removeItem(KEYS.existing); localStorage.removeItem(KEYS.fresh); } catch (e) {}
    App.profile = null; setState(blank()); App.syncFlags(); App.render();
  };
  setState(blank());

  /* ---------- derived user data ---------- */
  App.nextSetupScreen = function (s) {
    s = s || state;
    if (!s.onboardingPlacesComplete && !(s.places || []).length) return 'favorites';
    if (!(s.selectedActivities || []).length) return 'activities';
    if (!s.onboardingProgressComplete) return 'progress';
    if (!s.onboardingServicesComplete) return 'services';
    if (!s.accountRegistered) return 'account';
    return 'permissions';
  };
  U.contentTitle = function (activity) {
    var a = activity === undefined ? state.journeyActivity : activity, p = state.progressItems;
    if (U.isBook(a)) return p.bookTitle || '읽던 책';
    if (a === 'OTT 보기') return p.ottTitle || 'OTT 콘텐츠';
    return p.workTitle || a;
  };
  U.bookService = function () {
    var g = App.data.serviceGroups[0].options.map(function (o) { return o.name; }).concat((state.customServices || []).filter(function (n) { return state.customServiceCategories[n] === 'book'; }));
    var chosen = g.filter(function (n) { return state.selectedServices.indexOf(n) >= 0; });
    return chosen[0] || '밀리의 서재';
  };
  U.startPos = function () { return Number(state.startPosition) || 0; };
  U.pausePos = function () { return Number(state.pausePosition) || (U.startPos() + 14); };
  U.unit = function () { var a = state.journeyActivity; return U.isBook(a) ? 'p' : a === 'OTT 보기' ? '화' : ''; };
  U.minutes = function () { return 33 + Number(state.elapsed || 0); };
  U.lastRecord = function () { return (state.records || [])[0] || null; };
  U.nickname = function () { return state.account.nickname || 'ㅇㅇ'; };
  U.destLabel = function () {
    var v = state.destination || '회사', p = (state.places || []).find(function (x) { return x.name === v || (v === '회사' && x.kind === 'work'); });
    return p && p.kind === 'work' ? '회사' : p && p.kind === 'home' ? '집' : (v.length > 8 ? '목적지' : v);
  };
  U.destAddress = function () {
    var v = state.destination || '회사', p = (state.places || []).find(function (x) { return x.name === v || (v === '회사' && x.kind === 'work'); });
    return (p && p.address) || (v === '회사' || (p && p.kind === 'work') ? '강남역' : v);
  };
  U.direction = function (label) {
    var last = label.charCodeAt(label.length - 1), fin = last >= 44032 && last <= 55203 ? (last - 44032) % 28 : 0;
    return label + (fin && fin !== 8 ? '으로' : '로');
  };

  /* ---------- toast / modal ---------- */
  App.toast = function (message) {
    var el = document.getElementById('toast'); el.textContent = message; el.classList.add('show');
    clearTimeout(App.toast._t); App.toast._t = setTimeout(function () { el.classList.remove('show'); }, 2300);
  };
  App.openModal = function (title, copy, body) {
    document.getElementById('app-modal').innerHTML = U.sheet('<h2 class="sheet-title">' + U.esc(title) + '</h2>' + (copy ? '<p class="sheet-copy">' + U.esc(copy) + '</p>' : '') + body, { close: 'close-modal', label: title, cls: 'sheet-modal' });
  };
  App.closeModal = function () { document.getElementById('app-modal').innerHTML = ''; };

  /* ---------- router ---------- */
  App.go = function (next) {
    clearTimeout(App.timers.launch);
    if (!state.onboardingCompleted && App.data.protectedScreens.indexOf(next) >= 0) {
      next = App.nextSetupScreen(state);
      App.toast(next === 'login' ? '회원가입을 먼저 진행해 주세요.' : '초기 설정을 먼저 완료해 주세요.');
    }
    state.screen = next; App.save(); App.render();
  };
  App.timers = { launch: null, flow: null };

  App.render = function () {
    var s = state.screen, device = document.getElementById('device');
    var screenFn = App.screens[s] || App.screens.login;
    device.dataset.screen = s; device.dataset.tone = App.tones[s] || 'white';
    document.getElementById('app-screen').innerHTML = screenFn();
    document.getElementById('sheet-layer').innerHTML = App.sheets[s] ? App.sheets[s]() : '';
    App.renderIsland();
    if (App.lastRendered !== s) { document.getElementById('app-screen').scrollTop = 0; App.lastRendered = s; }
    App.updateWorkbench();
    App.hooks.render.forEach(function (fn) { fn(s); });
  };

  App.renderIsland = function () {
    var fn = App.islands[state.screen];
    document.getElementById('island-layer').innerHTML = fn ? fn() : '';
  };

  App.updateWorkbench = function () {
    var st = document.getElementById('wb-status'), fl = document.getElementById('wb-flags');
    if (st) st.textContent = '현재 화면: ' + (App.data.screenLabels[state.screen] || state.screen);
    if (fl) {
      var rows = [['isExistingUser', state.isExistingUser], ['onboardingCompleted', state.onboardingCompleted], ['hasPreviousActivity', state.hasPreviousActivity], ['hasActiveJourney', state.hasActiveJourney]];
      fl.innerHTML = rows.map(function (r) { return '<div><dt>' + r[0] + '</dt><dd class="' + (r[1] ? 'on' : '') + '">' + (r[1] ? 'true' : 'false') + '</dd></div>'; }).join('');
    }
  };
})();
