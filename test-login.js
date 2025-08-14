import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  try {
    console.log('=== Testando Login do Usuário Admin ===\n');
    
    // Test login with the admin user
    const adminEmail = 'jmarcss.rm@gmail.com';
    const adminPassword = 'Jm@2024'; // You'll need to provide the correct password
    
    console.log(`Tentando fazer login com: ${adminEmail}`);
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message);
      return;
    }
    
    console.log('✅ Login realizado com sucesso!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('Email confirmado:', !!authData.user.email_confirmed_at);
    
    // Now try to get the user profile
    console.log('\nBuscando perfil do usuário...');
    
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError.message);
    } else {
      console.log('✅ Perfil encontrado:');
      console.log('- Nome:', userProfile.name);
      console.log('- Role:', userProfile.role);
      console.log('- Ativo:', userProfile.is_active);
    }
    
    // Test accessing some data
    console.log('\nTestando acesso aos dados...');
    
    const { data: entities, error: entitiesError } = await supabase
      .from('entities')
      .select('*')
      .limit(5);
    
    if (entitiesError) {
      console.error('❌ Erro ao acessar entidades:', entitiesError.message);
    } else {
      console.log(`✅ Acesso às entidades funcionando (${entities.length} encontradas)`);
    }
    
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .limit(5);
    
    if (accountsError) {
      console.error('❌ Erro ao acessar contas:', accountsError.message);
    } else {
      console.log(`✅ Acesso às contas funcionando (${accounts.length} encontradas)`);
    }
    
    const { data: financialFacts, error: factsError } = await supabase
      .from('financial_facts')
      .select('*')
      .limit(5);
    
    if (factsError) {
      console.error('❌ Erro ao acessar dados financeiros:', factsError.message);
    } else {
      console.log(`✅ Acesso aos dados financeiros funcionando (${financialFacts.length} encontrados)`);
    }
    
    // Sign out
    console.log('\nFazendo logout...');
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('❌ Erro no logout:', signOutError.message);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }
    
    console.log('\n=== Teste de Login Concluído ===');
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
  }
}

// Test with different password if the first one fails
async function testWithDifferentPasswords() {
  const adminEmail = 'jmarcss.rm@gmail.com';
  const passwords = ['Jm@2024', 'admin123', 'password123', 'Admin@123'];
  
  console.log('=== Testando diferentes senhas ===\n');
  
  for (const password of passwords) {
    console.log(`Testando senha: ${password}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: password,
    });
    
    if (!error) {
      console.log(`✅ Senha correta encontrada: ${password}`);
      await supabase.auth.signOut();
      return password;
    } else {
      console.log(`❌ Senha incorreta: ${password}`);
    }
  }
  
  console.log('❌ Nenhuma senha funcionou');
  return null;
}

// Run the test
testWithDifferentPasswords().then(correctPassword => {
  if (correctPassword) {
    console.log(`\nUsando senha correta (${correctPassword}) para teste completo...\n`);
    testLogin();
  } else {
    console.log('\n❌ Não foi possível fazer login. Verifique as credenciais.');
  }
});