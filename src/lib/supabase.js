import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ncithrankyfykryiceyy.supabase.co'
const supabaseKey = 'sb_publishable_CN-C4wfDHuc6se0MAFSGTg_ByClynRS'

export const supabase = createClient(supabaseUrl, supabaseKey)