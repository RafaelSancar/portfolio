# Correção de fluidez

A reprodução usa os ciclos originais consistentes de 8 quadros para caminhada e corrida. Os gestos continuam com 16 quadros cada. Total ativo: 64 quadros. As folhas de 80 quadros da versão anterior permanecem preservadas em ../motion-v2/.

A combinação anterior alternava imagens com diferenças de anatomia e pose, causando saltos. Caminhada e corrida voltam aos respectivos ciclos completos, com eixo do corpo e apoio dos pés alinhados. A cadência acompanha a velocidade suavizada; os limites de entrada e saída da corrida são diferentes, reduzindo trocas repetidas de estado.

O Canvas acompanha a frequência da tela, sem o limite anterior de 30 fps. A densidade máxima de pixels foi reduzida para aliviar o desenho. Os atlas de gestos foram compactados proporcionalmente, mantendo os 16 quadros e a transparência. Nenhuma geração adicional foi feita: os originais continuam preservados.

Teste local de rolagem: aproximadamente 57 fps no ambiente usado. A taxa real depende do dispositivo. O teste também conferiu a sequência completa 0–7 sem saltos e a preservação dos textos Nous.
