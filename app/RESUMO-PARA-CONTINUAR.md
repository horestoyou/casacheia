# HourToYou — ponto de situação

Atualizado em 10 de novembro de 2026.

## Projeto atual
A versão local original encontra-se em C:\Users\PC\Desktop\HoryToyou. O site provisório está no Netlify. Esta pasta contém uma cópia separada da versão para servidor, ainda em preparação. Não substituir a versão existente nem publicar esta cópia sem concluir a revisão e os testes.

## Objetivo
Aplicação móvel para condutores com conta, relógio de ponto, registo de horas e horas extra, ordenado, calendário, perfil, relatórios e mensagens. A criação de conta e a lista de condutores serão abertas a qualquer pessoa que se registe, por decisão do proprietário.

## Preparado nesta cópia
- Base de servidor para contas, dados pessoais, mensagens e fotografias, com integração prevista para MongoDB Atlas e Cloudinary.
- Instalação como aplicação no Android e iPhone, com ícones baseados no logótipo existente.
- Preparação do funcionamento offline e sincronização quando regressa a ligação. As mensagens dependem da internet.
- Novo aspeto de relatórios PDF e Word e opções de personalização para os relatórios; a exportação Excel modificada ainda precisa de revisão.
- Foram feitos testes locais com base de dados temporária e armazenamento de imagens simulado. Algumas funções ainda precisam de testes finais, nomeadamente fotografias, sincronização e conflitos entre dispositivos.

## Próximos passos
1. Concluir a revisão e os testes, incluindo segurança, sincronização offline, fotografias e todos os formatos de relatório.
2. Preparar os ficheiros de publicação e confirmar a migração dos dados locais existentes sem os apagar. O antigo acesso de exemplo não constitui uma conta online pronta; será necessária uma palavra-passe segura.
3. Ligar o GitHub ao Render e configurar MongoDB Atlas e Cloudinary, passo a passo. As credenciais devem ser introduzidas diretamente nos serviços, nunca guardadas neste ficheiro ou enviadas no chat.
4. Testar o serviço real e a instalação nos dispositivos antes de o disponibilizar aos condutores. Não alterar o site provisório no Netlify sem confirmar o plano de publicação.

## Limitações atuais
Esta versão ainda não está ligada às contas reais do Render, MongoDB ou Cloudinary. A sincronização e as mensagens não foram verificadas em produção. Não existe sistema de emergência fiável nem garantia de entrega imediata das mensagens. Não há migração automática dos dados antigos nem recuperação de palavra-passe implementada. O funcionamento offline exige uma primeira utilização online e depende do armazenamento do dispositivo.
