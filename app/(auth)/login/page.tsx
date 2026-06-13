import LoginForm from "@/components/LoginForm";
import ClearSessionButton from "@/components/ClearSessionButton";

interface LoginPageProps {
  searchParams: { error?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const profileError = searchParams.error === "profile";

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center text-primary mb-2">
        거래처 매출·수금 관리
      </h1>
      <p className="text-center text-gray-500 text-sm mb-6">내부 관리 시스템</p>

      {profileError && (
        <div className="mb-4">
          <p className="text-danger text-sm bg-red-50 p-3 rounded-md">
            프로필이 등록되지 않은 계정입니다. 관리자에게 문의하세요.
          </p>
          <ClearSessionButton />
        </div>
      )}

      <LoginForm />
    </div>
  );
}
