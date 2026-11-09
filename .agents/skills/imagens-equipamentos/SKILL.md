---
name: imagens-equipamentos
description: Prepara as fotos do catálogo REST usando a API do Pixabay, padroniza os JPEGs e valida o manifesto. Use na carga ou troca de imagens de equipamentos.
---

1. Leia references/pixabay.md. Execute scripts/photos.ps1 em Windows PowerShell. O modo Search gera uma lista de candidatos, sem upload.
2. Preencha selections.json com assetTag, photoId e approved para cada escolha. No modo Prepare, gere os JPEGs. Revise visualmente os JPEGs finais em 800 × 600. Registre as recusas com ID e motivo em rejections.json.
3. Marque approved como true para as escolhas finais e rode o modo Verify. O manifesto só é gerado quando todos os 12 JPEGs são válidos e têm aprovação humana.
4. Entregue à titular os JPEGs e o manifesto. A publicação no bucket do Supabase é feita pela titular em sessão separada.
