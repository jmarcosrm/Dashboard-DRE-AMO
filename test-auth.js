import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Role Key exists:', !!supabaseKey);

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('\n=== Testando conexão com Supabase ===');
    
    // Test 1: Check users table
    console.log('\n1. Verificando tabela users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');
    
    if (usersError) {
      console.error('Erro ao buscar usuários:', usersError);
    } else {
      console.log('Usuários encontrados:', users.length);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.role}) - Ativo: ${user.is_active}`);
      });
    }
    
    // Test 2: Check auth users
    console.log('\n2. Verificando usuários de autenticação...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError);
    } else {
      console.log('Usuários de auth encontrados:', authUsers.users.length);
      authUsers.users.forEach(user => {
        console.log(`- ${user.email} - Confirmado: ${!!user.email_confirmed_at}`);
      });
    }
    
    // Test 3: Check permissions
    console.log('\n3. Verificando permissões da tabela users...');
    const { data: permissions, error: permError } = await supabase
      .rpc('check_table_permissions', { table_name: 'users' })
      .single();
    
    if (permError) {
      console.log('Função check_table_permissions não existe, verificando manualmente...');
      
      // Try to query with anon key
      const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
      const { data: anonTest, error: anonError } = await anonSupabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (anonError) {
        console.log('Erro com chave anon:', anonError.message);
      } else {
        console.log('Chave anon funcionando');
      }
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

testConnection();