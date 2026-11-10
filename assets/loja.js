/* =========================================================
   Loja Jan Rosê — proposta de redesign (JS puro, sem build)
   Rotas por hash: #/  #/categoria/<slug>  #/produto/<cod>
                   #/busca/<termo>  #/favoritos  #/checkout
   Dados: window.PRODUTOS (data/produtos.js) + window.CONTEUDO
   Integração: ver INTEGRACAO.md (trocar CONFIG e as funções da API).
   ========================================================= */
(() => {
"use strict";

/* ---------- CONFIG (na integração vem do back-end, por subdomínio do consultor) ---------- */
const CONFIG = {
  consultor: { nome: "David Braz", slug: "dbraz", whatsapp: "" }, // whatsapp: só dígitos com DDI, ex. 5511999999999
  freteGratisAcima: 0,           // 0 = não exibe a barra; usar a regra real da empresa
  urlLojaAtual: "https://dbraz.janrose.digital"
};

const CATS = {
  "bem-estar": { nome: "Saúde e bem-estar", desc: "Suplementos, chás e cuidados da linha Rennovit.", capa: "9044" },
  "perfumes":  { nome: "Perfumaria", desc: "Deo parfums com essências 100% importadas e alta fixação.", capa: "1036" },
  "rosto":     { nome: "Rosto", desc: "Limpeza, tratamento e proteção para a pele do rosto.", capa: "2025" },
  "corpo":     { nome: "Corpo e banho", desc: "Hidratação, banho e cuidados diários.", capa: "7573" },
  "cabelos":   { nome: "Cabelos", desc: "Shampoos, condicionadores e tratamentos.", capa: "7575" },
  "joias":     { nome: "Joias e presentes", desc: "Anéis, brincos e embalagens para presentear.", capa: "BR615" }
};
const TEXTO_PADRAO = {
  "bem-estar": "Da linha Rennovit, de saúde e bem-estar da Jan Rosê. Fórmula desenvolvida para fazer parte da sua rotina diária.",
  "perfumes": "Deo parfum Jan Rosê com 25% de essência, essências 100% importadas e fixação de até 48 horas na pele.",
  "rosto": "Cuidado facial Jan Rosê, com mais de 30 anos de experiência em cosmética e linhas veganas.",
  "corpo": "Cuidado para o corpo Jan Rosê, para transformar o banho e a hidratação num momento seu.",
  "cabelos": "Cuidado capilar Jan Rosê para limpar, tratar e dar brilho aos fios.",
  "joias": "Peça da coleção de joias e presentes Jan Rosê."
};
const DESTAQUES = ["9044","1036","9055","2025","1013","9057","7573","1031","9028","7575","1026","9056"];

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;" }[c]));
const sem = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const ICO = {
  busca:'<path d="m21 21-4.3-4.3"/><circle cx="11" cy="11" r="7"/>',
  coracao:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  mais:'<path d="M12 5v14M5 12h14"/>', x:'<path d="M6 6l12 12M18 6 6 18"/>',
  seta:'<path d="M5 12h14M13 6l6 6-6 6"/>', esq:'<path d="M15 6l-6 6 6 6"/>', dir:'<path d="m9 6 6 6-6 6"/>',
  check:'<path d="m5 12 4.5 4.5L19 7"/>', filtro:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  /* preenchidos (F:) — desenho próprio, dois tons */
  sacola:'F:<path d="M5.2 7.5h13.6l1 12.9a1.6 1.6 0 0 1-1.6 1.7H5.8a1.6 1.6 0 0 1-1.6-1.7l1-12.9Z"/><path d="M8.6 9.5V6.6a3.4 3.4 0 0 1 6.8 0v2.9" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="8.6" cy="10.2" r="1.1" fill="#fff" opacity=".9"/><circle cx="15.4" cy="10.2" r="1.1" fill="#fff" opacity=".9"/>',
  folha:'F:<path opacity=".28" d="M20.5 3.2C11 2.6 3.6 7.4 3.6 14.6c0 3.9 2.8 6.6 6.4 6.6 7.3 0 11.2-7.6 10.5-18Z"/><path d="M4.4 21.3c1.6-6.2 5.6-10.6 11.8-13.4.4-.2.8.4.4.7-5.3 3.2-8.6 7.4-10 13.1-.2.8-2.4.5-2.2-.4Z"/>',
  selo:'F:<path opacity=".28" d="m12 1.8 2.3 1.7 2.8-.3 1.1 2.6 2.6 1.1-.3 2.8 1.7 2.3-1.7 2.3.3 2.8-2.6 1.1-1.1 2.6-2.8-.3L12 22.2l-2.3-1.7-2.8.3-1.1-2.6-2.6-1.1.3-2.8L1.8 12l1.7-2.3-.3-2.8 2.6-1.1 1.1-2.6 2.8.3Z"/><circle cx="12" cy="12" r="5.4"/><path d="m12 8.9.9 2 2.2.2-1.7 1.4.5 2.1L12 13.5l-1.9 1.1.5-2.1-1.7-1.4 2.2-.2Z" fill="#fff"/>',
  globo:'F:<circle opacity=".28" cx="12" cy="12" r="9.6"/><path d="M12 2.4c-2.5 2.7-3.8 5.9-3.8 9.6s1.3 6.9 3.8 9.6c2.5-2.7 3.8-5.9 3.8-9.6S14.5 5.1 12 2.4Z"/><path d="M2.6 10.6h18.8v2.8H2.6z" opacity=".55"/>',
  caminhao:'F:<path opacity=".28" d="M12 1.8 2.8 6.4v11.2L12 22.2l9.2-4.6V6.4L12 1.8Z"/><path d="M12 11.4 3.3 7l8.7-4.4L20.7 7 12 11.4Zm-1 1.7v8.6l-7.6-3.8V9.3l7.6 3.8Z"/><path d="m7.6 4.8 8.7 4.4v3.3l-1.8.9V10.1L5.8 5.7Z" fill="#fff" opacity=".85"/>',
  escudo:'F:<path opacity=".28" d="M12 1.8 4 4.9v6.6c0 5.1 3.4 9 8 10.7 4.6-1.7 8-5.6 8-10.7V4.9l-8-3.1Z"/><path d="m10.5 15.6-3.4-3.4 1.5-1.5 1.9 1.9 4.9-4.9 1.5 1.5-6.4 6.4Z"/>',
  usuario:'F:<circle cx="12" cy="7.8" r="4.6"/><path opacity=".35" d="M3.4 21.8c.8-4.8 4.3-7.8 8.6-7.8s7.8 3 8.6 7.8Z"/>',
  zap:'W:<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>'
};
const ic = (n, cls = "i") => { const s = ICO[n]; const t = s.slice(0, 2);
  if (t === "F:") return `<svg class="${cls} if" viewBox="0 0 24 24" aria-hidden="true">${s.slice(2)}</svg>`;
  if (t === "W:") return `<svg class="${cls} iw" viewBox="0 0 24 24" aria-hidden="true">${s.slice(2)}</svg>`;
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${s}</svg>`; };

/* ---------- dados ---------- */
const PRODUTOS = (window.PRODUTOS || []).map(p => ({ ...p, busca: sem(`${p.nome} ${p.cod} ${p.linha || ""} ${CATS[p.cat]?.nome || ""}`) }));
const porCod = Object.fromEntries(PRODUTOS.map(p => [p.cod, p]));
const conteudo = cod => { const c = (window.CONTEUDO || {})[cod]; return c && c.ref ? window.CONTEUDO[c.ref] : c; };
const linhaDe = p => p.linha || (p.cat === "bem-estar" ? "Rennovit" : CATS[p.cat]?.nome);
const variacaoInicial = p => (p.variacoes || []).find(v => v.disponivel) || null;

/* ---------- estado persistente (try/catch: navegação privada) ---------- */
const guardar = (k, v) => { try { localStorage.setItem("jr_" + k, JSON.stringify(v)); } catch {} };
const ler = (k, d) => { try { return JSON.parse(localStorage.getItem("jr_" + k)) ?? d; } catch { return d; } };
let sacola = ler("sacola", []);      // [{cod, var, qtd}]
let favoritos = ler("favoritos", []);

/* ---------- API de carrinho (trocar pelo endpoint real na integração) ---------- */
const precoItem = it => { const p = porCod[it.cod]; const v = p?.variacoes?.find(x => x.cod === it.var); return v ? v.preco : p?.preco || 0; };
const totalSacola = () => sacola.reduce((s, it) => s + precoItem(it) * it.qtd, 0);
const qtdSacola = () => sacola.reduce((s, it) => s + it.qtd, 0);
function adicionar(cod, varCod = null, qtd = 1) {
  const p = porCod[cod]; if (!p) return;
  if (p.variacoes && !varCod) varCod = variacaoInicial(p)?.cod;
  const ex = sacola.find(i => i.cod === cod && i.var === varCod);
  ex ? ex.qtd += qtd : sacola.push({ cod, var: varCod, qtd });
  guardar("sacola", sacola); atualizarSacola();
  toast(`${esc(p.nome)} foi para a sacola. <a href="#" data-abrir-sacola>Ver sacola</a>`);
  track("add_to_cart", { cod, valor: precoItem({ cod, var: varCod }) });
}
function alterarQtd(i, d) { sacola[i].qtd += d; if (sacola[i].qtd < 1) sacola.splice(i, 1); guardar("sacola", sacola); atualizarSacola(); }
function alternarFav(cod) {
  favoritos = favoritos.includes(cod) ? favoritos.filter(c => c !== cod) : [...favoritos, cod];
  guardar("favoritos", favoritos); $$(`[data-fav="${cod}"]`).forEach(b => b.classList.toggle("on", favoritos.includes(cod)));
  $("#cont-fav").textContent = favoritos.length || "";
}
function track(evento, dados) { (window.dataLayer = window.dataLayer || []).push({ event: evento, ...dados }); }

/* ---------- componentes ---------- */
function card(p) {
  const c = conteudo(p.cod); const tags = [];
  if (c?.exclusivo) tags.push('<span class="tag roxo">Criação exclusiva</span>');
  if (p.variacoes && p.cat === "perfumes" && p.variacoes.length > 1) tags.push(`<span class="tag">${p.variacoes.map(v => v.rotulo).join(" · ")}</span>`);
  const aPartir = p.variacoes && new Set(p.variacoes.map(v => v.preco)).size > 1;
  const sub = c?.familia ? c.familia : linhaDe(p);
  return `<article class="card">
    <a href="#/produto/${p.cod}" class="im" aria-label="${esc(p.nome)}">
      <img src="${fotoCard(p)}" alt="${esc(p.nome)}" loading="lazy" width="400" height="400">
      <div class="tags">${tags.join("")}</div>
    </a>
    <button class="fav ${favoritos.includes(p.cod) ? "on" : ""}" data-fav="${p.cod}" aria-label="Favoritar ${esc(p.nome)}">${ic("coracao")}</button>
    <div class="info">
      <span class="linha-p">${esc(sub)}</span>
      <h3><a href="#/produto/${p.cod}">${esc(p.nome)}</a></h3>
      <div class="rodape">
        <span class="preco">${aPartir ? "<small>a partir de</small>" : ""}${brl(p.preco)}</span>
        <button class="add" data-add="${p.cod}" aria-label="Adicionar ${esc(p.nome)} à sacola">${ic("mais")}</button>
      </div>
    </div>
  </article>`;
}
const cards = lista => lista.map(card).join("");

/* ---------- herói: cenário (ChatGPT, sem produto) + produtos reais recortados ---------- */
const VITRINES = [
  { id: "femininos", aba: "Femininos", sobre: "Perfumaria feminina · deo parfum",
    titulo: "Um perfume que <em>fica</em> o dia inteiro.",
    texto: "25% de essência, essências 100% importadas e até 48 horas de fixação na pele. Do floral ao gourmand.",
    cta: ["Ver perfumes femininos", "#/categoria/perfumes?genero=fem"], itens: { frente: "1043", alto: "1036", baixo: "1037" } },
  { id: "masculinos", aba: "Masculinos", sobre: "Perfumaria masculina · deo parfum",
    titulo: "Presença que <em>marca</em> o ambiente.",
    texto: "Do aromático fresco ao oriental amadeirado: fragrâncias intensas, com alta fixação, para o dia e para a noite.",
    cta: ["Ver perfumes masculinos", "#/categoria/perfumes?genero=masc"], itens: { frente: "1044", alto: "1031", baixo: "1035" } },
  { id: "phases", aba: "Phases", sobre: "Coleção Phases · deo parfum",
    titulo: "Uma fase da lua para <em>cada</em> momento.",
    texto: "Sete fragrâncias inspiradas nas fases da lua, em frascos de 100 ml e 15 ml para levar na bolsa.",
    cta: ["Conhecer a coleção", "#/busca/phases"], itens: { frente: "1026", alto: "1027", baixo: "1032" } }
];
/* Fotos oficiais em alta, com fundo transparente (Mapa Olfativo Jan Rosê) */
const FOTOS_HD = new Set(["1013","1026","1027","1028","1030","1031","1032","1033","1034","1035","1036","1037","1038","1039","1040","1041","1042","1043","1044"]);
const fotoCard = p => FOTOS_HD.has(p.cod) ? `img/perfumes/${p.cod}-p.webp` : p.img;
const fotoGrande = p => FOTOS_HD.has(p.cod) ? `img/perfumes/${p.cod}.webp` : p.img;
function heroi() {
  return `<section class="heroi2" aria-label="Destaques">
    <div class="h2-palco">
      <div class="h2-cena">
        <picture><source media="(max-width:720px)" srcset="img/cenas/cena-pedestais-cel.webp"><img class="h2-fundo" src="img/cenas/cena-pedestais.webp" alt="" width="1456" height="819" fetchpriority="high"></picture>
        ${VITRINES.map((v, i) => `<div class="h2-set ${i ? "" : "on"}" data-set="${v.id}">${Object.entries(v.itens).map(([slot, cod]) => { const p = porCod[cod]; return p ? `
          <a class="h2-prod h2-${slot}" href="#/produto/${cod}" aria-label="${esc(p.nome)}" tabindex="${i ? -1 : 0}"><span class="h2-sombra"></span><img src="img/perfumes/${cod}.webp" alt="${esc(p.nome)}"></a>` : ""; }).join("")}</div>`).join("")}
      </div>
      <div class="h2-texto">
        <div class="h2-abas" role="tablist" aria-label="Escolha a vitrine">${VITRINES.map((v, i) => `<button role="tab" aria-selected="${!i}" class="${i ? "" : "on"}" data-vitrine="${i}">${v.aba}</button>`).join("")}</div>
        ${VITRINES.map((v, i) => `<div class="h2-copy ${i ? "" : "on"}" data-copy="${i}" ${i ? "hidden" : ""}>
          <span class="sobre">${v.sobre}</span>
          <h1 class="t-xl">${v.titulo}</h1>
          <p class="lead">${v.texto}</p>
          <div class="heroi-cta"><a class="btn btn-roxo" href="${v.cta[1]}">${v.cta[0]} ${ic("seta")}</a></div>
          <div class="h2-itens">${Object.values(v.itens).map(c => porCod[c]).filter(Boolean).map(p => `<a href="#/produto/${p.cod}"><b>${esc(p.nome)}</b><span>${p.variacoes && new Set(p.variacoes.map(v => v.preco)).size > 1 ? "a partir de " : ""}${brl(p.preco)}</span></a>`).join("")}</div>
        </div>`).join("")}
      </div>
    </div>
    <div class="wrap h2-provas">
      <div>${ic("selo")}<span><b>Desde 1994</b>marca brasileira</span></div>
      <div>${ic("folha")}<span><b>70%+ vegano</b>na linha toda</span></div>
      <div>${ic("caminhao")}<span><b>Entrega</b>pela Jan Rosê</span></div>
      <div>${ic("globo")}<span><b>Brasil e Europa</b>27 países</span></div>
    </div>
  </section>`;
}
let hTimer = null;
function trocarVitrine(i, manual) {
  $$("[data-vitrine]").forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", k === i); });
  $$("[data-copy]").forEach((c, k) => { c.classList.toggle("on", k === i); c.hidden = k !== i; });
  $$(".h2-set").forEach((s, k) => { s.classList.toggle("on", k === i); $$("a", s).forEach(a => a.tabIndex = k === i ? 0 : -1); });
  if (manual) { clearInterval(hTimer); hTimer = null; }
}
function iniciarHeroi() {
  clearInterval(hTimer); let i = 0;
  hTimer = setInterval(() => { if (!document.querySelector(".heroi2")) return clearInterval(hTimer); i = (i + 1) % VITRINES.length; trocarVitrine(i); }, 6500);
}

/* ---------- páginas ---------- */
function paginaHome() {
  const renno = ["9044","9057","9055","9056","9025","9028"].map(c => porCod[c]).filter(Boolean);
  const perfs = ["1036","1013","1031","1035"].map(c => porCod[c]).filter(Boolean);
  const familias = [...new Set(PRODUTOS.filter(p => p.cat === "perfumes").map(p => conteudo(p.cod)?.familia?.split(" ")[0]).filter(Boolean))];
  return `
  ${heroi()}

  <section class="sec" style="padding-top:40px">
    <div class="wrap">
      <div class="sec-cab"><div><span class="sobre">Comprar por categoria</span><h2 class="t-l" style="margin-top:8px">O que você procura <em>hoje?</em></h2></div></div>
      <div class="cats">${Object.entries(CATS).map(([slug, c]) => `
        <a class="cat" href="#/categoria/${slug}"><div class="im"><img src="${porCod[c.capa]?.img}" alt="" loading="lazy" width="200" height="200"></div>
        <b>${c.nome}</b><span>${PRODUTOS.filter(p => p.cat === slug).length} produtos</span></a>`).join("")}
      </div>
    </div>
  </section>

  <section class="sec lilas">
    <div class="wrap">
      <div class="sec-cab">
        <div><span class="sobre">Os favoritos</span><h2 class="t-l" style="margin-top:8px">Os mais <em>queridos</em> da casa</h2></div>
        <div class="setas"><button data-trilho="-1" aria-label="Anterior">${ic("esq")}</button><button data-trilho="1" aria-label="Próximo">${ic("dir")}</button></div>
      </div>
      <div class="trilho" id="trilho">${cards(DESTAQUES.map(c => porCod[c]).filter(Boolean))}</div>
    </div>
  </section>

  <section class="sec escura">
    <div class="wrap renno">
      <div>
        <span class="sobre">Linha Rennovit</span>
        <h2 class="t-l" style="margin:12px 0 18px">Cuidado que começa <em>de dentro</em> para fora.</h2>
        <p class="lead">Suplementos alimentares desenvolvidos pela Jan Rosê: aloe vera 99,4% pura, cinco formas de magnésio, creatina com laudo de pureza e mais. Sem glúten e zero lactose na maior parte da linha.</p>
        <div style="margin-top:30px"><a class="btn btn-claro" href="#/categoria/bem-estar">Ver toda a linha ${ic("seta")}</a></div>
      </div>
      <div class="renno-lista">${renno.map(p => `
        <a class="renno-item" href="#/produto/${p.cod}">
          <div class="im"><img src="${p.img}" alt="" loading="lazy" width="150" height="150"></div>
          <div><b>${esc(p.nome.replace(/ - .*/, ""))}</b><span>${esc((conteudo(p.cod)?.titulo || "").slice(0, 60))}</span><div class="preco">${brl(p.preco)}</div></div>
        </a>`).join("")}
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap perf">
      <div>
        <span class="sobre">Perfumaria fina</span>
        <h2 class="t-l" style="margin-top:10px">Perfumes que <em>ficam</em> o dia todo.</h2>
        <div class="perf-fatos">
          <div><b>25%</b><span>de essência na composição</span></div>
          <div><b>100%</b><span>essências importadas</span></div>
          <div><b>48h</b><span>de fixação na pele</span></div>
        </div>
        <p style="font-weight:700;margin-bottom:12px">Escolha pela família olfativa</p>
        <div class="familias">${familias.map(f => `<a class="chip" href="#/categoria/perfumes?familia=${encodeURIComponent(f)}">${f}</a>`).join("")}</div>
      </div>
      <div class="perf-vitrine">${perfs.map(p => `
        <a href="#/produto/${p.cod}"><img src="${fotoCard(p)}" alt="${esc(p.nome)}" loading="lazy" width="300" height="300"><b>${esc(p.nome)}</b><span>${esc(conteudo(p.cod)?.familia || "")}</span></a>`).join("")}
      </div>
    </div>
  </section>

  <section class="sec lilas">
    <div class="wrap">
      <div class="sec-cab"><div><span class="sobre">Por que Jan Rosê</span><h2 class="t-l" style="margin-top:8px">Três décadas cuidando <em>de gente.</em></h2></div></div>
      <div class="pilares">
        <div class="pilar"><div class="ico">${ic("folha")}</div><b>Mais de 70% vegano</b><p>A maior parte da linha é livre de ingredientes de origem animal.</p></div>
        <div class="pilar"><div class="ico">${ic("selo")}</div><b>Desde 1994</b><p>Marca brasileira nascida em Curitiba, com mais de 30 anos de mercado.</p></div>
        <div class="pilar"><div class="ico">${ic("globo")}</div><b>Brasil e Europa</b><p>Presente no Brasil e em 27 países da Europa.</p></div>
        <div class="pilar"><div class="ico">${ic("caminhao")}</div><b>Entrega pela Jan Rosê</b><p>O pedido sai direto da empresa para a sua casa, em todo o Brasil.</p></div>
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap">${blocoConsultor()}</div>
  </section>

  <section class="sec" style="padding-top:0">
    <div class="wrap">
      <div class="sec-cab"><div><span class="sobre">Dúvidas</span><h2 class="t-l" style="margin-top:8px">Perguntas <em>frequentes</em></h2></div></div>
      <div class="faq">
        <details><summary>Quem entrega o meu pedido?</summary><p>A própria Jan Rosê. Você compra pela loja do seu consultor e o pedido sai da empresa direto para o seu endereço.</p></details>
        <details><summary>O que é a loja do consultor?</summary><p>Cada consultor Jan Rosê tem a sua loja. Os preços são os mesmos da empresa, e você ganha um atendimento pessoal para tirar dúvidas e lembrar da recompra.</p></details>
        <details><summary>Os produtos são veganos?</summary><p>Mais de 70% da linha é vegana. A informação aparece na página de cada produto.</p></details>
        <details><summary>Os perfumes fixam mesmo?</summary><p>Os deo parfums têm 25% de essência, com essências 100% importadas e fixação de até 48 horas, segundo a Jan Rosê.</p></details>
        <details><summary>Suplemento substitui remédio?</summary><p>Não. Os suplementos Rennovit complementam a alimentação. Em caso de tratamento, gravidez ou dúvida, consulte o seu médico.</p></details>
      </div>
    </div>
  </section>`;
}

function blocoConsultor() {
  const c = CONFIG.consultor; const ini = c.nome.split(" ").map(s => s[0]).slice(0, 2).join("");
  return `<div class="consultor">
    <div class="av">${ini}</div>
    <div><span class="sobre">Seu consultor Jan Rosê</span><h3 class="t-m" style="margin-top:6px">Você está comprando com ${esc(c.nome)}</h3>
      <p>Ficou com dúvida sobre qual produto escolher? Fale comigo: te ajudo a acertar no perfume, monto um kit de presente e aviso quando for hora de repor.</p></div>
    ${linkZap("Olá! Vim pela sua loja Jan Rosê e tenho uma dúvida.", "Falar no WhatsApp")}
  </div>`;
}
function linkZap(msg, rotulo, cls = "btn btn-zap") {
  const n = CONFIG.consultor.whatsapp;
  const href = n ? `https://wa.me/${n}?text=${encodeURIComponent(msg)}` : "#";
  return `<a class="${cls}" href="${href}" ${n ? 'target="_blank" rel="noopener"' : 'data-sem-zap'} data-track="whatsapp">${ic("zap")} ${rotulo}</a>`;
}

function paginaCategoria(slug, params) {
  const c = CATS[slug]; if (!c) return pagina404();
  const lista = PRODUTOS.filter(p => p.cat === slug);
  const ehPerf = slug === "perfumes";
  const familias = ehPerf ? [...new Set(lista.map(p => conteudo(p.cod)?.familia?.split(" ")[0]).filter(Boolean))] : [];
  const famSel = params.get("familia");
  return `<div class="wrap">
    <nav class="miga"><a href="#/">Início</a> / ${c.nome}</nav>
    <div class="cat-cab"><div><h1 class="t-l">${c.nome}</h1><p class="lead" style="margin-top:8px">${c.desc}</p></div></div>
    <div class="cat-layout">
      <aside class="filtros" id="filtros">
        <div class="so-cel" style="justify-content:space-between;align-items:center"><b class="t-m">Filtros</b><button class="ic-btn" data-fechar-filtros aria-label="Fechar">${ic("x")}</button></div>
        ${ehPerf ? `<div><h4>Para quem</h4>
          <label><input type="checkbox" name="genero" value="fem" ${params.get("genero") === "fem" ? "checked" : ""}> Feminino</label>
          <label><input type="checkbox" name="genero" value="masc" ${params.get("genero") === "masc" ? "checked" : ""}> Masculino</label></div>
          <div><h4>Família olfativa</h4>${familias.map(f => `<label><input type="checkbox" name="familia" value="${f}" ${f === famSel ? "checked" : ""}> ${f}</label>`).join("")}</div>
          <div><h4>Intensidade</h4><label><input type="checkbox" name="intens" value="Moderado"> Moderado</label><label><input type="checkbox" name="intens" value="Intenso"> Intenso</label></div>` : ""}
        <div><h4>Preço</h4>
          <label><input type="radio" name="faixa" value="0-60"> Até R$ 60</label>
          <label><input type="radio" name="faixa" value="60-120"> R$ 60 a R$ 120</label>
          <label><input type="radio" name="faixa" value="120-99999"> Acima de R$ 120</label>
          <label><input type="radio" name="faixa" value="" checked> Todos</label></div>
        <button class="btn btn-roxo so-cel" data-fechar-filtros>Ver resultados</button>
      </aside>
      <div>
        <div class="barra-lista">
          <span id="contagem"></span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-borda so-cel" style="height:42px;padding:0 16px" data-abrir-filtros>${ic("filtro")} Filtros</button>
            <select class="sel" id="ordem" aria-label="Ordenar"><option value="rel">Mais relevantes</option><option value="menor">Menor preço</option><option value="maior">Maior preço</option><option value="az">A a Z</option></select>
          </div>
        </div>
        <div class="grade g3" id="lista"></div>
      </div>
    </div>
  </div>`;
}
function filtrarCategoria(slug) {
  const marc = n => $$(`#filtros input[name=${n}]:checked`).map(i => i.value);
  const gen = marc("genero"), fam = marc("familia"), int = marc("intens");
  const [min, max] = ($(`#filtros input[name=faixa]:checked`)?.value || "0-99999").split("-").map(Number);
  let l = PRODUTOS.filter(p => p.cat === slug).filter(p => {
    const c = conteudo(p.cod) || {};
    return (!gen.length || gen.includes(p.genero)) && (!fam.length || fam.includes(c.familia?.split(" ")[0]))
      && (!int.length || int.includes(c.intensidade)) && p.preco >= (min || 0) && p.preco <= (max || 99999);
  });
  const o = $("#ordem").value;
  if (o === "menor") l.sort((a, b) => a.preco - b.preco);
  if (o === "maior") l.sort((a, b) => b.preco - a.preco);
  if (o === "az") l.sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  $("#lista").innerHTML = l.length ? cards(l) : `<div class="vazio" style="grid-column:1/-1">Nenhum produto com esses filtros.</div>`;
  $("#contagem").textContent = `${l.length} ${l.length === 1 ? "produto" : "produtos"}`;
}

function paginaProduto(cod) {
  const p = porCod[cod]; if (!p) return pagina404();
  const c = conteudo(cod) || {}; const v0 = variacaoInicial(p);
  const preco = v0 ? v0.preco : p.preco;
  const rel = PRODUTOS.filter(x => x.cat === p.cat && x.cod !== cod).slice(0, 4);
  const selos = c.selos || (p.cat === "perfumes" ? ["25% de essência", "Essências importadas", "Até 48h de fixação"] : []);
  const abas = [];
  if (c.notas) abas.push(["Notas olfativas", `<div class="ficha-perf">${[c.familia, c.intensidade, c.genero].filter(Boolean).map(t => `<span class="chip">${t}</span>`).join("")}</div>
     <div class="piramide"><div><b>Saída</b><span>${c.notas.saida}</span></div><div><b>Corpo</b><span>${c.notas.corpo}</span></div><div><b>Fundo</b><span>${c.notas.fundo}</span></div></div>`]);
  if (c.beneficios) abas.push(["Benefícios", `<ul>${c.beneficios.map(b => `<li>${ic("check")}<span>${b}</span></li>`).join("")}</ul>`]);
  if (c.formula) abas.push(["Fórmula", `<p>${c.formula}</p>${c.formato ? `<p style="margin-top:10px"><b>Formato:</b> ${c.formato}</p>` : ""}${c.aviso ? `<div class="aviso-p">${c.aviso}</div>` : ""}`]);
  abas.push(["Entrega", `<ul><li>${ic("caminhao")}<span>Enviado pela Jan Rosê para todo o Brasil. Prazo e frete calculados no fechamento do pedido.</span></li><li>${ic("usuario")}<span>Atendimento do seu consultor antes e depois da compra.</span></li></ul>`]);
  if (p.cat === "bem-estar") abas[abas.length - 1][1] += `<div class="aviso-p">Suplemento alimentar não é medicamento. Consulte um profissional de saúde em caso de gestação, tratamento ou dúvida.</div>`;
  track("view_item", { cod, valor: preco });
  return `<div class="wrap">
    <nav class="miga"><a href="#/">Início</a> / <a href="#/categoria/${p.cat}">${CATS[p.cat].nome}</a> / ${esc(p.nome)}</nav>
    <div class="pdp">
      <div class="pdp-foto" id="foto"><img src="${fotoGrande(p)}" alt="${esc(p.nome)}" width="700" height="700"></div>
      <div>
        <span class="sobre">${esc(linhaDe(p))}${c.exclusivo ? " · criação exclusiva" : ""}</span>
        <h1>${esc(p.nome)}</h1>
        <div class="cod">Código ${esc(p.cod)}</div>
        ${c.titulo ? `<p style="font-weight:700;margin-top:16px">${c.titulo}</p>` : ""}
        <p class="resumo">${c.resumo || TEXTO_PADRAO[p.cat]}</p>
        <div class="preco preco-g" id="preco">${brl(preco)}</div>
        <div class="preco-obs">Preço oficial Jan Rosê. Frete calculado no fechamento.</div>
        ${selos.length ? `<div class="selos">${selos.map(s => `<span>${ic("check")}${s}</span>`).join("")}</div>` : ""}
        ${p.variacoes ? `<div class="opcoes"><h4>${p.cat === "joias" ? "Tamanho do aro" : "Tamanho"}</h4><div class="lista">${p.variacoes.map(v => `
          <button class="op ${v.cod === v0?.cod ? "on" : ""}" data-var="${v.cod}" data-preco="${v.preco}" ${v.disponivel ? "" : "disabled"}>${v.rotulo.replace("Aro ", "")}</button>`).join("")}</div></div>` : ""}
        <div class="comprar">
          <div class="qtd"><button data-q="-1" aria-label="Menos">−</button><input id="qtd" value="1" inputmode="numeric" aria-label="Quantidade"><button data-q="1" aria-label="Mais">+</button></div>
          <button class="btn btn-roxo" data-comprar="${cod}">${ic("sacola")} Adicionar à sacola</button>
          <button class="ic-btn fav ${favoritos.includes(cod) ? "on" : ""}" style="position:static;width:52px;height:52px;border:1.5px solid var(--linha)" data-fav="${cod}" aria-label="Favoritar">${ic("coracao")}</button>
        </div>
        <div style="margin-top:12px">${linkZap(`Olá! Tenho interesse no ${p.nome} (código ${p.cod}).`, "Tirar dúvida com o consultor", "btn btn-borda btn-bloco")}</div>
        <div class="garantias">
          <div>${ic("caminhao")} Entrega pela Jan Rosê em todo o Brasil</div>
          <div>${ic("escudo")} Compra segura no checkout oficial</div>
        </div>
        <div class="abas">
          <div class="abas-nav">${abas.map((a, i) => `<button class="${i ? "" : "on"}" data-aba="${i}">${a[0]}</button>`).join("")}</div>
          ${abas.map((a, i) => `<div class="aba ${i ? "" : "on"}" data-painel="${i}">${a[1]}</div>`).join("")}
        </div>
      </div>
    </div>
    ${rel.length ? `<section style="padding-bottom:88px"><div class="sec-cab"><h2 class="t-m">Você também pode gostar</h2><a class="link-seta" href="#/categoria/${p.cat}">Ver tudo ${ic("seta")}</a></div><div class="grade">${cards(rel)}</div></section>` : ""}
  </div>
  <div class="barra-cel"><span class="preco" id="preco-cel">${brl(preco)}</span><button class="btn btn-roxo" data-comprar="${cod}">${ic("sacola")} Adicionar</button></div>`;
}

function paginaLista(titulo, lista, vazio) {
  return `<div class="wrap" style="padding-bottom:88px"><nav class="miga"><a href="#/">Início</a> / ${esc(titulo)}</nav>
    <div class="cat-cab"><h1 class="t-l">${esc(titulo)}</h1></div>
    ${lista.length ? `<div class="grade">${cards(lista)}</div>` : `<div class="vazio">${vazio}</div>`}</div>`;
}
function buscar(t) { const q = sem(t).trim().split(/\s+/).filter(Boolean); return PRODUTOS.filter(p => q.every(w => p.busca.includes(w))); }

function paginaCheckout() {
  if (!sacola.length) return paginaLista("Finalizar compra", [], `Sua sacola está vazia. <a class="link-seta" href="#/">Ver produtos</a>`);
  return `<div class="wrap">
    <nav class="miga"><a href="#/">Início</a> / Finalizar compra</nav>
    <div class="check">
      <form id="form-check" novalidate>
        <div class="passos"><span class="on">1. Seus dados</span><span>2. Entrega</span><span>3. Pagamento</span></div>
        <div class="bloco"><h3>Seus dados</h3><div class="campos">
          ${campo("nome", "Nome completo", "text", "c2", 'autocomplete="name" required minlength="5"')}
          ${campo("email", "E-mail", "email", "", 'autocomplete="email" required')}
          ${campo("tel", "Celular com DDD", "tel", "", 'autocomplete="tel" required minlength="14"')}
          ${campo("cpf", "CPF", "text", "", 'inputmode="numeric" required minlength="14"')}
        </div></div>
        <div class="bloco"><h3>Entrega</h3><div class="campos">
          ${campo("cep", "CEP", "text", "", 'inputmode="numeric" autocomplete="postal-code" required minlength="9"')}
          ${campo("num", "Número", "text", "", "required")}
          ${campo("rua", "Endereço", "text", "c2", 'autocomplete="street-address" required')}
          ${campo("bairro", "Bairro", "text", "", "required")}
          ${campo("cidade", "Cidade / UF", "text", "", "required")}
        </div></div>
        <div class="bloco"><h3>Pagamento</h3>
          <div class="pag">
            <label><input type="radio" name="pag" value="pix" checked> Pix<small style="font-weight:500;color:var(--tinta-2)">Aprovação na hora</small></label>
            <label><input type="radio" name="pag" value="cartao"> Cartão<small style="font-weight:500;color:var(--tinta-2)">Crédito</small></label>
            <label><input type="radio" name="pag" value="boleto"> Boleto<small style="font-weight:500;color:var(--tinta-2)">Até 3 dias úteis</small></label>
          </div>
          <p class="nota-int"><b>Modelo de proposta:</b> as formas de pagamento, o frete e o envio do pedido usam o gateway e o sistema atuais da Jan Rosê na integração. Nenhum dado é enviado nesta demonstração.</p>
        </div>
        <button class="btn btn-roxo btn-bloco" type="submit">Concluir pedido</button>
      </form>
      <aside class="resumo-ped bloco"><h3>Resumo do pedido</h3>
        ${sacola.map(it => { const p = porCod[it.cod]; const v = p.variacoes?.find(x => x.cod === it.var);
          return `<div class="item" style="grid-template-columns:60px 1fr auto"><div class="im" style="width:60px;height:60px"><img src="${p.img}" alt=""></div><div><b>${esc(p.nome)}</b><small>${v ? v.rotulo + " · " : ""}${it.qtd}×</small></div><b>${brl(precoItem(it) * it.qtd)}</b></div>`; }).join("")}
        <div style="margin-top:16px"><div class="linha-tot"><span>Subtotal</span><span>${brl(totalSacola())}</span></div>
        <div class="linha-tot"><span>Frete</span><span id="frete">Informe o CEP</span></div>
        <div class="linha-tot g"><span>Total</span><span>${brl(totalSacola())}</span></div></div>
        <p class="nota-int">Comprando com <b>${esc(CONFIG.consultor.nome)}</b>, consultor Jan Rosê.</p>
      </aside>
    </div>
  </div>`;
}
const campo = (id, rot, tipo, cls, attrs) => `<label class="campo ${cls}" for="c-${id}">${rot}<input id="c-${id}" name="${id}" type="${tipo}" ${attrs}><span class="erro">Confira este campo.</span></label>`;
const pagina404 = () => paginaLista("Página não encontrada", [], `Não encontramos o que você procurava. <a class="link-seta" href="#/">Voltar ao início</a>`);

/* ---------- casca (topo, sacola, rodapé) ---------- */
function montarCasca() {
  const logo = `<img src="img/marca/logo.svg" alt="Jan Rosê" width="198" height="50">`;
  document.body.insertAdjacentHTML("afterbegin", `
  <a href="#conteudo" class="sr">Pular para o conteúdo</a>
  <div class="faixa-proposta"><span class="so-pc-txt">Proposta de redesign da loja do consultor · </span><b>Versão de demonstração</b>, não é a loja oficial<span class="so-pc-txt">. Nenhum pedido ou dado é enviado</span>.</div>
  <div class="aviso">Entrega para todo o Brasil<span class="so-pc-txt"> pela Jan Rosê</span> · <b>70%+ vegano</b></div>
  <header class="topo">
    <div class="wrap topo-l1">
      <a class="logo" href="#/">${logo}</a>
      <div class="busca" id="busca"><label class="sr" for="campo-busca">Buscar</label>${ic("busca")}
        <input id="campo-busca" type="search" placeholder="Buscar perfume, suplemento, hidratante…" autocomplete="off">
        <div class="busca-res" id="busca-res" role="listbox"></div></div>
      <div class="acoes">
        <div class="consultor-chip"><span class="av">${CONFIG.consultor.nome.split(" ").map(s => s[0]).slice(0, 2).join("")}</span><div><b>${esc(CONFIG.consultor.nome)}</b><span>seu consultor</span></div></div>
        <button class="ic-btn btn-busca" data-abrir-busca aria-label="Buscar">${ic("busca")}</button>
        <a class="ic-btn" href="#/favoritos" aria-label="Favoritos">${ic("coracao")}<span class="badge" id="cont-fav">${favoritos.length || ""}</span></a>
        <button class="ic-btn" data-abrir-sacola aria-label="Sacola">${ic("sacola")}<span class="badge" id="cont-sacola"></span></button>
      </div>
    </div>
    <nav class="wrap menu" id="menu"><a href="#/" data-rota="">Início</a>${Object.entries(CATS).map(([s, c]) => `<a href="#/categoria/${s}" data-rota="categoria/${s}">${c.nome}</a>`).join("")}</nav>
  </header>
  <main id="conteudo" tabindex="-1"></main>
  <footer class="rodape-site"><div class="wrap">
    <div class="rodape-grid">
      <div><a class="logo" href="#/">${logo}</a><p>Cosméticos, perfumaria e bem-estar desde 1994. Brasil e 27 países da Europa.</p></div>
      <div><h4>Categorias</h4><ul>${Object.entries(CATS).map(([s, c]) => `<li><a href="#/categoria/${s}">${c.nome}</a></li>`).join("")}</ul></div>
      <div><h4>Atendimento</h4><ul><li><a href="#/favoritos">Meus favoritos</a></li><li><a href="#" data-abrir-sacola>Minha sacola</a></li><li>${linkZap("Olá! Vim pela loja Jan Rosê.", "WhatsApp do consultor", "")}</li></ul></div>
      <div><h4>Seu consultor</h4><p>${esc(CONFIG.consultor.nome)}<br>Consultor independente Jan Rosê</p></div>
    </div>
    <div class="rodape-base"><span>© Jan Rosê Cosméticos. Preços e produtos da loja oficial.</span><span>Proposta de redesign · versão de apresentação</span></div>
  </div></footer>
  <div class="veu" id="veu"></div>
  <aside class="gaveta" id="gaveta" aria-label="Sacola" aria-hidden="true">
    <div class="gaveta-cab"><b>Sua sacola</b><button class="ic-btn" data-fechar-sacola aria-label="Fechar">${ic("x")}</button></div>
    <div class="gaveta-corpo" id="gaveta-corpo"></div>
    <div class="gaveta-pe" id="gaveta-pe"></div>
  </aside>
  <div class="toast" id="toast" role="status"></div>`);
}
function atualizarSacola() {
  $("#cont-sacola").textContent = qtdSacola() || "";
  const corpo = $("#gaveta-corpo"), pe = $("#gaveta-pe");
  if (!sacola.length) { corpo.innerHTML = `<div class="vazio">${ic("sacola")}<p style="margin-top:10px">Sua sacola está vazia.</p></div>`; pe.innerHTML = `<a class="btn btn-borda btn-bloco" href="#/" data-fechar-sacola>Continuar comprando</a>`; return; }
  corpo.innerHTML = sacola.map((it, i) => { const p = porCod[it.cod]; const v = p.variacoes?.find(x => x.cod === it.var);
    return `<div class="item"><div class="im"><img src="${p.img}" alt=""></div>
      <div><b>${esc(p.nome)}</b><small>${v ? v.rotulo + " · " : ""}${brl(precoItem(it))}</small>
        <div class="qtd"><button data-alt="${i}" data-d="-1" aria-label="Menos">−</button><input value="${it.qtd}" readonly aria-label="Quantidade"><button data-alt="${i}" data-d="1" aria-label="Mais">+</button></div></div>
      <div style="text-align:right"><b>${brl(precoItem(it) * it.qtd)}</b><button class="rem" data-alt="${i}" data-d="-999">Remover</button></div></div>`; }).join("");
  const tot = totalSacola(), lim = CONFIG.freteGratisAcima;
  pe.innerHTML = `${lim ? `<div class="frete-barra">${tot >= lim ? "Você ganhou <b>frete grátis</b>!" : `Faltam <b>${brl(lim - tot)}</b> para o frete grátis`}<div class="trilha"><i style="width:${Math.min(100, tot / lim * 100)}%"></i></div></div>` : ""}
    <div class="linha-tot"><span>Subtotal</span><span>${brl(tot)}</span></div>
    <div class="linha-tot" style="color:var(--tinta-2);font-size:13px"><span>Frete</span><span>calculado no checkout</span></div>
    <div class="linha-tot g"><span>Total</span><span>${brl(tot)}</span></div>
    <a class="btn btn-roxo btn-bloco" href="#/checkout" data-fechar-sacola>Finalizar compra ${ic("seta")}</a>`;
}
function abrirSacola(on = true) { if (on) $("#toast").classList.remove("on"); $("#gaveta").classList.toggle("on", on); $("#veu").classList.toggle("on", on); $("#gaveta").setAttribute("aria-hidden", !on); document.body.style.overflow = on ? "hidden" : ""; }
let tTimer; function toast(html) { const t = $("#toast"); t.innerHTML = html; t.classList.add("on"); clearTimeout(tTimer); tTimer = setTimeout(() => t.classList.remove("on"), 3200); }

/* ---------- roteador ---------- */
function rotear() {
  const [caminho, qs] = (location.hash.replace(/^#\/?/, "") || "").split("?");
  const params = new URLSearchParams(qs || ""); const [rota, arg] = caminho.split("/");
  const main = $("#conteudo"); let html, titulo = "Jan Rosê · Loja oficial";
  document.body.classList.remove("tem-barra");
  clearInterval(hTimer);
  if (!rota) html = paginaHome();
  else if (rota === "categoria") { html = paginaCategoria(arg, params); titulo = (CATS[arg]?.nome || "") + " · Jan Rosê"; }
  else if (rota === "produto") { html = paginaProduto(decodeURIComponent(arg)); titulo = (porCod[decodeURIComponent(arg)]?.nome || "") + " · Jan Rosê"; document.body.classList.add("tem-barra"); }
  else if (rota === "busca") { const t = decodeURIComponent(arg || ""); html = paginaLista(`Resultados para “${t}”`, buscar(t), "Nada encontrado. Tente outro termo."); }
  else if (rota === "favoritos") html = paginaLista("Meus favoritos", favoritos.map(c => porCod[c]).filter(Boolean), "Toque no coração de um produto para guardá-lo aqui.");
  else if (rota === "checkout") { html = paginaCheckout(); titulo = "Finalizar compra · Jan Rosê"; }
  else html = pagina404();
  main.innerHTML = html; document.title = titulo;
  $$("#menu a").forEach(a => a.classList.toggle("on", a.dataset.rota === (rota === "categoria" ? `categoria/${arg}` : rota || "")));
  if (rota === "categoria" && CATS[arg]) { filtrarCategoria(arg); $("#filtros").addEventListener("change", () => filtrarCategoria(arg)); $("#ordem").addEventListener("change", () => filtrarCategoria(arg)); }
  if (rota === "checkout") ligarCheckout();
  if (!rota) iniciarHeroi();
  window.scrollTo(0, 0);
}

/* ---------- checkout: máscaras, ViaCEP e validação ---------- */
function ligarCheckout() {
  const f = $("#form-check"); if (!f) return;
  const mask = (el, fn) => el && el.addEventListener("input", () => el.value = fn(el.value.replace(/\D/g, "")));
  mask(f.cpf, d => d.slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2"));
  mask(f.tel, d => d.slice(0, 11).replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2"));
  mask(f.cep, d => d.slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2"));
  f.cep.addEventListener("input", async () => {
    const d = f.cep.value.replace(/\D/g, ""); if (d.length !== 8) return;
    try { const r = await (await fetch(`https://viacep.com.br/ws/${d}/json/`)).json();
      if (!r.erro) { f.rua.value = r.logradouro; f.bairro.value = r.bairro; f.cidade.value = `${r.localidade} / ${r.uf}`; f.num.focus(); $("#frete").textContent = "calculado pela Jan Rosê"; } } catch {}
  });
  f.addEventListener("submit", e => {
    e.preventDefault(); let ok = true;
    $$("input[required]", f).forEach(i => { const v = i.checkValidity(); i.closest(".campo").classList.toggle("inv", !v); if (!v && ok) { i.focus(); ok = false; } });
    if (!ok) return;
    track("purchase_demo", { valor: totalSacola() });
    $("#conteudo").innerHTML = `<div class="wrap vazio" style="padding:120px 20px"><div class="pilar" style="max-width:520px;margin:0 auto;text-align:center">
      <div class="ico" style="margin:0 auto 16px">${ic("check")}</div><h1 class="t-m">Pedido de demonstração concluído</h1>
      <p style="margin:10px 0 22px">Na loja real, aqui o cliente recebe o número do pedido, o Pix ou o boleto, e o consultor é avisado na hora.</p>
      <a class="btn btn-roxo" href="#/">Voltar para a loja</a></div></div>`;
    sacola = []; guardar("sacola", sacola); atualizarSacola(); window.scrollTo(0, 0);
  });
}

/* ---------- eventos globais (delegação) ---------- */
function ligarEventos() {
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-vitrine],[data-add],[data-fav],[data-abrir-sacola],[data-fechar-sacola],[data-alt],[data-comprar],[data-var],[data-q],[data-aba],[data-trilho],[data-abrir-filtros],[data-fechar-filtros],[data-abrir-busca],[data-sem-zap],#veu,#foto");
    if (!t) return;
    const d = t.dataset;
    if (d.vitrine) trocarVitrine(+d.vitrine, true);
    else if (d.add) { e.preventDefault(); adicionar(d.add); }
    else if (d.fav) { e.preventDefault(); alternarFav(d.fav); }
    else if ("abrirSacola" in d) { e.preventDefault(); abrirSacola(true); }
    else if ("fecharSacola" in d || t.id === "veu") abrirSacola(false);
    else if (d.alt) alterarQtd(+d.alt, +d.d);
    else if (d.comprar) { const v = $(".op.on")?.dataset.var || null; adicionar(d.comprar, v, Math.max(1, parseInt($("#qtd")?.value) || 1)); }
    else if (d.var) { $$(".op").forEach(b => b.classList.toggle("on", b === t)); const pr = brl(+d.preco); $("#preco").textContent = pr; $("#preco-cel") && ($("#preco-cel").textContent = pr); }
    else if (d.q) { const q = $("#qtd"); q.value = Math.max(1, (parseInt(q.value) || 1) + +d.q); }
    else if (d.aba) { $$("[data-aba]").forEach(b => b.classList.toggle("on", b === t)); $$("[data-painel]").forEach(p => p.classList.toggle("on", p.dataset.painel === d.aba)); }
    else if (d.trilho) { const tr = $("#trilho"); tr.scrollBy({ left: +d.trilho * tr.clientWidth * .8, behavior: "smooth" }); }
    else if ("abrirFiltros" in d) $("#filtros").classList.add("on");
    else if ("fecharFiltros" in d) $("#filtros").classList.remove("on");
    else if ("abrirBusca" in d) { $("#busca").classList.toggle("on"); $("#campo-busca").focus(); }
    else if ("semZap" in d) { e.preventDefault(); toast("WhatsApp do consultor: preencher em CONFIG.consultor.whatsapp"); }
    else if (t.id === "foto") t.classList.toggle("zoom");
  });
  /* busca com sugestões e teclado */
  const campo = $("#campo-busca"), res = $("#busca-res"); let sel = -1;
  campo.addEventListener("input", () => {
    const l = campo.value.trim().length > 1 ? buscar(campo.value).slice(0, 7) : []; sel = -1;
    res.innerHTML = l.map(p => `<a href="#/produto/${p.cod}" role="option"><img src="${p.img}" alt=""><span>${esc(p.nome)}</span><b class="preco">${brl(p.preco)}</b></a>`).join("")
      + (l.length ? `<a href="#/busca/${encodeURIComponent(campo.value)}" class="link-seta" style="justify-content:center">Ver todos os resultados</a>` : "");
    res.classList.toggle("on", l.length > 0);
  });
  campo.addEventListener("keydown", e => {
    const itens = $$("a", res);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + itens.length) % itens.length; itens.forEach((a, i) => a.classList.toggle("ativo", i === sel)); }
    if (e.key === "Enter") { e.preventDefault(); location.hash = sel >= 0 ? itens[sel].getAttribute("href") : `#/busca/${encodeURIComponent(campo.value)}`; res.classList.remove("on"); campo.blur(); }
    if (e.key === "Escape") res.classList.remove("on");
  });
  document.addEventListener("click", e => { if (!e.target.closest("#busca")) res.classList.remove("on"); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") abrirSacola(false); });
  window.addEventListener("hashchange", () => { res.classList.remove("on"); $("#busca").classList.remove("on"); campo.value = ""; rotear(); });
}

montarCasca(); atualizarSacola(); ligarEventos(); rotear();
})();
