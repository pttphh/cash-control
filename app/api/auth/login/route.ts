import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "invalid", message: "이메일과 비밀번호를 입력하세요." },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions;
            }[]
          ) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    console.log("=== 로그인 시도 ===", email);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({ email, password });

    console.log("=== Auth 결과 ===", {
      user: authData?.user?.id,
      error: authError?.message,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        {
          error: "auth",
          message: "이메일 또는 비밀번호가 올바르지 않습니다.",
          detail: authError?.message,
        },
        { status: 401 }
      );
    }

    console.log("=== Profile 조회 시작 ===", authData.user.id);
    console.log("=== SERVICE_ROLE_KEY 존재 ===", !!process.env.SUPABASE_SERVICE_ROLE_KEY);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .maybeSingle();

    console.log("=== Profile 결과 ===", {
      profile,
      error: profileError?.message,
    });

    if (profileError || !profile) {
      await supabase.auth.signOut();
      return NextResponse.json(
        {
          error: "profile",
          message: "프로필이 등록되지 않은 계정입니다. 관리자에게 문의하세요.",
          detail: profileError?.message,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, role: profile.role });
  } catch (e) {
    console.error("=== 로그인 오류 ===", e);
    return NextResponse.json(
      { error: "server", message: "로그인 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}