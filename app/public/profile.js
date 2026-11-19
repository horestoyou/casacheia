(() => {
  const $=id=>document.getElementById(id);let user=null,profile=null,profileReadable=true;
  const fields=['name','phone','employee','role','location'];
  const example={name:'João Exemplo',phone:'912 000 000',employee:'EX-001',role:'Motorista',location:'Ponta Delgada'};
  function identity(){return encodeURIComponent(user.email||user.name.toLowerCase());}
  function photoKey(){return `hourtoyou.photo.v1.${identity()}`;}
  function profileKey(){return `hourtoyou.profile.v1.${identity()}`;}
  function isAdmin(){return (user.email||'').toLowerCase()==='admin@gmail.com';}
  function registration(){try{const list=JSON.parse(localStorage.getItem('hourtoyou.users.v1')||'[]');if(!Array.isArray(list))return null;return list.find(item=>item.email===user.email)||null;}catch{return null;}}
  function loadProfile(){
    profileReadable=true;
    try{const raw=localStorage.getItem(profileKey());if(raw!==null){const saved=JSON.parse(raw);if(!saved||typeof saved!=='object'||Array.isArray(saved)||fields.some(field=>saved[field]!==undefined&&typeof saved[field]!=='string'))throw Error('invalid');return {...saved,name:saved.name||user.name,phone:saved.phone||'',employee:saved.employee||'',role:saved.role||'',location:saved.location||''};}}
    catch{profileReadable=false;return {name:user.name,phone:'',employee:'',role:'',location:''};}
    if(isAdmin())return {...example};const original=registration();return {name:original?.name||user.name,phone:original?.phone||user.phone||'',employee:'',role:'',location:''};
  }
  function hasExample(data){return isAdmin()&&['name','phone','employee'].some(field=>data[field]&&data[field]===example[field]);}
  function photo(){try{return localStorage.getItem(photoKey())||'';}catch{return '';}}
  function show(){
    if(!user)return;const value=photo(),avatar=$('avatar-button'),preview=document.querySelector('.profile-picture');let header=avatar.querySelector('img');if(!header){header=document.createElement('img');header.alt='';avatar.prepend(header);}
    const widgets=[{image:header,icon:avatar.querySelector('svg')},{image:document.querySelector('#clock-avatar img'),icon:document.querySelector('#clock-avatar svg')},{image:preview.querySelector('img'),icon:preview.querySelector('svg')}];
    widgets.forEach(({image,icon})=>{if(value)image.src=value;else image.removeAttribute('src');image.hidden=!value;if(value)icon.setAttribute('hidden','');else icon.removeAttribute('hidden');});
    const displayName=isAdmin()&&profile.name===example.name?user.name:profile.name;user.displayName=displayName;
    $('profile-name').textContent=displayName;$('profile-remove').hidden=!value;
    document.querySelectorAll('[data-user-first]').forEach(el=>{el.textContent=displayName.trim().split(/\s+/)[0];});
    for(const field of fields){const target=field==='name'?'full-name':field;$(`detail-${target}`).textContent=profile[field]||'Não indicado';}
    $('detail-email').textContent=user.email||'Não disponível';$('profile-sample-badge').hidden=!hasExample(profile);
  }
  function fillForm(){for(const field of fields){const target=field==='name'?'full-name':field;$(`profile-${target}`).value=profile[field]||'';}$('profile-email').value=user.email||'';$('profile-data-message').hidden=true;$('profile-data-message').textContent='';}
  function setEditing(value){$('profile-details').hidden=value;$('profile-form').hidden=!value;if(value){fillForm();$('profile-full-name').focus();}}
  $('profile-edit').addEventListener('click',()=>setEditing(true));
  $('profile-cancel').addEventListener('click',()=>setEditing(false));
  $('profile-form').addEventListener('submit',event=>{
    event.preventDefault();const next={...profile};for(const field of fields){const target=field==='name'?'full-name':field;next[field]=$(`profile-${target}`).value.trim();}
    const msg=$('profile-data-message');msg.hidden=false;
    if(next.name.length<3){msg.textContent='Indica um nome com pelo menos 3 caracteres.';return;}
    if(next.phone&&(!/^[+\d\s()\-]{9,20}$/.test(next.phone)||next.phone.replace(/\D/g,'').length<9)){msg.textContent='Indica um número de telemóvel válido ou deixa o campo vazio.';return;}
    if(!profileReadable){msg.textContent='Não foi possível ler os dados guardados; as alterações não foram gravadas.';return;}
    try{localStorage.setItem(profileKey(),JSON.stringify(next));profile=next;show();setEditing(false);$('profile-feedback').textContent='Dados pessoais guardados neste dispositivo.';}
    catch{msg.textContent='Não foi possível guardar os dados neste navegador.';}
  });
  $('clock-avatar').addEventListener('click',()=>$('avatar-button').click());
  $('profile-file').addEventListener('change',event=>{const file=event.target.files[0];if(!file||!user)return;const msg=$('profile-feedback'),owner=identity();msg.textContent='';if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10000000){msg.textContent='Escolhe uma imagem JPG, PNG ou WebP até 10 MB.';event.target.value='';return;}const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{try{if(!user||identity()!==owner)throw Error();const size=Math.min(img.naturalWidth,img.naturalHeight);if(!size)throw Error();const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const ctx=canvas.getContext('2d');ctx.drawImage(img,(img.naturalWidth-size)/2,(img.naturalHeight-size)/2,size,size,0,0,320,320);const value=canvas.toDataURL('image/jpeg',.84);localStorage.setItem(photoKey(),value);show();msg.textContent='Fotografia guardada.';}catch{msg.textContent='Não foi possível guardar esta fotografia.';}finally{URL.revokeObjectURL(url);event.target.value='';}};img.onerror=()=>{URL.revokeObjectURL(url);msg.textContent='Não foi possível ler esta imagem.';event.target.value='';};img.src=url;});
  $('profile-remove').addEventListener('click',()=>{if(!confirm('Remover a fotografia de perfil deste dispositivo?'))return;try{localStorage.removeItem(photoKey());show();$('profile-feedback').textContent='Fotografia removida.';}catch{$('profile-feedback').textContent='Não foi possível remover a fotografia.';}});
  window.HourProfile={open(active){user=active;profile=loadProfile();show();setEditing(false);if(!profileReadable)$('profile-feedback').textContent='Não foi possível ler os dados pessoais guardados.';},close(){user=null;profile=null;},route(id){const selected=id==='profile';$('detail-screen').classList.toggle('is-profile',selected);$('profile-area').hidden=!selected;document.querySelector('.detail-placeholder').hidden=selected;$('detail-icon').hidden=selected;if(selected)setEditing(false);}};
})();



