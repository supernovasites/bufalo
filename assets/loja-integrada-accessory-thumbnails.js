(() => {
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

  function enhanceAccessorySelectors() {
    document.querySelectorAll(".list .item.multiple select:not([data-bg-thumbnails])").forEach((select) => {
      const options = [...select.options].filter((option) => option.value && option.value !== "Selecione");
      if (!options.length || !options.every((option) => variants[option.value])) return;

      const name = select.closest(".item")?.querySelector(".int span")?.textContent?.trim() || "Acessório";
      const group = document.createElement("div");
      group.className = "bg-accessory-thumbnails";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", `${name}: escolha uma opção`);

      const buttons = options.map((option) => {
        const variant = variants[option.value];
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
      select.classList.add("bg-accessory-native-select");
      select.dataset.bgThumbnails = "true";
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      select.insertAdjacentElement("afterend", group);
    });
  }

  enhanceAccessorySelectors();
  new MutationObserver(enhanceAccessorySelectors).observe(document.body, { childList: true, subtree: true });
})();
