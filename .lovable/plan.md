
# Plano: Implementar Página de Configurações do Usuário

## Objetivo
Criar uma página de configurações completa para o painel do usuário, permitindo gerenciar informações pessoais e de segurança da conta.

---

## Funcionalidades da Página

### Aba 1: Perfil
- Editar nome completo
- Editar telefone
- Visualizar email (somente leitura)
- Visualizar código de indicação (somente leitura)
- Upload de foto de perfil (avatar)

### Aba 2: Segurança
- Alterar senha (senha atual + nova senha + confirmação)

### Aba 3: Preferências (futuro)
- Espaço reservado para configurações de notificações e preferências

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/pages/Settings.tsx` | Criar | Página principal de configurações |
| `src/App.tsx` | Modificar | Adicionar rota `/settings` |
| `src/components/layout/Sidebar.tsx` | Modificar | Adicionar item "Configurações" no menu |

---

## Estrutura da Página

```text
┌─────────────────────────────────────────────────────────────┐
│  Configurações                                              │
├─────────────────────────────────────────────────────────────┤
│  [Perfil]  [Segurança]                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📷 Avatar                                          │   │
│  │  ┌──────┐                                           │   │
│  │  │  AB  │  [Alterar foto]                           │   │
│  │  └──────┘                                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Nome Completo                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  João Silva                                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Telefone                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  (11) 99999-9999                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Email (não editável)                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  joao@email.com                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Código de Indicação                                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ABC123XYZ                              [Copiar]    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│                              [Salvar Alterações]            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### 1. Criar Settings.tsx

A página terá:
- Tabs para navegação entre seções (Perfil / Segurança)
- Busca de dados do perfil atual via Supabase
- Formulário para edição com validação
- Toast de feedback para sucesso/erro
- Uso do `effectiveUserId` para compatibilidade com impersonação

```typescript
// Estrutura base
const Settings = () => {
  const { user, effectiveUserId, updatePassword } = useAuth();
  const [profile, setProfile] = useState({ full_name, phone, avatar_url, email, referral_code });
  
  // Aba Perfil: atualiza tabela profiles
  const handleSaveProfile = async () => {
    await supabase.from('profiles').update({...}).eq('user_id', effectiveUserId);
  };
  
  // Aba Segurança: atualiza senha via auth
  const handleChangePassword = async () => {
    await updatePassword(newPassword);
  };
};
```

### 2. Modificar App.tsx

Adicionar nova rota dentro do DashboardLayout:

```typescript
import Settings from "./pages/Settings";

// Dentro das rotas protegidas:
<Route path="/settings" element={<Settings />} />
```

### 3. Modificar Sidebar.tsx

Adicionar item de menu na lista `userNavItems`:

```typescript
import { Settings } from 'lucide-react';

const userNavItems: NavItem[] = [
  // ... itens existentes
  { label: 'Configurações', href: '/settings', icon: Settings },
];
```

---

## Funcionalidades de Segurança

### Alteração de Senha
- Campo para nova senha (mínimo 6 caracteres)
- Campo para confirmar nova senha
- Validação de que as senhas coincidem
- Usa `updatePassword()` do AuthContext (já implementado)

### Validações
- Nome: mínimo 2 caracteres
- Telefone: formato válido (opcional)
- Senha: mínimo 6 caracteres
- Confirmação de senha: deve coincidir

---

## Design Visual

A página seguirá o padrão visual existente:
- Background: `bg-[#0a0f14]` e `bg-[#111820]`
- Bordas: `border-[#1e2a3a]`
- Cores de destaque: gradientes teal-to-cyan
- Cards com hover effects
- Inputs com estilo dark consistente

---

## Fluxo do Usuário

```text
1. Usuário clica em "Configurações" no menu lateral
       |
       v
2. Página carrega com dados do perfil atual
       |
       v
3. Usuário edita informações desejadas
       |
       v
4. Clica em "Salvar Alterações"
       |
       v
5. Sistema valida e salva no banco
       |
       v
6. Toast de sucesso confirma a ação
```

---

## Resultado Esperado

Após a implementação:
1. Item "Configurações" aparecerá no menu lateral (com ícone de engrenagem)
2. Ao clicar, usuário verá página com abas Perfil e Segurança
3. Poderá editar nome, telefone e foto de perfil
4. Poderá alterar sua senha na aba Segurança
5. Links no Header (dropdown) para Configurações e Meu Perfil funcionarão corretamente
