/* Login + first-time setup (new-user onboarding). Ported from the existing project's logic,
   restyled to the latest Figma (black pill CTAs, white background). */
(function () {
  'use strict';
  var App = window.App, U = App.util, state = App.state, S = App.screens, A = App.actions;
  var esc = U.esc;

  function base(content, cls) { return '<section class="screen-content legacy ' + (cls || '') + '">' + content + '</section>'; }
  function steps(n) { var out = '<div class="step-track" aria-label="설정 진행">'; for (var i = 1; i <= 4; i++) out += '<i class="' + (i <= n ? 'on' : '') + '"></i>'; return out + '</div>'; }
  function setupTop(n, label, action) {
    return '<div class="source-setup-top"><button data-action="back">이전</button>' + steps(n) + '<button class="' + (label === '건너뛰기' ? 'source-skip' : '') + '" data-action="' + action + '">' + label + '</button></div>';
  }
  function serviceLogo(name) {
    var positions = { '밀리의 서재': '-22.83%', '교보 e-Book': '-146.5%', 'YouTube': '-265.31%', 'Netflix': '-380.48%' };
    if (name === 'Coupang Play') return '<span class="source-service-logo coupang"><img src="./assets/images/services/coupang.png" alt=""></span>';
    if (positions[name]) return '<span class="source-service-logo"><img src="./assets/images/services/logos.png" alt="" style="left:' + positions[name] + '"></span>';
    return '';
  }
  function icon(group, name, w, h) { return '<img src="./assets/icons/' + group + '/' + name + '.svg" alt="" width="' + w + '" height="' + h + '">'; }

  /* ---- login ---- */
  S.login = function () {
    return base('<div class="login-logo-space" aria-hidden="true">로고</div>' +
      '<div class="login-fields"><input class="input-field" aria-label="이메일" data-bind="loginEmail" type="email" autocomplete="username" value="' + esc(state.loginEmail) + '" placeholder="이메일"><input class="input-field" aria-label="비밀번호" data-bind="loginPassword" type="password" autocomplete="current-password" value="' + esc(state.loginPassword) + '" placeholder="비밀번호"></div>' +
      '<div class="login-options"><label class="login-auto"><input type="checkbox" data-bind="autoLogin" ' + (state.autoLogin ? 'checked' : '') + '>' + icon('login', 'auto-login', 16, 16) + '<span>자동 로그인</span></label><button type="button" class="text-link" data-action="forgot">비밀번호를 잊었나요?</button></div>' +
      U.btn('로그인', 'login-existing', 'login-submit') +
      '<button type="button" class="signup-prompt" data-action="signup">아직 계정이 없으신가요?</button><div class="login-or">or</div>' +
      U.btn('구글로 계속하기', 'login-existing', 'login-social login-google') + U.btn('애플로 계속하기', 'login-existing', 'login-social login-apple') +
      '<p class="login-terms">회원가입 시<br>서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주됩니다.</p>', 'login-screen');
  };

  /* ---- favorites (places) ---- */
  S.favorites = function () {
    function placeRow(kind, title, empty, ic) {
      var p = state.places.find(function (x) { return x.kind === kind; });
      return '<button class="source-place-row" data-action="add-place" data-kind="' + kind + '"><span class="source-place-icon ' + (p ? 'has-place' : '') + '">' + icon('places', ic, 24, 24) + '</span><span><strong>' + title + '</strong><small>' + esc(p ? (p.address || p.name) : empty) + '</small></span></button>';
    }
    return base('<div class="source-place-map" aria-hidden="true"><img src="./assets/images/places/map.png" alt=""></div>' +
      '<div class="source-place-head"><div class="source-place-top">' + steps(1) + '<button class="' + (state.places.length ? 'is-ready' : '') + '" data-action="to-activities">' + (state.places.length ? '다음' : '건너뛰기') + '</button></div><h2>자주 가는 장소를 등록해 볼까요?</h2><p>자주 가는 장소를 등록하면<br>이동 경로를 더 빠르게 설정할 수 있어요.</p>' +
      '<div class="source-place-search"><label><button type="button" data-action="search-place" aria-label="장소 검색">' + icon('places', 'search', 24, 24) + '</button><input aria-label="장소 검색어" data-bind="placeQuery" value="' + esc(state.placeQuery) + '" placeholder="장소를 검색해 주세요."></label><button type="button" class="source-current-location" data-action="use-current-location" aria-label="현재 위치">' + icon('places', 'location', 24, 24) + '</button></div></div>' +
      '<img class="source-place-marker" src="./assets/icons/places/marker.svg" alt="현재 위치" width="34" height="34">' +
      '<div class="source-place-sheet"><i class="sheet-handle"></i><h3>내 장소</h3>' + placeRow('home', '집', '집 주소를 등록하세요.', 'home') + placeRow('work', '회사', '회사 주소를 등록하세요.', 'work') +
      state.places.filter(function (p) { return p.kind === 'custom'; }).map(function (p) { return '<button class="source-place-row" data-action="pick-place" data-kind="custom" data-index="' + state.places.indexOf(p) + '"><span class="source-place-icon">' + icon('places', 'location', 24, 24) + '</span><span><strong>' + esc(p.name) + '</strong></span></button>'; }).join('') +
      '<button class="source-place-row" data-action="add-place" data-kind="custom"><span class="source-place-icon">' + icon('places', 'add', 24, 24) + '</span><span><strong>장소 등록</strong><small>내 장소를 추가해보세요. (최대 5개)</small></span></button></div>', 'source-favorites-screen');
  };
  S.placeAdd = function () {
    var title = state.pendingPlaceKind === 'home' ? '집 추가' : state.pendingPlaceKind === 'work' ? '회사 추가' : '장소 등록';
    return base('<div class="source-add-map" aria-hidden="true"><img src="./assets/images/place-add/map.png" alt=""></div><img class="source-add-area" src="./assets/icons/place-add/area.svg" alt="" aria-hidden="true">' +
      '<div class="source-add-head"><div class="source-place-search"><label><button type="button" data-action="select-place-draft" aria-label="장소 검색">' + icon('places', 'search', 24, 24) + '</button><input id="new-place-name" aria-label="추가할 장소" data-bind="placeDraft" value="' + esc((state.placeDraft || '').replace(/^서울특별시 /, '')) + '" placeholder="가온구 새봄동 123-45"></label><button type="button" class="source-current-location" data-action="select-place-draft" aria-label="현재 위치">' + icon('places', 'location', 24, 24) + '</button></div></div>' +
      '<img class="source-add-pin" src="./assets/icons/place-add/pin.svg" alt="선택 위치" width="32" height="32">' +
      '<div class="source-add-sheet"><i class="sheet-handle"></i><h2>' + title + '</h2><div class="source-add-address"><span><strong id="place-draft-label">' + esc(state.placeDraft || '서울특별시 가온구 새봄동 123-45') + '</strong><small>새봄로 24길 18</small></span><button type="button" data-action="select-place-draft">선택</button></div></div>' +
      '<div class="source-add-cta"><button type="button" class="btn btn-primary" data-action="confirm-place">추가하기</button></div>', 'source-add-screen');
  };

  /* ---- activities / progress ---- */
  S.activities = function () {
    var icons = App.data.activityIcons, all = App.data.activities.concat(state.customActivities || []);
    return base(setupTop(2, '다음', 'to-progress') + '<div class="source-setup-heading"><h2>이동 중 어떤 활동을 하고 싶나요?</h2><p>꾸준히 이어가고 싶은 활동을 선택해주세요. (최대 10개)</p></div><div class="source-activity-picker">' +
      all.map(function (a, i) { var on = state.selectedActivities.indexOf(a) >= 0; return '<button type="button" class="source-activity-chip ' + (on ? 'selected' : '') + '" data-action="toggle-activity" data-value="' + esc(a) + '" aria-pressed="' + on + '">' + icon('activities', icons[i] || 'imgAddCircle', 24, 24) + '<span>' + esc(a) + '</span></button>'; }).join('') +
      '<button type="button" class="source-activity-chip source-activity-add" data-action="add-activity">' + icon('activities', 'imgAddCircle', 24, 24) + '<span>직접 입력하기</span></button></div>', 'source-activities-screen');
  };
  S.progress = function () {
    var p = state.progressItems;
    function card(key, title, ic, titleKey, placeholder, label, lastKey, unit) {
      return '<div class="source-progress-card"><div class="source-progress-title"><span>' + icon('activities', ic, 24, 24) + title + '</span><button type="button" data-action="toggle-progress-item" data-value="' + key + '" aria-label="' + title + ' 진행 중" aria-pressed="' + !!p[key + 'On'] + '">' + icon('progress', 'toggle-' + (p[key + 'On'] ? 'on' : 'off'), 44, 25) + '</button></div>' +
        '<input class="source-progress-name" data-bind="progressItems.' + titleKey + '" value="' + esc(p[titleKey]) + '" placeholder="' + placeholder + '" aria-label="' + title + ' 제목">' +
        '<div class="source-progress-position"><label for="progress-' + key + '">' + label + '</label><span><input id="progress-' + key + '" class="source-progress-' + key + '" data-bind="progressItems.' + lastKey + '" value="' + esc(p[lastKey]) + '" placeholder="' + (unit ? '0' : '예) 와이어 프레임 수정') + '" ' + (unit ? 'type="number" min="0" inputmode="numeric"' : 'type="text"') + '>' + (unit ? '<span>' + unit + '</span>' : '') + '</span></div></div>';
    }
    var filled = p.bookOn || p.ottOn || p.workOn || p.bookTitle || p.ottTitle || p.workTitle;
    return base(setupTop(3, filled ? '다음' : '건너뛰기', 'to-services') + '<div class="source-setup-heading"><h2>이미 진행 중인 활동이 있나요?</h2><p>이전에 하던 활동을 바로 이어갈 수 있도록 설정해 보세요.</p></div><div class="source-progress-list">' +
      card('book', '책 읽기', 'imgBook4', 'bookTitle', '책 제목을 입력해 주세요.', '마지막으로 읽은 페이지', 'bookPosition', '페이지') +
      card('ott', 'OTT 보기', 'imgMovie', 'ottTitle', '콘텐츠 제목을 입력해 주세요.', '마지막으로 본 회차', 'ottEpisode', '화') +
      card('work', '업무 · 과제', 'imgTrip', 'workTitle', '과제명 또는 작업 내용을 입력해 주세요.', '마지막으로 한 내용', 'workLast', '') + '</div>', 'source-progress-screen');
  };

  /* ---- services ---- */
  S.services = function () {
    var icons = { book: 'imgBook4', ott: 'imgMovie', work: 'imgTrip' };
    var sections = App.data.serviceGroups.map(function (group) {
      var names = group.options.map(function (o) { return o.name; }).concat(state.customServices.filter(function (n) { return state.customServiceCategories[n] === group.key; }));
      var chosen = names.filter(function (n) { return state.selectedServices.indexOf(n) >= 0; });
      return '<section class="source-service-group"><h3>' + icon('activities', icons[group.key], 24, 24) + group.label + '</h3><div class="source-service-grid">' +
        chosen.map(function (n) { return '<button type="button" class="source-service-card" data-action="toggle-service" data-value="' + esc(n) + '" aria-label="' + esc(n) + ' 연결 해제">' + serviceLogo(n) + '<span>' + esc(n) + '</span><img class="source-service-remove" src="./assets/icons/services/remove.svg" alt="" width="20" height="20"></button>'; }).join('') +
        (chosen.length < 3 ? '<button type="button" class="source-service-card source-service-add" data-action="add-service" data-kind="' + group.key + '" aria-label="' + group.label + ' 서비스 추가"><img src="./assets/icons/services/add.svg" alt="" width="28" height="28"><span>추가</span></button>' : '') + '</div></section>';
    }).join('');
    return base(setupTop(4, state.selectedServices.length ? '다음' : '건너뛰기', 'to-account') + '<div class="source-setup-heading"><h2>평소 어떤 앱을 사용하시나요?</h2><p>활동에 사용할 앱이나 서비스를 연결해 주세요.<br>다른 앱으로 벗어나면 알려드릴게요.</p></div><div class="source-service-list">' + sections + '</div>', 'source-services-screen');
  };
  function serviceResults() {
    var entries = [];
    App.data.serviceGroups.forEach(function (g) { g.options.forEach(function (o) { entries.push({ name: o.name, kind: g.key, label: g.label }); }); });
    state.customServices.concat(state.serviceDraft || []).forEach(function (name) {
      if (!entries.some(function (e) { return e.name === name; })) {
        var kind = (state.serviceDraftCategories || {})[name] || state.customServiceCategories[name] || state.pendingServiceKind || 'book', g = App.data.serviceGroups.find(function (x) { return x.key === kind; });
        entries.push({ name: name, kind: kind, label: g ? g.label : '' });
      }
    });
    var q = (state.serviceQuery || '').trim().toLowerCase(), all = entries, active = state.pendingServiceKind || 'book';
    entries = entries.filter(function (e) { return e.kind === active && (!q || e.name.toLowerCase().indexOf(q) >= 0); });
    if (!entries.length && q && !all.some(function (e) { return e.name.toLowerCase().indexOf(q) >= 0; })) entries = [{ name: state.serviceQuery.trim(), kind: active, label: (App.data.serviceGroups.find(function (g) { return g.key === active; }) || App.data.serviceGroups[0]).label }];
    return entries.map(function (entry) {
      var sel = (state.serviceDraft || state.selectedServices).indexOf(entry.name) >= 0;
      return '<button type="button" class="source-service-result" data-action="select-source-service" data-value="' + esc(entry.name) + '" data-kind="' + entry.kind + '" aria-pressed="' + sel + '">' + serviceLogo(entry.name) + '<span>' + esc(entry.name) + '<small>' + entry.label + '</small></span><img src="./assets/icons/' + (sel ? 'permissions/imgCheckCircle' : 'map-apps/unselected') + '.svg" alt="" width="24" height="24"></button>';
    }).join('');
  }
  function serviceFooter() {
    var active = state.pendingServiceKind || 'book';
    var count = (state.serviceDraft || state.selectedServices).filter(function (name) {
      var g = App.data.serviceGroups.find(function (x) { return x.options.some(function (o) { return o.name === name; }); });
      return (g ? g.key : (state.serviceDraftCategories || {})[name] || state.customServiceCategories[name] || active) === active;
    }).length;
    return '<button type="button" class="source-service-register" data-action="register-services" ' + (count ? '' : 'disabled') + '>선택한 앱 ' + count + '개 등록하기</button>';
  }
  App.refreshServiceSearch = function () {
    var r = document.getElementById('source-service-results'); if (r) r.innerHTML = serviceResults();
    var f = document.getElementById('source-service-selection-footer'); if (f) f.innerHTML = serviceFooter();
  };
  S.serviceSearch = function () {
    return base('<button type="button" class="source-search-back" data-action="cancel-service-selection">이전</button><label class="source-service-search"><img src="./assets/icons/places/search.svg" alt="" width="24" height="24"><input aria-label="서비스 검색" data-bind="serviceQuery" value="' + esc(state.serviceQuery) + '" placeholder="앱 이름 검색"></label><div id="source-service-results">' + serviceResults() + '</div><div id="source-service-selection-footer">' + serviceFooter() + '</div>', 'source-service-search-screen');
  };

  /* ---- account / permissions ---- */
  S.account = function () {
    function field(label, key, placeholder, type, help) {
      return '<label class="source-account-field source-account-' + key + '"><span>' + label + '</span>' + (help ? '<small>' + help + '</small>' : '') + '<input aria-label="' + label + '" data-bind="account.' + key + '" value="' + esc(state.account[key]) + '" placeholder="' + placeholder + '" type="' + (type || 'text') + '" autocomplete="' + (key === 'password' || key === 'passwordConfirm' ? 'new-password' : key === 'email' ? 'email' : 'nickname') + '"></label>';
    }
    return base(setupTop(4, '다음', 'create-account') + '<div class="source-setup-heading"><h2>회원가입을 위해<br>아래 정보를 입력해 주세요.</h2><p>입력하신 정보는 계정 생성과 로그인에 사용돼요.</p></div><div class="source-account-fields">' +
      field('닉네임', 'nickname', '예) 홍길동') + field('이메일 주소', 'email', '예) 03.04@sookmyung.ac.kr', 'email') + field('비밀번호', 'password', '8자 이상, 영문·숫자·특수문자 중 2가지 조합', 'password', '8자 이상, 영문·숫자·특수문자 중 2가지 조합') + field('비밀번호 확인', 'passwordConfirm', '비밀번호를 재입력해 주세요.', 'password') + '</div>', 'source-account-screen');
  };
  S.permissions = function () {
    var rows = [['location', 'imgLocationOn', '위치 접근', '이동 경로와 출발/도착 시점을 파악해요.'], ['motion', 'imgDirectionsRun', '동작 및 피트니스', '걷기와 정지 등 이동 상태를 파악해요.'], ['screen', 'imgMobileHandLeft', '스크린 타임', '활동에 사용하는 앱을 관리하고<br>시작과 복귀를 도와줘요.']];
    return base(setupTop(4, '다음', 'finish-onboarding') + '<div class="source-permission-intro"><span>3 / 4</span><h2>필요한 권한을 허용해 주세요.</h2><p>이동 상황을 파악하고, 활동을 이어갈 수 있도록<br>아래 권한을 설정해 주세요.</p></div><div class="source-permission-list">' +
      rows.map(function (r) { var on = state.permissions[r[0]]; return '<button type="button" class="source-permission-row" data-action="toggle-permission" data-value="' + r[0] + '" aria-pressed="' + on + '"><img src="./assets/icons/permissions/' + r[1] + '.svg" alt="" width="32" height="32"><span><strong>' + r[2] + '</strong><small>' + r[3] + '</small></span><img class="source-permission-check ' + (on ? '' : 'unchecked') + '" src="./assets/icons/permissions/imgCheckCircle.svg" alt="" width="24" height="24"></button>'; }).join('') +
      '<div class="source-permission-row source-notification-row"><img src="./assets/icons/permissions/imgNotificationsActive.svg" alt="" width="32" height="32"><span><strong>알림</strong><small>활동 시작과 복귀가 필요할 때<br>알려드려요.</small></span><button type="button" data-action="toggle-permission" data-value="notification">' + (state.permissions.notification ? '허용됨' : '허용하기') + '</button></div></div>', 'source-permissions-screen');
  };

  /* ---------- actions ---------- */
  function loginAsExisting() {
    // Existing user: restore data. If this device holds a finished fresh-user account with the same e-mail, restore that one instead.
    var email = (state.loginEmail || '').trim().toLowerCase(), fresh = App.loadProfile('fresh');
    var toFresh = fresh && fresh.onboardingCompleted && fresh.account.email && email && email === fresh.account.email.toLowerCase();
    App.enterProfile(toFresh ? 'fresh' : 'existing');
    App.go('home');
  }
  A['login-existing'] = loginAsExisting;
  A.signup = function () { App.enterProfile('fresh', true); App.go('favorites'); };
  A.forgot = function () { App.toast('비밀번호 재설정은 목업 기능입니다.'); };
  A['to-activities'] = function () { state.onboardingPlacesComplete = true; App.go('activities'); };
  A['toggle-activity'] = function (t) {
    var v = t.dataset.value;
    if (state.selectedActivities.indexOf(v) >= 0) state.selectedActivities = state.selectedActivities.filter(function (a) { return a !== v; });
    else if (state.selectedActivities.length < 10) state.selectedActivities.push(v);
    else { App.toast('활동은 최대 10개까지 선택할 수 있어요.'); return; }
    App.save(); App.render();
  };
  A['toggle-progress-item'] = function (t) { var k = t.dataset.value + 'On'; state.progressItems[k] = !state.progressItems[k]; App.save(); App.render(); };
  A['to-progress'] = function () {
    if (!state.selectedActivities.length) { App.toast('목표 활동을 선택해 주세요.'); return; }
    if (state.editingActivities) { state.editingActivities = false; App.go('home'); } else App.go('progress');
  };
  A['to-services'] = function () { state.onboardingProgressComplete = true; App.go('services'); };
  A['toggle-service'] = function (t) { var v = t.dataset.value; state.selectedServices = state.selectedServices.indexOf(v) >= 0 ? state.selectedServices.filter(function (s) { return s !== v; }) : state.selectedServices.concat(v); App.save(); App.render(); };
  A['add-service'] = function (t) { state.pendingServiceKind = t.dataset.kind; state.serviceQuery = ''; state.serviceDraft = state.selectedServices.slice(); state.serviceDraftCategories = {}; App.go('serviceSearch'); };
  A['select-source-service'] = function (t) {
    var v = t.dataset.value; if (!state.serviceDraft) state.serviceDraft = state.selectedServices.slice();
    var i = state.serviceDraft.indexOf(v); if (i >= 0) state.serviceDraft.splice(i, 1); else state.serviceDraft.push(v);
    if (!state.serviceDraftCategories) state.serviceDraftCategories = {};
    state.serviceDraftCategories[v] = t.dataset.kind || state.pendingServiceKind || 'book';
    App.save(); App.refreshServiceSearch();
  };
  A['register-services'] = function () {
    if (!state.serviceDraft || !state.serviceDraft.length) return;
    state.serviceDraft.forEach(function (name) {
      var known = App.data.serviceGroups.some(function (g) { return g.options.some(function (o) { return o.name === name; }); });
      if (!known && state.customServices.indexOf(name) < 0) { state.customServices.push(name); state.customServiceCategories[name] = (state.serviceDraftCategories || {})[name] || state.pendingServiceKind || 'book'; }
    });
    state.selectedServices = state.serviceDraft.slice(); delete state.serviceDraft; delete state.serviceDraftCategories; App.go('services');
  };
  A['cancel-service-selection'] = function () { delete state.serviceDraft; delete state.serviceDraftCategories; App.go('services'); };
  A['add-activity'] = function () { App.openModal('활동 직접 입력', '', '<input class="input-field modal-input" id="new-activity-name" placeholder="활동 이름"><div class="sheet-actions">' + U.btn('추가하기', 'confirm-activity', 'btn btn-primary') + '</div>'); };
  A['confirm-activity'] = function () {
    var an = ((document.getElementById('new-activity-name') || {}).value || '').trim();
    if (!an) { App.toast('활동 이름을 입력해 주세요.'); return; }
    if (state.selectedActivities.indexOf(an) < 0 && state.selectedActivities.length >= 10) { App.toast('활동은 최대 10개까지 선택할 수 있어요.'); return; }
    if (state.customActivities.indexOf(an) < 0) state.customActivities.push(an);
    if (state.selectedActivities.indexOf(an) < 0) state.selectedActivities.push(an);
    App.save(); App.closeModal(); App.render();
  };
  A['to-account'] = function () { state.onboardingServicesComplete = true; App.go('account'); };
  A['create-account'] = function () {
    ['nickname', 'email', 'password', 'passwordConfirm'].forEach(function (k) { var el = document.querySelector('[data-bind="account.' + k + '"]'); if (el) state.account[k] = el.value; });
    state.account.nickname = (state.account.nickname || '').trim(); state.account.email = (state.account.email || '').trim();
    state.accountRegistered = true; state.onboardingCompleted = false; state.loginEmail = state.account.email;
    state.account.password = ''; state.account.passwordConfirm = ''; App.go('permissions');
  };
  A['toggle-permission'] = function (t) { var v = t.dataset.value; state.permissions[v] = !state.permissions[v]; App.save(); App.render(); };
  A['finish-onboarding'] = function () {
    if (!state.accountRegistered) { App.go('account'); return; }
    if (!state.selectedActivities.length) { state.screen = 'activities'; App.save(); App.render(); App.toast('목표 활동을 선택해 주세요.'); return; }
    if (!state.permissions.location || !state.permissions.motion || !state.permissions.screen) { App.toast('필요한 권한을 허용해 주세요.'); return; }
    state.onboardingCompleted = true; state.isExistingUser = false;
    if (!state.departure) { var h = state.places.find(function (p) { return p.kind === 'home'; }); state.departure = h ? h.name : '집'; }
    if (!state.destination) { var w = state.places.find(function (p) { return p.kind === 'work'; }); state.destination = w ? w.name : '회사'; }
    App.go('home');
  };
  A.skip = function () {
    if (state.screen === 'favorites') { state.onboardingPlacesComplete = true; App.go('activities'); }
    else if (state.screen === 'progress') { state.onboardingProgressComplete = true; App.go('services'); }
    else if (state.screen === 'services') { state.onboardingServicesComplete = true; App.go('account'); }
    else App.toast('현재 단계에서는 건너뛸 수 없습니다.');
  };
  A['add-place'] = function (t) { state.pendingPlaceKind = t.dataset.kind || 'custom'; state.placeDraft = '서울특별시 가온구 새봄동 123-45'; App.go('placeAdd'); };
  A['use-current-location'] = function () { state.pendingPlaceKind = 'home'; state.placeDraft = '서울특별시 가온구 새봄동 123-45'; App.go('placeAdd'); };
  A['select-place-draft'] = function () {
    state.placeDraft = (document.getElementById('new-place-name') || {}).value || state.placeDraft;
    if (state.placeDraft === '가온구 새봄동 123-45') state.placeDraft = '서울특별시 ' + state.placeDraft;
    App.save(); App.render();
  };
  A['confirm-place'] = function () {
    var address = (state.placeDraft || '').trim(), kind = state.pendingPlaceKind || 'custom';
    if (!address) { App.toast('장소를 입력해 주세요.'); return; }
    var name = kind === 'home' ? '집' : kind === 'work' ? '회사' : address;
    var existing = state.places.find(function (p) { return p.kind === kind; });
    if (kind === 'home' || kind === 'work') { if (existing) { existing.address = address; } else state.places.push({ name: name, kind: kind, address: address }); }
    else if (!state.places.some(function (p) { return p.name === name; })) {
      if (state.places.filter(function (p) { return p.kind === 'custom'; }).length >= 5) { App.toast('즐겨찾는 장소는 최대 5개까지 등록할 수 있어요.'); return; }
      state.places.push({ name: name, kind: 'custom', address: address });
    }
    if (kind === 'home') { state.departure = name; if (!state.destination && state.places.some(function (p) { return p.kind === 'work'; })) state.destination = '회사'; }
    else if (kind === 'work') { state.destination = '회사'; if (!state.departure) state.departure = '집'; }
    else { if (!state.departure) state.departure = name; if (!state.destination) state.destination = name; }
    state.screen = 'favorites'; App.save(); App.render();
  };
  A['pick-place'] = function (t) { var p = state.places[Number(t.dataset.index)]; if (p) { state.destination = p.name; App.save(); App.render(); } };
  A['search-place'] = function () {
    var q = ((document.querySelector('[data-bind="placeQuery"]') || {}).value || '').toLowerCase();
    var list = App.data.mockPlaces.filter(function (p) { return !q || p.toLowerCase().indexOf(q) >= 0; });
    App.openModal('장소 검색 결과', '검색 결과는 테스트용 목업 장소입니다.', '<div class="modal-list">' + (list.length ? list.map(function (p) { return '<button type="button" class="modal-row" data-action="select-search-place" data-value="' + esc(p) + '"><span>' + esc(p) + '<small>대한민국 · 목업 장소</small></span><b>추가</b></button>'; }).join('') : '<p class="sheet-copy">검색 결과가 없습니다.</p>') + '</div>');
  };
  A['select-search-place'] = function (t) {
    var name = t.dataset.value;
    if (!state.places.some(function (p) { return p.name === name; })) {
      if (state.places.filter(function (p) { return p.kind === 'custom'; }).length >= 5) { App.toast('즐겨찾는 장소는 최대 5개까지 등록할 수 있어요.'); return; }
      state.places.push({ name: name, kind: 'custom', address: name });
    }
    if (!state.departure) state.departure = name;
    if (!state.destination) state.destination = name;
    App.save(); App.closeModal(); App.render(); App.toast(name + ' 등록 완료');
  };
})();
