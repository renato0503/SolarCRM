import"./modulepreload-polyfill-Dezn_h7o.js";/* empty css              */import{initializeApp as e}from"https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";import{getAuth as t,signInWithEmailAndPassword as n}from"https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";import{doc as r,getFirestore as i,setDoc as a}from"https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";var o=e({apiKey:`AIzaSyDStqxnwdR6hYxypR1Xm_2cLM0MQRphytE`,authDomain:`solarcrm-60ce1.firebaseapp.com`,projectId:`solarcrm-60ce1`,storageBucket:`solarcrm-60ce1.firebasestorage.app`,messagingSenderId:`797245411122`,appId:`1:797245411122:web:bcfa64de128b1fd5d1112b`}),s=t(o),c=i(o),l=[{uid:`bQkEsOjXPWaSx7TCaIbwRDcDQth1`,email:`contato@sparkengenharia.net`,nome:`Contato Spark`,role:`admin`},{uid:`LQuFXi2Eg3aIVRsxdqRsZoheyHB2`,email:`adalberto.eng.eletrica@gmail.com`,nome:`Adalberto Engenharia`,role:`admin`},{uid:`vayD8Cc5hdRXgJzxmR7gb9wYNDb2`,email:`eng.eudesr@gmail.com`,nome:`Eudes Rodrigues`,role:`admin`}],u=document.getElementById(`loginSection`),d=document.getElementById(`setupSection`),f=document.getElementById(`userList`),p=document.getElementById(`resultArea`);document.getElementById(`btnLogin`).addEventListener(`click`,async()=>{let e=document.getElementById(`loginEmail`).value,t=document.getElementById(`loginPassword`).value,r=document.getElementById(`btnLogin`);try{r.disabled=!0,r.textContent=`Entrando...`,await n(s,e,t),document.getElementById(`loggedEmail`).textContent=e,u.style.display=`none`,d.style.display=`block`,f.innerHTML=l.map(e=>`
          <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;background:var(--bg-card);border:1px solid var(--border-color);border-radius:8px;margin-bottom:0.5rem;">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(255,215,0,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--solar-orange);font-size:0.875rem;">
              ${e.nome.charAt(0)}
            </div>
            <div style="flex:1;">
              <p style="font-weight:600;color:#fff;font-size:0.875rem;">${e.nome}</p>
              <p style="color:var(--text-muted);font-size:0.75rem;">${e.email}</p>
            </div>
            <span class="badge" style="background:rgba(255,215,0,0.2);color:var(--solar-orange);padding:0.2rem 0.75rem;border-radius:50px;font-size:0.7rem;font-weight:600;">${e.role}</span>
          </div>
        `).join(``)}catch(e){alert(`Erro no login: `+e.message)}finally{r.disabled=!1,r.textContent=`Fazer Login`}}),document.getElementById(`btnSetup`).addEventListener(`click`,async()=>{let e=document.getElementById(`btnSetup`);p.style.display=`block`,p.innerHTML=`<p style="color:var(--text-muted);">Criando perfis...</p>`;let t=0,n=[];for(let e of l)try{await a(r(c,`users`,e.uid),{email:e.email,nome:e.nome,role:e.role,criadoEm:new Date().toISOString()},{merge:!0}),t++}catch(t){n.push(`${e.email}: ${t.message}`)}n.length===0?p.innerHTML=`
          <div style="background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.3);border-radius:8px;padding:1rem;text-align:center;">
            <p style="color:var(--status-fechado);font-size:1.125rem;font-weight:700;">✅ ${t} perfis criados com sucesso!</p>
            <p style="color:var(--text-muted);font-size:0.8rem;margin-top:0.5rem;">
              Os usuários já podem fazer login em <a href="../login.html" style="color:var(--solar-orange);">login.html</a>
            </p>
          </div>
          <div style="margin-top:1rem;padding:0.75rem;background:rgba(255,215,0,0.1);border:1px solid rgba(255,215,0,0.3);border-radius:8px;">
            <p style="font-size:0.8rem;color:var(--solar-orange);font-weight:600;">
              ⚠️ Reverta as regras do Firestore:
            </p>
            <p style="font-size:0.75rem;color:var(--text-muted);margin-top:0.25rem;">
              No arquivo <code>firestore.rules</code>, restaurar a regra original:
            </p>
            <pre style="background:#1e293b;padding:0.5rem;border-radius:4px;font-size:0.7rem;color:var(--text-muted);margin-top:0.25rem;">
allow create, update: if request.auth != null && request.auth.uid == userId;</pre>
          </div>
        `:p.innerHTML=`
          <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:1rem;">
            <p style="color:var(--status-perdido);font-weight:700;">${t} criados, ${n.length} erros</p>
            <ul style="font-size:0.8rem;color:var(--text-muted);margin-top:0.5rem;">
              ${n.map(e=>`<li>${e}</li>`).join(``)}
            </ul>
          </div>
        `,e.disabled=!0,e.textContent=`✅ Concluído`});