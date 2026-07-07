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
  if (menu) {
    var path = (location.pathname.split("/").pop() || "index.html");
    if (path === "") path = "index.html";
    menu.querySelectorAll("a[href]").forEach(function (a) {
      var href = (a.getAttribute("href") || "").split("/").pop().split("#")[0];
      if (href && href === path) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
        var topLi = a.closest(".menu > li");
        if (topLi) topLi.classList.add("is-active");
      }
    });
  }

  /* ---- 탭 ---- */
  document.querySelectorAll("[data-tabs]").forEach(function (group) {
    var tabs = group.querySelectorAll(".tab");
    var panels = group.querySelectorAll(".tab-panel");
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

  /* ---- 이미지 확대(라이트박스) 기능 비활성화 ----
     사이트 내 모든 이미지는 클릭해도 아무 반응이 없도록 처리합니다. */

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

  /* ---- 상세페이지 사이드 목차(TOC) + 스크롤스파이 ---- */
  (function () {
    var secs = document.querySelectorAll("section[data-toc]");
    if (secs.length < 2) return;                       // 섹션 2개 미만이면 목차 불필요
    var toc = document.createElement("nav");
    toc.className = "page-toc";
    toc.setAttribute("aria-label", "페이지 목차");
    var ul = document.createElement("ul");
    Array.prototype.forEach.call(secs, function (s, i) {
      if (!s.id) s.id = "sec-" + (i + 1);
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = "#" + s.id;
      a.textContent = s.getAttribute("data-toc");
      li.appendChild(a);
      ul.appendChild(li);
    });
    toc.appendChild(ul);
    document.body.appendChild(toc);

    var links = toc.querySelectorAll("a");
    function setActive(id) {
      Array.prototype.forEach.call(links, function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
      Array.prototype.forEach.call(secs, function (s) { io.observe(s); });
    }
    setActive(secs[0].id);
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
