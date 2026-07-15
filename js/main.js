/**
 * main.js
 * Core, page-agnostic site behavior:
 *  - mobile navigation toggle
 *  - sticky mobile CTA bar visibility
 *  - scroll-reveal animation via IntersectionObserver
 *  - footer year
 *  - active nav link (aria-current)
 *
 * No dependencies. Runs on every page.
 */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     Mobile navigation toggle
  --------------------------------------------------------- */
  function initNavToggle() {
    var toggle = document.querySelector("[data-nav-toggle]");
    var nav = document.getElementById("site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });

    // Close menu when a nav link is clicked (mobile)
    nav.addEventListener("click", function (event) {
      if (event.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    // Close on Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
        document.body.style.overflow = "";
      }
    });
  }

  /* ---------------------------------------------------------
     Sticky mobile CTA bar - appears after scrolling past hero
  --------------------------------------------------------- */
  function initMobileCtaBar() {
    var bar = document.querySelector("[data-mobile-cta]");
    if (!bar) return;

    var showAfter = 480; // px scrolled before the bar appears
    var ticking = false;

    function update() {
      var scrolled = window.scrollY || document.documentElement.scrollTop;
      bar.classList.toggle("is-visible", scrolled > showAfter);
      ticking = false;
    }

    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update();
  }

  /* ---------------------------------------------------------
     Scroll-reveal animation
     Elements marked [data-reveal] fade/slide in once visible.
     Respects prefers-reduced-motion by skipping the observer
     entirely (CSS also has a static fallback).
  --------------------------------------------------------- */
  function initScrollReveal() {
    var items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    var prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-revealed");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  function initFooterYear() {
    var el = document.querySelector("[data-year]");
    if (el) {
      el.textContent = new Date().getFullYear();
    }
  }

  /* ---------------------------------------------------------
     Mark current page in nav via aria-current.
     Uses a data-page attribute on <body> compared against each
     nav link's data-page attribute, so this works identically
     regardless of hosting path, trailing slashes, or subfolders.
  --------------------------------------------------------- */
  function initActiveNav() {
    var currentPage = document.body.getAttribute("data-page");
    if (!currentPage) return;
    var links = document.querySelectorAll(".site-nav__list a[data-page]");
    links.forEach(function (link) {
      if (link.getAttribute("data-page") === currentPage) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNavToggle();
    initMobileCtaBar();
    initScrollReveal();
    initFooterYear();
    initActiveNav();
  });
})();
