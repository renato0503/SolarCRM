import{g as e,m as t,n,r,t as i}from"./utils-hAzASED0.js";/* empty css              */document.addEventListener(`DOMContentLoaded`,()=>{let a=document.getElementById(`searchForm`),o=document.getElementById(`telefone`),s=document.getElementById(`resultsContainer`),c=document.getElementById(`resultsList`),l=document.getElementById(`noResults`);o.addEventListener(`input`,e=>{let t=e.target.value.replace(/\D/g,``);t.length>11&&(t=t.slice(0,11)),t.length>6?e.target.value=`(${t.slice(0,2)}) ${t.slice(2,7)}-${t.slice(7)}`:t.length>2?e.target.value=`(${t.slice(0,2)}) ${t.slice(2)}`:t.length>0?e.target.value=`(${t.slice(0,2)}`:e.target.value=``}),a.addEventListener(`submit`,async a=>{a.preventDefault();let u=o.value.replace(/\D/g,``);if(u.length<10){r(`Digite um número de WhatsApp válido.`,`error`);return}try{r(`Buscando seus orçamentos...`,`info`);let[a,o]=await Promise.all([t(),e()]),d=a.filter(e=>{let t=(e.telefone||``).replace(/\D/g,``);return t===u||t.endsWith(u)||u.endsWith(t)});if(d.length===0){s.style.display=`none`,l.style.display=`block`;return}let f=o.filter(e=>d.some(t=>t.id===e.lead_id));c.innerHTML=``,d.forEach(e=>{let t=f.filter(t=>t.lead_id===e.id);if(t.length===0){let t=document.createElement(`div`);t.className=`glass-card`,t.style.marginBottom=`1rem`,t.innerHTML=`
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <div>
                <h3 style="font-size: 1.125rem; font-weight: 600;">${e.nome}</h3>
                <p style="color: var(--text-muted); font-size: 0.875rem;">${n(e.telefone)} · ${e.cidade||``}/${e.uf||``}</p>
              </div>
              <span style="background: var(--status-novo-bg); color: var(--status-novo); padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">Aguardando</span>
            </div>
            <p style="color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 1rem;">
              Nenhuma proposta gerada ainda. Entre em contato conosco.
            </p>
            <a href="https://wa.me/55${e.telefone}?text=Olá%20${encodeURIComponent(e.nome)}!%20Vimos%20seu%20contato%20na%20Spark.%20Podemos%20ajudar%20com%20seu%20projeto%20de%20energia%20solar?" target="_blank" class="btn btn-primary" style="width: 100%;">
              ☀️ Falar via WhatsApp
            </a>
          `,c.appendChild(t)}else t.forEach(t=>{let r=document.createElement(`div`);r.className=`glass-card`,r.style.marginBottom=`1rem`;let a=new Date(t.data_criacao).toLocaleDateString(`pt-BR`),o=t.status===`Fechado`?`var(--status-fechado)`:t.status===`Enviado`?`var(--status-enviado)`:t.status===`Perdido`?`var(--status-perdido)`:`var(--status-novo)`,s=t.status===`Fechado`?`var(--status-fechado-bg)`:t.status===`Enviado`?`var(--status-enviado-bg)`:t.status===`Perdido`?`var(--status-perdido-bg)`:`var(--status-novo-bg)`;r.innerHTML=`
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                <div>
                  <h3 style="font-size: 1.125rem; font-weight: 600;">${e.nome}</h3>
                  <p style="color: var(--text-muted); font-size: 0.875rem;">${n(e.telefone)} · ${e.cidade||``}/${e.uf||``}</p>
                  <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">📅 ${a}</p>
                </div>
                <span style="background: ${s}; color: ${o}; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600;">${t.status||`Novo`}</span>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; padding: 1rem; background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 1rem;">
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700; color: var(--solar-orange);">${t.potencia_kwp||`-`} kWp</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Potência</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700;">${t.numero_paineis||`-`} Painéis</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Módulos</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 1.25rem; font-weight: 700;">${i(t.preco_final||0)}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Valor Total</div>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem;">
                ${t.lead_id?`<a href="./proposta.html?id=${t.id}" target="_blank" class="btn btn-secondary" style="flex: 1; text-align: center;">📄 Ver Proposta</a>`:``}
                <a href="https://wa.me/55${e.telefone}?text=Olá%20${encodeURIComponent(e.nome)}!%20Seguimos%20com%20sua%20proposta%20de%20energia%20solar.%20Podemos%20conversar?" target="_blank" class="btn btn-primary" style="flex: 1; text-align: center;">☀️ Falar</a>
              </div>
            `,c.appendChild(r)})}),s.style.display=`block`,l.style.display=`none`}catch(e){console.error(`Erro ao buscar orçamentos:`,e),r(`Erro ao buscar orçamentos. Tente novamente.`,`error`)}})});