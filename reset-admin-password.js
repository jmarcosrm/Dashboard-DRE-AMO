import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetAdminPassword() {
  try {
    console.log('=== Resetando senha do usuário admin ===\n');
    
    const adminEmail = 'jmarcss.rm@gmail.com';
    const newPassword = 'Admin@123456';
    
    // First, get the user by email
    const { data: authUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return;
    }
    
    const adminUser = authUsers.users.find(user => user.email === adminEmail);
    
    if (!adminUser) {
      console.error('Usuário admin não encontrado na autenticação');
      return;
    }
    
    console.log('Usuário admin encontrado:', adminUser.id);
    console.log('Email:', adminUser.email);
    console.log('Email confirmado:', !!adminUser.email_confirmed_at);
    
    // Reset the password
    console.log('\nResetando senha...');
    
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      adminUser.id,
      {
        password: newPassword,
        email_confirm: true // Ensure email is confirmed
      }
    );
    
    if (updateError) {
      console.error('❌ Erro ao resetar senha:', updateError);
      return;
    }
    
    console.log('✅ Senha resetada com sucesso!');
    console.log('Nova senha:', newPassword);
    
    // Test the new password
    console.log('\nTestando nova senha...');
    
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    
    const { data: loginData, error: loginError } = await anonSupabase.auth.signInWithPassword({
      email: adminEmail,
      password: newPassword,
    });
    
    if (loginError) {
      console.error('❌ Erro no teste de login:', loginError.message);
    } else {
      console.log('✅ Login com nova senha funcionando!');
      console.log('User ID:', loginData.user.id);
      
      // Test profile access
      const { data: profile, error: profileError } = await anonSupabase
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Erro ao acessar perfil:', profileError.message);
      } else {
        console.log('✅ Perfil acessível:');
        console.log('- Nome:', profile.name);
        console.log('- Role:', profile.role);
        console.log('- Ativo:', profile.is_active);
      }
      
      // Sign out
      await anonSupabase.auth.signOut();
    }
    
    console.log('\n=== Reset de senha concluído ===');
    console.log(`Use as credenciais: ${adminEmail} / ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

resetAdminPassword();