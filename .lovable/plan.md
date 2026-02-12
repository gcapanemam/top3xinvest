

# Plano: Mostrar horario e atualizar status automaticamente

## Mudancas na pagina Meus Investimentos (Investments.tsx)

### 1. Mostrar hora no Inicio e Fim

Atualmente os campos "Inicio" e "Liberacao" mostram apenas `dd/MM/yy`. Vamos alterar para `dd/MM/yy HH:mm` para incluir a hora.

**Linha ~243 (Inicio):**
```text
ANTES:  format(new Date(investment.created_at), 'dd/MM/yy', { locale: ptBR })
DEPOIS: format(new Date(investment.created_at), 'dd/MM/yy HH:mm', { locale: ptBR })
```

**Linha ~254 (Liberacao):**
```text
ANTES:  format(new Date(investment.lock_until), 'dd/MM/yy', { locale: ptBR })
DEPOIS: format(new Date(investment.lock_until), 'dd/MM/yy HH:mm', { locale: ptBR })
```

### 2. Atualizacao automatica de status ao expirar o bloqueio

Adicionar um `useEffect` com timer que verifica a cada 30 segundos se algum investimento ativo passou da data de `lock_until`. Quando detectar, forca um re-render para que o badge mude de "Em Operacao" para "Disponivel" sem precisar recarregar a pagina manualmente.

```text
useEffect com setInterval(30s):
  - Verifica se algum investimento ativo tem lock_until no passado
  - Se sim, forca re-render via estado contador
  - Limpa o interval ao desmontar o componente
```

### 3. Mesma correcao no Dashboard (Dashboard.tsx)

Aplicar a mesma logica de horario nos campos de data dos cards de investimento do Dashboard, e adicionar o mesmo timer de auto-refresh.

