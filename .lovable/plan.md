
# Plano: Alterar Nome do Site para N3XPRIME

## Objetivo
Substituir todas as referências de "INVEST HUB" ou "Invest Hub" pelo nome "N3XPRIME" em toda a aplicação.

## Arquivos a Modificar

### 1. **index.html**
- Alterar `<title>Lovable App</title>` para `<title>N3XPRIME</title>`
- Alterar `og:title` para "N3XPRIME"

### 2. **src/components/landing/LandingHeader.tsx**
- Linha 25: `INVEST HUB` → `N3XPRIME`

### 3. **src/components/landing/LandingFooter.tsx**
- Linha 15: `INVEST HUB` → `N3XPRIME`
- Linha 75: `Invest Hub` → `N3XPRIME`

### 4. **src/components/landing/AboutSection.tsx**
- Linha 27: `Invest Hub` → `N3XPRIME`
- Linha 37: `O Invest Hub é` → `O N3XPRIME é`

### 5. **src/components/layout/Sidebar.tsx**
- Linha 96: `Invest Hub` → `N3XPRIME`

### 6. **src/pages/Auth.tsx**
- Linha 247: `Invest Hub` → `N3XPRIME`

### 7. **src/pages/MLMNetwork.tsx**
- Linha 245: `Invest Hub - Convite` → `N3XPRIME - Convite`
- Linha 246-247: Referências a "Invest Hub" → `N3XPRIME`

### 8. **src/components/landing/QuickNavCards.tsx**
- Linha 7: `Conheça o Invest Hub` → `Conheça o N3XPRIME`

### 9. **supabase/migrations/20260201203825_68291cf4-4b0f-4f10-9d2b-d4dd8da5e3df.sql** (comentário apenas)
- Linha 2: Comentário `INVEST HUB` → `N3XPRIME`

## Resumo das Alterações
- **9 arquivos** serão modificados
- **~12 substituições** totais
- Mantém a estrutura e funcionalidade intacta
- Apenas muda o nome visual da marca

## Nota Importante
O logo (ícone do bot/trending) permanece igual, apenas o texto é alterado para "N3XPRIME".
