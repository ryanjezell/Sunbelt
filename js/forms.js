/**
 * forms.js
 * Handles every <form data-async-form> on the site (valuation form,
 * contact form, whitepaper download forms).
 *
 * Progressive enhancement:
 *  - Without JS, forms still work: they POST to the Formspree "action"
 *    URL and Formspree redirects the visitor to the page named in the
 *    hidden "_next" field (thanks.html).
 *  - With JS, submission happens via fetch() so the visitor never
 *    leaves the page; an inline success or error message is shown.
 *
 * Requires no build step and no external libraries.
 */

(function () {
  "use strict";

  function setFieldError(field, message) {
    field.classList.add("has-error");
    var errorEl = field.querySelector(".field-error");
    if (errorEl) errorEl.textContent = message;
  }

  function clearFieldError(field) {
    field.classList.remove("has-error");
  }

  function validateForm(form) {
    var valid = true;
    var fields = form.querySelectorAll("[data-field]");

    fields.forEach(function (field) {
      var input = field.querySelector("input, textarea, select");
      if (!input) return;
      clearFieldError(field);

      if (input.hasAttribute("required") && !input.value.trim()) {
        setFieldError(field, "This field is required.");
        valid = false;
        return;
      }

      if (input.type === "email" && input.value.trim()) {
        var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(input.value.trim())) {
          setFieldError(field, "Enter a valid email address.");
          valid = false;
        }
      }

      if (input.type === "tel" && input.value.trim()) {
        var digits = input.value.replace(/\D/g, "");
        if (digits.length < 7) {
          setFieldError(field, "Enter a valid phone number.");
          valid = false;
        }
      }
    });

    return valid;
  }

  function showStatus(form, type, message) {
    var statusEl = form.querySelector("[data-form-status]");
    if (!statusEl) return;
    statusEl.className = "form-status is-visible form-status--" + type;
    var textEl = statusEl.querySelector("[data-status-text]");
    if (textEl) textEl.textContent = message;
    statusEl.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function setSubmittingState(button, isSubmitting) {
    if (!button) return;
    button.disabled = isSubmitting;
    var label = button.querySelector("[data-btn-label]");
    var spinner = button.querySelector(".spinner");
    if (isSubmitting) {
      if (label) label.dataset.originalText = label.textContent;
      if (label) label.textContent = "Sending\u2026";
      if (spinner) spinner.style.display = "inline-block";
    } else {
      if (label && label.dataset.originalText) {
        label.textContent = label.dataset.originalText;
      }
      if (spinner) spinner.style.display = "none";
    }
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("[data-async-form]")) return;

    // Honeypot: if filled, silently pretend success (bot trap)
    var honeypot = form.querySelector('input[name="_gotcha"]');
    if (honeypot && honeypot.value) {
      event.preventDefault();
      form.reset();
      showStatus(form, "success", "Thanks! We'll be in touch shortly.");
      return;
    }

    if (!validateForm(form)) {
      event.preventDefault();
      var firstError = form.querySelector(".has-error input, .has-error textarea");
      if (firstError) firstError.focus();
      return;
    }

    // Only intercept with fetch if the action points to a real endpoint.
    var action = form.getAttribute("https://formspree.io/f/meeyodpe") || "";
    if (action.indexOf("YOUR_FORM_ID") !== -1) {
      // Placeholder Formspree ID hasn't been configured yet -
      // let the normal HTML submission happen (it will simply fail
      // gracefully or can be replaced before launch). We still stop
      // here to warn the site owner during local testing.
      console.warn(
        "forms.js: replace YOUR_FORM_ID in " +
          form.id +
          " with a real Formspree endpoint before launch."
      );
    }

    event.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    setSubmittingState(submitBtn, true);

    var formData = new FormData(form);

    fetch(action, {
      method: "POST",
      body: formData,
      headers: { Accept: "application/json" },
    })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          form.hidden = true;
          showStatus(
            form,
            "success",
            form.dataset.successMessage ||
              "Thanks \u2014 your message is on its way. We'll respond within one business day."
          );
          form.hidden = false;
          // Hide the fields but keep the status message visible:
          Array.prototype.forEach.call(form.elements, function (el) {
            if (!el.closest("[data-form-status]")) {
              el.style.display = "none";
            }
          });
        } else {
          return response.json().then(function (data) {
            var message =
              data && data.errors
                ? data.errors.map(function (e) { return e.message; }).join(", ")
                : "Something went wrong. Please try again or call us directly.";
            showStatus(form, "error", message);
          });
        }
      })
      .catch(function () {
        showStatus(
          form,
          "error",
          "We couldn't send that. Please check your connection and try again, or call us directly."
        );
      })
      .finally(function () {
        setSubmittingState(submitBtn, false);
      });
  }

  /* ---------------------------------------------------------
     Whitepaper email-gate modal (Resources page)
  --------------------------------------------------------- */
  function initWhitepaperModal() {
    var triggers = document.querySelectorAll("[data-open-modal]");
    var overlay = document.getElementById("whitepaper-modal");
    if (!triggers.length || !overlay) return;

    var modal = overlay.querySelector(".modal");
    var closeBtn = overlay.querySelector("[data-close-modal]");
    var titleField = overlay.querySelector("[data-modal-title]");
    var hiddenTitleInput = overlay.querySelector('input[name="whitepaper"]');
    var lastFocused = null;

    function openModal(title) {
      lastFocused = document.activeElement;
      if (titleField) titleField.textContent = title;
      if (hiddenTitleInput) hiddenTitleInput.value = title;
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      var firstInput = modal.querySelector("input");
      if (firstInput) firstInput.focus();
    }

    function closeModal() {
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        openModal(trigger.dataset.openModal);
      });
    });

    closeBtn.addEventListener("click", closeModal);

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closeModal();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        closeModal();
      }
    });

    // Basic focus trap
    modal.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var focusable = modal.querySelectorAll(
        'input, textarea, button, a[href]'
      );
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-async-form]").forEach(function (form) {
      form.addEventListener("submit", handleSubmit);
    });
    initWhitepaperModal();
  });
})();
