# Movimentos v4 — 100 quadros ativos

Folhas novas geradas com o `image_gen` integrado, usando o personagem existente como referência de identidade. Os cinco movimentos usam sequências próprias, sem intercalar poses das versões anteriores.

| Movimento | Antes | Agora |
| --- | ---: | ---: |
| Caminhada | 8 | 16 |
| Corrida | 8 | 16 |
| Aceno | 16 | 24 |
| Apresentação | 16 | 24 |
| Comemoração | 16 | 20 |
| Total | 64 | 100 |

Foram aprovadas as 20 poses completas da folha de comemoração, sem duplicar imagens para aumentar a contagem. Aceno e apresentação têm suas fases ordenadas para evitar levantar o braço novamente durante o retorno ao repouso.

Os PNGs originais estão em `sources/`. `prompts.json` registra os prompts completos e as referências das cinco gerações selecionadas. As versões anteriores continuam preservadas nas respectivas pastas.

Os arquivos WebP são atlas de reprodução: cada silhueta foi isolada e desenhada proporcionalmente em uma célula própria de 384 × 448 pixels. O quadril define a âncora horizontal; o apoio dos pés fica na linha 416 e a altura de referência é de 360 pixels. Isso elimina a captura de tênis e fragmentos dos quadros vizinhos. O alfa transparente foi preservado.

Os metadados de cada movimento incluem recorte de origem, célula original, âncora, apoio dos pés e ordem de reprodução. A intro e o cenário usam a contagem real dos quadros. Os gestos são reproduzidos a 14 quadros por segundo e terminam no repouso; a cadência de caminhada e corrida acompanha a velocidade do personagem.

Artes geradas podem apresentar pequenas variações de rosto e roupa entre poses. A contagem maior não elimina essa limitação; os originais foram preservados para novos refinamentos.
