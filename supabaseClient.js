
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('خطأ: مفاتيح Supabase مش موجودة في ملف .env')
  console.error('تأكد من إنك حاطط SUPABASE_URL و SUPABASE_ANON_KEY')
  process.exit(1) 
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)