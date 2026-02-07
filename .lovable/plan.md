
Objetivo
- Eliminar o erro “Erro ao gerar link de pagamento” ao criar depósitos via OxaPay, que hoje acontece quando a chamada para a função de backend chega com um token inválido/ausente (nos logs aparece como “Auth session missing!”).
- Melhorar a experiência do usuário com mensagens mais claras e um caminho de recuperação (“tentar novamente”) sem precisar criar/deletar depósitos manualmente.
- (Bônus de segurança) Evitar que um usuário consiga informar um `depositId` de outra pessoa e atualizar/consultar dados indevidamente.

O que está acontecendo (diagnóstico)
- A função `oxapay-create-invoice` exige autenticação e valida o token com `auth.getUser()`.
- Quando o frontend chama `supabase.functions.invoke(...)` sem uma sessão válida no momento, a requisição pode sair com um `Authorization` que não é um JWT de usuário (ou vazio/anon), e aí a função retorna 401 e o app mostra a mensagem genérica “Erro ao gerar link de pagamento”.
- No meu teste a função retornou `payLink` corretamente quando o token veio certo; então o problema é intermitente e ligado ao estado de sessão no navegador do usuário.

Mudanças propostas (sem alterar o comportamento principal do produto)
1) Frontend: garantir token de sessão antes de chamar o backend (Deposits)
Arquivo: `src/pages/Deposits.tsx`
- Antes de invocar `oxapay-create-invoice`, buscar a sessão atual:
  - `const { data: { session } } = await supabase.auth.getSession()`
  - Se `session?.access_token` não existir:
    - Mostrar toast: “Sessão expirada. Faça login novamente.”
    - Redirecionar para `/auth`
    - Não criar depósito (ou, alternativamente, criar e deixar em pending; prefiro não criar para evitar “lixo”)
- Chamar `supabase.functions.invoke('oxapay-create-invoice', { body, headers: { Authorization: `Bearer ${session.access_token}` } })` explicitamente.
  - Isso evita depender do comportamento automático quando a sessão está instável.
- Melhorar mensagem de erro:
  - Se `invoiceData?.error` existir, exibir ela.
  - Se não, exibir também `invoiceError?.message` (hoje isso não aparece e cai no genérico).
- Se a função retornar 401, orientar login novamente (e opcionalmente forçar `signOut()`).

2) Frontend: robustez no acompanhamento (PaymentStatus)
Arquivo: `src/pages/PaymentStatus.tsx`
- No `checkStatus`, aplicar a mesma regra:
  - Buscar `session.access_token` e passar `Authorization` explicitamente no invoke de `oxapay-check-status`.
  - Se não houver token, parar o polling e redirecionar para `/auth` com toast.
- Tratamento melhor de erro:
  - Se `error` vier do invoke, registrar e (em 401) mostrar toast claro.

3) UX: permitir “Recuperar link de pagamento” quando falhar
Arquivos: `src/pages/PaymentStatus.tsx` (e opcionalmente `src/pages/Deposits.tsx`)
- Se o depósito estiver `pending` e `oxapay_pay_link` estiver vazio:
  - Exibir um botão “Gerar link de pagamento novamente”.
  - Ao clicar:
    - Rechamar `oxapay-create-invoice` com `depositId` + `amount` do depósito
    - Atualizar o depósito (vai ocorrer via backend) e refazer `fetchDeposit()`
- Benefício: se a primeira tentativa falhar por sessão/token, o usuário não fica travado.

4) Backend: validar propriedade do depósito e reduzir risco de abuso (IDOR)
Arquivo: `supabase/functions/oxapay-create-invoice/index.ts`
- Após autenticar o usuário, buscar o depósito pelo `depositId` usando a chave de serviço (já usada para update):
  - `select user_id, amount, status from deposits where id = depositId`
- Validar:
  - Depósito existe
  - `deposit.user_id === user.id` (se não, retornar 403)
  - Opcional: `status === 'pending'` (se já aprovado, não gerar fatura)
  - Opcional: conferir que `amount` do request bate com `deposit.amount` (tolerância para float)
- Se falhar, retornar erro claro (JSON) para o frontend.

Arquivo: `supabase/functions/oxapay-check-status/index.ts`
- Mesma ideia: após autenticar, buscar o depósito no banco e validar que pertence ao usuário.
- Opcional (recomendado): validar que `trackId` informado bate com o `oxapay_track_id` salvo no depósito.

5) Backend: CORS mais completo (opcional, mas seguro)
Arquivo: `supabase/functions/_shared/cors.ts`
- Adicionar `Access-Control-Allow-Methods` (ex.: `GET,POST,OPTIONS`) para evitar problemas em alguns navegadores / cenários de preflight.

6) (Recomendação forte) Endurecer webhook para evitar aprovações falsas
Arquivo: `supabase/functions/oxapay-webhook/index.ts`
- Hoje o webhook aprova depósito apenas com `orderId` + `status: Paid`, sem validar nada além disso.
- Mitigação mínima sem depender de assinatura:
  - Buscar depósito e comparar `deposit.oxapay_track_id` com `trackId` do webhook.
  - (Opcional) confirmar `amount` recebido é compatível com `deposit.amount`.
  - Se não bater, retornar 400/403 e não creditar saldo.
- Se OxaPay oferecer assinatura/secret no webhook, podemos implementar validação de assinatura também (precisaria confirmar o formato exato).

Plano de testes (end-to-end)
- No app:
  1) Logar, ir em Depósitos, criar depósito de $1.
  2) Confirmar que navega para `/deposit/status/:id` e aparece botão “Ir para Pagamento”.
  3) Abrir em outra aba/atualizar a página e confirmar que o status continua funcionando.
- Simular sessão inválida:
  1) Fazer logout, tentar criar depósito (deve orientar login).
- Recuperação:
  1) Forçar cenário sem `oxapay_pay_link` (criando depósito e interrompendo a geração do invoice) e validar botão “Gerar link novamente”.
- Segurança:
  - Tentar chamar a função com `depositId` de outro usuário (deve retornar 403).

Impacto e risco
- Sem mudanças de schema.
- Mudanças pequenas no frontend e nas funções de backend, com grande ganho de estabilidade.
- As validações de propriedade do depósito melhoram segurança sem afetar usuários legítimos.

Arquivos que serão alterados
- `src/pages/Deposits.tsx`
- `src/pages/PaymentStatus.tsx`
- `supabase/functions/oxapay-create-invoice/index.ts`
- `supabase/functions/oxapay-check-status/index.ts`
- (opcional) `supabase/functions/_shared/cors.ts`
- (recomendado) `supabase/functions/oxapay-webhook/index.ts`
