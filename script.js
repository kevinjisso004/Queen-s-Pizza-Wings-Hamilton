// Queen's Pizza & Wings — site interactions
// (mobile nav is bound by components.js after the header loads)

document.addEventListener("DOMContentLoaded", function () {
  /* ---------- reveal on scroll ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      // start revealing slightly BEFORE the element scrolls into view,
      // so fast scrolling never shows blank gaps
      { rootMargin: "0px 0px 10% 0px", threshold: 0.01 }
    );
    revealEls.forEach((el) => io.observe(el));

    // fail-safe: anything near the viewport must never stay hidden
    setTimeout(() => {
      revealEls.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 1.25) {
          el.classList.add("is-in");
        }
      });
    }, 2500);
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- plates carousel: paged arrows + mobile autoplay ---------- */
  const track = document.querySelector(".plates-track");
  if (track) {
    const gap = () =>
      parseFloat(getComputedStyle(track).columnGap) ||
      parseFloat(getComputedStyle(track).gap) ||
      0;
    const cardStep = () => {
      const card = track.querySelector(".plate");
      return card ? card.getBoundingClientRect().width + gap() : 1;
    };
    // cards visible per page (3 desktop / 2 tablet / 1 mobile)
    const perView = () =>
      Math.max(1, Math.round((track.clientWidth + gap()) / cardStep()));

    /* Chrome ignores smooth scrollTo while mandatory snap is active,
       and JS tweens stutter when frames are throttled. So: suspend
       snap, hand the animation to the browser's compositor-driven
       smooth scroll, then restore snap and re-anchor on the exact
       card position once the scroll ends. */
    const setSnap = (on) => track.classList.toggle("snap-off", !on);
    let snapRestoreTimer = null;
    let pendingTarget = null;

    const finishPaging = () => {
      clearTimeout(snapRestoreTimer);
      snapRestoreTimer = null;
      if (pendingTarget !== null) {
        const target = pendingTarget;
        pendingTarget = null;
        setSnap(true);
        // explicit assignment updates the snap engine's remembered
        // target so it doesn't spring back to the previous card
        track.scrollLeft = target;
      }
    };

    const scrollToCard = (index) => {
      const plates = track.querySelectorAll(".plate");
      if (!plates.length) return;
      const rest = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const target = plates[index].offsetLeft - plates[0].offsetLeft + rest;
      if (Math.abs(track.scrollLeft - target) < 2) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        track.scrollLeft = target;
        return;
      }

      setSnap(false);
      pendingTarget = target;
      clearTimeout(snapRestoreTimer);
      track.addEventListener("scrollend", finishPaging, { once: true });
      snapRestoreTimer = setTimeout(finishPaging, 1000); // fallback
      track.scrollTo({ left: target, behavior: "smooth" });
    };

    // the user grabbing the track cancels any in-flight paging
    ["wheel", "touchstart", "pointerdown"].forEach((ev) =>
      track.addEventListener(
        ev,
        () => {
          track.removeEventListener("scrollend", finishPaging);
          clearTimeout(snapRestoreTimer);
          pendingTarget = null;
          setSnap(true);
        },
        { passive: true }
      )
    );

    const page = (dir) => {
      const count = track.querySelectorAll(".plate").length;
      const maxIdx = Math.max(0, count - perView());
      const idx = Math.round(track.scrollLeft / cardStep());
      let target = idx + dir * perView();
      if (dir > 0 && idx >= maxIdx) target = 0; // loop forward
      else if (dir < 0 && idx <= 0) target = maxIdx; // loop back
      else target = Math.min(Math.max(target, 0), maxIdx);
      scrollToCard(target);
    };

    /* mobile autoplay — pauses off-screen, on touch, on hidden tab */
    const mqMobile = window.matchMedia("(max-width: 600px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let autoTimer = null;
    let inView = false;
    let holdUntil = 0;

    const startAuto = () => {
      if (autoTimer || !mqMobile.matches || mqReduced.matches || !inView)
        return;
      autoTimer = setInterval(() => {
        if (Date.now() < holdUntil || document.hidden) return;
        page(1);
      }, 4000);
    };

    const stopAuto = () => {
      clearInterval(autoTimer);
      autoTimer = null;
    };

    const userPause = () => {
      holdUntil = Date.now() + 8000;
    };

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(
        (entries) => {
          inView = entries[0].isIntersecting;
          if (inView) startAuto();
          else stopAuto();
        },
        { threshold: 0.25 }
      ).observe(track);
    } else {
      inView = true;
      startAuto();
    }

    mqMobile.addEventListener("change", () => {
      stopAuto();
      startAuto();
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAuto();
      else startAuto();
    });

    document.querySelectorAll("[data-scroll]").forEach((btn) => {
      btn.addEventListener("click", () => {
        userPause();
        page(btn.dataset.scroll === "next" ? 1 : -1);
      });
    });

    track.addEventListener("pointerdown", userPause);
    track.addEventListener("touchstart", userPause, { passive: true });
  }

  /* ---------- header shadow once scrolled ---------- */
  window.addEventListener(
    "scroll",
    () => {
      const header = document.querySelector(".site-header");
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    },
    { passive: true }
  );

  /* ---------- back-to-top ---------- */
  const toTop = document.createElement("button");
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML =
    '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 20V4m-6 6 6-6 6 6"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener("click", () =>
    window.scrollTo({ top: 0, behavior: "smooth" })
  );
  window.addEventListener(
    "scroll",
    () => toTop.classList.toggle("show", window.scrollY > 650),
    { passive: true }
  );

  /* ---------- drag-to-scroll on the plates carousel ---------- */
  const dragTrack = document.querySelector(".plates-track");
  if (dragTrack) {
    let startX = 0;
    let startScroll = 0;
    let dragging = false;

    dragTrack.addEventListener("pointerdown", (e) => {
      dragging = true;
      startX = e.clientX;
      startScroll = dragTrack.scrollLeft;
      dragTrack.setPointerCapture(e.pointerId);
      dragTrack.classList.add("dragging");
      dragTrack.style.scrollBehavior = "auto";
    });

    dragTrack.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      dragTrack.scrollLeft = startScroll - (e.clientX - startX);
    });

    const endDrag = () => {
      dragging = false;
      dragTrack.classList.remove("dragging");
      dragTrack.style.scrollBehavior = "";
    };
    dragTrack.addEventListener("pointerup", endDrag);
    dragTrack.addEventListener("pointercancel", endDrag);
  }

  /* ---------- FAQ: close other open items ---------- */
  const qas = document.querySelectorAll("details.qa");
  qas.forEach((qa) => {
    qa.addEventListener("toggle", () => {
      if (qa.open) {
        qas.forEach((other) => {
          if (other !== qa) other.removeAttribute("open");
        });
      }
    });
  });

  /* ---------- legacy accordion FAQ (SEO pages) ---------- */
  const legacyFaq = document.querySelectorAll(".faq__question");
  legacyFaq.forEach((item) => {
    item.addEventListener("click", () => {
      const parent = item.parentElement;
      document.querySelectorAll(".faq__item.active").forEach((el) => {
        if (el !== parent) el.classList.remove("active");
      });
      parent.classList.toggle("active");
    });
  });

  /* ================================================================
     MENU-DRIVEN CONTENT (any page) — sections marked [data-dynamic]
     re-render from menu.js, so updating menu.js updates the site.
     The static markup underneath stays as a no-JS fallback.
     ================================================================ */
  if (typeof data !== "undefined" && Array.isArray(data)) {
    const liveCategories = [...data]
      .sort((a, b) => a.priority - b.priority)
      .map((c) => ({
        title: c.title,
        foods: (c.foods_displayed_in_menu || []).filter(
          (f) => f.is_displayable_item !== false && f.is_available !== false
        ),
      }))
      .filter((c) => c.foods.length);

    // home: category tiles in the menu-preview band
    const catGrid = document.querySelector(".cat-grid[data-dynamic]");
    if (catGrid && liveCategories.length) {
      catGrid.innerHTML = "";
      liveCategories.slice(0, 6).forEach((c) => {
        const tile = document.createElement("a");
        tile.className = "cat-tile";
        tile.href =
          "menu.html?cat=" + encodeURIComponent(c.title) + "#menu-section";
        const label = document.createElement("span");
        label.textContent = c.title;
        const arrow = document.createElement("span");
        arrow.className = "arrow";
        arrow.innerHTML =
          '<svg class="ico" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M7 17 17 7m-8 0h8v8"/></svg>';
        tile.append(label, arrow);
        catGrid.appendChild(tile);
      });
    }

  }

  /* ================================================================
     LIVE MENU (menu.html) — renders categories/items from menu.js
     ================================================================ */
  const menuButtonsContainer = document.querySelector(".menu-buttons");
  const menuItemsContainer = document.querySelector(".menu-items");
  const dropdownContent = document.querySelector(".dropdown-content");
  const menuSection = document.querySelector("#menu");
  const menuTitleSection = document.querySelector("#menu-title-section");
  const mobileMenuControls = document.querySelector(".mobile-menu-controls");

  if (
    !menuButtonsContainer ||
    !menuItemsContainer ||
    !dropdownContent ||
    typeof data === "undefined"
  ) {
    return;
  }

  function isMobileView() {
    return window.innerWidth <= 768;
  }

  // Sort data by priority value (ascending order)
  const sortedData = [...data].sort((a, b) => a.priority - b.priority);

  // Generate menu buttons dynamically (for desktop)
  sortedData.forEach((category, index) => {
    if (!category.foods_displayed_in_menu?.length) {
      return;
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className =
      index === 0 ? "menu-button active-button" : "menu-button";
    button.id = category.title;
    button.textContent = category.title;
    menuButtonsContainer.appendChild(button);

    // Add category to mobile dropdown
    const dropdownItem = document.createElement("a");
    dropdownItem.href = "#";
    dropdownItem.textContent = category.title;
    dropdownContent.appendChild(dropdownItem);
  });

  // Generate menu items dynamically
  sortedData.forEach((category) => {
    category.foods_displayed_in_menu.forEach((food) => {
      const item = document.createElement("div");
      item.className = "menu-item";
      item.dataset.category = category.title;

      const details = document.createElement("div");
      details.className = "item-details";

      const name = document.createElement("h3");
      name.className = "item-name";
      name.textContent = food.title;

      const price = document.createElement("h4");
      price.className = "item-price";
      price.textContent = `$${food.price}`;

      const desc = document.createElement("p");
      desc.className = "item-desc";
      const span = document.createElement("span");
      span.textContent = category.title;
      desc.appendChild(span);
      if (food.description) {
        desc.innerHTML += ` ${food.description}`;
      }

      details.appendChild(name);
      details.appendChild(price);
      details.appendChild(desc);
      item.appendChild(details);
      menuItemsContainer.appendChild(item);
    });
  });

  const buttons = document.querySelectorAll(".menu-button");
  const items = document.querySelectorAll(".menu-item");
  const dropdownBtn = document.querySelector(".dropbtn");

  if (dropdownBtn) {
    dropdownBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdownContent.style.display =
        dropdownContent.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", () => {
      dropdownContent.style.display = "none";
    });
  }

  document.querySelectorAll(".dropdown-content a").forEach((item) => {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      const selectedCategory = this.textContent;
      const categoryId = `category-${selectedCategory
        .replace(/\s+/g, "-")
        .toLowerCase()}`;
      clearSearch();

      dropdownContent.style.display = "none";
      if (dropdownBtn) {
        dropdownBtn.textContent = selectedCategory;
      }

      setTimeout(() => {
        const categoryElement = document.getElementById(categoryId);
        if (categoryElement) {
          const controlsHeight = mobileMenuControls?.offsetHeight || 0;
          const headerHeight =
            document.querySelector(".site-header")?.offsetHeight || 0;
          const scrollToPosition =
            categoryElement.getBoundingClientRect().top +
            window.scrollY -
            controlsHeight -
            headerHeight -
            16;

          window.scrollTo({ top: scrollToPosition, behavior: "smooth" });
        }
      }, 100);
    });
  });

  let selectedButton = buttons.length > 0 ? buttons[0].id : "";
  let menuItemsRendered = false;

  function showItems() {
    if (menuItemsRendered && isMobileView()) return;

    let currentCategory = null;
    menuItemsContainer.innerHTML = "";

    items.forEach((item) => {
      const cat = item.dataset.category;
      const itemClone = item.cloneNode(true);

      if (isMobileView()) {
        itemClone.style.display = "block";
      } else {
        itemClone.style.display = cat === selectedButton ? "block" : "none";
      }

      if (isMobileView() && cat !== currentCategory) {
        const categoryHeader = document.createElement("h2");
        categoryHeader.className = "category-header";
        categoryHeader.textContent = cat;
        categoryHeader.id = `category-${cat
          .replace(/\s+/g, "-")
          .toLowerCase()}`;
        menuItemsContainer.appendChild(categoryHeader);
        currentCategory = cat;
      }

      menuItemsContainer.appendChild(itemClone);
    });

    menuItemsRendered = true;
  }

  function updateDesktopView() {
    if (isMobileView()) return;

    document.querySelectorAll(".menu-items .menu-item").forEach((item) => {
      const cat = item.dataset.category;
      item.style.display = cat === selectedButton ? "block" : "none";
    });
  }

  function clearButtons() {
    buttons.forEach((btn) => btn.classList.remove("active-button"));
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      clearButtons();
      selectedButton = btn.id;
      btn.classList.add("active-button");
      updateDesktopView();
      scrollToMenuSection();
    });
  });

  function scrollToMenuSection() {
    if (!menuTitleSection) return;
    const headerHeight =
      document.querySelector(".site-header")?.offsetHeight || 0;
    const top =
      menuTitleSection.getBoundingClientRect().top +
      window.scrollY -
      headerHeight -
      12;
    window.scrollTo({ top, behavior: "smooth" });
  }

  const searchInput = document.getElementById("menu-search");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const searchTerm = searchInput.value.toLowerCase();
      const menuItems = document.querySelectorAll(".menu-items .menu-item");
      const categoryHeaders = document.querySelectorAll(".category-header");
      const visibleItemsInCategory = {};

      menuItems.forEach((item) => {
        const itemName = item
          .querySelector(".item-name")
          .textContent.toLowerCase();
        const itemDesc = item
          .querySelector(".item-desc")
          .textContent.toLowerCase();
        const itemCategory = item.querySelector("p span").textContent;
        const matches =
          itemName.includes(searchTerm) || itemDesc.includes(searchTerm);

        if (isMobileView()) {
          item.style.display = matches ? "block" : "none";
          if (matches) {
            visibleItemsInCategory[itemCategory] =
              (visibleItemsInCategory[itemCategory] || 0) + 1;
          }
        } else if (itemCategory === selectedButton) {
          item.style.display = matches ? "block" : "none";
        }
      });

      if (isMobileView()) {
        categoryHeaders.forEach((header) => {
          header.style.display = visibleItemsInCategory[header.textContent]
            ? "block"
            : "none";
        });
      }
    });
  }

  function clearSearch() {
    if (searchInput) {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
    }
  }

  window.addEventListener("load", () => {
    showItems();
    updateDesktopView();
  });

  let lastWasMobile = isMobileView();
  window.addEventListener("resize", () => {
    const nowMobile = isMobileView();
    if (nowMobile !== lastWasMobile) {
      lastWasMobile = nowMobile;
      menuItemsRendered = false;
      showItems();
      updateDesktopView();
    }
  });

  showItems();
  updateDesktopView();

  /* deep link: menu.html?cat=<category> pre-selects that category
     (the home-page tiles link here) */
  const requestedCat = new URLSearchParams(window.location.search).get("cat");
  if (requestedCat) {
    const target = Array.from(buttons).find(
      (b) => b.id.toLowerCase() === requestedCat.toLowerCase()
    );
    if (target) {
      // select right away (desktop rail)
      if (!isMobileView()) {
        clearButtons();
        selectedButton = target.id;
        target.classList.add("active-button");
        updateDesktopView();
      }

      // position once everything is loaded, with an instant scroll so
      // the browser's own #hash scroll can't fight it
      const positionToCategory = () => {
        const headerHeight =
          document.querySelector(".site-header")?.offsetHeight || 0;
        let anchor = null;
        let extraOffset = 12;

        if (isMobileView()) {
          const id = `category-${target.id
            .replace(/\s+/g, "-")
            .toLowerCase()}`;
          anchor = document.getElementById(id);
          extraOffset = (mobileMenuControls?.offsetHeight || 0) + 16;
        } else {
          anchor = menuTitleSection;
        }

        if (anchor) {
          window.scrollTo({
            top:
              anchor.getBoundingClientRect().top +
              window.scrollY -
              headerHeight -
              extraOffset,
            behavior: "instant",
          });
        }
      };

      if (document.readyState === "complete") {
        setTimeout(positionToCategory, 80);
      } else {
        window.addEventListener("load", () =>
          setTimeout(positionToCategory, 150)
        );
      }
    }
  }
});
