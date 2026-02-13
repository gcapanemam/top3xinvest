

# Plano: Desativar confirmacao de email no cadastro

## Objetivo
Remover a necessidade de confirmar o email ao se cadastrar. O usuario podera acessar a plataforma imediatamente apos o registro.

## Alteracao

### Configuracao de autenticacao
Ativar a opcao de auto-confirmacao de email no sistema de autenticacao do backend. Isso fara com que novos usuarios sejam automaticamente confirmados ao se cadastrar, sem precisar clicar em nenhum link de email.

## Detalhes tecnicos
- Sera utilizada a ferramenta de configuracao de autenticacao para habilitar `autoconfirm` para signups por email
- Nenhum arquivo de codigo precisa ser alterado
- A funcionalidade de "esqueci minha senha" continuara funcionando normalmente

