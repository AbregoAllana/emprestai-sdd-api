# Dados iniciais

PRD de empréstimo de equipamentos. ADR-001 (stack) e ADR-003 (operação).

## Critérios de aceite

- CA-01: exatamente os 12 equipamentos da lista canônica, 9 disponíveis e TI-0004, TI-0007 e TI-0010 em manutenção.
- CA-02: 12 fotos distintas da API do Pixabay, aprovadas visualmente, de 800 × 600, com licença e URL pública no Supabase Storage.
- CA-03: conta do professor como colaborador, login funcionando e zero empréstimos. Senha definida no Supabase Auth pela titular.
- CA-04: duas execuções preservam patrimônios, IDs, fotos e vínculo sem criar empréstimos.

## Validade da aprovação (CA-02)

A aprovação visual referencia o SHA-256 do JPEG revisado. Cada preparação ou verificação invalida o manifesto anterior. O manifesto só volta a existir após uma verificação bem-sucedida de todo o lote.

## Fora de escopo

Tela de catálogo, interface de cadastro e importação da planilha.
