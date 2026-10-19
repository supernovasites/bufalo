(() => {
  let carouselId = 0;
  const variants = {
    "345713703": { color: "Areia", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/base-de-jafa-areia-w881ky5sfc.png" },
    "400761718": { color: "Céu", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/dc94da46e0bb4c498948f0b08a527c35-wxuppl22qu.png" },
    "400761670": { color: "Chocolate", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/694b16681a2746dda86369780810f1f3-8gh5duhorc.png" },
    "400761715": { color: "Creme", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/95f2f121d93248889f6f6345a73d0fce-vm5z0yn4me.png" },
    "400761835": { color: "Nuvem", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/e1177841653640e5b928f95e59882332-inzo9r8ym6.png" },
    "400761826": { color: "Petróleo", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/62ce7e82906a40508ba2967ae2e93737-nq39xvufdf.png" },
    "345713699": { color: "Pitaya", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/base-de-jafa-pitaya-y3s9m9m0yg.png" },
    "346774415": { color: "Tiffany", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/base-de-jafa-turques-cr5fx3rn1r.png" },
    "345713709": { color: "Preto", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/base-de-jafa-preta-0nyqawzix6.png" },
    "371477617": { color: "Nuvem", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/371477535/-----editar---tampas-ud2wulifm1.png" },
    "371477724": { color: "Petróleo", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/371477535/tamp-easydrink-petrol--1--e2z8p2nlta.png" },
    "371477599": { color: "Preto", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/371477535/tamp-easydrink--1--9t7rj3wq6e.png" },
    "344414109": { color: "Areia", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/bico-areia-y6027rmh19.png" },
    "376162447": { color: "Céu", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/t-bico-ceu-ww9qvnonby.png" },
    "395834326": { color: "Chocolate", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/t-bico-choc-xryiounly5.png" },
    "395834205": { color: "Creme", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/t-bico-creme-2strgf2tip.png" },
    "376162852": { color: "Magenta", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/t-bico-magenta-2md7gfmoqh.png" },
    "344414177": { color: "Mirtilo", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/bico-mirtilo-pgzf01rwtd.png" },
    "344414026": { color: "Nuvem", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/bico-nuvem-wjhwkztk6g.png" },
    "344414703": { color: "Petróleo", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/bico-petrol-ev6cwvyghj.png" },
    "344414066": { color: "Pistache", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/bico-pistache-zjvw36ouqy.png" },
    "376162239": { color: "Tiffany", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/344413208/t-bio-tiffany-kkccxlwe95.png" },
    "390919850": { color: "Cáqui", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/390919334/bolsa-esportiva-8zb4f21ht2.png" },
    "390919400": { color: "Preto", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/390919334/5ae1e5c02a804fbe98b41064e4228597-l4l396nhhg.png" }
  };

  const protectionCovers = {
    harpuri: {
      Areia: "base-de-harpuri-areia--1--k34g0u4476.png",
      Céu: "03067340ff0d4329ac26c75b4adda259-4qxwkb8ufc.png",
      Chocolate: "c401bbc3c28c4c4d87bd60babaa93b09-xkrfz9pkst.png",
      Creme: "74f0e9ed6f844197b28d27e6505bf8e9-40axzbrzha.png",
      Nuvem: "base-harpuri-jqfmpt650g.png",
      Petróleo: "e3ed8b7bbf6847bb83706cd4c9cdf340-51xdkk2xgb.png",
      Pitaya: "base-de-harpuri-rosa-ab20c9smk0.png",
      Tiffany: "base-de-harpuri-turquesa-dybuhjt83t.png",
      Preto: "base-de-harpuri-preto-k7387eedn3.png"
    },
    murrahBuba: {
      Areia: "12-ipo7bchtvp.png",
      Branco: "c45fe0852c8d43219bc28b8841f237f8-kuqmm0e15h.png",
      Céu: "46306e0dd6d24f3abf55502c6906f1be-ajhtxluw6g.png",
      Chocolate: "b11349fe1df54561a4714a765b4e3b7c-3y6xm7b4sg.png",
      Creme: "24c6149e27db4f9c9b9abe974d0415db-gu8ffe9lfy.png",
      Nuvem: "2c18c3d881454c0484adb46baa8af002-d2inrr5lv6.png",
      Petróleo: "c0908ee52a3c445bac2cb3a9a889792d-mhf3w8isj8.png",
      Pitaya: "base-garrafa-bubamurrah--1--pbemjpmq3w.png",
      Tiffany: "base-de-buba_murrah-turquesa-g9ofvn8rlt.png",
      Preto: "base-de-buba_murrah-preta-3rtrvfrkol.png"
    }
  };

  function normalize(value) {
    return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  function accessoryVariant(select, option) {
    if (variants[option.value]) return variants[option.value];
    const itemName = select.closest(".item")?.querySelector(".int span")?.textContent?.trim() || "";
    const label = option.textContent.trim();
    const color = Object.keys(protectionCovers.harpuri).find((name) =>
      normalize(label).startsWith(normalize(name))
    );
    if (!color) return null;

    let family;
    let productId;
    if (normalize(itemName).includes("capa harpuri")) {
      family = protectionCovers.harpuri;
      productId = "345697385";
    } else if (normalize(itemName).includes("capa murrah") || normalize(itemName).includes("capa buba")) {
      family = protectionCovers.murrahBuba;
      productId = "345690989";
    } else {
      return null;
    }
    return {
      color,
      image: `https://cdn.awsli.com.br/200x200/1237/1237589/produto/${productId}/${family[color]}`
    };
  }

  function emphasizeAccessoryHeading() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if (walker.currentNode.nodeValue.trim() === "Adicione acessórios:") textNodes.push(walker.currentNode);
    }
    textNodes.forEach((node) => {
      const emphasis = document.createElement("strong");
      emphasis.className = "bg-accessory-heading";
      emphasis.textContent = node.nodeValue.trim();
      node.replaceWith(emphasis);
    });
  }

  function enhanceAccessorySelectors() {
    emphasizeAccessoryHeading();
    const accessorySelects = [...document.querySelectorAll(".list .item.multiple select")];
    new Set(accessorySelects.map((select) => select.closest(".list")).filter(Boolean)).forEach((list) => {
      const accessoryCount = list.querySelectorAll(":scope > .item").length;
      list.classList.add("bg-accessory-list");
      if (accessoryCount > 5) list.dataset.scrollable = "true";
      else delete list.dataset.scrollable;
    });

    accessorySelects.filter((select) => !select.hasAttribute("data-bg-thumbnails")).forEach((select) => {
      const options = [...select.options].filter((option) => option.value && option.value !== "Selecione");
      const optionVariants = options.map((option) => accessoryVariant(select, option));
      if (!options.length || optionVariants.some((variant) => !variant)) return;

      const name = select.closest(".item")?.querySelector(".int span")?.textContent?.trim() || "Acessório";
      select.closest(".item")?.querySelector(".int span")?.classList.add("bg-accessory-name");
      const group = document.createElement("div");
      group.className = "bg-accessory-thumbnails";
      if (options.length > 5) group.dataset.scrollable = "true";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", `${name}: escolha uma opção`);

      const buttons = options.map((option, index) => {
        const variant = optionVariants[index];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bg-accessory-thumbnail";
        button.setAttribute("aria-label", `${variant.color} — ${option.textContent.trim()}`);
        button.setAttribute("aria-pressed", String(select.value === option.value));
        button.dataset.variantId = option.value;
        button.title = variant.color;

        const image = document.createElement("img");
        image.src = variant.image;
        image.alt = "";
        image.loading = "lazy";
        image.width = 56;
        image.height = 56;

        const label = document.createElement("span");
        label.textContent = variant.color;
        button.append(image, label);
        button.addEventListener("click", () => {
          select.value = select.value === option.value ? "Selecione" : option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          group.querySelectorAll(".bg-accessory-thumbnail").forEach((item) => {
            item.setAttribute("aria-pressed", String(item.dataset.variantId === select.value));
          });
        });
        return button;
      });

      group.append(...buttons);
      let presentation = group;
      if (options.length > 5) {
        group.dataset.scrollable = "true";
        group.id = `bg-accessory-thumbnails-${++carouselId}`;

        const carousel = document.createElement("div");
        carousel.className = "bg-accessory-carousel";

        const previous = document.createElement("button");
        previous.type = "button";
        previous.className = "bg-accessory-arrow";
        previous.setAttribute("aria-label", `Miniaturas anteriores de ${name}`);
        previous.setAttribute("aria-controls", group.id);
        previous.textContent = "‹";

        const next = document.createElement("button");
        next.type = "button";
        next.className = "bg-accessory-arrow";
        next.setAttribute("aria-label", `Próximas miniaturas de ${name}`);
        next.setAttribute("aria-controls", group.id);
        next.textContent = "›";

        const updateArrows = () => {
          const maxScroll = group.scrollWidth - group.clientWidth;
          previous.disabled = group.scrollLeft <= 1;
          next.disabled = maxScroll <= 1 || group.scrollLeft >= maxScroll - 1;
        };
        previous.addEventListener("click", () => {
          group.scrollBy({ left: -group.clientWidth, behavior: "smooth" });
        });
        next.addEventListener("click", () => {
          group.scrollBy({ left: group.clientWidth, behavior: "smooth" });
        });
        group.addEventListener("scroll", updateArrows, { passive: true });
        window.addEventListener("resize", updateArrows, { passive: true });
        requestAnimationFrame(updateArrows);

        carousel.append(previous, group, next);
        presentation = carousel;
      }
      select.classList.add("bg-accessory-native-select");
      select.dataset.bgThumbnails = "true";
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      select.insertAdjacentElement("afterend", presentation);
    });
  }

  enhanceAccessorySelectors();
  new MutationObserver(enhanceAccessorySelectors).observe(document.body, { childList: true, subtree: true });
})();
