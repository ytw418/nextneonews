# NeoNews (네오뉴스)

최신 뉴스와 K-POP 소식을 실시간으로 전달하는 뉴스 플랫폼입니다.

## 🚀 주요 기능

- 실시간 뉴스 피드
- K-POP 전문 뉴스 섹션
- AI 기반 뉴스 생성
- 다크모드 지원
- 모바일 최적화 UI
- 무한 스크롤
- 반응형 디자인

## 🛠 기술 스택

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- SWR
- React Hook Form
- Shadcn/ui

### Backend

- Prisma
- Supabase (PostgreSQL)
- MSW (Mock Service Worker)

### AI/ML

- OpenAI
- Langchain
- Hugging Face

## 🏃‍♂️ 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- Yarn 패키지 매니저
- Supabase 계정 및 프로젝트

### 설치 방법

1. 저장소 클론

   ```bash
   git clone https://github.com/your-username/neonews.git
   cd neonews
   ```

2. 의존성 설치

   ```bash
   yarn install
   ```

3. 환경 변수 설정

   ```bash
   cp .env.example .env
   ```

   > `.env` 파일을 열고 다음 환경 변수들을 설정하세요:
   >
   > ```bash
   > DATABASE_URL="your-supabase-postgresql-url"
   > DIRECT_URL="your-supabase-direct-connection-url"
   > ```

4. 데이터베이스 마이그레이션

   ```bash
   # 개발 환경
   npx prisma migrate dev --name init

   # 프로덕션 환경
   npx prisma migrate deploy
   ```

5. 개발 서버 실행
   ```bash
   yarn dev
   ```

이제 [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

## 📱 주요 페이지

| 경로         | 설명                |
| ------------ | ------------------- |
| `/`          | 메인 페이지         |
| `/post/[id]` | 뉴스 상세 페이지    |
| `/write`     | 뉴스 작성 페이지    |
| `/generate`  | AI 뉴스 생성 페이지 |
| `/k-pop`     | K-POP 뉴스 페이지   |

## 🌙 다크모드

시스템 설정에 따라 자동으로 다크모드가 적용됩니다.

## 📝 개발 규칙

1. 컴포넌트 파일명은 대문자로 시작
2. 폴더명은 소문자로 시작
3. 클라이언트 컴포넌트는 `xxClient` 형식으로 네이밍
4. 모바일 우선 UI/UX 설계
5. TypeScript 사용 필수

## 🤝 기여하기

1. 프로젝트 Fork
2. Feature 브랜치 생성
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. 변경사항 커밋
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. 브랜치에 Push
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Pull Request 생성

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)를 따릅니다.

## 👥 팀원

| 이름           | 역할       | GitHub                               |
| -------------- | ---------- | ------------------------------------ |
| ytw418(윤성준) | Full Stack | [@ytw418](https://github.com/ytw418) |

## 📞 문의하기

프로젝트에 대한 문의사항이 있으시다면 [이슈](https://github.com/your-username/neonews/issues)를 생성해주세요.
