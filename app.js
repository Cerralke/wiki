(() => {
  "use strict";
  const data = window.BEZKRES_SEARCH || [];
  const normalize = value => String(value).toLocaleLowerCase("pl").replaceAll("ł", "l").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const entries = data.map(item => ({...item, titleKey: normalize(item.title), aliasKey: normalize(item.aliases.join(" ")), textKey: normalize(item.text)}));
  const form = document.getElementById("wiki-search");
  if (!form) return;
  const query = document.getElementById("search-query");
  const category = document.getElementById("search-category");
  const status = document.getElementById("search-status");
  const results = document.getElementById("search-results");
  const initial = new URLSearchParams(location.search);
  query.value = initial.get("q") || "";
  if (["Książki", "Postacie", "Lore"].includes(initial.get("kategoria"))) category.value = initial.get("kategoria");
  document.getElementById("nav-search").value = query.value;
  function search() {
    const text = normalize(query.value.trim());
    const tokens = text.split(/\s+/).filter(Boolean);
    const found = entries.map(item => {
      if (category.value && !item.categories.some(c => c.split(" / ")[0] === category.value)) return null;
      if (!tokens.every(token => (item.titleKey + " " + item.aliasKey + " " + item.textKey).includes(token))) return null;
      const score = !text ? 0 : (item.titleKey === text ? 100 : 0) + (item.titleKey.includes(text) ? 40 : 0) + (item.aliasKey.includes(text) ? 30 : 0) + tokens.filter(t => item.titleKey.includes(t)).length * 10;
      return {...item, score};
    }).filter(Boolean).sort((a,b) => b.score - a.score || a.title.localeCompare(b.title,"pl"));
    results.replaceChildren();
    status.textContent = text || category.value ? `Znaleziono haseł: ${found.length}.` : `Wszystkie hasła: ${found.length}. Wpisz nazwę lub fragment tekstu, aby zawęzić wyniki.`;
    for (const item of found) {
      const article = document.createElement("article"); article.className = "search-result";
      const heading = document.createElement("h2"); const link = document.createElement("a");
      link.href = item.url; link.textContent = item.title; heading.append(link);
      const excerpt = document.createElement("p"); excerpt.textContent = item.excerpt.length > 300 ? item.excerpt.slice(0,300) + "…" : item.excerpt;
      const meta = document.createElement("small"); meta.textContent = item.categories.join(" · ");
      article.append(heading,excerpt,meta); results.append(article);
    }
    if (!found.length) {
      const hint = document.createElement("p"); hint.textContent = "Spróbuj krótszej nazwy, innego określenia albo wybierz wszystkie kategorie."; results.append(hint);
    }
    try {
      const url = new URL(location.href);
      query.value.trim() ? url.searchParams.set("q",query.value.trim()) : url.searchParams.delete("q");
      category.value ? url.searchParams.set("kategoria",category.value) : url.searchParams.delete("kategoria");
      history.replaceState(null,"",url);
    } catch (_) { /* Local file viewers may disallow rewriting the address. */ }
  }
  form.addEventListener("submit",event => { event.preventDefault(); search(); });
  query.addEventListener("input",search);
  category.addEventListener("change",search);
  search();
})();
