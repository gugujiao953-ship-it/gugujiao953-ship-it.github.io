/* ============================================
   纸 · 墨 · 朱 — 交互层
   Lenis 丝滑滚动 + GSAP 动效，无库自动降级
   ============================================ */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");

  var params = new URLSearchParams(window.location.search);
  var forceStatic = params.has("static"); // 静态模式：全部内容直接呈现（预览/调试/降级验证用）
  if (forceStatic) doc.style.scrollBehavior = "auto";

  var reduced =
    forceStatic ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined";
  var hasST = hasGsap && typeof window.ScrollTrigger !== "undefined";
  var hasLenis = typeof window.Lenis !== "undefined";
  var fine = window.matchMedia("(pointer: fine)").matches;

  if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);

  /* ---------- Lenis 平滑滚动 ---------- */
  var lenis = null;
  if (hasLenis && !reduced) {
    lenis = new window.Lenis({
      duration: 1.15,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true
    });
    if (hasGsap) {
      window.gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      window.gsap.ticker.lagSmoothing(0);
      if (hasST) lenis.on("scroll", window.ScrollTrigger.update);
    } else {
      var rafLoop = function (time) {
        lenis.raf(time);
        requestAnimationFrame(rafLoop);
      };
      requestAnimationFrame(rafLoop);
    }
    window.__lenis = lenis;
  }

  /* ---------- 锚点滚动 ---------- */
  function scrollToTarget(hash) {
    var el = document.querySelector(hash);
    if (!el) return;
    if (lenis) {
      lenis.scrollTo(el, { offset: -70 });
    } else {
      var top = el.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
    }
  }
  document.querySelectorAll("[data-scroll]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var href = a.getAttribute("href");
      if (href && href.charAt(0) === "#") {
        e.preventDefault();
        scrollToTarget(href === "#top" ? "body" : href);
      }
    });
  });

  /* ---------- 导航状态 + 返回顶部 ---------- */
  var nav = document.querySelector(".site-nav");
  var backTop = document.querySelector(".back-top");
  var progressBar = document.querySelector(".scroll-progress span");

  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("scrolled", y > 24);
    if (backTop) backTop.classList.toggle("show", y > 600);
    if (progressBar) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progressBar.style.transform = "scaleX(" + (h > 0 ? y / h : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backTop) {
    backTop.addEventListener("click", function () {
      if (lenis) lenis.scrollTo(0);
      else window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    });
  }

  /* ---------- Scrollspy ---------- */
  var spyLinks = Array.prototype.slice.call(
    document.querySelectorAll('.nav-links a[href^="#"]')
  );
  var spyMap = {};
  spyLinks.forEach(function (a) {
    spyMap[a.getAttribute("href").slice(1)] = a;
  });
  var spySections = Object.keys(spyMap)
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);
  if ("IntersectionObserver" in window && spySections.length) {
    var spyIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            spyLinks.forEach(function (l) {
              l.classList.remove("active");
            });
            var link = spyMap[en.target.id];
            if (link) link.classList.add("active");
          }
        });
      },
      { rootMargin: "-30% 0px -55% 0px" }
    );
    spySections.forEach(function (s) {
      spyIO.observe(s);
    });
  }

  /* ---------- 技能卡鼠标晕墨坐标 ---------- */
  if (fine && !reduced) {
    document.querySelectorAll(".skill-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
      });
    });
  }

  /* ---------- Count-up ---------- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (isNaN(target)) return;
    if (reduced) {
      el.textContent = target;
      return;
    }
    var start = null;
    var dur = 1600;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(2, -10 * p); // easeOutExpo
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target;
    }
    requestAnimationFrame(step);
  }

  /* ---------- 降级：IntersectionObserver reveal ---------- */
  function fallbackReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (forceStatic || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("in");
      });
      document.querySelectorAll("[data-count]").forEach(countUp);
      document.querySelectorAll(".skill-card").forEach(function (c) {
        c.classList.add("filled");
      });
      document.querySelectorAll(".t-item").forEach(function (t) {
        t.classList.add("lit");
      });
      document.querySelectorAll("[data-hero-line]").forEach(function (el) {
        el.style.transform = "none";
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          if (en.target.classList.contains("stat") || en.target.querySelector("[data-count]")) {
            en.target.querySelectorAll("[data-count]").forEach(countUp);
          }
          if (en.target.classList.contains("skill-card")) {
            en.target.classList.add("filled");
          }
          if (en.target.classList.contains("t-item")) {
            en.target.classList.add("lit");
          }
          io.unobserve(en.target);
        });
      },
      { threshold: 0.12 }
    );
    items.forEach(function (el) {
      io.observe(el);
    });
    // Hero 标题行
    document.querySelectorAll("[data-hero-line]").forEach(function (el) {
      el.style.transition = "transform 1.1s cubic-bezier(0.22,1,0.36,1)";
      requestAnimationFrame(function () {
        el.style.transform = "translateY(0)";
      });
    });
  }

  /* ---------- GSAP 动效（渐进增强） ---------- */
  if (hasST && !reduced) {
    var gsap = window.gsap;
    var ST = window.ScrollTrigger;

    // Hero 逐行进场
    gsap.to("[data-hero-line]", {
      y: 0,
      duration: 1.2,
      ease: "power4.out",
      stagger: 0.14,
      delay: 0.25
    });
    gsap.fromTo(
      ".hero [data-reveal]",
      { opacity: 0, y: 28 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.6, overwrite: "auto" }
    );
    gsap.fromTo(
      ".mountains .mountain",
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 1.6, ease: "power2.out", stagger: 0.15, delay: 0.3 }
    );

    // 远山视差
    gsap.to(".mountain.far", {
      yPercent: 18,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".mountain.mid", {
      yPercent: 32,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".mountain.near", {
      yPercent: 48,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });

    // 印章盖落
    gsap.from(".manifesto-seal", {
      scale: 1.8,
      opacity: 0,
      rotation: 8,
      duration: 0.7,
      ease: "power4.in",
      scrollTrigger: { trigger: ".manifesto", start: "top 65%" }
    });

    // 区块 reveal（Hero 之外的）
    document.querySelectorAll("main [data-reveal], .site-footer [data-reveal]").forEach(function (el) {
      gsap.fromTo(
        el,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        }
      );
    });

    // 时间线金线生长
    gsap.to(".timeline-rail", {
      "--rail-progress": 1,
      ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: true }
    });
    document.querySelectorAll(".t-item").forEach(function (item) {
      ST.create({
        trigger: item,
        start: "top 72%",
        onEnter: function () {
          item.classList.add("lit");
        }
      });
    });

    // count-up
    document.querySelectorAll("[data-count]").forEach(function (el) {
      ST.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          countUp(el);
        }
      });
    });

    // 技能条
    document.querySelectorAll(".skill-card").forEach(function (card) {
      ST.create({
        trigger: card,
        start: "top 82%",
        once: true,
        onEnter: function () {
          card.classList.add("filled");
        }
      });
    });

    // 页脚大字视差
    gsap.from(".footer-big", {
      yPercent: 40,
      opacity: 0,
      ease: "power2.out",
      duration: 1.1,
      scrollTrigger: { trigger: ".site-footer", start: "top 85%" }
    });
  } else {
    fallbackReveal();
  }
})();
