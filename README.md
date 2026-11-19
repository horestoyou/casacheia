# HourToYou

Protótipo local, otimizado para telemóvel. Abrir `index.html` num navegador moderno. Acesso de demonstração: `admin@gmail.com` / `admin`.

As contas e registos ficam apenas no armazenamento do navegador e dispositivo. Limpar os dados do navegador elimina-os. A palavra-passe é derivada com PBKDF2; ainda assim, este mecanismo e o utilizador administrador são apenas para demonstração. Antes de publicar, substituir o acesso local por autenticação e armazenamento seguros no servidor/base de dados e remover a conta de demonstração. Publicar estes ficheiros no Netlify não cria contas partilhadas nem proteção real.

## Ponto e horas
A data e hora usam `Atlantic/Azores` e o relógio do dispositivo. O histórico permite anular o registo mais recente. O total de horas conta apenas pares completos (entrada até almoço ou saída; regresso até almoço ou saída), sendo atribuídos ao mês em que o período se iniciou. Marcações incompletas são assinaladas e não são somadas.

## Ordenado e horas extra
O valor de referência por dia é o ordenado líquido mensal dividido por 22, e o valor por hora é esse resultado dividido por 8. As horas extra são introduzidas manualmente, com percentagem livre: é possível escolher percentagem como acréscimo ou como valor total da hora. Cada registo conserva a taxa de referência à data da sua criação. Os resultados são estimativas, não processam impostos, retenções ou regras contratuais e não são calculados automaticamente a partir do horário.

## Calendário e horários
Podem marcar-se folgas e adicionar períodos manualmente ou a partir de texto, TXT, DOCX e PDF que contenha texto. A extração automática procura pares de horas na mesma linha; formatos diferentes podem precisar de correção ou introdução manual. Confirmar sempre datas, horas e percursos antes de guardar. PDF digitalizado sem texto necessita de reconhecimento de texto externo ou transcrição. DOC antigo deve ser convertido para DOCX. As durações de horário são previstas, não descontam pausas e podem diferir em dias de mudança de hora; as horas efetivas usam o relógio de ponto. Dados pessoais e ficheiros são processados no dispositivo.

As bibliotecas locais PDF.js e JSZip e respetivas licenças encontram-se na pasta `vendor`. Não é necessário passo de compilação para uma futura publicação estática; a publicação e a ligação a uma base de dados são fases posteriores.

## Relatórios e perfil
Em Horas e no Calendário é possível exportar PDF, Excel e Word com nome do condutor e intervalo opcional. Horas de ponto e horas extra aparecem em separado porque podem sobrepor-se. O valor base estimado usa o ordenado atual; não é um cálculo de processamento salarial. Os turnos são atribuídos ao dia em que começam. Marcações incompletas não entram no total e são assinaladas.

O administrador vê uma demonstração de 6 horas, identificada como exemplo, sem criar marcações reais nem modificar os dados existentes. Esta demonstração só aparece nos relatórios se a respetiva opção for marcada. A fotografia escolhida no perfil é reduzida para miniatura e guardada apenas no armazenamento local do navegador.

## Perfil e conversas locais
O perfil permite editar nome, telemóvel, número de colaborador, função e localidade; o email de acesso mantém-se inalterável. A conta de demonstração mostra dados fictícios identificados até serem substituídos. Os dados e a fotografia ficam apenas neste navegador.

As mensagens mostram contas criadas neste navegador e quatro contactos fictícios identificados como exemplos. Texto, links, fotos JPG/PNG/WebP e GIFs podem ser guardados localmente; vídeos são recusados. O estado é inferido da última marcação local e deixa de ser considerado recente após 18 horas. O percurso pode ser indicado no relógio de ponto ou derivado de um horário guardado; o percurso manual expira após 24 horas. Os pedidos de ajuda são apenas mensagens locais de demonstração: não chegam a outros dispositivos nem acionam serviços de emergência. Conversas reais entre condutores em dispositivos diferentes, notificações, autenticação e segurança exigem servidor e base de dados, ainda não implementados.
