import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dyjsggqdugfgbtryycjq.supabase.co'
const supabaseKey = 'sb_publishable_YGiBzHtltVvdXqwFj66a0Q_q0qg3Xcr'

export const supabase = createClient(supabaseUrl, supabaseKey)