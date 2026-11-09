# Pixabay

- API oficial: https://pixabay.com/api/docs/
- Licença: https://pixabay.com/service/license-summary/
- Configure PIXABAY_API_KEY na sessão privada. A chave vai apenas na consulta à API e não deve aparecer em logs.
- O cache local da pesquisa é reutilizado por 24 horas. Baixe as seleções antes que as URLs retornadas expirem. Mantenha os arquivos finais no Storage da entrega.
- Critério visual: rejeite qualquer pessoa, marca ou logo legível, texto e tela com conteúdo. Confira tanto a fonte quanto o JPEG final. Guarde o ID e a razão de cada reprovação.
- selections.json é um array como [{"assetTag":"TI-0001","photoId":123,"approved":false}]. rejections.json é um array como [{"photoId":456,"reason":"Marca legível"}], ou [] se nenhuma candidata foi recusada.
