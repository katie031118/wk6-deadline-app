/* Home → route → reading → transfer → return → arrival.
   Layout numbers come from the latest Figma Mid-fi frames (402 × 874, device-origin coordinates). */
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

  /* ---------- home ---------- */
  function tabBar() {
    var tabs = [['home', '홈'], ['open-calendar', '캘린더'], ['edit-activities', '활동'], ['open-account', '내 정보']];
    return '<nav class="tabbar">' + tabs.map(function (t) { return '<button type="button" class="tab-dot" data-action="' + t[0] + '" aria-label="' + t[1] + '"></button>'; }).join('') + '</nav>';
  }
  S.home = function () {
    var r = U.lastRecord(), returning = state.hasPreviousActivity && r;
    var recentLabel = r && r.dateKey === App.SIM_TODAY ? '오늘' : (r ? Number(r.dateKey.slice(5, 7)) + '/' + Number(r.dateKey.slice(8)) : '');
    var card = returning
      ? '<section class="home-card"><div class="home-card-head"><h3>최근 진행중인 활동</h3><button type="button" class="chip-btn" data-action="recent-detail">자세히보기 &gt;</button></div>' +
        '<div class="home-card-body">' + U.logo(62) + '<div><small>' + esc(U.activityLabel(r.activity)) + '</small><strong>' + esc(r.contentTitle || U.contentTitle(r.activity)) + '</strong><small>마지막 활동 · ' + recentLabel + ' ' + esc(r.endTime || '') + '</small><small>최근 활동 시간 · ' + Number(r.minutes || 0) + '분</small></div></div></section>'
      : '<section class="home-card home-card-empty"><div class="home-card-head"><h3>최근 진행중인 활동</h3></div><div class="home-empty"><img src="./assets/icons/places/add.svg" alt="" width="32" height="32"><strong>아직 진행중인 활동이 없어요.</strong><small>이동을 시작하면 상황에 맞는 활동을 제안해드릴게요.</small></div></section>';
    return '<section class="fx home-screen"><div class="home-content"><h2 class="home-greeting">' + esc(U.nickname()) + '님,<br>오늘 활동을 ' + (returning ? '이어가볼까요?' : '시작해볼까요?') + '</h2>' + card +
      '<section class="home-places"><h3>즐겨찾는 장소</h3><button type="button" class="place-card" data-action="open-home-route"><i class="place-icon"></i><strong>집 ↔ 회사</strong><small>강남구 ↔ 강남역</small><small>약 56분 · 지하철+도보</small></button>' + U.btn('+ 장소 추가하기', 'source-home-add', 'btn btn-secondary') + '</section></div>' +
      U.btn('오늘의 활동 시작하기', 'start-today', 'btn btn-primary home-start') + tabBar() + '</section>';
  };
  S.homePlace = S.home;
  SH.homePlace = function () {
    var names = state.places.length ? state.places.map(function (p) { return p.name; }) : App.data.mockPlaces.slice(0, 2);
    var q = state.homePlaceQuery, results = names.concat(App.data.mockPlaces).filter(function (n, i, arr) { return arr.indexOf(n) === i && (!q || n.indexOf(q) >= 0); }).slice(0, 2);
    if (!results.length && q) results = [q];
    return U.sheet('<h2 class="sheet-title">즐겨찾는 장소 추가</h2><label class="search-input"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" stroke="#7c7c7c" stroke-width="2"/><path d="M15.5 15.5L21 21" stroke="#7c7c7c" stroke-width="2" stroke-linecap="round"/></svg><input data-bind="homePlaceQuery" value="' + esc(q) + '" placeholder="장소를 검색해보세요" aria-label="즐겨찾는 장소 검색"></label>' +
      '<h3 class="sheet-label">최근 검색</h3><div class="place-results" id="home-place-results">' + homePlaceResults(results) + '</div>' + U.btn('이 장소로 선택하기', 'confirm-home-place', 'btn btn-primary'), { close: 'home', label: '즐겨찾는 장소 추가', cls: 'sheet-tall' });
  };
  function homePlaceResults(results) {
    return results.map(function (n) { return '<button type="button" class="place-result" data-action="choose-home-place" data-value="' + esc(n) + '" aria-pressed="' + (state.homePlaceChoice === n) + '"><i class="ph-circle"></i><span>' + esc(n) + '</span></button>'; }).join('');
  }
  App.refreshHomePlaceResults = function () {
    var box = document.getElementById('home-place-results'); if (!box) return;
    var q = state.homePlaceQuery, names = (state.places.length ? state.places.map(function (p) { return p.name; }) : App.data.mockPlaces.slice(0, 2)).concat(App.data.mockPlaces);
    var res = names.filter(function (n, i, arr) { return arr.indexOf(n) === i && (!q || n.indexOf(q) >= 0); }).slice(0, 2);
    if (!res.length && q) res = [q];
    box.innerHTML = homePlaceResults(res);
  };

  /* ---------- route ---------- */
  function routeBase() {
    var dest = U.destLabel(), options = '';
    if (state.showRoutes) {
      options = '<div class="route-list">' + [['버스 · 지하철', '56분', '도보 8분 · 환승 1회'], ['지하철', '61분', '도보 5분 · 환승 2회'], ['버스', '68분', '도보 11분 · 환승 없음']].map(function (r, i) {
        return '<button type="button" class="route-option ' + (state.route === i ? 'selected' : '') + '" data-action="pick-route" data-index="' + i + '"><span><strong>' + r[0] + '</strong><small>' + r[2] + '</small></span><b>' + r[1] + '</b></button>';
      }).join('') + '</div>';
    }
    return U.back() + '<h2 class="fx-title">' + esc(U.direction(dest)) + ' 이동할까요?</h2>' +
      '<div class="place-row"><span class="place-circle"><img src="./assets/icons/route/imgGriddyIconsEnterpriseFilled.svg" alt="" width="40" height="40"></span><div><strong>' + esc(dest) + '</strong><small>' + esc(U.destAddress()) + '</small></div><button type="button" class="chip-btn chip-outline" data-action="choose-location" data-kind="work">장소 변경</button></div>' +
      '<div class="route-head"><h3>평소 이용 경로</h3><button type="button" data-action="toggle-routes">편집</button></div>' +
      (options || '<div class="route-card"><strong>약 56분</strong><span>지금 출발 · 오후 6:20 도착예상</span><img src="./assets/images/route/imgImage7.png" alt="경로 미리보기" width="250" height="319"></div>');
  }
  S.route = function () { return '<section class="fx route-screen">' + routeBase() + '</section>'; };
  SH.route = function () {
    return U.sheet(U.btn('이 경로로 출발하기', 'route-confirm', 'btn btn-primary') + '<button type="button" class="route-link" data-action="open-map-apps"><i class="ph-circle ph-40"></i><span><strong>다른 경로가 필요하신가요?</strong><small>지도 앱에서 새로운 경로를 확인해보세요.</small></span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="#1c1b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>', { dim: false, label: '경로 선택' });
  };
  S.routeConfirm = S.route;
  SH.routeConfirm = function () {
    return U.sheet('<span class="confirm-check"><i></i><svg width="30" height="30" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="sheet-hero">저장된 경로로<br>출발할게요!</h2><p class="sheet-desc">약 56분의 이동 시간이 예상돼요.<br>원한다면 이동 중 할 활동을 선택할 수 있어요.</p><div class="sheet-actions">' + U.btn('활동 선택하기', 'to-journey-activity', 'btn btn-primary') + U.btn('나중에 선택하기', 'start-without-activity', 'btn btn-text') + '</div>', { close: 'back', label: '저장된 경로', cls: 'sheet-center sheet-confirm' });
  };
  S.mapApps = function () {
    return '<section class="fx">' + U.back() + '<div class="fx-head"><h2>다른 경로를 찾아볼까요?</h2><p>선호하는 지도 앱에서 새로운 경로를 확인할 수 있어요.</p></div><div class="option-list map-list">' +
      ['네이버 지도', '카카오맵', '티맵', 'Google Maps'].map(function (app) { return '<button type="button" class="option ' + (state.mapApp === app ? 'selected' : '') + '" data-action="pick-map-app" data-value="' + app + '" aria-pressed="' + (state.mapApp === app) + '"><strong>' + app + '에서 열기</strong><i class="radio"></i></button>'; }).join('') + '</div>' +
      U.actions('이 앱으로 열기', 'open-map-app', '나중에 선택하기', 'cancel-map-app') + '</section>';
  };

  /* ---------- activity choice / start / loading ---------- */
  function journeyChoices() {
    var p = state.progressItems, list = [];
    if (p.bookOn) list.push('책 읽기'); if (p.ottOn) list.push('OTT 보기'); if (p.workOn) list.push('업무 · 과제');
    if (!list.length) list = state.selectedActivities.slice(0, 3);
    if (!list.length) list = ['책 읽기'];
    return list;
  }
  S.journeyActivity = function () {
    var list = journeyChoices();
    if (list.indexOf(state.journeyActivity) < 0) state.journeyActivity = list[0];
    return '<section class="fx">' + U.back() + '<div class="fx-head"><h2>이동 중 어떤 활동을<br>진행할까요?</h2><p>약 56분의 시간을 이렇게 활용해보세요.</p></div><div class="option-list choice-list">' +
      list.slice(0, 3).map(function (a) {
        var on = state.journeyActivity === a;
        return '<button type="button" class="option option-card ' + (on ? 'selected' : '') + '" data-action="pick-journey-activity" data-value="' + esc(a) + '" aria-pressed="' + on + '">' + U.logo(62) + '<span class="option-copy"><small>' + esc(U.activityLabel(a)) + '</small><strong>' + esc(U.contentTitle(a)) + '</strong><em>약 40~50분</em></span><i class="radio"></i></button>';
      }).join('') + '</div>' + U.actions('이 활동으로 선택하기', 'start-now', '나중에 선택하기', 'start-without-activity') + '</section>';
  };
  S.activityStart = function () {
    var label = U.activityLabel(state.journeyActivity), title = U.contentTitle();
    return '<section class="fx start-screen">' + U.back() + '<span class="start-circle"><img src="./assets/icons/transfer/train.svg" alt="" width="64" height="64"></span>' +
      '<div class="start-copy"><h2>' + esc(U.direction(U.destLabel())) + ' 이동을 시작했어요!</h2><p>약 56분동안<br>' + esc(U.isBook(state.journeyActivity) ? title + josaEulReul(title) + ' 읽어볼까요?' : label + '를 이어서 진행해볼까요?') + '</p></div>' +
      '<div class="trip-card"><i class="trip-line"></i><div><i class="dot"></i><span><small>현재 위치</small><strong>' + esc(state.departure === '집' ? '서울 강남구 역삼동' : (state.departure || '서울 강남구 역삼동')) + '</strong></span></div><div><i class="dot"></i><span><small>도착 예정</small><strong>' + esc(U.destLabel()) + ' (' + esc(U.destAddress()) + ')</strong></span></div></div>' +
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
      (opts.badge ? '<span class="badge reader-badge" style="top:' + (opts.expanded ? 332 : 292) + 'px">여기서부터 이어 읽기 · ' + U.pausePos() + U.unit() + '</span>' : '') +
      '<p class="reader-note">' + esc(U.bookService()) + ' 앱 화면</p>';
  }
  /* The reading screen never changes while time passes — only the Dynamic Island does (see islandModel). */
  S.millie = function () { return '<section class="fx reader">' + readerBody({ expanded: state.islandExpanded }) + '</section>'; };
  S.resume = function () { return '<section class="fx reader">' + readerBody({ badge: true, expanded: state.islandExpanded }) + '</section>'; };
  S.arrivalNotice = function () {
    return '<section class="fx reader">' + readerBody() + '</section>';
  };
  /* Island content for the current reader phase. phases: active → 3 → 2 → 1 → soon; target: transfer | destination. */
  App.islandModel = function () {
    var dest = state.readerTarget === 'destination', noun = dest ? '도착' : '환승', ph = state.readerPhase || 'active', resumed = state.screen === 'resume';
    var m = { minutes: (resumed ? 18 : 12) + Number(state.elapsed || 0), dest: dest };
    if (ph === 'active') { m.label = '활동 중'; m.time = resumed ? '15:34' : '12:34'; m.icon = ''; m.remain = noun + '까지 4분'; }
    else if (ph === 'soon') { m.label = dest ? '곧 도착해요' : '곧 환승해요'; m.time = ''; m.icon = dest ? 'location' : 'train'; m.remain = m.label; }
    else { m.label = '활동 중 · ' + noun + ' ' + ph + '분'; m.time = ''; m.icon = ''; m.remain = noun + '까지 ' + ph + '분'; }
    return m;
  };
  function pill(m) {
    return '<button type="button" class="isl-pill" data-action="toggle-island" aria-label="' + esc(m.label) + ' — 활동 상태 펼치기"><span class="isl-dot">' + (m.icon ? icon('island', m.icon, 14, 14) : '') + '</span><span class="isl-label">' + esc(m.label) + '</span>' + (m.time ? '<time>' + m.time + '</time>' : '') + '</button>';
  }
  function expandedIsland(m) {
    return '<div class="isl-backdrop" data-action="collapse-island" aria-hidden="true"></div><div class="isl-live"><div class="isl-live-top"><i></i><span>활동 중</span><time>' + (m.time || (state.screen === 'resume' ? '15:34' : '12:34')) + '</time></div>' + U.logo(56, 'isl-logo') +
      '<strong>전자책 읽기</strong><small>' + esc(U.contentTitle()) + ' · 이번 활동 ' + m.minutes + '분째</small><small class="isl-remain">' + esc(m.remain) + '</small><button type="button" class="isl-stop" data-action="return-from-reader" aria-label="전자책 활동 중단"><b></b></button></div>';
  }
  IS.millie = IS.resume = function () { var m = App.islandModel(); return state.islandExpanded ? expandedIsland(m) : pill(m); };
  function banner(action, title, body) {
    return '<button type="button" class="notif" data-action="' + action + '">' + U.logo(40) + '<span><span class="notif-head"><b>' + esc(U.bookService()) + '</b><time>지금</time></span><strong>' + title + '</strong><span class="notif-body">' + body + '</span></span></button>';
  }
  IS.arrivalNotice = function () {
    return banner('show-arrival-summary', '곧 목적지에 도착해요 · 1분 후', '읽던 위치를 남기고 이동을 마무리할 준비를 해보세요.');
  };

  /* ---------- transfer record / saved ---------- */
  S.transferRecord = function () { return '<section class="fx reader">' + readerBody() + '</section>'; };
  SH.transferRecord = function () {
    var image = state.transferRecordMode === 'image', pos = U.pausePos() + U.unit();
    return U.sheet(badge('환승 준비') + '<div class="sheet-head"><h2>어디까지 읽었나요?</h2><p>환승 후 이어 읽을 수 있게 저장할게요.</p></div>' + bookCard(esc(U.bookService()) + ' · ' + pos + ' 까지 읽었어요') +
      '<h3 class="sheet-label">원하는 방식으로 기록해주세요.</h3><div class="option-list">' +
      '<button type="button" class="option ' + (image ? 'selected' : '') + '" data-action="record-mode" data-value="image" aria-pressed="' + image + '"><span class="option-copy"><strong>이미지 올리기</strong><em>지금 보고 있는 페이지를 찍어주세요.</em></span><i class="radio"></i></button>' +
      '<button type="button" class="option ' + (!image ? 'selected' : '') + '" data-action="record-mode" data-value="note" aria-pressed="' + !image + '"><span class="option-copy"><strong>간단히 메모하기</strong><em>한 줄 메모로 기록해요.</em></span><i class="radio"></i></button>' +
      (!image ? '<textarea class="note-input" data-bind="onTripNote" placeholder="메모" aria-label="환승 메모">' + esc(state.onTripNote || '') + '</textarea>' : '') + '</div>' +
      '<div class="sheet-actions">' + U.btn('저장하고 닫기', 'save-transfer-record', 'btn btn-primary') + U.btn('기록하지 않고 닫기', 'skip-transfer-record', 'btn btn-text') + '</div>', { close: 'skip-transfer-record', label: '읽은 위치 기록', cls: 'sheet-tall' });
  };
  S.transferSaved = function () {
    return '<section class="fx saved-screen">' + U.back() + '<span class="check-circle"><svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="saved-title">기록이 저장되었어요!</h2>' +
      bookCard(esc(U.bookService()) + ' · ' + U.pausePos() + U.unit() + ' 까지 읽었어요') + U.actions('다른 구간에서 이어하기', 'transfer-saved-continue', '닫기', 'transfer-saved-close') + '</section>';
  };

  /* ---------- waiting / return ---------- */
  function waitBody() {
    return U.back() + '<span class="wait-circle"><img src="./assets/icons/transfer/train.svg" alt="" width="64" height="64"></span><div class="wait-copy"><h2><span class="dots">···</span><br>탑승 대기중</h2><p>탑승이 감지되면<br>알림으로 알려드릴게요.</p></div>';
  }
  S.lockScreen = function () { return '<section class="fx wait-screen">' + waitBody() + U.actions('지금 시작하기', 'start-now-from-transfer', '여기서 그만할게요', 'stop-waiting') + '</section>'; };
  S.boarding = function () { return '<section class="fx wait-screen">' + waitBody() + '</section>'; };
  SH.boarding = function () {
    var title = U.contentTitle();
    return U.sheet(badge('잠시 멈춤 · 16:20') + '<div class="sheet-head"><h2>아까 읽던 ' + esc(title) + ',<br>지금 바로 읽을까요?</h2><p>탑승까지 약 2분 남았어요.</p></div>' + bookCard(esc(U.bookService()) + ' · ' + U.pausePos() + U.unit() + ' 까지 읽었어요') +
      '<div class="sheet-actions">' + U.btn(esc(U.bookService()) + '로 돌아가기', 'continue-after-transfer', 'btn btn-primary') + U.btn('탑승 후 이어 읽기', 'wait-for-boarding', 'btn btn-text') + '</div>', { close: 'wait-for-boarding', label: '이어 읽기 선택', cls: 'sheet-boarding' });
  };

  /* ---------- lock-screen pushes ---------- */
  function lock(action, title, body) {
    return '<section class="fx lock-screen"><p class="lock-date">10월 15일 (목)</p><p class="lock-time">8:34</p>' +
      '<button type="button" class="notif notif-lock" data-action="' + action + '">' + U.logo(40) + '<span><span class="notif-head"><b>' + esc(U.bookService()) + '</b><time>지금</time></span><strong>' + title + '</strong><span class="notif-body">' + body + '</span></span></button>' +
      '<i class="lock-key lock-left"></i><i class="lock-key lock-right"></i></section>';
  }
  S.departureNotice = function () { return lock('home', '지금 출발하셨네요!', '약 56분 동안 ' + esc(U.isBook(state.journeyActivity) || !state.journeyActivity ? U.contentTitle('책 읽기') + ' 읽기를' : U.activityLabel(state.journeyActivity) + '를') + ' 진행해볼까요?'); };
  S.boardingNotice = function () { return lock('continue-after-transfer', '탑승이 감지됐어요', esc(U.contentTitle()) + ' 이어 읽기를 시작할까요?'); };

  /* ---------- arrival ---------- */
  S.arrival = function () {
    var r = state.lastSummary || {};
    return '<section class="fx arrival-screen">' + U.back() + '<span class="check-circle check-small"><svg width="25" height="25" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span><h2 class="arrival-title">도착했어요!</h2><p class="arrival-desc">' + esc(U.destAddress() === '강남역' ? '강남역' : U.destAddress()) + '에 도착했어요.</p>' +
      '<div class="book-card book-card-compact">' + U.logo(62) + '<div><small>' + U.activityLabel(state.journeyActivity) + '</small><strong>' + esc(U.contentTitle()) + '</strong></div></div>' +
      '<dl class="arrival-facts"><div><dt>활동 시간</dt><dd>' + (r.minutes || U.minutes()) + '분</dd></div><div><dt>마지막 활동</dt><dd>' + esc(r.endTime || '09:51') + '</dd></div><div><dt>활동 재개 (이어간 횟수)</dt><dd>' + Number(state.resumeCount || 0) + '회</dd></div></dl>' +
      '<h3 class="arrival-q">원래 하려던 활동을 이어가는 데<br>얼마나 도움이 되었나요?</h3><div class="rating-row">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-action="rate-helpfulness" data-value="' + n + '" aria-label="도움 정도 ' + n + '점" aria-pressed="' + (state.helpfulness === n) + '">' + n + '</button>'; }).join('') + '</div><div class="rating-labels"><span>매우 아쉬워요</span><span>매우 만족스러워요</span></div></section>';
  };
  SH.arrival = function () {
    return U.sheet('<div class="sheet-actions">' + U.btn('이동 마무리하기', 'to-record-method', 'btn btn-primary') + U.btn('도착 후에도 계속하기', 'continue-after-arrival', 'btn btn-text') + '</div>', { dim: false, label: '도착', cls: 'sheet-footer' });
  };

  /* ---------- journey helpers + actions ---------- */
  App.buildSummary = function () {
    var summary = {
      dateKey: App.SIM_TODAY, activity: state.journeyActivity || '책 읽기', contentTitle: U.contentTitle(), minutes: U.minutes(),
      departure: state.departure, destination: state.destination, startTime: '08:34', endTime: '09:51', service: U.bookService(),
      resumeCount: Number(state.resumeCount || 0), startPosition: U.startPos(), endPosition: (Number(state.pausePosition) || U.startPos() + 14) + 16
    };
    state.lastSummary = summary; return summary;
  };
  function prepareJourney(activity) {
    if (activity !== undefined) state.journeyActivity = activity || state.journeyActivity;
    if (!state.journeyActivity) state.journeyActivity = journeyChoices()[0];
    state.journeyStarted = true; state.resumeCount = 0; state.elapsed = 0; state.satisfaction = 0; state.helpfulness = 0; state.photo = '';
    state.transferHandled = false; state.pausePosition = 0; state.onTripNote = ''; state.endPositionInput = ''; state.recordPhotoOpen = false; state.recordPhotoSheet = false; state.lastSummary = null;
    state.transferRecordMode = 'image'; state.startPosition = U.isBook(state.journeyActivity) ? (Number(state.progressItems.bookPosition) || 0) : 0;
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
  /* Coming back after a transfer restores the SAME e-book activity (journey state is kept) and heads for the destination. */
  App.resumeReading = function () { state.transferHandled = true; state.islandExpanded = false; state.readerPhase = 'active'; state.readerTarget = 'destination'; state.resumeCount = Number(state.resumeCount || 0) + 1; App.go('resume'); };

  A['open-home-route'] = openRoute;
  A['start-today'] = function () { if (state.hasActiveJourney) { App.go('resume'); return; } openRoute(); };
  A['recent-detail'] = function () { var r = U.lastRecord(); if (r) { state.selectedDate = r.dateKey; state.calendarMonth = r.dateKey.slice(0, 7) + '-01'; App.go('calendar'); } };
  A['source-home-add'] = function () { state.homePlaceQuery = ''; state.homePlaceChoice = ''; App.go('homePlace'); };
  A['choose-home-place'] = function (t) { state.homePlaceChoice = t.dataset.value; App.save(); App.refreshHomePlaceResults(); };
  A['confirm-home-place'] = function () {
    var choice = state.homePlaceChoice || state.homePlaceQuery || (document.querySelector('.place-result span') || {}).textContent;
    if (!choice) { App.toast('장소를 검색해 주세요.'); return; }
    if (!state.places.some(function (p) { return p.name === choice; })) {
      if (state.places.filter(function (p) { return p.kind === 'custom'; }).length >= 5) { App.toast('즐겨찾는 장소는 최대 5개까지 등록할 수 있어요.'); return; }
      state.places.push({ name: choice, kind: 'custom', address: choice });
    }
    state.destination = choice; App.go('home'); App.toast(choice + ' 등록 완료');
  };
  A['route-confirm'] = function () { App.go('routeConfirm'); };
  A['toggle-routes'] = function () { state.showRoutes = !state.showRoutes; App.save(); App.render(); };
  A['pick-route'] = function (t) { state.route = Number(t.dataset.index); state.showRoutes = false; App.save(); App.render(); };
  A['choose-location'] = function (t) {
    App.openModal(t.dataset.kind === 'home' ? '출발 장소 선택' : '목적지 선택', '등록된 장소를 선택할 수 있어요.', '<div class="modal-list">' + state.places.map(function (p, i) { return '<button type="button" class="modal-row" data-action="set-location" data-kind="' + t.dataset.kind + '" data-index="' + i + '"><span>' + esc(p.name) + '<small>' + (p.kind === 'home' ? '집' : p.kind === 'work' ? '회사' : '자주 가는 장소') + '</small></span><b>선택</b></button>'; }).join('') + '</div>');
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
  /* Any island state (activity / 환승 N분 / 곧 환승해요 / 도착 …) can be tapped to expand; the phase clock keeps running. */
  A['toggle-island'] = function () { if (onReader()) { state.islandExpanded = !state.islandExpanded; App.save(); App.render(); } };
  A['collapse-island'] = function () { if (onReader() && state.islandExpanded) { state.islandExpanded = false; App.save(); App.render(); } };
  /* ■ Stop = pause the current e-book activity only. The journey itself (journeyStarted) stays alive. */
  A['return-from-reader'] = function () { state.islandExpanded = false; state.pausePosition = U.startPos() + 14; state.transferHandled = true; App.go('transferRecord'); };
  A['record-mode'] = function (t) { state.transferRecordMode = t.dataset.value; App.save(); App.render(); };
  A['save-transfer-record'] = function () {
    var note = document.querySelector('[data-bind="onTripNote"]'); if (note) state.onTripNote = note.value;
    App.go('transferSaved');
  };
  A['skip-transfer-record'] = function () { state.onTripNote = ''; App.go('boarding'); };
  A['transfer-saved-continue'] = function () { App.go('boarding'); };
  A['transfer-saved-close'] = function () { App.go('lockScreen'); };
  A['wait-for-boarding'] = function () { App.go('lockScreen'); };
  A['continue-after-transfer'] = function () { App.resumeReading(); };
  A['start-now-from-transfer'] = function () { App.resumeReading(); };
  /* Ending the trip early ("여기서 그만할게요" / 이용 종료): the activity so far is saved, so the end screen's "기록되었어요" is true. */
  App.endJourney = function () {
    if (state.journeyStarted) {
      var sum = App.buildSummary();
      if (!state.resumeCount) sum.minutes = 16 + Number(state.elapsed || 0); // only the first reading segment happened
      var r = Object.assign({}, sum, { rating: null, helpfulness: null, photo: state.photo || '', note: state.onTripNote || '', position: U.isBook(sum.activity) ? (Number(state.pausePosition) || U.startPos() + 14) + ' 페이지' : '' });
      if (U.isBook(sum.activity)) state.progressItems.bookPosition = String(Number(state.pausePosition) || U.startPos() + 14);
      state.records.unshift(r); state.records = state.records.slice(0, 100); state.lastSummary = r;
      state.journeyStarted = false; state.transferHandled = false; state.islandExpanded = false; state.elapsed = 0;
    } else if (!state.lastSummary) { App.buildSummary(); }
    App.syncFlags(); App.go('end');
  };
  A['stop-waiting'] = function () { App.endJourney(); };
  A['show-arrival-summary'] = function () { App.buildSummary(); App.go('arrival'); };
  A['rate-helpfulness'] = function (t) { state.helpfulness = Number(t.dataset.value); App.save(); App.render(); };
  A['to-record-method'] = function () { App.buildSummary(); state.recordPhotoOpen = false; state.recordPhotoSheet = false; App.go('record'); };
  A['continue-after-arrival'] = function () { state.elapsed = Number(state.elapsed || 0) + 10; App.resumeReading(); };
  A['resume-journey'] = function () { App.go('resume'); };

  /* simulator */
  A['sim-depart'] = function () { App.go('departureNotice'); };
  /* 환승 직전: jump the island to "곧 환승해요" on the reading screen (starts a journey first if none is running). */
  A['sim-transfer'] = function () {
    if (!state.journeyStarted) prepareJourney();
    state.readerTarget = 'transfer'; state.readerPhase = 'soon'; state.islandExpanded = false;
    if (onReader()) { App.save(); App.render(); App.restartReaderClock(); } else App.go('millie');
    App.toast('환승 직전 시뮬레이션');
  };
  A['sim-boarding'] = function () { if (!state.journeyStarted) prepareJourney(); App.go('boardingNotice'); App.toast('탑승 감지 시뮬레이션'); };
  A['sim-destination'] = function () { if (!state.journeyStarted) prepareJourney(); App.buildSummary(); App.go('arrivalNotice'); App.toast('목적지 도착 시뮬레이션'); };
  A['sim-time'] = function () { state.elapsed = Number(state.elapsed || 0) + 10; App.save(); App.renderIsland(); App.toast('이동 시간 10분을 더했습니다.'); };
  A['end-use'] = function () { App.endJourney(); };
})();
