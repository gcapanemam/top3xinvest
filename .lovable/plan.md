

# Plano: Melhorar Tratamento de Erros no Cadastro

## Situacao Atual

O cadastro esta funcionando corretamente. Testei o fluxo completo com o email "hawseven@gmail.com" e o usuario foi criado com sucesso no banco de dados.

O erro reportado pelo usuario pode ter ocorrido por:
- Tentativa anterior com email ja registrado
- Problema temporario de rede
- Rate limiting do Supabase

## Problema Identificado

A mensagem de erro atual e muito generica:
```typescript
let message = 'Erro ao criar conta';
if (error.message.includes('User already registered')) {
  message = 'Este email já está cadastrado';
}
```

Isso nao cobre todos os cenarios possiveis de erro.

---

## Solucao Proposta

### 1. Melhorar Tratamento de Erros

Adicionar mais casos de erro especificos no `handleRegister`:

| Erro do Supabase | Mensagem Amigavel |
|------------------|-------------------|
| User already registered | Este email ja esta cadastrado |
| Email rate limit exceeded | Muitas tentativas. Aguarde alguns minutos |
| Signup disabled | Cadastros estao temporariamente desativados |
| Invalid email | Formato de email invalido |
| Password too short | Senha deve ter pelo menos 6 caracteres |
| Network error | Falha de conexao. Verifique sua internet |

### 2. Adicionar Log de Debug

Para facilitar diagnostico de problemas futuros, adicionar log do erro real (apenas em desenvolvimento):

```typescript
console.error('Signup error:', error.message);
```

---

## Secao Tecnica

### Arquivo: src/pages/Auth.tsx

Alterar a funcao `handleRegister` para tratar mais tipos de erro:

```typescript
if (error) {
  let message = 'Erro ao criar conta';
  
  if (error.message.includes('User already registered')) {
    message = 'Este email já está cadastrado';
  } else if (error.message.includes('rate limit')) {
    message = 'Muitas tentativas. Aguarde alguns minutos e tente novamente';
  } else if (error.message.includes('Signup disabled')) {
    message = 'Cadastros estão temporariamente desativados';
  } else if (error.message.includes('invalid email')) {
    message = 'Formato de email inválido';
  } else if (error.message.includes('Password')) {
    message = 'Senha inválida. Use pelo menos 6 caracteres';
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    message = 'Falha de conexão. Verifique sua internet e tente novamente';
  }
  
  console.error('Signup error:', error.message);
  
  toast({
    title: 'Erro',
    description: message,
    variant: 'destructive',
  });
}
```

---

## Resultado Esperado

- Usuario recebe mensagens de erro mais claras e informativas
- Facilita diagnostico de problemas futuros via console
- Melhora a experiencia do usuario ao identificar exatamente o que deu errado

---

## Nota

O cadastro com "hawseven@gmail.com" foi criado com sucesso durante meu teste. O usuario pode tentar fazer login com esse email, ou caso ainda queira testar o cadastro, usar um email diferente.

