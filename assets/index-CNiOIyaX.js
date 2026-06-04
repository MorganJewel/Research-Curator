(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const n of a.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&r(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function r(i){if(i.ep)return;i.ep=!0;const a=t(i);fetch(i.href,a)}})();const x="research_curator_packet",q="research_curator_settings";function k(){try{const s=localStorage.getItem(x);return s?JSON.parse(s):[]}catch{return[]}}function T(s){try{localStorage.setItem(x,JSON.stringify(s))}catch(e){console.warn("Research Curator: Could not save to localStorage",e)}}function O(s){const e=k();if(e.some(r=>r.url===s.url))return e;const t=[s,...e];return T(t),t}function D(s){const t=k().filter(r=>r.id!==s);return T(t),t}function I(){localStorage.removeItem(x)}function F(){try{const s=localStorage.getItem(q);return s?JSON.parse(s):null}catch{return null}}function j(s){try{localStorage.setItem(q,JSON.stringify(s))}catch{}}const w=[{id:"academic",label:"Academic Articles",icon:"📄"},{id:"documentary",label:"Documentary / Video",icon:"🎥"},{id:"podcast",label:"Podcasts",icon:"🎙️"},{id:"archival",label:"Archival / Primary",icon:"📌"}];class M{constructor(e,{onSearch:t}){this.container=e,this.onSearch=t;const r=F();this.topic=(r==null?void 0:r.topic)||"",this.subtopics=(r==null?void 0:r.subtopics)||[],this.activeFilters=(r==null?void 0:r.activeFilters)||w.map(i=>i.id),this.depth=(r==null?void 0:r.depth)||"quick",this.render(),this.bindEvents()}render(){this.container.innerHTML=`
      <h2>New Research Query</h2>

      <div class="input-group">
        <label for="topic-input">Primary Topic</label>
        <input
          type="text"
          id="topic-input"
          placeholder="e.g. Bread riots in 18th-century France"
          value="${m(this.topic)}"
          autocomplete="off"
        />
      </div>

      <div class="input-group">
        <label>Subtopics <span style="font-weight:400;text-transform:none;letter-spacing:0;color:var(--text-muted)">(press Enter or comma to add)</span></label>
        <div class="chip-input-wrapper" id="chip-wrapper">
          ${this.subtopics.map(e=>this.renderChip(e)).join("")}
          <input
            type="text"
            class="chip-input"
            id="subtopic-input"
            placeholder="${this.subtopics.length===0?"e.g. gender roles, food scarcity…":""}"
            autocomplete="off"
          />
        </div>
      </div>

      <div class="input-group">
        <label>Source Types</label>
        <div class="filter-grid">
          ${w.map(e=>this.renderFilter(e)).join("")}
        </div>
      </div>

      <div class="input-group">
        <label>Search Depth</label>
        <div class="depth-toggle">
          <button class="depth-option ${this.depth==="quick"?"active":""}" data-depth="quick">
            Quick Overview
          </button>
          <button class="depth-option ${this.depth==="deep"?"active":""}" data-depth="deep">
            Deep Dive
          </button>
        </div>
      </div>

      <button class="btn-primary" id="search-btn">
        Curate Sources
      </button>

      <div class="status-message" id="status-msg"></div>
    `}renderChip(e){return`
      <span class="chip" data-value="${m(e)}">
        ${m(e)}
        <button class="chip-remove" aria-label="Remove ${m(e)}">×</button>
      </span>
    `}renderFilter(e){const t=this.activeFilters.includes(e.id);return`
      <label class="filter-toggle ${t?"active":""}" data-filter="${e.id}">
        <input type="checkbox" ${t?"checked":""} />
        <span class="toggle-box">${t?"✓":""}</span>
        <span class="filter-label">${e.icon} ${e.label}</span>
      </label>
    `}bindEvents(){const e=this.container.querySelector("#topic-input"),t=this.container.querySelector("#subtopic-input"),r=this.container.querySelector("#chip-wrapper"),i=this.container.querySelector("#search-btn");e.addEventListener("input",()=>{this.topic=e.value,this.persistSettings()}),t.addEventListener("keydown",a=>{a.key==="Enter"||a.key===","?(a.preventDefault(),this.addSubtopic(t.value),t.value=""):a.key==="Backspace"&&t.value===""&&this.subtopics.length>0&&this.removeSubtopic(this.subtopics[this.subtopics.length-1])}),t.addEventListener("blur",()=>{t.value.trim()&&(this.addSubtopic(t.value),t.value="")}),r.addEventListener("click",a=>{a.target.closest(".chip-remove")||t.focus()}),r.addEventListener("click",a=>{const n=a.target.closest(".chip-remove");if(n){const c=n.closest(".chip");c&&this.removeSubtopic(c.dataset.value)}}),this.container.addEventListener("click",a=>{const n=a.target.closest(".filter-toggle");n&&n.dataset.filter&&(a.preventDefault(),this.toggleFilter(n.dataset.filter))}),this.container.addEventListener("click",a=>{const n=a.target.closest(".depth-option");n&&n.dataset.depth&&this.setDepth(n.dataset.depth)}),i.addEventListener("click",()=>this.handleSearch()),e.addEventListener("keydown",a=>{a.key==="Enter"&&this.handleSearch()})}addSubtopic(e){const t=e.replace(/,/g,"").trim();!t||this.subtopics.includes(t)||(this.subtopics.push(t),this.refreshChips(),this.persistSettings())}removeSubtopic(e){this.subtopics=this.subtopics.filter(t=>t!==e),this.refreshChips(),this.persistSettings()}refreshChips(){const e=this.container.querySelector("#chip-wrapper"),t=this.container.querySelector("#subtopic-input");if(!e||!t)return;e.querySelectorAll(".chip").forEach(i=>i.remove()),this.subtopics.map(i=>{const a=document.createElement("span");return a.className="chip",a.dataset.value=i,a.innerHTML=`${m(i)}<button class="chip-remove" aria-label="Remove ${m(i)}">×</button>`,a}).forEach(i=>e.insertBefore(i,t)),t.placeholder=this.subtopics.length===0?"e.g. gender roles, food scarcity…":""}toggleFilter(e){if(this.activeFilters.includes(e)){if(this.activeFilters.length===1)return;this.activeFilters=this.activeFilters.filter(t=>t!==e)}else this.activeFilters.push(e);this.container.querySelectorAll(".filter-toggle").forEach(t=>{const r=t.dataset.filter,i=this.activeFilters.includes(r);w.find(a=>a.id===r),t.className=`filter-toggle ${i?"active":""}`,t.querySelector(".toggle-box").textContent=i?"✓":"",t.querySelector("input[type=checkbox]").checked=i}),this.persistSettings()}setDepth(e){this.depth=e,this.container.querySelectorAll(".depth-option").forEach(t=>{t.classList.toggle("active",t.dataset.depth===e)}),this.persistSettings()}persistSettings(){j({topic:this.topic,subtopics:this.subtopics,activeFilters:this.activeFilters,depth:this.depth})}setSearching(e){const t=this.container.querySelector("#search-btn");t&&(t.disabled=e,t.textContent=e?"Searching…":"Curate Sources")}showStatus(e,t=!1){const r=this.container.querySelector("#status-msg");r&&(r.textContent=e,r.className=`status-message visible${t?" error":""}`)}hideStatus(){const e=this.container.querySelector("#status-msg");e&&(e.className="status-message")}handleSearch(){const e=this.topic.trim();if(!e){this.showStatus("Please enter a research topic before searching.",!0);return}const t=w.filter(r=>this.activeFilters.includes(r.id)).map(r=>r.label);this.onSearch({topic:e,subtopics:this.subtopics,mediaFilters:t,depth:this.depth})}}function m(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}const E={"peer-reviewed":{emoji:"✅",label:"Peer-reviewed",cssClass:"badge--peer-reviewed",description:"Published in a peer-reviewed academic journal or conference."},scholarly:{emoji:"📚",label:"Scholarly / Reputable",cssClass:"badge--scholarly",description:"Published by a reputable institution, press, or established outlet."},documentary:{emoji:"🎥",label:"Verified Documentary",cssClass:"badge--documentary",description:"A verified documentary or video from a credible broadcaster or filmmaker."},podcast:{emoji:"🎙️",label:"Reputable Podcast",cssClass:"badge--podcast",description:"A podcast from a recognized host or institution."},primary:{emoji:"📌",label:"Primary / Archival",cssClass:"badge--primary",description:"A primary source or archival document."},caution:{emoji:"⚠️",label:"Use with caution",cssClass:"badge--caution",description:"Source credibility is unclear. Verify independently before use."}},H={Article:"📄",Video:"🎬",Podcast:"🎧",Archive:"🗄️"};function C(s){return E[s]||E.caution}function N(s){return H[s]||"📄"}function B(s){const e=C(s.reliabilityTier),t=N(s.sourceType),r=s.displayLink||s.url;return`
    <div class="result-card" data-id="${S(s.id)}">
      <div class="result-card__header">
        <div class="result-card__title">
          <a href="${S(s.url)}" target="_blank" rel="noopener noreferrer">
            ${f(s.title)}
          </a>
        </div>
        <div class="result-card__delete">
          <button class="btn-danger" data-action="delete" data-id="${S(s.id)}" title="Remove from packet">
            ✕
          </button>
        </div>
      </div>

      <div class="result-card__url">${f(r)}</div>

      <div class="result-card__badges">
        <span class="badge badge--source">${t} ${f(s.sourceType)}</span>
        <span class="badge ${e.cssClass}" title="${S(e.description)}">
          ${e.emoji} ${f(e.label)}
        </span>
      </div>

      ${s.reliabilityNote?`
        <div class="result-card__reliability-note">
          ${f(s.reliabilityNote)}
        </div>
      `:""}

      ${s.relevanceNote?`
        <div class="result-card__relevance-note">
          ${f(s.relevanceNote)}
        </div>
      `:""}

      ${s.query?`
        <div class="result-card__query-label" title="From query: ${S(s.query)}">
          via: ${f(J(s.query,40))}
        </div>
      `:""}
    </div>
  `}function f(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function S(s){return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function J(s,e){return s.length>e?s.slice(0,e)+"…":s}class Y{constructor(e,{onPacketChange:t}){this.container=e,this.onPacketChange=t,this.packet=[],this.render()}setPacket(e){this.packet=e,this.renderCards()}addCards(e){this.packet=[...e,...this.packet.filter(t=>!e.some(r=>r.id===t.id))],this.renderCards()}render(){this.container.innerHTML=`
      <div class="packet-section">
        <div class="packet-header">
          <div>
            <h2 style="display:inline">Research Packet</h2>
            <span class="packet-count" id="packet-count"></span>
          </div>
          <div class="packet-actions" id="packet-actions"></div>
        </div>

        <div class="search-progress" id="search-progress">
          <div class="search-progress__title" id="progress-title">Generating search queries…</div>
          <ul class="search-progress__queries" id="progress-queries"></ul>
        </div>

        <div id="cards-container"></div>
      </div>
    `,this.renderCards()}renderCards(){const e=this.container.querySelector("#cards-container"),t=this.container.querySelector("#packet-count"),r=this.container.querySelector("#packet-actions");if(!e)return;const i=this.packet.length;if(t&&(t.textContent=i>0?`— ${i} source${i===1?"":"s"}`:""),r){r.innerHTML=i>0?`
        <button class="btn-secondary" id="clear-all-btn" title="Remove all sources">
          Clear all
        </button>
      `:"";const a=r.querySelector("#clear-all-btn");a&&a.addEventListener("click",()=>this.handleClearAll())}if(i===0){e.innerHTML=`
        <div class="empty-state">
          <div class="empty-state__icon">📖</div>
          <div class="empty-state__title">Your research packet is empty</div>
          <div class="empty-state__subtitle">
            Enter a topic in the panel on the left and click
            <em>Curate Sources</em> to begin building your research packet.
          </div>
        </div>
      `;return}e.innerHTML=this.packet.map(B).join(""),e.querySelectorAll('[data-action="delete"]').forEach(a=>{a.addEventListener("click",()=>this.handleDelete(a.dataset.id))})}handleDelete(e){const t=D(e);this.packet=t,this.renderCards(),this.onPacketChange(t)}handleClearAll(){confirm(`Remove all ${this.packet.length} sources from your research packet?`)&&(I(),this.packet=[],this.renderCards(),this.onPacketChange([]))}showProgress(e="Generating search queries…"){const t=this.container.querySelector("#search-progress"),r=this.container.querySelector("#progress-title"),i=this.container.querySelector("#progress-queries");t&&t.classList.add("visible"),r&&(r.textContent=e),i&&(i.innerHTML="")}updateProgressTitle(e){const t=this.container.querySelector("#progress-title");t&&(t.textContent=e)}setProgressQueries(e){const t=this.container.querySelector("#progress-queries");t&&(t.innerHTML=e.map((r,i)=>`
        <li class="search-progress__query" data-query-index="${i}">
          <span class="query-dot"></span>
          <span>${z(r)}</span>
        </li>
      `).join(""))}setQueryStatus(e,t){const r=this.container.querySelector(`[data-query-index="${e}"]`);r&&(r.className=`search-progress__query ${t}`,r.querySelector(".query-dot"))}hideProgress(){const e=this.container.querySelector("#search-progress");e&&e.classList.remove("visible")}}function z(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}class G{constructor(e,{getPacket:t}){this.container=e,this.getPacket=t,this.render(),this.bindEvents()}render(){this.container.innerHTML=`
      <button class="export-btn" id="export-pdf-btn" title="Export research packet as PDF">
        <span>⬇</span> Export PDF
      </button>
    `}bindEvents(){this.container.querySelector("#export-pdf-btn").addEventListener("click",()=>this.handleExport())}setDisabled(e){const t=this.container.querySelector("#export-pdf-btn");t&&(t.disabled=e)}async handleExport(){const e=this.getPacket();if(e.length===0){alert("Your research packet is empty. Add some sources before exporting.");return}if(typeof window.html2pdf>"u"){alert("PDF export is not available. Please check your internet connection and reload the page.");return}const t=this.container.querySelector("#export-pdf-btn");t.disabled=!0,t.innerHTML='<span class="spinner"></span> Generating PDF…';try{const r=this.buildPdfContent(e);document.body.appendChild(r);const i={margin:[12,12,12,12],filename:`research-packet-${Q()}.pdf`,image:{type:"jpeg",quality:.92},html2canvas:{scale:2,useCORS:!0,logging:!1},jsPDF:{unit:"mm",format:"a4",orientation:"portrait"},pagebreak:{mode:["avoid-all","css","legacy"]}};await window.html2pdf().set(i).from(r).save(),document.body.removeChild(r)}catch(r){console.error("PDF export failed:",r),alert("PDF export failed. Please try again.")}finally{t.disabled=!1,t.innerHTML="<span>⬇</span> Export PDF"}}buildPdfContent(e){const t=document.createElement("div");t.style.cssText=`
      font-family: Georgia, 'Times New Roman', serif;
      color: #1a1a1a;
      background: #fff;
      padding: 24px 32px;
      max-width: 720px;
      margin: 0 auto;
    `;const r=new Date().toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});return t.innerHTML=`
      <div style="border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 24px;">
        <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 6px; letter-spacing: -0.02em;">
          Research Packet
        </h1>
        <p style="margin: 0; font-size: 12px; color: #555; font-style: italic;">
          Generated ${r} · ${e.length} source${e.length===1?"":"s"}
        </p>
      </div>

      ${e.map((i,a)=>this.buildPdfCard(i,a+1)).join("")}

      <div style="margin-top: 32px; padding-top: 12px; border-top: 1px solid #ccc; font-size: 10px; color: #888; text-align: center; font-style: italic;">
        Compiled with Research Curator — a tool for playwrights and researchers
      </div>
    `,t}buildPdfCard(e,t){const r=C(e.reliabilityTier),i=N(e.sourceType),a={"peer-reviewed":"#1a5c36",scholarly:"#1a3a6b",documentary:"#4a1a6b",podcast:"#6b3a1a",primary:"#6b1a1a",caution:"#6b5a10"},n=a[e.reliabilityTier]||a.caution;return`
      <div style="
        margin-bottom: 20px;
        padding: 14px 16px;
        border: 1px solid #ddd;
        border-left: 3px solid ${n};
        border-radius: 4px;
        page-break-inside: avoid;
      ">
        <div style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
          <span style="font-size: 11px; color: #888; flex-shrink: 0; margin-top: 2px;">${t}.</span>
          <div style="flex: 1;">
            <a href="${U(e.url)}"
               style="font-size: 14px; font-weight: 600; color: #1a1a1a; text-decoration: none; line-height: 1.3; display: block;">
              ${b(e.title)}
            </a>
            <div style="font-size: 10px; color: #888; margin-top: 3px;">${b(e.displayLink||e.url)}</div>
          </div>
        </div>

        <div style="display: flex; gap: 6px; margin: 8px 0; flex-wrap: wrap;">
          <span style="
            font-size: 10px; font-weight: 600; padding: 2px 8px;
            background: #f0f0f0; color: #444; border-radius: 3px;
          ">${i} ${b(e.sourceType)}</span>
          <span style="
            font-size: 10px; font-weight: 600; padding: 2px 8px;
            background: ${n}22; color: ${n}; border-radius: 3px;
          ">${r.emoji} ${b(r.label)}</span>
        </div>

        ${e.reliabilityNote?`
          <div style="font-size: 11px; color: #555; margin-bottom: 5px;">
            ${b(e.reliabilityNote)}
          </div>
        `:""}

        ${e.relevanceNote?`
          <div style="font-size: 12px; color: #222; font-style: italic; border-top: 1px solid #eee; padding-top: 6px; margin-top: 6px; line-height: 1.5;">
            ${b(e.relevanceNote)}
          </div>
        `:""}
      </div>
    `}}function Q(){return new Date().toISOString().split("T")[0]}function b(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function U(s){return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const V="meta-llama/Llama-3.1-8B-Instruct";function K(){return`${"https://falling-glitter-0f34.morganjewel01.workers.dev".replace(/\/$/,"")}/apertus`}async function L(s,e=.4,t=512){var n,c,p;const r=await fetch(K(),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:V,messages:s,temperature:e,max_tokens:t,stream:!1})});if(!r.ok){const d=await r.text();throw new Error(`Apertus API error ${r.status}: ${d}`)}const a=(p=(c=(n=(await r.json()).choices)==null?void 0:n[0])==null?void 0:c.message)==null?void 0:p.content;if(!a)throw new Error("Apertus returned an empty response.");return a}function _(s){const e=s.match(/```(?:json)?\s*([\s\S]*?)```/);if(e)return JSON.parse(e[1].trim());const t=s.indexOf("["),r=s.indexOf("{");let i=-1;if(t!==-1&&(r===-1||t<r)?i=t:r!==-1&&(i=r),i===-1)throw new Error("No JSON found in model response");return JSON.parse(s.slice(i))}async function W({topic:s,subtopics:e=[],mediaFilters:t=[],depth:r="quick"}){const i=r==="deep"?"The user wants a Deep Dive: prefer specific, academic, or archival queries. Include site: operators and scholarly terminology where appropriate.":"The user wants a Quick Overview: prefer broader, accessible queries that surface varied source types quickly.",a=e.length>0?`The user is also interested in these subtopics: ${e.join(", ")}.`:"",n=t.length>0?`Prioritize sources of these types: ${t.join(", ")}.`:"",c=`You are a research librarian assistant specializing in helping playwrights and dramatists find high-quality research sources. Your task is to generate precise, varied Google search queries that will surface the most useful research material.

Return ONLY a JSON array of 3 to 5 search query strings. No explanation, no prose — just the JSON array.`,p=`Research topic: "${s}"
${a}
${n}
${i}

Generate 3–5 specific Google search queries that would surface the most useful research sources for a playwright working on this topic. Vary the query strategies (e.g., academic search, documentary search, archival search, firsthand accounts). Return only a JSON array of strings.`,d=await L([{role:"system",content:c},{role:"user",content:p}],.5,256);let o;try{o=_(d)}catch{o=d.split(`
`).map(g=>g.replace(/^[\d.\-\*\s"]+|["]+$/g,"").trim()).filter(g=>g.length>5).slice(0,5)}if(!Array.isArray(o)||o.length===0)throw new Error("Apertus did not return valid search queries.");return o.slice(0,5)}async function X(s,e){const t=`You are a research librarian assistant helping a playwright evaluate source credibility and relevance. You are precise, scholarly, and concise.

Return ONLY a JSON object with exactly these keys:
- sourceType: one of "Article", "Video", "Podcast", "Archive"
- reliabilityTier: one of "peer-reviewed", "scholarly", "documentary", "podcast", "primary", "caution"
- reliabilityNote: one sentence explaining the reliability assessment
- relevanceNote: 1–2 sentences on why this source is relevant to the playwright's topic

No prose outside the JSON.`,r=`Research topic: "${e}"

Search result to evaluate:
Title: ${s.title}
URL: ${s.link}
Snippet: ${s.snippet||"(no snippet available)"}

Evaluate this source and return the JSON object.`,i=await L([{role:"system",content:t},{role:"user",content:r}],.2,256);let a;try{a=_(i)}catch{a={sourceType:"Article",reliabilityTier:"caution",reliabilityNote:"Could not assess reliability automatically.",relevanceNote:s.snippet||"See source for details."}}return{sourceType:a.sourceType||"Article",reliabilityTier:a.reliabilityTier||"caution",reliabilityNote:a.reliabilityNote||"",relevanceNote:a.relevanceNote||""}}function Z(){return`${"https://falling-glitter-0f34.morganjewel01.workers.dev".replace(/\/$/,"")}/serper`}async function ee(s,e=10){const t=Z();let r;if(t)r=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({q:s,num:e})});else throw new Error("Neither VITE_SERPER_PROXY_URL nor VITE_SERPER_API_KEY is set. Set one in your .env file.");if(!r.ok){const n=await r.text();throw new Error(`Serper API error ${r.status}: ${n}`)}return((await r.json()).organic||[]).map(n=>({title:n.title||"(No title)",link:n.link||"#",snippet:n.snippet||"",displayLink:n.displayLink||n.link||""}))}async function te(s,e=8){const t=await Promise.allSettled(s.map(a=>ee(a,e))),r=new Set,i=[];for(const a of t)if(a.status==="fulfilled")for(const n of a.value)r.has(n.link)||(r.add(n.link),i.push(n));return i}const re=document.getElementById("app");re.innerHTML=`
  <header class="app-header">
    <h1>Research Curator</h1>
    <span class="tagline">A dramaturg's research companion</span>
    <div style="flex:1"></div>
    <div id="export-btn-mount"></div>
  </header>

  <main class="app-main">
    <aside class="sidebar" id="sidebar"></aside>
    <section class="main-content" id="main-content"></section>
  </main>
`;let h=k();const l=new Y(document.getElementById("main-content"),{onPacketChange:s=>{h=s,P.setDisabled(h.length===0)}});l.setPacket(h);const P=new G(document.getElementById("export-btn-mount"),{getPacket:()=>h});P.setDisabled(h.length===0);const u=new M(document.getElementById("sidebar"),{onSearch:se});async function se({topic:s,subtopics:e,mediaFilters:t,depth:r}){u.setSearching(!0),u.hideStatus(),l.showProgress("Generating search queries…");try{let i;try{i=await W({topic:s,subtopics:e,mediaFilters:t,depth:r})}catch(o){console.error("Query generation error:",o),u.showStatus(`Could not generate queries: ${o.message}`,!0),l.hideProgress();return}l.setProgressQueries(i),l.updateProgressTitle("Searching the web…");let a;try{a=await te(i,8)}catch(o){console.error("Search error:",o),u.showStatus(`Search failed: ${o.message}`,!0),l.hideProgress();return}if(a.length===0){u.showStatus("No results found for those queries. Try a different topic.",!1),l.hideProgress();return}i.forEach((o,g)=>l.setQueryStatus(g,"done")),l.updateProgressTitle(`Evaluating ${Math.min(a.length,12)} sources…`);const n=a.slice(0,12),c=await Promise.allSettled(n.map(o=>X(o,s))),p=[];c.forEach((o,g)=>{const v=n[g];let y;o.status==="fulfilled"?y=o.value:y={sourceType:"Article",reliabilityTier:"caution",reliabilityNote:"Reliability could not be assessed automatically.",relevanceNote:v.snippet||""};const A=ie(v,i),$={id:ae(),title:v.title,url:v.link,displayLink:v.displayLink,sourceType:y.sourceType,reliabilityTier:y.reliabilityTier,reliabilityNote:y.reliabilityNote,relevanceNote:y.relevanceNote,query:A,addedAt:Date.now()};O($).some(R=>R.id===$.id)&&p.push($)}),h=k(),l.setPacket(h),P.setDisabled(h.length===0),l.hideProgress();const d=p.length;d>0?u.showStatus(`Added ${d} new source${d===1?"":"s"} to your packet.`):u.showStatus("All results were already in your packet. Try a different topic or subtopics.")}catch(i){console.error("Unexpected search error:",i),u.showStatus(`An unexpected error occurred: ${i.message}`,!0),l.hideProgress()}finally{u.setSearching(!1)}}function ie(s,e){if(!e||e.length===0)return"";const t=`${s.title} ${s.link} ${s.snippet}`.toLowerCase();let r=e[0],i=0;for(const a of e){const c=a.toLowerCase().split(/\s+/).filter(p=>p.length>3).reduce((p,d)=>p+(t.includes(d)?1:0),0);c>i&&(i=c,r=a)}return r}function ae(){return`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}
