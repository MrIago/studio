# Configurar a chave OpenRouter

A skill precisa de uma chave da [OpenRouter](https://openrouter.ai/keys) pra gerar
imagem/voz/música. O usuário fornece. Duas formas (a skill tenta env primeiro):

## Forma 1 — salvar na config (recomendado, persiste)

```bash
node ${CLAUDE_SKILL_DIR}/scripts/lib/config.mjs OPENROUTER_KEY=sk-or-v1-...
```

Salva em `~/.config/studio/.env` (privado, não commitado). A skill lê dali.

## Forma 2 — variável de ambiente

```bash
export OPENROUTER_KEY=sk-or-v1-...
```

## Chave de provisioning (caso raro)

Se a chave for uma **management/provisioning key** (que não gera direto — só
gerencia sub-keys, retorna 401 "User not found" em geração), use
`OPENROUTER_PROVISIONING_KEY` em vez de `OPENROUTER_KEY`. A skill cria
automaticamente uma sub-key de inferência (limit $20) a partir dela e cacheia.

```bash
node ${CLAUDE_SKILL_DIR}/scripts/lib/config.mjs OPENROUTER_PROVISIONING_KEY=sk-or-v1-...
```

## Segurança

- **Nunca commite a chave** nem a coloque em código. `~/.config/studio/.env` e
  `.env` já são privados.
- Se uma chave vazar (apareceu num chat, log, etc), **revogue** em
  https://openrouter.ai/keys e gere outra.
- Custo: cada geração desconta da chave. `usage.cost × 100` = créditos (1cr = 1¢ USD).
  Imagem ~4-24cr · voz/música ~1-8cr.
