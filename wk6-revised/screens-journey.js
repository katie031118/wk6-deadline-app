/* Home → route → reading → transfer → return → arrival.
   Layout numbers come from the Figma Mid-fi frames (402 × 874, device-origin coordinates).
   Data rules (usability-test revision):
   - the reading position is ONE value, state.currentReadingPage, read through U.page() on every screen;
   - places/areas come from what the user registered during onboarding;
   - trip start / end / total / activity time come from the trip model in core.js (U.simOffset, U.activityMinutesAt). */
(function () {
  'use strict';
  var App = window.App, U = App.util, state = App.state, S = App.screens, A = App.actions, SH = App.sheets, IS = App.islands;
  var esc = U.esc;

  function icon(group, name, w, h, cls) { return '<img ' + (cls ? 'class="' + cls + '" ' : '') + 'src="./assets/icons/' + group + '/' + name + '.svg" alt="" width="' + w + '" height="' + h + '">'; }
  function josaEulReul(word) {
    var c = String(word).charCodeAt(String(word).length - 1);
    return c >= 44032 && c <= 55203 && (c - 44032) % 28 ? '을' : '를';
  }
  function bookCard(sub) {
    return '<div class="book-card">' + U.logo(62) + '<div><small>' + U.activityLabel(state.journeyActivity) + '</small><strong>' + esc(U.contentTitle()) + '</strong>' + (sub ? '<small>' + sub + '</small>' : '') + '</div></div>';
  }
  function badge(text) { return '<span class="badge">' + esc(text) + '</span>'; }
  function savedLine() { return esc(U.bookService()) + (U.page() ? ' · ' + U.pageText() : ''); }

  /* ---------- home ---------- */
  var TAB_ICONS = {
    home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>',
    'open-calendar': '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    'edit-activities': '<path d="M5 6h14M5 12h14M5 18h9"/>',
    'open-account': '<circle cx="12" cy="8.5" r="3.5"/><path d="M5 20c.8-3.6 3.7-5.5 7-5.5s6.2 1.9 7 5.5"/>'
  };
  function tabBar() {
    var tabs = [['home', '홈'], ['open-calendar', '캘린더'], ['edit-activities', '활동'], ['open-account', '내 정보']];
    return '<nav class="tabbar">' + tabs.map(function (t) { return '<button type="button" class="tab-item" data-action="' + t[0] + '" aria-label="' + t[1] + '"><span class="tab-dot"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1c1b1f" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + TAB_ICONS[t[0]] + '</svg></span><small>' + t[1] + '</small></button>'; }).join('') + '</nav>';
  }
  /* The activity the user registered during onboarding (or last did) — shown as "최근 진행 중인 활동". */
  function ongoingActivity() {
    var p = state.progressItems, r = U.lastRecord();
    if (p.bookOn || p.bookTitle) return { activity: '책 읽기', title: p.bookTitle || '읽던 책', sub: U.resumeText() };
    if (p.ottOn || p.ottTitle) return { activity: 'OTT 보기', title: p.ottTitle || 'OTT 콘텐츠', sub: p.ottEpisode ? p.ottEpisode + '화부터 이어 보기' : '이어 보기' };
    if (p.workOn || p.workTitle) return { activity: '업무 · 과제', title: p.workTitle || '업무 · 과제', sub: p.workLast ? p.workLast + ' 이어서' : '이어서 진행' };
    return r ? { activity: r.activity, title: r.contentTitle, sub: '' } : null;
  }
  function dayWord(key) { return key === App.SIM_TODAY ? '오늘' : key === U.shiftDate(App.SIM_TODAY, -1) ? '어제' : Number(key.slice(5, 7)) + '/' + Number(key.slice(8)); }
  S.home = function () {
    var cur = ongoingActivity(), r = U.lastRecord();
    var card = cur
      ? '<section class="home-card"><div class="home-card-head"><h3>최근 진행 중인 활동</h3>' + (r ? '<button type="button" class="chip-btn" data-action="recent-detail">자세히보기 &gt;</button>' : '') + '</div>' +
        '<div class="home-card-body">' + U.logo(62) + '<div><small>' + esc(U.activityLabel(cur.activity)) + '</small><strong>' + esc(cur.title) + '</strong>' + (cur.sub ? '<small class="home-resume">' + esc(cur.sub) + '</small>' : '') + (r ? '<small>마지막 활동 · ' + dayWord(r.dateKey) + ' ' + esc(r.endTime || '') + ' · 활동 ' + Number(r.minutes || 0) + '분</small>' : '') + '</div></div></section>'
      : '<section class="home-card home-card-empty"><div class="home-card-head"><h3>최근 진행 중인 활동</h3></div><div class="home-empty"><img src="./assets/icons/places/add.svg" alt="" width="32" height="32"><strong>최근 진행 중인 활동이 없어요.</strong><small>이동을 시작하면 상황에 맞는 활동을 제안해드릴게요.</small></div></section>';
    var rl = U.routeLabel();
    var route = rl
      ? '<button type="button" class="place-card" data-action="open-home-route"><i class="place-icon"></i><strong>' + esc(rl) + '</strong><small>' + esc((state.departure || '집') + ' → ' + U.destLabel()) + '</small><small>약 ' + U.routeMin() + '분 · 지하철+도보</small></button>'
      : '<p class="route-empty">저장된 이동 경로가 없어요.<br>집과 회사를 등록하면 경로가 만들어져요.</p>';
    return '<section class="fx home-screen"><div class="home-content"><h2 class="home-greeting">' + esc(U.nickname()) + '님,<br>오늘 활동을 ' + (cur ? '이어가볼까요?' : '시작해볼까요?') + '</h2>' + card +
      '<section class="home-places"><h3>자주 이용하는 경로</h3>' + route + U.btn('+ 장소 추가하기', 'source-home-add', 'btn btn-secondary') + '</section></div>' +
      U.btn('오늘의 활동 시작하기', 'start-today', 'btn btn-primary home-start') + tabBar() + '</section>';
  };
  S.homePlace = S.home;
  function homePlaceNames() { return (state.places.length ? state.places.map(function (p) { return p.name; }) : []).concat(App.data.mockPlaces); }
  SH.homePlace = function () {
    var q = state.homePlaceQuery, results = homePlaceNames().filter(function (n, i, arr) { return arr.indexOf(n) === i && (!q || n.indexOf(q) >= 0); }).slice(0, 3);
    if (!results.length && q) results = [q];
    return U.sheet('<h2 class="sheet-title">장소 추가</h2><label class="search-input"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="#7c7c7c" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="#7c7c7c" stroke-width="2" stroke-linecap="round"/></svg><input data-bind="homePlaceQuery" value="' + esc(q) + '" placeholder="장소를 검색해보세요" aria-label="장소 검색"></label>' +
      '<h3 class="sheet-label">최근 검색</h3><div class="place-results" id="home-place-results">' + homePlaceResults(results) + '</div>' + U.btn('이 장소로 선택하기', 'confirm-home-place', 'btn btn-primary'), { close: 'home', label: '장소 추가', cls: 'sheet-tall' });
  };
  function homePlaceResults(results) {
    return results.map(function (n) { return '<button type="button" class="place-result" data-action="choose-home-place" data-value="' + esc(n) + '" aria-pressed="' + (state.homePlaceChoice === n) + '"><i class="ph-circle"></i><span>' + esc(n) + '</span></button>'; }).join('');
  }
  App.refreshHomePlaceResults = function () {
    var box = document.getElementById('home-place-results'); if (!box) return;
    var q = state.homePlaceQuery, res = homePlaceNames().filter(function (n, i, arr) { return arr.indexOf(n) === i && (!q || n.indexOf(q) >= 0); }).slice(0, 3);
    if (!res.length && q) res = [q];
    box.innerHTML = homePlaceResults(res);
  };

  /* ---------- route ---------- */
  function routeBase() {
    var dest = U.destLabel(), options = '', area = U.destAddress(), T = App.data.trip;
    if (state.showRoutes) {
      options = '<div class="route-list">' + App.data.routes.map(function (r, i) {
        return '<button type="button" class="route-option ' + (state.route === i ? 'selected' : '') + '" data-action="pick-route" data-index="' + i + '"><span><strong>' + r.name + '</strong><small>' + r.sub + '</small></span><b>' + r.min + '분</b></button>';
      }).join('') + '</div>';
    }
    return U.back() + '<h2 class="fx-title">' + esc(U.direction(dest)) + ' 이동할까요?</h2>' +
      '<div class="place-row"><span class="place-circle"><img src="./assets/icons/route/imgGriddyIconsEnterpriseFilled.svg" alt="" width="40" height="40"></span><div><strong>' + esc(dest) + '</strong>' + (area ? '<small>' + esc(area) + '</small>' : '') + '</div><button type="button" class="chip-btn chip-outline" data-action="choose-location" data-kind="work">장소 변경</button></div>' +
      '<div class="route-head"><h3>평소 이용 경로</h3><button type="button" data-action="toggle-routes">편집</button></div>' +
      (options || '<div class="route-card"><strong>약 ' + U.routeMin() + '분</strong><span>지금 출발 · ' + U.fmtKo(T.startMin + U.routeMin()) + ' 도착 예정</span><img src="./assets/images/route/imgImage7.png" alt="경로 미리보기" width="250" height="319"></div>');
  }
  S.route = function () { return '<section class="fx route-screen">' + routeBase() + '</section>'; };
  SH.route = function () {
    return U.sheet(U.btn('이 경로로 출발하기', 'route-confirm', 'btn btn-primary') + '<button type="button" class="route-link" data-action="open-map-apps"><i class="ph-circle ph-40"></i><span><strong>다른 경로가 필요하신가요?</strong><small>지도 앱에서 새로운 경로를 확인해보세요.</small></span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="#1c1b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>', { dim: false, label: '경로 선택' });
  };
  S.routeConfirm = S.route;
  SH.routeConfirm = function () {
    return U.sheet('<span class="confirm-check"><i></i><svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="sheet-hero">저장된 경로로<br>출발할게요!</h2><p class="sheet-desc">약 ' + U.routeMin() + '분의 이동 시간이 예상돼요.<br>원한다면 이동 중 할 활동을 선택할 수 있어요.</p><div class="sheet-actions">' + U.btn('활동 선택하기', 'to-journey-activity', 'btn btn-primary') + U.btn('나중에 선택하기', 'start-without-activity', 'btn btn-text') + '</div>', { close: 'back', label: '저장된 경로', cls: 'sheet-center sheet-confirm' });
  };
  S.mapApps = function () {
    return '<section class="fx">' + U.back() + '<div class="fx-head"><h2>다른 경로를 찾아볼까요?</h2><p>선호하는 지도 앱에서 새로운 경로를 확인할 수 있어요.</p></div><div class="option-list map-list">' +
      ['네이버 지도', '카카오맵', '티맵', 'Google Maps'].map(function (app) { return '<button type="button" class="option ' + (state.mapApp === app ? 'selected' : '') + '" data-action="pick-map-app" data-value="' + app + '" aria-pressed="' + (state.mapApp === app) + '"><strong>' + app + '에서 열기</strong><i class="radio"></i></button>'; }).join('') + '</div>' +
      U.actions('이 앱으로 열기', 'open-map-app', '나중에 선택하기', 'cancel-map-app') + '</section>';
  };

  /* ---------- activity choice / start / loading ---------- */
  function journeyChoices() {
    var p = state.progressItems, list = [];
    if (p.bookOn || p.bookTitle) list.push('책 읽기'); if (p.ottOn || p.ottTitle) list.push('OTT 보기'); if (p.workOn || p.workTitle) list.push('업무 · 과제');
    if (!list.length) list = state.selectedActivities.slice(0, 3);
    if (!list.length) list = ['책 읽기'];
    return list;
  }
  S.journeyActivity = function () {
    var list = journeyChoices();
    if (list.indexOf(state.journeyActivity) < 0) state.journeyActivity = list[0];
    return '<section class="fx">' + U.back() + '<div class="fx-head"><h2>이동 중 어떤 활동을<br>진행할까요?</h2><p>약 ' + U.routeMin() + '분의 시간을 이렇게 활용해보세요.</p></div><div class="option-list choice-list">' +
      list.slice(0, 3).map(function (a) {
        var on = state.journeyActivity === a;
        return '<button type="button" class="option option-card ' + (on ? 'selected' : '') + '" data-action="pick-journey-activity" data-value="' + esc(a) + '" aria-pressed="' + on + '">' + U.logo(62) + '<span class="option-copy"><small>' + esc(U.activityLabel(a)) + '</small><strong>' + esc(U.contentTitle(a)) + '</strong><em>' + (U.isBook(a) && U.page() ? U.page() + '쪽부터 · ' : '') + '약 ' + (U.routeMin() - App.data.trip.wait) + '분</em></span><i class="radio"></i></button>';
      }).join('') + '</div>' + U.actions('이 활동으로 선택하기', 'start-now', '나중에 선택하기', 'start-without-activity') + '</section>';
  };
  function tripPlace(label, area) { return esc(label) + (area ? ' · ' + esc(area) : ''); }
  S.activityStart = function () {
    var label = U.activityLabel(state.journeyActivity), title = U.contentTitle();
    return '<section class="fx start-screen">' + U.back() + '<span class="start-circle"><img src="./assets/icons/transfer/train.svg" alt="" width="64" height="64"></span>' +
      '<div class="start-copy"><h2>' + esc(U.direction(U.destLabel())) + ' 이동을 시작했어요!</h2><p>약 ' + U.routeMin() + '분동안<br>' + esc(U.isBook(state.journeyActivity) ? title + josaEulReul(title) + ' 읽어볼까요?' : label + '를 이어서 진행해볼까요?') + '</p></div>' +
      '<div class="trip-card"><i class="trip-line"></i><div><i class="dot"></i><span><small>현재 위치</small><strong>' + tripPlace(state.departure || '집', U.depArea()) + '</strong></span></div><div><i class="dot"></i><span><small>도착 예정</small><strong>' + tripPlace(U.destLabel(), U.destArea()) + '</strong></span></div></div>' +
      U.actions('지금 ' + esc(label) + ' 시작', 'start-activity', '이동 상세보기', 'open-moving-detail') + '</section>';
  };
  S.readingLoading = function () {
    var svc = U.bookService();
    return '<section class="fx loading-screen">' + U.back('cancel-reader') + '<span class="loading-circle">' + U.logo(104) + '</span><div class="loading-copy"><h2>' + esc(svc) + ' 앱으로<br>이동할게요.</h2><p>잠시 후 앱이 실행됩니다.</p></div><div class="fx-cta">' + U.btn('취소', 'cancel-reader', 'btn btn-text') + '</div></section>';
  };

  /* ---------- reader (simulated external app) + dynamic island ---------- */
  function readerBody(opts) {
    opts = opts || {};
    var widths = [330, 362, 340, 362, 300, 362, 350, 362, 280, 362, 330, 340, 362, 300], lines = '';
    widths.forEach(function (w, i) { if (opts.expanded) { if (i > 11) return; } if (opts.badge && (i === 5 || i === 6)) return; lines += '<i class="skeleton" style="top:' + ((opts.expanded ? 200 : 160) + i * 26) + 'px;width:' + w + 'px"></i>'; });
    return (opts.expanded ? '' : U.back() + '<h2 class="reader-title">' + esc(U.contentTitle()) + '</h2><p class="reader-app">' + esc(U.bookService()) + '</p>') + lines +
      (opts.badge ? '<span class="badge reader-badge" style="top:' + (opts.expanded ? 332 : 292) + 'px">' + esc(opts.badge) + '</span>' : '') +
      '<p class="reader-note">' + esc(U.bookService()) + ' 앱 화면</p>';
  }
  function readerBadge(resumed) { return U.page() ? (resumed ? '여기서부터 이어 읽기 · ' : '현재 위치 · ') + U.pageText() : ''; }
  /* The reading screen never changes while time passes — only the Dynamic Island does (see islandModel). */
  S.millie = function () { return '<section class="fx reader">' + readerBody({ expanded: state.islandExpanded, badge: readerBadge(false) }) + '</section>'; };
  S.resume = function () { return '<section class="fx reader">' + readerBody({ badge: readerBadge(true), expanded: state.islandExpanded }) + '</section>'; };
  /* Resume prompt: shows the position that was saved at the transfer, so the resume point can't differ from it. */
  SH.resume = function () {
    if (!state.resumePending) return '';
    return U.sheet(badge('탑승 감지') + '<div class="sheet-head"><h2>이어 읽을까요?</h2><p>저장한 위치에서 바로 이어서 읽을 수 있어요.</p></div>' + bookCard(esc(U.bookService()) + ' · ' + esc(U.resumeText())) +
      '<div class="sheet-actions">' + U.btn('이어 읽기', 'start-resume', 'btn btn-primary') + '</div>', { dim: false, label: '이어 읽기', cls: 'sheet-boarding' });
  };
  S.arrivalNotice = function () {
    return '<section class="fx reader">' + readerBody() + '</section>';
  };
  /* ---- Dynamic Island: built from the Figma "수정해야하는 프로토타입 화면들" frames ----
     active      → compact pill 246×36 "● 활동 중 ………… 12분 34초"
     3 / 2 stops → compact pill with train icon "환승 ………… 3정거장 전"
     1 / soon    → wide banner 362×62 "다음 역에서 환승해요 / 한 정거장 남았어요 · 읽던 위치 저장" + sheet with the save-and-pause button
     expanded    → Live Activity 362×144 (tap the pill) */
  App.islandElapsed = function () {
    var secs = Math.floor((Date.now() - (App.islandT0 || Date.now())) / 1000) % 60;
    return U.activityMinutesNow() + '분 ' + secs + '초';
  };
  App.islandModel = function () {
    var dest = state.readerTarget === 'destination', ph = state.readerPhase || 'active', n = Number(ph), noun = dest ? '하차' : '환승';
    var m = { dest: dest, phase: ph };
    if (ph === 'active') { m.kind = 'pill'; m.left = '활동 중'; m.right = App.islandElapsed(); m.timeRight = true; m.stops = '4정거장 남았습니다.'; }
    else if (ph === '3' || ph === '2') { m.kind = 'pill'; m.left = noun; m.right = n + '정거장 전'; m.icon = 'train'; m.stops = n + '정거장 남았습니다.'; }
    else if (ph === '1') { m.kind = 'banner'; m.title = dest ? '다음 역에서 내려요' : '다음 역에서 환승해요'; m.sub = dest ? '한 정거장 남았어요' : '한 정거장 남았어요 · 읽던 위치 저장'; m.stops = '1정거장 남았습니다.'; }
    else { m.kind = 'banner'; m.title = dest ? '곧 도착해요' : '곧 환승해요'; m.sub = dest ? '곧 목적지에 도착해요' : '곧 환승해요 · 읽던 위치 저장'; m.stops = dest ? '곧 도착합니다.' : '곧 환승합니다.'; }
    return m;
  };
  function pill(m) {
    return '<button type="button" class="isl-pill" data-action="toggle-island" aria-label="' + esc(m.left + ' ' + m.right) + ' — 활동 상태 펼치기"><span class="isl-left"><span class="isl-dot' + (m.icon ? ' has-icon' : '') + '">' + (m.icon ? icon('island', m.icon, 14, 14) : '') + '</span><span class="isl-label">' + esc(m.left) + '</span></span><span class="isl-right' + (m.timeRight ? ' isl-time' : '') + '">' + esc(m.right) + '</span></button>';
  }
  function transferBanner(m) {
    return '<div class="isl-banner" role="status"><span class="isl-banner-ico">' + icon('island', 'train', 24, 24) + '</span><strong>' + esc(m.title) + '</strong><small>' + esc(m.sub) + '</small></div>';
  }
  /* Live Activity (expanded). The ■ stop button is the Figma control: a white 48px circle with a black square. */
  function expandedIsland(m) {
    var label = U.isBook(state.journeyActivity) ? '전자책' : U.activityLabel(state.journeyActivity);
    return '<div class="isl-backdrop" data-action="collapse-island" aria-hidden="true"></div><div class="isl-live"><div class="isl-live-top"><i></i><span>활동 중</span><time class="isl-time">' + esc(App.islandElapsed()) + '</time></div>' + U.logo(56, 'isl-logo') +
      '<strong>' + esc(label + ' · ' + U.contentTitle() + (U.isBook(state.journeyActivity) ? ' 읽기' : '')) + '</strong><small>' + esc(m.stops) + '</small><button type="button" class="isl-stop" data-action="return-from-reader" aria-label="읽은 위치 기록하고 활동 멈추기"><b></b></button></div>';
  }
  IS.millie = IS.resume = function () {
    if (state.screen === 'resume' && state.resumePending) return '';
    var m = App.islandModel(); return state.islandExpanded ? expandedIsland(m) : (m.kind === 'banner' ? transferBanner(m) : pill(m));
  };
  /* "다음 역에서 환승해요. 읽던 위치를 저장하고 잠시 멈출까요?" — shown with the transfer banner (before the transfer only). */
  SH.millie = function () {
    var m = App.islandModel();
    if (state.islandExpanded || m.kind !== 'banner' || m.dest) return '';
    return '<section class="isl-sheet" role="dialog" aria-label="환승 안내"><h3>' + (m.phase === 'soon' ? '곧 환승해요.' : '다음 역에서 환승해요.') + '</h3><p>읽던 위치를 저장하고 잠시 멈출까요?</p>' + U.btn('읽은 위치 저장하고 잠시 멈추기', 'return-from-reader', 'btn btn-primary') + '</section>';
  };
  function banner(action, title, body) {
    return '<button type="button" class="notif" data-action="' + action + '">' + U.logo(40) + '<span><span class="notif-head"><b>' + esc(U.bookService()) + '</b><time>지금</time></span><strong>' + title + '</strong><span class="notif-body">' + body + '</span></span></button>';
  }
  IS.arrivalNotice = function () {
    return banner('show-arrival-summary', '곧 목적지에 도착해요 · 다음 역에서 내려요', '읽던 위치를 남기고 이동을 마무리할 준비를 해보세요.');
  };

  /* ---------- transfer record / saved ---------- */
  S.transferRecord = function () { return '<section class="fx reader">' + readerBody() + '</section>'; };
  SH.transferRecord = function () {
    var valid = parseInt(state.pageDraft, 10) > 0;
    return U.sheet('<div class="sheet-head"><h2>어디까지 읽었나요?</h2><p>다음 지하철에서 이어 읽을 수 있게 저장할게요.</p></div>' + bookCard(esc(U.bookService())) +
      '<label class="page-field"><span class="page-field-label">읽은 위치</span><span class="page-field-box"><input id="page-draft" type="number" inputmode="numeric" min="1" data-bind="pageDraft" value="' + esc(state.pageDraft) + '" placeholder="0" aria-label="읽은 위치(쪽)"><b>쪽</b></span></label>' +
      '<label class="memo-field"><span class="sheet-label">메모 남기기 <em>· 선택</em></span><textarea class="note-input" data-bind="onTripNote" placeholder="한 줄 메모를 남겨 보세요." aria-label="메모(선택)">' + esc(state.onTripNote || '') + '</textarea></label>' +
      '<div class="sheet-actions">' + U.btn('저장하기', 'save-transfer-record', 'btn btn-primary', valid ? '' : 'aria-disabled="true"') + U.btn('기록하지 않고 닫기', 'skip-transfer-record', 'btn btn-text') + '</div>', { close: 'skip-transfer-record', label: '읽은 위치 기록', cls: 'sheet-tall sheet-record' });
  };
  App.refreshTransferSave = function () {
    var b = document.querySelector('[data-action="save-transfer-record"]'); if (!b) return;
    if (parseInt(state.pageDraft, 10) > 0) b.removeAttribute('aria-disabled'); else b.setAttribute('aria-disabled', 'true');
  };
  S.transferSaved = function () {
    return '<section class="fx saved-screen">' + U.back() + '<span class="check-circle"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="saved-title">' + (U.page() ? U.pageText() + '에 저장했어요' : '읽은 위치를 저장했어요') + '</h2>' +
      bookCard(savedLine()) + (state.onTripNote ? '<p class="saved-memo">메모 · ' + esc(state.onTripNote) + '</p>' : '') + U.actions('다음 지하철에서 이어 읽기', 'transfer-saved-continue', '활동 그만하기', 'stop-waiting') + '</section>';
  };

  /* ---------- waiting / return ---------- */
  S.lockScreen = function () {
    return '<section class="fx wait-screen">' + U.back() + '<span class="wait-circle"><img src="./assets/icons/transfer/train.svg" alt="" width="64" height="64"></span><div class="wait-copy"><h2><span class="dots">···</span><br>다음 지하철 탑승을<br>기다리고 있어요</h2><p>탑승이 감지되면<br>이어 읽을 수 있도록 알려드릴게요.</p><p class="wait-hint">지금은 아무것도 하지 않아도 괜찮아요.</p></div>' +
      '<div class="wait-saved">' + U.logo(40) + '<span><strong>' + esc(U.contentTitle()) + '</strong><small>' + esc(U.resumeText()) + '</small></span></div>' +
      U.actions('지금 바로 이어 읽기', 'start-now-from-transfer', '활동 그만하기', 'stop-waiting', { primaryCls: 'btn btn-secondary' }) + '</section>';
  };

  /* ---------- lock-screen pushes ---------- */
  function lock(action, title, body) {
    return '<section class="fx lock-screen"><p class="lock-date">10월 15일 (목)</p><p class="lock-time">' + U.fmtClock(App.data.trip.startMin + U.simOffset()) + '</p>' +
      '<button type="button" class="notif notif-lock" data-action="' + action + '">' + U.logo(40) + '<span><span class="notif-head"><b>' + esc(U.bookService()) + '</b><time>지금</time></span><strong>' + title + '</strong><span class="notif-body">' + body + '</span></span></button>' +
      '<i class="lock-key lock-left"></i><i class="lock-key lock-right"></i></section>';
  }
  S.departureNotice = function () { return lock('home', '지금 출발하셨네요!', '약 ' + U.routeMin() + '분 동안 ' + esc(U.isBook(state.journeyActivity) || !state.journeyActivity ? U.contentTitle('책 읽기') + ' 읽기를' : U.activityLabel(state.journeyActivity) + '를') + ' 진행해볼까요?'); };
  S.boardingNotice = function () { return lock('continue-after-transfer', '탑승이 감지됐어요', esc(U.contentTitle()) + ' · ' + esc(U.resumeText()) + '를 시작할까요?'); };

  /* ---------- arrival ---------- */
  S.arrival = function () {
    var r = state.lastSummary || App.buildSummary('arrival'), area = U.destAddress(), book = U.isBook(state.journeyActivity);
    return '<section class="fx arrival-screen">' + U.back() + '<span class="check-circle check-small"><svg width="25" height="25" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="arrival-title">도착했어요!</h2><p class="arrival-desc">' + (area ? esc(area) + '에' : '목적지에') + ' 도착했어요.</p>' +
      '<div class="book-card book-card-compact">' + U.logo(62) + '<div><small>' + U.activityLabel(state.journeyActivity) + '</small><strong>' + esc(U.contentTitle()) + '</strong>' + (book && U.page() ? '<small>마지막 읽은 위치 · ' + U.pageText() + '</small>' : '') + '</div></div>' +
      '<dl class="arrival-facts"><div><dt>활동 진행 시간</dt><dd>' + r.minutes + '분</dd></div><div><dt>최근 활동 시각</dt><dd>' + esc(U.fmtAmPm(r.endMin)) + '</dd></div><div><dt>활동 재개 (이어간 횟수)</dt><dd>' + Number(state.resumeCount || 0) + '회</dd></div></dl></section>';
  };
  SH.arrival = function () {
    return U.sheet('<div class="sheet-actions">' + U.btn('이동 마무리하기', 'to-record-method', 'btn btn-primary') + U.btn('도착 후에도 계속하기', 'continue-after-arrival', 'btn btn-text') + '</div>', { dim: false, label: '도착', cls: 'sheet-footer' });
  };

  /* ---------- journey helpers + actions ---------- */
  /* Snapshot of one trip. Times: startTime/endTime/totalMinutes describe the trip, `minutes` only the time spent on the activity. */
  App.buildSummary = function (at) {
    var T = App.data.trip, off = at === 'arrival' ? U.tripTotal() : U.simOffset(), book = U.isBook(state.journeyActivity);
    var summary = {
      dateKey: App.SIM_TODAY, activity: state.journeyActivity || '책 읽기', contentTitle: U.contentTitle(), totalMinutes: off, minutes: U.activityMinutesAt(off),
      startTime: U.fmt(T.startMin), endTime: U.fmt(T.startMin + off), endMin: T.startMin + off,
      departure: state.departure, destination: state.destination, service: U.bookService(), resumeCount: Number(state.resumeCount || 0),
      startPage: book ? Number(state.tripStartPage) || 0 : null, endPage: book ? U.page() : null
    };
    state.lastSummary = summary; return summary;
  };
  function prepareJourney(activity) {
    if (activity !== undefined) state.journeyActivity = activity || state.journeyActivity;
    if (!state.journeyActivity) state.journeyActivity = journeyChoices()[0];
    state.journeyStarted = true; state.resumeCount = 0; state.elapsed = 0; state.satisfaction = 0; state.photo = '';
    state.transferHandled = false; state.transferStopped = false; state.resumePending = false; state.onTripNote = ''; state.endPositionInput = ''; state.pageDraft = ''; state.recordPhotoOpen = false; state.recordPhotoSheet = false; state.lastSummary = null;
    state.tripStartPage = U.isBook(state.journeyActivity) ? String(U.page() || '') : '';
    state.readerPhase = 'active'; state.readerTarget = 'transfer'; state.islandExpanded = false;
  }
  App.prepareJourney = prepareJourney;
  function openRoute() {
    var h = state.places.find(function (p) { return p.kind === 'home'; }), w = state.places.find(function (p) { return p.kind === 'work'; });
    if (!state.departure) state.departure = h ? h.name : '집';
    if (!state.destination) state.destination = w ? w.name : '회사';
    state.showRoutes = false; App.go('route');
  }
  App.launchReader = function () {
    if (!state.journeyStarted) prepareJourney();
    state.islandExpanded = false; state.readerPhase = 'active'; state.readerTarget = 'transfer';
    App.go('readingLoading');
    App.timers.launch = setTimeout(function () { if (state.screen === 'readingLoading') App.enterReader(); }, 1500);
  };
  /* Reading starts with the compact "● 활동 중" island. */
  App.enterReader = function () { state.islandExpanded = false; state.readerPhase = 'active'; state.readerTarget = 'transfer'; App.go('millie'); };
  /* Coming back after a transfer restores the SAME e-book activity at the SAVED page; the user confirms with "이어 읽기". */
  App.resumeReading = function () { state.transferHandled = true; state.islandExpanded = false; state.readerPhase = 'active'; state.readerTarget = 'destination'; state.resumePending = true; state.resumeCount = Number(state.resumeCount || 0) + 1; App.go('resume'); };

  A['open-home-route'] = openRoute;
  A['start-today'] = function () { if (state.hasActiveJourney) { App.go('resume'); return; } openRoute(); };
  A['recent-detail'] = function () { var r = U.lastRecord(); if (r) { state.selectedDate = r.dateKey; state.calendarMonth = r.dateKey.slice(0, 7) + '-01'; App.go('calendar'); } };
  A['source-home-add'] = function () { state.homePlaceQuery = ''; state.homePlaceChoice = ''; App.go('homePlace'); };
  A['choose-home-place'] = function (t) { state.homePlaceChoice = t.dataset.value; App.save(); App.refreshHomePlaceResults(); };
  A['confirm-home-place'] = function () {
    var choice = state.homePlaceChoice || state.homePlaceQuery || (document.querySelector('.place-result span') || {}).textContent;
    if (!choice) { App.toast('장소를 검색해 주세요.'); return; }
    if (!state.places.some(function (p) { return p.name === choice; })) {
      if (state.places.filter(function (p) { return p.kind === 'custom'; }).length >= 5) { App.toast('장소는 최대 5개까지 등록할 수 있어요.'); return; }
      state.places.push({ name: choice, kind: 'custom', address: choice });
    }
    state.destination = choice; App.go('home'); App.toast(choice + ' 등록 완료');
  };
  A['route-confirm'] = function () { App.go('routeConfirm'); };
  A['toggle-routes'] = function () { state.showRoutes = !state.showRoutes; App.save(); App.render(); };
  A['pick-route'] = function (t) { state.route = Number(t.dataset.index); state.showRoutes = false; App.save(); App.render(); };
  A['choose-location'] = function (t) {
    App.openModal(t.dataset.kind === 'home' ? '출발 장소 선택' : '목적지 선택', '등록된 장소를 선택할 수 있어요.', '<div class="modal-list">' + state.places.map(function (p, i) { return '<button type="button" class="modal-row" data-action="set-location" data-kind="' + t.dataset.kind + '" data-index="' + i + '"><span>' + esc(p.name) + '<small>' + esc(U.areaOf(p.address || p.name) || (p.kind === 'home' ? '집' : p.kind === 'work' ? '회사' : '자주 가는 장소')) + '</small></span><b>선택</b></button>'; }).join('') + '</div>');
  };
  A['set-location'] = function (t) { var p = state.places[Number(t.dataset.index)]; if (p) { if (t.dataset.kind === 'home') state.departure = p.name; else state.destination = p.name; App.save(); App.closeModal(); App.render(); } };
  A['open-map-apps'] = function () { App.go('mapApps'); };
  A['pick-map-app'] = function (t) { state.mapApp = t.dataset.value; App.save(); App.render(); };
  A['open-map-app'] = function () { App.toast(state.mapApp + ' 연결은 시뮬레이션입니다. 경로 화면으로 돌아갑니다.'); App.go('route'); };
  A['cancel-map-app'] = function () { App.go('route'); };
  A['to-journey-activity'] = function () { App.go('journeyActivity'); };
  A['pick-journey-activity'] = function (t) { state.journeyActivity = t.dataset.value; App.save(); App.render(); };
  A['start-now'] = function () { prepareJourney(state.journeyActivity); App.go('activityStart'); };
  A['start-without-activity'] = function () { prepareJourney(state.journeyActivity || journeyChoices()[0]); App.go('activityStart'); };
  A['start-activity'] = function () { App.launchReader(); };
  A['cancel-reader'] = function () { clearTimeout(App.timers.launch); state.islandExpanded = false; App.go('activityStart'); };
  A['open-moving-detail'] = function () { App.go('route'); };
  function onReader() { return state.screen === 'millie' || state.screen === 'resume'; }
  /* Any island state can be tapped to expand; the phase clock keeps running. */
  A['toggle-island'] = function () { if (onReader()) { state.islandExpanded = !state.islandExpanded; App.save(); App.render(); } };
  A['collapse-island'] = function () { if (onReader() && state.islandExpanded) { state.islandExpanded = false; App.save(); App.render(); } };
  /* "읽은 위치 기록" = pause the current e-book activity only and ask where the user stopped. The journey itself stays alive. */
  A['return-from-reader'] = function () {
    state.islandExpanded = false; state.transferHandled = true; state.transferStopped = true; state.pageDraft = state.currentReadingPage ? String(state.currentReadingPage) : '';
    App.go('transferRecord');
  };
  /* Save = the typed page becomes THE reading position; the memo is stored separately (onTripNote). */
  A['save-transfer-record'] = function () {
    var n = parseInt(state.pageDraft, 10);
    if (!(n > 0)) { App.toast('읽은 쪽수를 숫자로 입력해 주세요.'); var el = document.getElementById('page-draft'); if (el) el.focus(); return; }
    state.currentReadingPage = String(n); App.go('transferSaved');
  };
  A['skip-transfer-record'] = function () { state.onTripNote = ''; App.go('lockScreen'); };
  A['transfer-saved-continue'] = function () { App.go('lockScreen'); };
  A['continue-after-transfer'] = function () { App.resumeReading(); };
  A['start-now-from-transfer'] = function () { App.resumeReading(); };
  A['start-resume'] = function () { state.resumePending = false; App.save(); App.render(); App.restartReaderClock(); };
  /* "활동 그만하기" / 이용 종료: ends the reading ACTIVITY (not the trip home). It leads to the same wrap-up as arriving:
     마무리했어요 → 오늘의 기록 → 결과 → 홈. Nothing is saved until the record step is finished (or "홈으로" is chosen on the wrap-up screen). */
  App.endJourney = function () {
    if (!state.journeyStarted) { App.toast('진행 중인 이동이 없어요.'); return; }
    App.buildSummary(); state.islandExpanded = false; App.go('end');
  };
  A['stop-waiting'] = function () { App.endJourney(); };
  A['show-arrival-summary'] = function () { App.buildSummary('arrival'); App.go('arrival'); };
  /* 도착 → "이동 마무리하기" → "오늘 이동을 마무리했어요!" (the record screen follows from there) */
  A['to-record-method'] = function () { if (!state.lastSummary) App.buildSummary('arrival'); App.go('end'); };
  A['continue-after-arrival'] = function () { state.elapsed = Number(state.elapsed || 0) + 10; App.resumeReading(); };
  A['resume-journey'] = function () { App.go('resume'); };

  /* researcher simulator — these only drive the situation; they never show a message inside the phone screen */
  A['sim-depart'] = function () { App.go('departureNotice'); App.wbLog('출발 감지'); };
  /* 환승 직전: jump the island to "곧 환승해요" on the reading screen. Any leftover toast is cleared so no contradicting message stays. */
  A['sim-transfer'] = function () {
    if (!state.journeyStarted) prepareJourney();
    App.hideToast(); state.readerTarget = 'transfer'; state.readerPhase = '1'; state.islandExpanded = false; // the Figma "다음 역에서 환승해요" state
    if (onReader()) { App.save(); App.render(); App.restartReaderClock(); } else App.go('millie');
    App.wbLog('환승 직전');
  };
  A['sim-boarding'] = function () { if (!state.journeyStarted) prepareJourney(); state.transferStopped = true; App.go('boardingNotice'); App.wbLog('탑승 감지'); };
  A['sim-destination'] = function () { if (!state.journeyStarted) prepareJourney(); App.buildSummary('arrival'); App.go('arrivalNotice'); App.wbLog('목적지 도착'); };
  A['sim-time'] = function () { state.elapsed = Number(state.elapsed || 0) + 10; App.save(); App.renderIsland(); App.wbLog('이동 시간 +10분 (총 ' + U.tripTotal() + '분)'); };
  A['end-use'] = function () { App.endJourney(); App.wbLog('이용 종료'); };
})();
