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
    "345713709": { color: "Preto", image: "https://cdn.awsli.com.br/200x200/1237/1237589/produto/345713697/base-de-jafa-preta-0nyqawzix6.png" }
  };

  let carouselId = 0;
  const normalize = (value) => (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  function emphasizeHeading() {
    const heading = [...document.querySelectorAll("body *")].find((element) =>
      element.children.length === 0 && normalize(element.textContent) === "adicione acessorios:"
    );
    if (heading) heading.classList.add("bg-accessories-heading");
  }

  function enhanceCoverSelects() {
    document.querySelectorAll(".list .item.multiple select:not([data-bg-cover-thumbnails])").forEach((select) => {
      const item = select.closest(".item");
      const name = item?.querySelector(".int span")?.textContent?.trim() || "";
      if (!normalize(name).includes("capa jafarabadi")) return;

      const options = [...select.options].filter((option) => option.value && variants[option.value]);
      if (options.length !== 9) return;

      const staticCoverImage = [...(item?.querySelectorAll("img") || [])].find((image) =>
        normalize(image.alt).includes("capa jafarabadi")
      );
      if (staticCoverImage) {
        staticCoverImage.classList.add("bg-jafarabadi-cover-static-image");
        staticCoverImage.setAttribute("aria-hidden", "true");
        staticCoverImage.alt = "";
      }

      const group = document.createElement("div");
      group.className = "bg-jafarabadi-cover-options";
      group.id = `bg-jafarabadi-cover-options-${++carouselId}`;
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", "Capa Jafarabadi 1L: escolha uma cor");

      const updateSelection = () => group.querySelectorAll(".bg-jafarabadi-cover-option").forEach((button) => {
        button.setAttribute("aria-pressed", String(button.dataset.variantId === select.value));
      });

      options.forEach((option) => {
        const variant = variants[option.value];
        const button = document.createElement("button");
        button.type = "button";
        button.className = "bg-jafarabadi-cover-option";
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
          updateSelection();
        });
        group.append(button);
      });

      const carousel = document.createElement("div");
      carousel.className = "bg-jafarabadi-cover-carousel";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "bg-jafarabadi-cover-arrow";
      previous.setAttribute("aria-label", "Cores anteriores da capa Jafarabadi");
      previous.setAttribute("aria-controls", group.id);
      previous.textContent = "‹";
      const next = document.createElement("button");
      next.type = "button";
      next.className = "bg-jafarabadi-cover-arrow";
      next.setAttribute("aria-label", "Próximas cores da capa Jafarabadi");
      next.setAttribute("aria-controls", group.id);
      next.textContent = "›";

      const updateArrows = () => {
        const maxScroll = group.scrollWidth - group.clientWidth;
        previous.disabled = group.scrollLeft <= 1;
        next.disabled = maxScroll <= 1 || group.scrollLeft >= maxScroll - 1;
      };
      previous.addEventListener("click", () => group.scrollBy({ left: -group.clientWidth, behavior: "smooth" }));
      next.addEventListener("click", () => group.scrollBy({ left: group.clientWidth, behavior: "smooth" }));
      group.addEventListener("scroll", updateArrows, { passive: true });
      window.addEventListener("resize", updateArrows, { passive: true });
      select.addEventListener("change", updateSelection);

      carousel.append(previous, group, next);
      select.classList.add("bg-jafarabadi-cover-select-native");
      select.dataset.bgCoverThumbnails = "true";
      select.setAttribute("aria-hidden", "true");
      select.tabIndex = -1;
      select.insertAdjacentElement("afterend", carousel);
      requestAnimationFrame(updateArrows);
    });
  }

  function enhance() {
    emphasizeHeading();
    enhanceCoverSelects();
  }

  enhance();
  new MutationObserver(enhance).observe(document.body, { childList: true, subtree: true });
})();
