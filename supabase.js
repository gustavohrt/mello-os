(function(){
  "use strict";
  const URL="https://mozgyzwnpgafeptopwqz.supabase.co";
  const KEY="sb_publishable_1R9mWR6lwk3qo7DJxErK-w_VjFPx2dS";
  const SESSION_KEY="mello_supabase_session";
  let session=null,syncTimer=null,applyingRemote=false;
  const headers=()=>({"apikey":KEY,"Content-Type":"application/json",...(session?.access_token?{"Authorization":"Bearer "+session.access_token}:{})});
  async function request(path,options={}){
    const response=await fetch(URL+path,{...options,headers:{...headers(),...(options.headers||{})}});
    const text=await response.text();let data={};try{data=text?JSON.parse(text):{}}catch(_){data={message:text}}
    if(!response.ok)throw new Error(data.msg||data.message||data.error_description||"Falha na comunicação com a nuvem.");
    return data;
  }
  function saveSession(value){session=value;value?localStorage.setItem(SESSION_KEY,JSON.stringify(value)):localStorage.removeItem(SESSION_KEY)}
  async function signIn(email,password){const data=await request("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email,password})});saveSession(data);return data}
  async function signUp(email,password){const data=await request("/auth/v1/signup",{method:"POST",body:JSON.stringify({email,password})});if(data.access_token)saveSession(data);return data}
  function signOut(){saveSession(null);location.reload()}
  async function refresh(){
    if(!session?.refresh_token)return false;
    try{const data=await request("/auth/v1/token?grant_type=refresh_token",{method:"POST",body:JSON.stringify({refresh_token:session.refresh_token})});saveSession(data);return true}catch(_){saveSession(null);return false}
  }
  async function restoreSession(){
    try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||"null")}catch(_){session=null}
    if(session&&session.expires_at*1000<Date.now()+60000)await refresh();
    return session;
  }
  async function pull(){
    if(!session?.user?.id)return null;
    const rows=await request("/rest/v1/mello_databases?select=payload,updated_at&user_id=eq."+encodeURIComponent(session.user.id)+"&limit=1");
    if(!rows.length)return null;
    applyingRemote=true;
    try{window.Mello.Store.restore(rows[0].payload,false);localStorage.setItem("mello_last_cloud_sync",rows[0].updated_at)}finally{applyingRemote=false}
    return rows[0].payload;
  }
  async function push(){
    if(!session?.user?.id||applyingRemote||!window.Mello.Store)return;
    const body={user_id:session.user.id,payload:window.Mello.Store.snapshot(),updated_at:new Date().toISOString()};
    await request("/rest/v1/mello_databases?on_conflict=user_id",{method:"POST",headers:{"Prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(body)});
    localStorage.setItem("mello_last_cloud_sync",body.updated_at);
    window.dispatchEvent(new CustomEvent("mello:sync",{detail:{status:"synced"}}));
  }
  function schedulePush(){if(!session||applyingRemote)return;clearTimeout(syncTimer);window.dispatchEvent(new CustomEvent("mello:sync",{detail:{status:"syncing"}}));syncTimer=setTimeout(()=>push().catch(e=>window.dispatchEvent(new CustomEvent("mello:sync",{detail:{status:"error",message:e.message}}))),700)}
  function authScreen(){
    let root=document.getElementById("authRoot");if(!root){root=document.createElement("div");root.id="authRoot";document.body.append(root)}
    root.innerHTML=`<div class="auth-screen"><section class="auth-card"><div class="brand auth-brand"><div class="brand-mark">M</div><div><strong>Mello OS</strong><small>Dados sincronizados com segurança</small></div></div><h1>Entre na sua assistência</h1><p>Use a mesma conta no computador e no celular.</p><form id="authForm"><div class="field"><label>E-mail</label><input name="email" type="email" required autocomplete="email"></div><div class="field"><label>Senha</label><input name="password" type="password" minlength="6" required autocomplete="current-password"></div><button class="btn primary auth-submit" type="submit">Entrar</button><button class="btn auth-signup" type="button">Criar minha conta</button><div class="auth-message" aria-live="polite"></div></form><small class="muted">Se o Supabase solicitar confirmação, abra o e-mail recebido antes de entrar.</small></section></div>`;
    const form=root.querySelector("form"),message=root.querySelector(".auth-message");
    const run=async mode=>{message.textContent="Conectando…";form.querySelectorAll("button").forEach(b=>b.disabled=true);try{const d=Object.fromEntries(new FormData(form).entries());const result=mode==="signup"?await signUp(d.email,d.password):await signIn(d.email,d.password);if(mode==="signup"&&!result.access_token){message.textContent="Conta criada. Confirme o e-mail e depois entre.";form.querySelectorAll("button").forEach(b=>b.disabled=false);return}root.remove();await startSync();window.Mello.App?.render();window.Mello.U.toast("Nuvem conectada com sucesso.")}catch(e){message.textContent=e.message;form.querySelectorAll("button").forEach(b=>b.disabled=false)}};
    form.onsubmit=e=>{e.preventDefault();run("signin")};root.querySelector(".auth-signup").onclick=()=>run("signup");
  }
  async function startSync(){try{await pull();window.Mello.App?.render()}catch(e){if(/mello_databases|relation/i.test(e.message))window.Mello.U.toast("Execute o arquivo supabase-setup.sql no Supabase.","error");else window.Mello.U.toast("Usando dados locais: "+e.message,"error")}}
  async function init(){await restoreSession();if(!session)authScreen();else await startSync();window.addEventListener("mello:changed",schedulePush)}
  window.Mello=window.Mello||{};window.Mello.Cloud={init,signOut,push,pull,get session(){return session},get connected(){return!!session}};
})();
