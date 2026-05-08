import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 단일 인스턴스 — 다른 모듈은 여기서 import해서 사용
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
