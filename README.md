# 거래처 매출·수금 관리

소규모 팀(3명) 전용 내부 관리 앱. 거래처별 출고/발행/수금/금고 출금을 월별로 관리합니다.

## 기술 스택

- Next.js 14 (App Router)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- Vercel 배포

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일에 Supabase 정보를 입력합니다.

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY`는 관리자 페이지에서 회원 생성/탈퇴 API에 필요합니다.

### 3. Supabase DB 설정

Supabase SQL Editor에서 `supabase/schema.sql` 파일 내용을 실행합니다.

### 4. 최초 관리자 계정

1. Supabase Dashboard → Authentication → Users에서 관리자 이메일/비밀번호 생성
2. SQL Editor에서 profiles 테이블에 INSERT:

```sql
insert into profiles (id, name, role)
values ('<생성된-user-uuid>', '관리자', 'admin');
```

### 5. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 로그인합니다.

## 역할별 권한

| 역할 | 권한 |
|------|------|
| admin | 전체 열람, 수정/삭제, 회원 관리, 금고, 보고서 |
| jibgye | 출고/수금 기입, 금고 관리, 보고서 |
| sales | 출고/수금 기입만 |

## 페이지

- `/` — 로그인
- `/shipments` — 출고/발행 기입
- `/collections` — 수금 기입
- `/vault` — 금고 관리 (jibgye, admin)
- `/report` — 월별 조회/보고서 (jibgye, admin)
- `/admin` — 회원 관리 (admin)

## 배포 (Vercel)

1. GitHub에 푸시
2. Vercel에서 프로젝트 import
3. 환경 변수 3개 설정
4. Deploy
