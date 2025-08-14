import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAuthUsers() {
  try {
    console.log('=== Corrigindo usuários de autenticação ===\n');
    
    // 1. Get all users from users table
    const { data: dbUsers, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);
    
    if (dbError) {
      console.error('Erro ao buscar usuários da tabela:', dbError);
      return;
    }
    
    console.log(`Encontrados ${dbUsers.length} usuários ativos na tabela users`);
    
    // 2. Get all auth users
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Erro ao buscar usuários de auth:', authError);
      return;
    }
    
    const authUsers = authData.users;
    console.log(`Encontrados ${authUsers.length} usuários na autenticação\n`);
    
    // 3. Find users that exist in users table but not in auth
    const authEmails = new Set(authUsers.map(u => u.email));
    const missingAuthUsers = dbUsers.filter(u => !authEmails.has(u.email));
    
    console.log(`Usuários faltando na autenticação: ${missingAuthUsers.length}`);
    
    // 4. Create auth users for missing ones
    for (const user of missingAuthUsers) {
      console.log(`\nCriando usuário de auth para: ${user.email}`);
      
      const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: 'TempPassword123!', // Temporary password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });
      
      if (createError) {
        console.error(`Erro ao criar usuário ${user.email}:`, createError);
      } else {
        console.log(`✅ Usuário ${user.email} criado com sucesso`);
        
        // Update the users table with the correct auth ID
        const { error: updateError } = await supabase
          .from('users')
          .update({ id: newAuthUser.user.id })
          .eq('email', user.email);
        
        if (updateError) {
          console.error(`Erro ao atualizar ID do usuário ${user.email}:`, updateError);
        } else {
          console.log(`✅ ID do usuário ${user.email} atualizado`);
        }
      }
    }
    
    // 5. Check for users that exist in auth but not in users table
    const dbEmails = new Set(dbUsers.map(u => u.email));
    const missingDbUsers = authUsers.filter(u => !dbEmails.has(u.email));
    
    console.log(`\nUsuários faltando na tabela users: ${missingDbUsers.length}`);
    
    // 6. Create users table entries for missing ones
    for (const authUser of missingDbUsers) {
      console.log(`\nCriando entrada na tabela users para: ${authUser.email}`);
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email.split('@')[0],
          role: authUser.user_metadata?.role || 'user',
          is_active: true
        });
      
      if (insertError) {
        console.error(`Erro ao criar entrada na tabela para ${authUser.email}:`, insertError);
      } else {
        console.log(`✅ Entrada na tabela criada para ${authUser.email}`);
      }
    }
    
    console.log('\n=== Sincronização concluída ===');
    
    // 7. Final verification
    const { data: finalUsers, error: finalError } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true);
    
    if (!finalError) {
      console.log(`\nTotal de usuários ativos após sincronização: ${finalUsers.length}`);
      finalUsers.forEach(user => {
        console.log(`- ${user.email} (${user.role})`);
      });
    }
    
  } catch (error) {
    console.error('Erro geral:', error);
  }
}

fixAuthUsers();