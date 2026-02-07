
# Plano: Adicionar Botão "Acessar Painel do Usuário" para Admin

## Objetivo
Permitir que administradores acessem o painel de um usuário específico, visualizando a plataforma exatamente como esse usuário veria. Isso é útil para suporte, debug e verificação de problemas reportados pelos usuários.

## Abordagem

A implementação usará um sistema de **impersonação visual** onde:
1. O admin continua logado normalmente
2. A sessão de visualização é armazenada no localStorage
3. Uma barra fixa no topo indica que está no "modo visualização como usuário"
4. O admin pode sair desse modo a qualquer momento

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/contexts/AuthContext.tsx` | Modificar | Adicionar estado e funções para impersonação |
| `src/pages/admin/AdminUsers.tsx` | Modificar | Adicionar botão "Acessar Painel" no menu de ações |
| `src/components/layout/ImpersonationBanner.tsx` | Criar | Componente da barra de aviso de impersonação |
| `src/components/layout/DashboardLayout.tsx` | Modificar | Incluir o banner de impersonação |
| `src/pages/Dashboard.tsx` | Modificar | Buscar dados do usuário impersonado quando aplicável |

---

## Detalhes da Implementação

### 1. Atualizar AuthContext

Adicionar ao contexto:
- `impersonatedUser`: dados do usuário sendo visualizado (id, nome)
- `impersonateUser(userId, fullName)`: função para iniciar impersonação
- `stopImpersonation()`: função para parar impersonação
- `effectiveUserId`: retorna o ID do usuário impersonado (se houver) ou o ID real

```typescript
interface ImpersonatedUser {
  id: string;
  fullName: string | null;
}

// No contexto:
impersonatedUser: ImpersonatedUser | null;
impersonateUser: (userId: string, fullName: string | null) => void;
stopImpersonation: () => void;
effectiveUserId: string | null;
```

### 2. Modificar AdminUsers.tsx

Adicionar novo item no dropdown de ações de cada usuário:
- Ícone: `Eye` (olho)
- Texto: "Acessar Painel"
- Ação: Chama `impersonateUser()` e redireciona para `/dashboard`

```typescript
<DropdownMenuItem
  onClick={() => {
    impersonateUser(user.user_id, user.full_name);
    navigate('/dashboard');
  }}
  className="cursor-pointer text-cyan-400 focus:text-cyan-400 focus:bg-[#1e2a3a]"
>
  <Eye className="mr-2 h-4 w-4" />
  Acessar Painel
</DropdownMenuItem>
```

### 3. Criar ImpersonationBanner.tsx

Componente fixo no topo que aparece durante impersonação:
- Fundo amarelo/âmbar para destaque
- Mostra nome do usuário sendo visualizado
- Botão para sair do modo impersonação

```text
┌──────────────────────────────────────────────────────────────┐
│ ⚠️ Visualizando como: João Silva           [Sair do Modo]   │
└──────────────────────────────────────────────────────────────┘
```

### 4. Modificar DashboardLayout.tsx

- Importar e renderizar `ImpersonationBanner` quando houver impersonação ativa
- Banner fica acima do Header

### 5. Modificar Páginas do Dashboard

Nas páginas que buscam dados do usuário (Dashboard, Investments, etc):
- Usar `effectiveUserId` do contexto ao invés de `user.id`
- Isso faz com que os dados do usuário impersonado sejam exibidos

---

## Persistência

- A impersonação será armazenada no `sessionStorage` (não localStorage)
- Isso garante que a impersonação termina quando o navegador é fechado
- Ao recarregar a página, a impersonação continua ativa

---

## Segurança

- Apenas administradores podem iniciar impersonação (verificação de `isAdmin`)
- A impersonação é apenas visual/leitura - não permite alterações como se fosse o usuário
- O admin real continua autenticado, então qualquer ação sensível (como depósitos/saques) ainda seria associada ao admin
- O banner sempre visível impede confusão sobre qual contexto está sendo visualizado

---

## Fluxo do Usuário

```text
1. Admin acessa "Gestão de Usuários"
       |
       v
2. Clica em "..." no usuário desejado
       |
       v
3. Clica em "Acessar Painel"
       |
       v
4. É redirecionado para /dashboard
   com banner amarelo no topo
       |
       v
5. Visualiza dados do usuário
   (saldo, investimentos, rede, etc)
       |
       v
6. Clica em "Sair do Modo Visualização"
       |
       v
7. Volta a ver seus próprios dados
```

---

## Resultado Esperado

Após a implementação:
1. O dropdown de ações em cada usuário terá a opção "Acessar Painel"
2. Ao clicar, o admin será levado para o dashboard com os dados daquele usuário
3. Uma barra amarela no topo indicará claramente o modo de visualização
4. O admin pode navegar por todas as páginas vendo os dados do usuário
5. A qualquer momento pode clicar para sair do modo e voltar ao normal
