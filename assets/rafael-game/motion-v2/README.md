# Movimentos v2 — 80 quadros

Cinco animações com 16 quadros cada: walk.webp (caminhada), run.webp (corrida), wave.webp (aceno), present.webp (apresentação) e celebrate.webp (comemoração). Anteriormente eram 8 quadros de caminhada, 8 de corrida e 4 por gesto, totalizando 28.

Imagens novas geradas com image_gen integrado, usando o personagem existente e os movimentos anteriores como referência. Folhas originais em sources/ e prompts integrais em walk-prompt.txt, run-prompt.txt, wave-prompt.txt, present-prompt.txt e celebrate-prompt.txt. Caminhada e corrida combinam os oito quadros anteriores com oito novas poses; os três gestos usam 16 novas poses cada. Na corrida, oito poses completas foram selecionadas da folha gerada; poses cortadas não são usadas.

Os assets WebP são atlas de reprodução, com as silhuetas extraídas, redimensionadas proporcionalmente e organizadas sem repintura. O eixo do quadril e a linha de apoio dos pés são normalizados. Metadados individuais e manifest.json registram as dimensões, quadros e origens.

Cada movimento usa 16 poses distintas, e o motor lê a contagem real de quadros. O ciclo de locomoção tem velocidade limitada para não saltar vários quadros ao rolar rapidamente. Gestos reproduzem a 12 quadros por segundo; apresentação mantém a última pose, enquanto aceno pode repetir o ciclo. A intro usa o mesmo aceno de 16 quadros. Movimento reduzido mantém a pose parada.

Artes generativas ainda podem apresentar pequenas variações de tecido e anatomia entre poses. Os originais foram preservados para refinamento artístico posterior.
