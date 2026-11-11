---
name: imagens-equipamentos
description: Prepara as fotos do catálogo REST usando a API do Pixabay, padroniza os JPEGs e valida o manifesto. Use na carga ou troca de imagens de equipamentos.
---

1. Leia references/pixabay.md. Execute scripts/photos.ps1 em Windows PowerShell. O modo Search gera uma lista de candidatos, sem upload.
2. Preencha selections.json com assetTag, photoId e approved para cada escolha. No modo Prepare, gere os JPEGs. Revise visualmente os JPEGs finais em 800 × 600. Registre as recusas com ID e motivo em rejections.json.
3. Para cada JPEG que você revisou, registre o SHA-256 em approvedSha256 e marque approved como true. Se os bytes mudarem, faça uma nova revisão. Rode Verify. Prepare e Verify invalidam manifest.json no início. Só uma verificação bem-sucedida gera um novo manifesto.
4. Entregue à titular os JPEGs e o manifesto. A publicação no bucket do Supabase é feita pela titular em sessão separada.
