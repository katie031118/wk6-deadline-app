/* Wrap-up: today's record (activity + progress + photo + satisfaction), result, calendar, end. */
(function () {
  'use strict';
  var App = window.App, U = App.util, state = App.state, S = App.screens, A = App.actions, SH = App.sheets;
  var esc = U.esc;

  function header(title, back) { return U.back(back) + '<strong class="fx-header">' + title + '</strong>'; }
  /* The ONLY rating in the wrap-up. Question and scale mean the same thing: 1 = 전혀 아니에요 … 5 = 매우 그래요. */
  var RATING_LABELS = { 1: '전혀 아니에요', 2: '아니에요', 3: '보통이에요', 4: '그래요', 5: '매우 그래요' };
  function ratingPills(action, current, label) {
    return '<div class="rating-row rating-pills">' + [1, 2, 3, 4, 5].map(function (n) { return '<button type="button" data-action="' + action + '" data-value="' + n + '" aria-label="' + label + ' ' + n + '점 (' + RATING_LABELS[n] + ')" aria-pressed="' + (current === n) + '">' + n + '</button>'; }).join('') + '</div><div class="rating-labels"><span>1 = ' + RATING_LABELS[1] + '</span><span>5 = ' + RATING_LABELS[5] + '</span></div>';
  }
  function pageOf(r) { return r.endPage ? r.endPage + '쪽' : ''; }
  function activityLabelFor(r) { return U.activityLabel(r.activity); }
  function dayLabel(key) {
    if (key === App.SIM_TODAY) return '오늘';
    if (key === U.shiftDate(App.SIM_TODAY, -1)) return '어제';
    var d = U.parseKey(key); return (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
  }
  function routeTag(r) {
    var home = (state.places || []).some(function (p) { return p.kind === 'home' && p.name === r.destination; });
    return home || String(r.destination || '').indexOf('집') >= 0 ? '퇴근길' : '출근길';
  }

  /* ---------- today's record ---------- */
  S.record = function () {
    var sum = state.lastSummary || App.buildSummary('arrival'), open = !!state.recordPhotoOpen, has = !!state.photo, book = U.isBook(sum.activity);
    var option;
    if (open) {
      option = '<div class="photo-option is-open" role="group"><button type="button" class="photo-head" data-action="open-photo-sheet" aria-expanded="true"><span class="option-copy"><strong>이미지 올리기</strong><em>지금 보고 있는 페이지를 찍어주세요.</em></span><i class="radio is-on"></i></button>' +
        '<div class="photo-body">' + (has ? '<img src="' + esc(state.photo) + '" alt="선택한 기록 사진">' : '<i class="photo-ph"></i><span>사진을 선택해주세요</span>') + '</div></div>';
    } else {
      option = '<button type="button" class="photo-option" data-action="open-photo-sheet" aria-pressed="' + has + '"><span class="option-copy"><strong>이미지 올리기</strong><em>지금 보고 있는 페이지를 찍어주세요.</em></span>' + (has ? '<i class="check-dot"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7.4l2.7 2.7L11 4.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></i>' : '<i class="radio-ring"></i>') + '</button>';
    }
    /* Page is pre-filled with the position saved at the transfer (state.currentReadingPage) — nothing to type again, but it can be corrected. */
    var progress = book
      ? '<div class="tile">' + (sum.startPage ? '시작 · ' + sum.startPage + '쪽' : '시작') + '</div><span>→</span><label class="tile-wrap"><input class="tile-input" data-bind="endPositionInput" type="number" min="1" inputmode="numeric" value="' + esc(state.endPositionInput) + '" placeholder="쪽수" aria-label="마지막 읽은 위치(쪽)"><b>쪽</b></label>'
      : '<div class="tile">' + esc(sum.activity === 'OTT 보기' ? (state.progressItems.ottEpisode || '0') + '화' : '시작') + '</div><span>→</span><input class="tile-input" data-bind="endPositionInput" value="' + esc(state.endPositionInput) + '" placeholder="직접 입력" aria-label="진행 위치 직접 입력">';
    return '<section class="fx record-screen ' + (open ? 'is-open' : '') + '">' + header('오늘의 기록') + '<h2 class="rec-title">오늘의 이동 활동을<br>기록해 볼까요?</h2><p class="rec-label rec-l1">오늘의 활동 · 활동 시간 ' + sum.minutes + '분</p>' +
      '<div class="rec-activity">' + U.logo(40) + '<strong>' + esc(activityLabelFor(sum)) + ' · ' + esc(sum.contentTitle) + '</strong></div><p class="rec-label rec-l2">' + (book ? '마지막 읽은 위치' : '활동 진행') + '</p>' +
      '<div class="rec-progress">' + progress + '</div>' +
      '<div class="rec-option">' + option + '</div><input id="record-photo-input" class="hidden-file" type="file" data-bind="photoFile" accept="image/*">' +
      '<div class="rec-rating"><p class="rec-label">오늘 이동시간을 원했던 방식에 가깝게 보냈나요?</p>' + ratingPills('rate', state.satisfaction, '이동시간 평가') + '</div>' + '<div class="fx-cta">' + U.btn('완료', 'complete-record', 'btn btn-primary') + '</div></section>';
  };
  SH.record = function () {
    if (!state.recordPhotoSheet) return '';
    return U.sheet('<h2 class="sheet-title">사진 올리기</h2><button type="button" class="sheet-row" data-action="choose-photo"><i class="ph-circle ph-40"></i><span>내 사진첩에서 고르기</span><svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 6l6 6-6 6" stroke="#1c1b1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' + U.btn('닫기', 'close-photo-sheet', 'btn btn-secondary'), { close: 'close-photo-sheet', label: '사진 올리기' });
  };

  /* ---------- result ---------- */
  function weekKeys(refKey) {
    var d = U.parseKey(refKey), start = new Date(d); start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    var keys = []; for (var i = 0; i < 7; i++) { var w = new Date(start); w.setDate(start.getDate() + i); keys.push(U.dateKey(w)); } return keys;
  }
  S.result = function () {
    var r = state.lastSummary || {}, minutes = Number(r.minutes) || 0, activity = U.activityLabel(r.activity);
    var tag = routeTag(r), dirLabel = tag === '퇴근길' ? '퇴근' : '출근';
    var daily = weekKeys(r.dateKey || App.SIM_TODAY).map(function (k) { return state.records.filter(function (x) { return x.dateKey === k; }).reduce(function (n, x) { return n + (Number(x.minutes) || 0); }, 0); });
    var total = daily.reduce(function (a, b) { return a + b; }, 0), max = Math.max.apply(null, daily) || 0;
    var bars = daily.map(function (v) { var h = v ? Math.max(8, Math.round(v / max * 120)) : 4; return '<i class="' + (v ? '' : 'is-empty') + '" style="height:' + h + 'px"></i>'; }).join('');
    var book = U.isBook(r.activity);
    return '<section class="fx result-screen">' + header('결과') + '<div class="fx-head"><h2>' + minutes + '분동안 ' + dirLabel + '시간을<br>알차게 보냈어요!</h2><p>' + dirLabel + '길에 계획한 ' + (book ? '독서' : esc(activity)) + (book ? '를' : '을(를)') + ' 실천했어요.</p></div>' +
      '<dl class="summary-card"><div><dt>활동</dt><dd>' + esc(activity) + '</dd></div><div><dt>활동 시간</dt><dd>' + minutes + '분</dd></div><div><dt>이동 시간</dt><dd>' + esc(r.startTime || '') + ' → ' + esc(r.endTime || '') + ' · ' + Number(r.totalMinutes || 0) + '분</dd></div><div><dt>원하던 방식</dt><dd>' + (r.rating ? RATING_LABELS[r.rating] + ' (' + r.rating + '/5)' : '—') + '</dd></div></dl>' +
      '<div class="reading-card">' + U.logo(40) + '<div><strong>' + esc(r.contentTitle || '') + '</strong><small>' + (book && r.endPage ? '마지막 읽은 위치 · ' + pageOf(r) : esc(activity)) + '</small></div></div>' +
      '<p class="result-label">이번주 활동 시간</p><div class="chart-card"><strong>' + Math.floor(total / 60) + '시간 ' + (total % 60) + '분</strong><div class="chart-bars">' + bars + '</div></div>' +
      '<div class="fx-cta">' + U.btn('홈으로', 'home', 'btn btn-primary') + '</div></section>';
  };

  /* ---------- calendar ---------- */
  S.calendar = function () {
    var sel = state.selectedDate || App.SIM_TODAY, keys = weekKeys(sel), wd = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var list = state.records.filter(function (r) { return r.dateKey === sel; }), total = list.reduce(function (n, r) { return n + Number(r.minutes || 0); }, 0);
    var totalLabel = total >= 60 ? Math.floor(total / 60) + '시간 ' + (total % 60 ? (total % 60) + '분' : '') : total + '분';
    var month = U.parseKey(sel).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    var strip = keys.map(function (k, i) { var d = U.parseKey(k), on = k === sel; return '<button type="button" class="date-chip ' + (on ? 'on' : '') + '" style="left:' + (-14 + i * 60) + 'px" data-action="pick-date" data-value="' + k + '" aria-pressed="' + on + '"><strong>' + d.getDate() + '</strong><small>' + wd[i] + '</small></button>'; }).join('');
    var cards = list.map(function (r) {
      return '<button type="button" class="record-card" data-action="record-detail" data-index="' + state.records.indexOf(r) + '"><span class="badge badge-white">' + routeTag(r) + '</span><span class="rc-row"><strong>' + esc(activityLabelFor(r)) + '</strong><time>' + esc(r.startTime || '') + ' → ' + esc(r.endTime || '') + '</time></span><span class="rc-row rc-sub"><span>' + esc(r.contentTitle || '') + (pageOf(r) ? ' · ' + pageOf(r) : '') + '</span><span>이동 ' + Number(r.totalMinutes || 0) + '분 · 활동 ' + Number(r.minutes || 0) + '분</span></span></button>';
    }).join('');
    return '<section class="fx calendar-screen">' + header('캘린더') + '<button type="button" class="cal-nav cal-prev" data-action="week-prev" aria-label="이전 주">&lt;</button><h2 class="cal-month">' + month + '</h2><button type="button" class="cal-nav cal-next" data-action="week-next" aria-label="다음 주">&gt;</button>' +
      '<div class="date-strip">' + strip + '</div><p class="cal-day">' + dayLabel(sel) + '</p><p class="cal-total">' + (total ? totalLabel : '기록 없음') + '</p><div class="record-list">' + cards + '</div>' +
      '<div class="fx-cta">' + U.btn('홈으로', 'home', 'btn btn-primary') + '</div></section>';
  };

  /* ---------- end ---------- */
  S.end = function () {
    var r = state.lastSummary || App.buildSummary('arrival');
    return '<section class="fx end-screen">' + U.back('end-home') + '<span class="check-circle check-large"><svg width="39" height="39" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M9 21l8 8 14-17" stroke="#1c1b1f" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>' +
      '<div class="end-copy"><h2>오늘 이동을<br>마무리했어요!</h2><p>이번 이동에서의 활동이 기록되었어요.<br>다음 이동에서도 원하는 방식으로<br>시간을 활용해보세요.</p></div>' +
      '<div class="book-card end-card">' + U.logo(62) + '<div><small>' + esc(activityLabelFor(r)) + '</small><strong>' + esc(r.contentTitle || U.contentTitle()) + '</strong>' + (pageOf(r) ? '<small>' + pageOf(r) + '</small>' : '') + '</div><b>' + Number(r.minutes || 0) + '분</b></div>' +
      U.actions('기록 남기기', 'end-to-record', '홈으로', 'end-home') + '</section>';
  };

  /* ---------- actions ---------- */
  function finishJourney(saved) {
    state.journeyStarted = false; state.transferHandled = false; state.transferStopped = false; state.resumePending = false; state.islandExpanded = false; state.elapsed = 0;
    App.syncFlags(); if (saved) state.hasPreviousActivity = true;
  }
  /* The one place a trip's record is saved: from the record screen (with rating / photo) or from "홈으로" on the wrap-up screen (without). */
  App.commitRecord = function (extra) {
    var sum = state.lastSummary || App.buildSummary('arrival'), book = U.isBook(sum.activity);
    var r = Object.assign({}, sum, { rating: null, resumeCount: Number(state.resumeCount || 0), photo: state.photo || '', note: state.onTripNote || '', endPage: book ? U.page() : null, progress: '' }, extra || {});
    state.records.unshift(r); state.records = state.records.slice(0, 100); state.lastSummary = r;
    finishJourney(true); return r;
  };
  A.rate = function (t) { state.satisfaction = Number(t.dataset.value); App.save(); App.render(); };
  A['open-photo-sheet'] = function () { state.recordPhotoOpen = true; state.recordPhotoSheet = !state.photo; App.save(); App.render(); };
  A['close-photo-sheet'] = function () { state.recordPhotoSheet = false; if (!state.photo) state.recordPhotoOpen = false; App.save(); App.render(); };
  A['choose-photo'] = function () { var input = document.getElementById('record-photo-input'); if (input) input.click(); };
  /* Completing the record: the (pre-filled, possibly corrected) page is written back to the single reading position. */
  A['complete-record'] = function () {
    var sum = state.lastSummary || App.buildSummary('arrival'), input = (state.endPositionInput || '').trim(), book = U.isBook(sum.activity);
    if (book && input !== '' && !(parseInt(input, 10) > 0)) { App.toast('읽은 쪽수를 숫자로 입력해 주세요.'); return; }
    if (book && input !== '') state.currentReadingPage = String(parseInt(input, 10));
    App.commitRecord({ rating: state.satisfaction || null, endPage: book ? U.page() : null, progress: book ? '' : input });
    state.screen = 'result'; App.save(); App.render(); App.toast('기록을 저장했어요.');
  };
  /* 마무리했어요 → 기록 남기기: the page is pre-filled with the saved reading position */
  A['end-to-record'] = function () { state.endPositionInput = U.isBook(state.journeyActivity) && U.page() ? String(U.page()) : ''; state.recordPhotoOpen = false; state.recordPhotoSheet = false; App.go('record'); };
  /* 마무리했어요 → 홈으로: the activity is still saved (without rating/photo) so no trip is lost */
  A['end-home'] = function () { if (state.journeyStarted) App.commitRecord(); state.editingActivities = false; App.go('home'); };
  A['open-calendar'] = function () { state.selectedDate = (state.lastSummary && state.lastSummary.dateKey) || App.SIM_TODAY; App.go('calendar'); };
  A['pick-date'] = function (t) { state.selectedDate = t.dataset.value; App.save(); App.render(); };
  A['week-prev'] = function () { state.selectedDate = U.shiftDate(state.selectedDate || App.SIM_TODAY, -7); App.save(); App.render(); };
  A['week-next'] = function () { state.selectedDate = U.shiftDate(state.selectedDate || App.SIM_TODAY, 7); App.save(); App.render(); };
  A['record-detail'] = function (t) {
    var r = state.records[Number(t.dataset.index)]; if (!r) return;
    var page = r.endPage ? r.endPage + '쪽' : (r.progress || '');
    App.openModal(U.activityLabel(r.activity), '', '<div class="modal-list"><p class="sheet-copy">' + esc(r.departure) + ' → ' + esc(r.destination) + '<br>이동 ' + esc(r.startTime || '') + ' → ' + esc(r.endTime || '') + ' (' + esc(r.totalMinutes || 0) + '분) · 활동 ' + esc(r.minutes || 0) + '분</p><p class="sheet-copy">' + esc(r.contentTitle || '') + (page ? ' · 마지막 읽은 위치 ' + esc(page) : '') + '</p><p class="sheet-copy">원하던 방식 · ' + (r.rating ? esc(RATING_LABELS[r.rating]) + ' (' + esc(r.rating) + '/5)' : '—') + '</p>' + (r.note ? '<p class="sheet-copy">메모 · ' + esc(r.note) + '</p>' : '') + '</div><div class="sheet-actions">' + U.btn('닫기', 'close-modal', 'btn btn-secondary') + '</div>');
  };
  A.home = function () { state.editingActivities = false; if (state.screen === 'result') finishJourney(false); App.go('home'); };
  A['edit-activities'] = function () { state.editingActivities = true; App.go('activities'); };
  A['open-account'] = function () {
    App.openModal('계정 정보', '로컬 프로토타입 계정 정보입니다.', '<div class="modal-list"><p class="sheet-copy"><strong>' + esc(state.account.nickname || '사용자') + '</strong><br>' + esc(state.account.email || '이메일 미등록') + '</p></div><div class="sheet-actions">' + U.btn('확인', 'close-modal', 'btn btn-primary') + '</div>');
  };
})();
