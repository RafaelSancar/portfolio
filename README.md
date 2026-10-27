# Portfólio de Rafael Carvalho

Portfólio pessoal com projetos e demonstrações interativas, feito com HTML, CSS e JavaScript.

- Site: https://rafaelsancar.github.io/portfolio/
- Código do site: `site/`

## Visualizar localmente

Na pasta do projeto, execute `python -m http.server 8080 --directory site` e acesse http://localhost:8080.

## Publicação

O GitHub Pages publica o conteúdo da branch `gh-pages`.
Para atualizar, salve as alterações em um commit e execute:

```sh
git push origin main
git subtree push --prefix site origin gh-pages
```

Backups e outros projetos locais não fazem parte deste repositório.
