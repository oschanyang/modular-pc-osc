/* 모듈형 PC 공동주택 연구단 — 공통 스크립트 */
(function () {
  "use strict";

  /* ---- 네비게이션: 모바일 토글 + 아코디언 + 접근성 ---- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.querySelector(".menu");
  function isMobileNav() { return window.matchMedia("(max-width: 820px)").matches; }

  if (toggle && menu) {
    if (!menu.id) menu.id = "primary-menu";
    toggle.setAttribute("aria-controls", menu.id);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "메뉴 열기");

    function setMenu(open) {
      menu.classList.toggle("open", open);
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      document.body.style.overflow = open ? "hidden" : "";
    }
    toggle.addEventListener("click", function () { setMenu(!menu.classList.contains("open")); });

    // 상위 메뉴: 모바일에서 탭하면 하위메뉴 아코디언 토글 (한 번에 하나만 열림)
    menu.querySelectorAll(":scope > li").forEach(function (li) {
      var a = li.querySelector(":scope > a");
      var dd = li.querySelector(":scope > .dropdown");
      if (!a || !dd) return;
      a.setAttribute("aria-haspopup", "true");
      a.setAttribute("aria-expanded", "false");
      a.addEventListener("click", function (e) {
        if (!isMobileNav()) return;               // 데스크톱은 hover 드롭다운 유지
        e.preventDefault();
        var willOpen = !li.classList.contains("open");
        menu.querySelectorAll(":scope > li.open").forEach(function (o) {
          if (o !== li) {
            o.classList.remove("open");
            var oa = o.querySelector(":scope > a");
            if (oa) oa.setAttribute("aria-expanded", "false");
          }
        });
        li.classList.toggle("open", willOpen);
        a.setAttribute("aria-expanded", willOpen ? "true" : "false");
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) { setMenu(false); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (!isMobileNav()) {
        menu.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });
  }

  /* ---- 현재 페이지 active 표시 ---- */
  // 주소 형태(.html 유무, 쿼리, 해시, 트레일링 슬래시)와 무관하게 페이지 키를 뽑는다
  function pageKey(p) {
    p = (p || "").split("#")[0].split("?")[0];
    if (p.slice(-1) === "/") p = p.slice(0, -1);
    p = p.split("/").pop().replace(/\.html$/, "");
    return p === "" ? "index" : p;
  }
  var currentKey = pageKey(location.pathname);
  if (menu) {
    menu.querySelectorAll("a[href]").forEach(function (a) {
      if (pageKey(a.getAttribute("href")) === currentKey) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
        var topLi = a.closest(".menu > li");
        if (topLi) topLi.classList.add("is-active");
      }
    });
  }

  /* ---- 탭 ---- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    // :scope 직계 기준으로 선택해 탭 안에 탭(중첩)이 있어도 서로 간섭하지 않게 한다
    var tabs = group.querySelectorAll(":scope > .tabs .tab");
    var panels = group.querySelectorAll(":scope > .tab-panel");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-tab");
        tabs.forEach(function (t) { t.classList.toggle("active", t === tab); });
        panels.forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-panel") === target);
        });
      });
    });
  });

  /* ---- URL 해시 진입 시 대상이 탭 안이면 해당 탭 활성화 후 이동 ---- */
  (function () {
    if (!location.hash) return;
    var t;
    try { t = document.querySelector(location.hash); } catch (e) { return; }
    if (!t) return;
    var panel = t.closest(".tab-panel");
    if (panel && !panel.classList.contains("active")) {
      var group = panel.closest("[data-tabs]");
      var btn = group && group.querySelector(':scope > .tabs .tab[data-tab="' + panel.getAttribute("data-panel") + '"]');
      if (btn) btn.click();
      setTimeout(function () { t.scrollIntoView(); }, 60);
    }
  })();

  /* ---- 수행계획 슬라이드(.slide-fig) 한정 확대 보기 ----
     UX 조사 권고에 따라 밀도 높은 계획 슬라이드만 클릭 시 원본 확대. 그 외 이미지는 계속 무반응. */
  (function () {
    var figs = document.querySelectorAll(".slide-fig img");
    if (!figs.length) return;
    var box = document.createElement("div");
    box.className = "slidebox";
    box.innerHTML =
      '<button class="sb-close" aria-label="닫기">&times;</button>' +
      '<button class="sb-prev" aria-label="이전 슬라이드">&#8249;</button>' +
      '<img alt="">' +
      '<button class="sb-next" aria-label="다음 슬라이드">&#8250;</button>' +
      '<div class="sb-cap"></div>';
    document.body.appendChild(box);
    var big = box.querySelector("img");
    var cap = box.querySelector(".sb-cap");
    var list = [], idx = 0;

    function visibleFigs() {
      return Array.prototype.filter.call(figs, function (f) { return f.offsetParent !== null; });
    }
    function show(i) {
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      big.src = list[idx].src;
      big.alt = list[idx].alt;
      cap.textContent = list[idx].alt + "  (" + (idx + 1) + " / " + list.length + ")";
    }
    function open(f) {
      list = visibleFigs();
      show(list.indexOf(f));
      box.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      box.classList.remove("open");
      document.body.style.overflow = "";
      big.src = "";
    }
    Array.prototype.forEach.call(figs, function (f) {
      var fig = f.closest(".slide-fig");
      if (fig) fig.addEventListener("click", function () { open(f); });
    });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    box.querySelector(".sb-close").addEventListener("click", close);
    box.querySelector(".sb-prev").addEventListener("click", function () { show(idx - 1); });
    box.querySelector(".sb-next").addEventListener("click", function () { show(idx + 1); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
  })();

  /* ---- 그 외 이미지 확대 기능 비활성화 ----
     사이트 내 다른 이미지는 클릭해도 아무 반응이 없도록 유지합니다. */

  /* ---- 스크롤 진입 애니메이션 ---- */
  (function () {
    var selectors = [
      ".section-head", ".lead-block", ".grid > *", ".poster", ".stats > .stat",
      ".compare > .col", ".steps > .step", ".orgchart", ".org-parts > *",
      ".partners", ".board", ".spec", ".tabs"
    ];
    var els = [];
    selectors.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (el.closest(".hero")) return;        // 히어로는 자체 애니메이션 사용
        if (el.hasAttribute("data-reveal")) return; // 방향성 애니메이션(홈)은 별도 처리
        if (els.indexOf(el) === -1) els.push(el);
      });
    });
    if (!els.length) return;

    // 같은 그룹(그리드/통계 등) 내 순차 지연(stagger)
    document.querySelectorAll(".grid, .stats, .partners, .steps, .org-parts, .compare").forEach(function (group) {
      Array.prototype.slice.call(group.children).forEach(function (child, i) {
        child.style.transitionDelay = Math.min(i * 70, 420) + "ms";
      });
    });

    els.forEach(function (el) {
      el.classList.add(el.matches(".poster") ? "reveal-img" : "reveal");
    });

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---- 하위분야 앵커 바 스크롤스파이 (연구수행계획) ---- */
  (function () {
    var groups = document.querySelectorAll(".sf-anchors");
    if (!groups.length || !("IntersectionObserver" in window)) return;
    Array.prototype.forEach.call(groups, function (group) {
      var links = group.querySelectorAll('a[href^="#"]');
      var sections = [];
      Array.prototype.forEach.call(links, function (a) {
        var s = document.querySelector(a.getAttribute("href"));
        if (s) sections.push(s);
      });
      if (!sections.length) return;
      function setActive(id) {
        Array.prototype.forEach.call(links, function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + id);
        });
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: "-30% 0px -60% 0px", threshold: 0 });
      sections.forEach(function (s) { io.observe(s); });
      setActive(sections[0].id);
    });
  })();

  /* ---- 상세페이지 사이드 목차(TOC) + 스크롤스파이 (하위분야까지 세밀 목차) ---- */
  (function () {
    var secs = document.querySelectorAll("section[data-toc]");
    if (!secs.length) return;
    var toc = document.createElement("nav");
    toc.className = "page-toc";
    toc.setAttribute("aria-label", "페이지 목차");
    var label = document.createElement("p");
    label.className = "toc-label";
    var curPage = document.querySelector(".menu .dropdown a.active") || document.querySelector(".menu a.active");
    label.textContent = curPage ? curPage.textContent : "목차";
    toc.appendChild(label);
    var ul = document.createElement("ul");

    function goScroll(t) {
      requestAnimationFrame(function () { t.scrollIntoView({ behavior: "smooth" }); });
    }
    function addItem(text, cls, onClick) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#";
      a.textContent = text;
      if (cls) a.className = cls;
      a.addEventListener("click", function (e) { e.preventDefault(); onClick(); });
      li.appendChild(a);
      ul.appendChild(li);
      return { li: li, a: a };
    }

    var spyTargets = [];   // 스크롤스파이 대상 (섹션 + 하위분야)
    var midItems = [];     // 세부(탭) 항목 — 활성 탭만 강조
    var subItems = [];     // 하위분야 항목 — 활성 세부만 펼침(아코디언)

    function updateExpand() {
      midItems.forEach(function (m) { m.a.classList.toggle("on", m.panel.classList.contains("active")); });
      subItems.forEach(function (si) { si.li.style.display = si.panel.classList.contains("active") ? "" : "none"; });
    }

    Array.prototype.forEach.call(secs, function (s, i) {
      if (!s.id) s.id = "sec-" + (i + 1);
      var group = s.querySelector("[data-tabs]");
      if (!group) {
        var top = addItem(s.getAttribute("data-toc"), "", function () { goScroll(s); });
        top.a.setAttribute("data-spy", s.id);
        spyTargets.push(s);
        return;
      }
      // 탭 그룹 섹션: 우산 항목 없이 세부(탭)들을 최상위 목차 항목으로 표시
      var panels = group.querySelectorAll(":scope > .tab-panel");
      Array.prototype.forEach.call(panels, function (panel) {
        var key = panel.getAttribute("data-panel");
        var btn = group.querySelector(':scope > .tabs .tab[data-tab="' + key + '"]');
        if (!btn) return;
        var midLabel = (btn.textContent.split("·")[0] || btn.textContent).trim();
        var mid = addItem(midLabel, "tabtop", function () {
          if (!panel.classList.contains("active")) btn.click();
          updateExpand();
          goScroll(s);
        });
        midItems.push({ a: mid.a, panel: panel });
        btn.addEventListener("click", function () { setTimeout(updateExpand, 0); });

        var sfs = panel.querySelectorAll(".sf-section");
        if (sfs.length < 2) return;              // 하위분야가 1개뿐이면 세부 항목만
        Array.prototype.forEach.call(sfs, function (sf, j) {
          if (!sf.id) sf.id = key + "-sf" + (j + 1);
          var head = sf.querySelector(".subpart-head");
          var badge = head && head.querySelector(".badge");
          var h3 = head && head.querySelector("h3");
          var text = (badge ? badge.textContent + " " : "") + (h3 ? h3.textContent : sf.id);
          var sub = addItem(text, "sub", function () {
            if (!panel.classList.contains("active")) btn.click();
            updateExpand();
            goScroll(sf);
          });
          sub.a.setAttribute("data-spy", sf.id);
          subItems.push({ li: sub.li, panel: panel });
          spyTargets.push(sf);
        });
      });
    });
    if (ul.children.length < 2) return;              // 항목 2개 미만이면 목차 불필요
    toc.appendChild(ul);
    document.body.appendChild(toc);
    updateExpand();

    var spyLinks = toc.querySelectorAll("a[data-spy]");
    function setActive(id) {
      Array.prototype.forEach.call(spyLinks, function (a) {
        a.classList.toggle("active", a.getAttribute("data-spy") === id);
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
      spyTargets.forEach(function (t) { io.observe(t); });
    }
    if (spyTargets.length) setActive(spyTargets[0].id);
  })();

  /* ---- 서브 내비게이션 바 (헤더 아래 가로 탭 — 대메뉴 하위 페이지) ---- */
  (function () {
    var activeTop = document.querySelector(".menu > li.is-active");
    if (!activeTop) return;                            // 홈 등 대메뉴 밖 페이지는 제외
    var topLink = activeTop.querySelector(":scope > a");
    var subLinks = activeTop.querySelectorAll(".dropdown a");
    var header = document.querySelector(".site-header");
    if (!topLink || !subLinks.length || !header) return;

    var bar = document.createElement("div");
    bar.className = "sub-nav";
    var inner = document.createElement("div");
    inner.className = "sn-inner";
    var title = document.createElement("span");
    title.className = "sn-title";
    title.textContent = topLink.textContent;
    var links = document.createElement("nav");
    links.className = "sn-links";
    links.setAttribute("aria-label", topLink.textContent + " 하위 메뉴");
    Array.prototype.forEach.call(subLinks, function (s) {
      var a = document.createElement("a");
      a.href = s.getAttribute("href");
      a.textContent = s.textContent;
      if (pageKey(a.getAttribute("href")) === currentKey) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      }
      links.appendChild(a);
    });
    inner.appendChild(title);
    inner.appendChild(links);
    bar.appendChild(inner);
    header.insertAdjacentElement("afterend", bar);
  })();

  /* ---- 스킵 링크 (키보드 사용자 본문 바로가기) ---- */
  (function () {
    var target = document.querySelector(".hero, .page-hero, section.section");
    if (!target) return;
    if (!target.id) target.id = "main-content";
    target.setAttribute("tabindex", "-1");
    var a = document.createElement("a");
    a.className = "skip-link";
    a.href = "#" + target.id;
    a.textContent = "본문 바로가기";
    a.addEventListener("click", function () {
      setTimeout(function () { target.focus({ preventScroll: true }); }, 0);
    });
    document.body.insertBefore(a, document.body.firstChild);
  })();

  /* ---- 맨 위로 버튼 ---- */
  (function () {
    var btn = document.createElement("button");
    btn.className = "back-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "맨 위로");
    btn.textContent = "↑";
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    document.body.appendChild(btn);
    var ticking = false;
    function update() {
      btn.classList.toggle("show", window.scrollY > 600);
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ---- Figma 스타일 방향성 스크롤 애니메이션 (data-reveal, 홈 전용) ---- */
  (function () {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (el) { io.observe(el); });
  })();
})();
