# wk6-deadline-app

6주차 과제용 프로젝트입니다. 이동 중 독서/활동을 이어가고 기록하는 모바일 working prototype입니다. 5주차(`wk5-deadline-app`)와 같은 구조(`experiments/claude`)로 정리했습니다.

## 결과물
- 배포: https://wk6-deadline-app-claude.vercel.app
- 코드: [`experiments/claude`](./experiments/claude) (실행 방법은 그 폴더의 README)
- 디자인: Figma Mid-fi (402×874 모바일 프레임) https://www.figma.com/design/hdVQRvOM3Pmnl4F7CxkKKx

## 사용한 툴
- Figma: Mid-fi 화면 설계, 화면 스타일 통일. Pretendard 적용·line-height·letter-spacing 정리용 Figma 플러그인 3개를 만들어 사용
- Claude Code: 기존 Figma 분석 보고, working prototype 구현, Figma 대비 화면 비율 점검, 배포 보조
- GitHub: 버전 기록 및 결과물 관리
- Vercel: 정적 사이트 배포

## 이번 주 작업 흐름
1. Figma Mid-fi 화면을 같은 스타일로 맞추고(버튼·시트 위치, 홈 인디케이터, 프레임 이름 정리), 폰트와 줄 간격을 Pretendard 기준으로 통일
2. 코드를 고치기 전에 Figma를 분석해 보고서로 정리한 뒤 구현 시작
3. 원본 폴더는 건드리지 않고 새 폴더에서 빌드 없는 HTML/CSS/JS prototype으로 구현
4. 기존 사용자(로그인 후 데미안 기록 복원)와 신규 사용자(회원가입 → 온보딩 → 빈 홈)를 분리
5. 독서 중 Dynamic Island 흐름 수정, Figma 대비 화면 비율 재점검
6. Vercel CLI로 배포하고 배포 주소에서 동작 확인

## 효과가 있었던 핵심 프롬프트
- 시나리오를 고정: 전자책 읽기 → 데미안 → 밀리의 서재 → 독서 → 환승 직전 저장 → 이동으로 독서 중단 → 복귀 안내 → 데미안 이어 읽기 → 목적지 도착 → 이동 마무리. 강의·OTT 등 관련 없는 활동은 넣지 않도록 제한
- 기존 프로젝트 원본은 수정·삭제하지 말고 새 폴더에서만 작업하도록 지정
- 사용자 상태를 `isExistingUser`, `onboardingCompleted`, `hasPreviousActivity`, `hasActiveJourney`로 나누고, 신규 사용자에게 이전 기록이 보이지 않게 요구
- Dynamic Island는 처음부터 펼치지 않고 compact(`● 활동 중`)로 시작, 환승 3/2/1분에만 눌러서 펼침. 펼친 상태의 Stop은 환승 기록으로, 바깥을 누르면 접히기만 하도록 구체적으로 명시
- 임의 기준을 만들지 말고 최신 Figma를 다시 열어 프레임 비율, 여백, 버튼·시트 위치를 비교하도록 요청

## 테스트 및 발견한 문제
- Figma 텍스트와 박스 위치를 브라우저의 실제 위치와 비교(허용 오차 2.5px). 어긋난 곳을 고침: 상단 이전/다음 링크 정렬, 홈 "자세히보기" 칩 크기, 경로 카드·지도 앱 목록 간격, 로딩 화면 제목, 서비스 검색 결과 행, 홈 탭바 위치
- 데스크톱 미리보기 확대·축소는 가로·세로를 따로 늘리지 않고 같은 배율로만 조정해 402:874 비율 유지
- 로고 이미지가 검은 원으로 보이던 문제는 이미지 자르는 기준을 다시 계산해 수정
- 바텀시트 안쪽을 눌러도 시트가 닫히던 문제는 어두운 배경을 직접 눌렀을 때만 닫히게 수정
- "여기서 그만할게요" 뒤에도 이동 상태가 남던 문제를 이동 종료 시 기록을 저장하고 상태를 비우도록 수정
- 환승 안내를 무시해도 막히지 않는 경로 확인: 탑승이 자동으로 감지되고 이동이 이어짐. Stop 경로와 무시 경로를 각각 브라우저에서 처음부터 끝까지 확인

## 실패한 시도
- 환승·도착 임박을 별도 화면(`transferSoon`, `arrivalSoon`)으로 두었으나, 독서 화면은 그대로 두고 Dynamic Island 상태만 바뀌게 합쳤음
- 모바일 화면에서 하단 버튼이 화면 밖으로 밀려서, 높이를 늘리는 방식 대신 전체를 같은 비율로 줄여 맞추는 방식으로 변경
- GitHub 저장소로 push하려 했으나 인증 문제로 막혀서, 처음 배포는 Vercel CLI로 `experiments/claude` 폴더를 직접 올렸음. 이후 GitHub CLI 브라우저 로그인으로 push에 성공했고, Vercel 프로젝트를 이 저장소(Root Directory `experiments/claude`, `main` 브랜치)에 연결해 이후 push는 자동 배포됨

## 남은 한계
- 위치·환승·탑승·도착 감지와 밀리의 서재 앱 실행은 구현하지 않고 시뮬레이션함. 환승 3/2/1분과 도착 시간은 시연용으로 압축한 시간
- 동작 확인은 데스크톱 브라우저에서 했고, 실제 휴대폰과 실제 이동 환경에서는 확인하지 못함
- 사용자 테스트는 하지 않았고, 개인 확인 수준의 점검만 진행함
- 데이터는 브라우저 localStorage에만 저장되며 서버로 보내지 않음
