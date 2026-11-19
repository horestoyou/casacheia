(() => {
  let promptEvent=null;
  const info=document.getElementById('install-instructions');
  const say=text=>{info.textContent=text;info.hidden=false;};
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;});
  document.getElementById('install-android').addEventListener('click',async()=>{
    if(window.matchMedia('(display-mode: standalone)').matches)return say('A HourToYou já está aberta como aplicação.');
    if(promptEvent){const p=promptEvent;promptEvent=null;try{await p.prompt();const choice=await p.userChoice;say(choice.outcome==='accepted'?'Segue as indicações do telemóvel para concluir a instalação.':'Podes instalar mais tarde pelo menu do navegador.');}catch{say('No Chrome, abre o menu ⋮ e escolhe “Instalar aplicação” ou “Adicionar ao ecrã inicial”.');}return;}
    if(location.protocol==='file:')return say('Para instalar, abre primeiro o endereço seguro da HourToYou no Chrome. Depois usa o menu ⋮ e escolhe “Instalar aplicação”.');
    say('No Chrome para Android, abre o menu ⋮ e escolhe “Instalar aplicação” ou “Adicionar ao ecrã inicial”.');
  });
  document.getElementById('install-ios').addEventListener('click',()=>{if(window.matchMedia('(display-mode: standalone)').matches)return say('A HourToYou já está aberta como aplicação.');say('No iPhone, abre a HourToYou no Safari, toca em Partilhar e escolhe “Adicionar ao ecrã principal”.');});
  window.addEventListener('appinstalled',()=>{promptEvent=null;say('HourToYou instalada no teu dispositivo.');});
  function state(){let banner=document.getElementById('offline-banner');if(!navigator.onLine){if(!banner){banner=document.createElement('div');banner.id='offline-banner';banner.className='offline-banner';banner.setAttribute('role','status');document.body.append(banner);}banner.textContent='Sem internet · a trabalhar com os dados deste dispositivo';}else if(banner)banner.remove();}
  window.addEventListener('online',state);window.addEventListener('offline',state);state();
  if('serviceWorker' in navigator&&['http:','https:'].includes(location.protocol))navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
})();
