

# Adicionar Lista de Investidores nos Cards de Robos (Admin)

## O que sera feito

Na pagina de administracao de robos (`/admin/robots`), ao lado do texto "X investimento(s) ativo(s)", sera adicionado um botao clicavel que expande/mostra a lista dos nomes dos investidores ativos daquele robo. Cada investidor tera um icone de "olhinho" (Eye) que, ao ser clicado, faz a impersonacao do usuario e navega para a pagina `/investments`.

## Detalhes tecnicos

### Arquivo: `src/pages/admin/AdminRobots.tsx`

**1. Novo estado para controlar expansao**
- Adicionar estado `expandedInvestors` do tipo `Record<string, InvestorData[]>` para armazenar os investidores carregados por robo
- Adicionar estado `loadingInvestors` do tipo `Set<string>` para controle de loading

**2. Nova funcao `toggleInvestorsList`**
- Ao clicar no botao, busca os investimentos ativos do robo no banco (com join no profiles para pegar `full_name`)
- Se ja estiver expandido, colapsa (remove do estado)
- Exibe um spinner durante o carregamento

**3. Alteracao no card do robo (linhas 1686-1695)**
- Ao lado do texto "X investimento(s) ativo(s)", adicionar um botao com icone `Users` ou `ChevronDown`
- Abaixo, renderizar condicionalmente a lista de investidores quando expandida
- Cada item mostra o nome do investidor e um botao com icone `Eye`
- O clique no `Eye` chama `impersonateUser(userId, fullName)` e `navigate('/investments')`

**4. Imports adicionais**
- Importar `useAuth` para acessar `impersonateUser`
- O icone `Eye` ja esta importado no arquivo

### Fluxo do usuario

```
Admin ve card do robo -> "3 investimento(s) ativo(s)" [botao Users]
  -> Clica no botao
  -> Lista expande mostrando:
     - Joao Silva        [Eye]
     - Maria Santos      [Eye]
     - Pedro Oliveira    [Eye]
  -> Clica no Eye do "Joao Silva"
  -> Sistema impersona Joao e navega para /investments
```

### Dados buscados
- Tabela `investments` (filtro: `robot_id` e `status = 'active'`)
- Join com `profiles` para obter `full_name`
- Agrupado por usuario (caso um usuario tenha multiplos investimentos no mesmo robo)
