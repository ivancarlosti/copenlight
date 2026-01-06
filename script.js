(function () {
  'use strict';

  // Key map
  const ENTER = 13;
  const ESCAPE = 27;

  function toggleNavigation(toggle, menu) {
    const isExpanded = menu.getAttribute("aria-expanded") === "true";
    menu.setAttribute("aria-expanded", !isExpanded);
    toggle.setAttribute("aria-expanded", !isExpanded);
  }

  function closeNavigation(toggle, menu) {
    menu.setAttribute("aria-expanded", false);
    toggle.setAttribute("aria-expanded", false);
    toggle.focus();
  }

  // Navigation

  window.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.querySelector(".header .menu-button-mobile");
    const menuList = document.querySelector("#user-nav-mobile");

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNavigation(menuButton, menuList);
    });

    menuList.addEventListener("keyup", (event) => {
      if (event.keyCode === ESCAPE) {
        event.stopPropagation();
        closeNavigation(menuButton, menuList);
      }
    });

    // Toggles expanded aria to collapsible elements
    const collapsible = document.querySelectorAll(
      ".collapsible-nav, .collapsible-sidebar"
    );

    collapsible.forEach((element) => {
      const toggle = element.querySelector(
        ".collapsible-nav-toggle, .collapsible-sidebar-toggle"
      );

      element.addEventListener("click", () => {
        toggleNavigation(toggle, element);
      });

      element.addEventListener("keyup", (event) => {
        console.log("escape");
        if (event.keyCode === ESCAPE) {
          closeNavigation(toggle, element);
        }
      });
    });

    // If multibrand search has more than 5 help centers or categories collapse the list
    const multibrandFilterLists = document.querySelectorAll(
      ".multibrand-filter-list"
    );
    multibrandFilterLists.forEach((filter) => {
      if (filter.children.length > 6) {
        // Display the show more button
        const trigger = filter.querySelector(".see-all-filters");
        trigger.setAttribute("aria-hidden", false);

        // Add event handler for click
        trigger.addEventListener("click", (event) => {
          event.stopPropagation();
          trigger.parentNode.removeChild(trigger);
          filter.classList.remove("multibrand-filter-list--collapsed");
        });
      }
    });
  });

  const isPrintableChar = (str) => {
    return str.length === 1 && str.match(/^\S$/);
  };

  function Dropdown(toggle, menu) {
    this.toggle = toggle;
    this.menu = menu;

    this.menuPlacement = {
      top: menu.classList.contains("dropdown-menu-top"),
      end: menu.classList.contains("dropdown-menu-end"),
    };

    this.toggle.addEventListener("click", this.clickHandler.bind(this));
    this.toggle.addEventListener("keydown", this.toggleKeyHandler.bind(this));
    this.menu.addEventListener("keydown", this.menuKeyHandler.bind(this));
    document.body.addEventListener("click", this.outsideClickHandler.bind(this));

    const toggleId = this.toggle.getAttribute("id") || crypto.randomUUID();
    const menuId = this.menu.getAttribute("id") || crypto.randomUUID();

    this.toggle.setAttribute("id", toggleId);
    this.menu.setAttribute("id", menuId);

    this.toggle.setAttribute("aria-controls", menuId);
    this.menu.setAttribute("aria-labelledby", toggleId);

    if (!this.toggle.hasAttribute("aria-haspopup")) {
      this.toggle.setAttribute("aria-haspopup", "true");
    }

    if (!this.toggle.hasAttribute("aria-expanded")) {
      this.toggle.setAttribute("aria-expanded", "false");
    }

    this.toggleIcon = this.toggle.querySelector(".dropdown-chevron-icon");
    if (this.toggleIcon) {
      this.toggleIcon.setAttribute("aria-hidden", "true");
    }

    this.menu.setAttribute("tabindex", -1);
    this.menuItems.forEach((menuItem) => {
      menuItem.tabIndex = -1;
    });

    this.focusedIndex = -1;
  }

  Dropdown.prototype = {
    get isExpanded() {
      return this.toggle.getAttribute("aria-expanded") === "true";
    },

    get menuItems() {
      return Array.prototype.slice.call(
        this.menu.querySelectorAll("[role='menuitem'], [role='menuitemradio']")
      );
    },

    dismiss: function () {
      if (!this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "false");
      this.menu.classList.remove("dropdown-menu-end", "dropdown-menu-top");
      this.focusedIndex = -1;
    },

    open: function () {
      if (this.isExpanded) return;

      this.toggle.setAttribute("aria-expanded", "true");
      this.handleOverflow();
    },

    handleOverflow: function () {
      var rect = this.menu.getBoundingClientRect();

      var overflow = {
        right: rect.left < 0 || rect.left + rect.width > window.innerWidth,
        bottom: rect.top < 0 || rect.top + rect.height > window.innerHeight,
      };

      if (overflow.right || this.menuPlacement.end) {
        this.menu.classList.add("dropdown-menu-end");
      }

      if (overflow.bottom || this.menuPlacement.top) {
        this.menu.classList.add("dropdown-menu-top");
      }

      if (this.menu.getBoundingClientRect().top < 0) {
        this.menu.classList.remove("dropdown-menu-top");
      }
    },

    focusByIndex: function (index) {
      if (!this.menuItems.length) return;

      this.menuItems.forEach((item, itemIndex) => {
        if (itemIndex === index) {
          item.tabIndex = 0;
          item.focus();
        } else {
          item.tabIndex = -1;
        }
      });

      this.focusedIndex = index;
    },

    focusFirstMenuItem: function () {
      this.focusByIndex(0);
    },

    focusLastMenuItem: function () {
      this.focusByIndex(this.menuItems.length - 1);
    },

    focusNextMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const nextIndex = (currentIndex + 1) % this.menuItems.length;

      this.focusByIndex(nextIndex);
    },

    focusPreviousMenuItem: function (currentItem) {
      if (!this.menuItems.length) return;

      const currentIndex = this.menuItems.indexOf(currentItem);
      const previousIndex =
        currentIndex <= 0 ? this.menuItems.length - 1 : currentIndex - 1;

      this.focusByIndex(previousIndex);
    },

    focusByChar: function (currentItem, char) {
      char = char.toLowerCase();

      const itemChars = this.menuItems.map((menuItem) =>
        menuItem.textContent.trim()[0].toLowerCase()
      );

      const startIndex =
        (this.menuItems.indexOf(currentItem) + 1) % this.menuItems.length;

      // look up starting from current index
      let index = itemChars.indexOf(char, startIndex);

      // if not found, start from start
      if (index === -1) {
        index = itemChars.indexOf(char, 0);
      }

      if (index > -1) {
        this.focusByIndex(index);
      }
    },

    outsideClickHandler: function (e) {
      if (
        this.isExpanded &&
        !this.toggle.contains(e.target) &&
        !e.composedPath().includes(this.menu)
      ) {
        this.dismiss();
        this.toggle.focus();
      }
    },

    clickHandler: function (event) {
      event.stopPropagation();
      event.preventDefault();

      if (this.isExpanded) {
        this.dismiss();
        this.toggle.focus();
      } else {
        this.open();
        this.focusFirstMenuItem();
      }
    },

    toggleKeyHandler: function (e) {
      const key = e.key;

      switch (key) {
        case "Enter":
        case " ":
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusFirstMenuItem();
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();

          this.open();
          this.focusLastMenuItem();
          break;
        }
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
      }
    },

    menuKeyHandler: function (e) {
      const key = e.key;
      const currentElement = this.menuItems[this.focusedIndex];

      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      switch (key) {
        case "Esc":
        case "Escape": {
          e.stopPropagation();
          e.preventDefault();

          this.dismiss();
          this.toggle.focus();
          break;
        }
        case "ArrowDown":
        case "Down": {
          e.stopPropagation();
          e.preventDefault();

          this.focusNextMenuItem(currentElement);
          break;
        }
        case "ArrowUp":
        case "Up": {
          e.stopPropagation();
          e.preventDefault();
          this.focusPreviousMenuItem(currentElement);
          break;
        }
        case "Home":
        case "PageUp": {
          e.stopPropagation();
          e.preventDefault();
          this.focusFirstMenuItem();
          break;
        }
        case "End":
        case "PageDown": {
          e.stopPropagation();
          e.preventDefault();
          this.focusLastMenuItem();
          break;
        }
        case "Tab": {
          if (e.shiftKey) {
            e.stopPropagation();
            e.preventDefault();
            this.dismiss();
            this.toggle.focus();
          } else {
            this.dismiss();
          }
          break;
        }
        default: {
          if (isPrintableChar(key)) {
            e.stopPropagation();
            e.preventDefault();
            this.focusByChar(currentElement, key);
          }
        }
      }
    },
  };

  // Drodowns

  window.addEventListener("DOMContentLoaded", () => {
    const dropdowns = [];
    const dropdownToggles = document.querySelectorAll(".dropdown-toggle");

    dropdownToggles.forEach((toggle) => {
      const menu = toggle.nextElementSibling;
      if (menu && menu.classList.contains("dropdown-menu")) {
        dropdowns.push(new Dropdown(toggle, menu));
      }
    });
  });

  // Share

  window.addEventListener("DOMContentLoaded", () => {
    const links = document.querySelectorAll(".share a");
    links.forEach((anchor) => {
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(anchor.href, "", "height = 500, width = 500");
      });
    });
  });

  // Vanilla JS debounce function, by Josh W. Comeau:
  // https://www.joshwcomeau.com/snippets/javascript/debounce/
  function debounce(callback, wait) {
    let timeoutId = null;
    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }

  // Define variables for search field
  let searchFormFilledClassName = "search-has-value";
  let searchFormSelector = "form[role='search']";

  // Clear the search input, and then return focus to it
  function clearSearchInput(event) {
    event.target
      .closest(searchFormSelector)
      .classList.remove(searchFormFilledClassName);

    let input;
    if (event.target.tagName === "INPUT") {
      input = event.target;
    } else if (event.target.tagName === "BUTTON") {
      input = event.target.previousElementSibling;
    } else {
      input = event.target.closest("button").previousElementSibling;
    }
    input.value = "";
    input.focus();
  }

  // Have the search input and clear button respond
  // when someone presses the escape key, per:
  // https://twitter.com/adambsilver/status/1152452833234554880
  function clearSearchInputOnKeypress(event) {
    const searchInputDeleteKeys = ["Delete", "Escape"];
    if (searchInputDeleteKeys.includes(event.key)) {
      clearSearchInput(event);
    }
  }

  // Create an HTML button that all users -- especially keyboard users --
  // can interact with, to clear the search input.
  // To learn more about this, see:
  // https://adrianroselli.com/2019/07/ignore-typesearch.html#Delete
  // https://www.scottohara.me/blog/2022/02/19/custom-clear-buttons.html
  function buildClearSearchButton(inputId) {
    const button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("aria-controls", inputId);
    button.classList.add("clear-button");
    const buttonLabel = window.searchClearButtonLabelLocalized;
    const icon = `<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' focusable='false' role='img' viewBox='0 0 12 12' aria-label='${buttonLabel}'><path stroke='currentColor' stroke-linecap='round' stroke-width='2' d='M3 9l6-6m0 6L3 3'/></svg>`;
    button.innerHTML = icon;
    button.addEventListener("click", clearSearchInput);
    button.addEventListener("keyup", clearSearchInputOnKeypress);
    return button;
  }

  // Append the clear button to the search form
  function appendClearSearchButton(input, form) {
    const searchClearButton = buildClearSearchButton(input.id);
    form.append(searchClearButton);
    if (input.value.length > 0) {
      form.classList.add(searchFormFilledClassName);
    }
  }

  // Add a class to the search form when the input has a value;
  // Remove that class from the search form when the input doesn't have a value.
  // Do this on a delay, rather than on every keystroke.
  const toggleClearSearchButtonAvailability = debounce((event) => {
    const form = event.target.closest(searchFormSelector);
    form.classList.toggle(
      searchFormFilledClassName,
      event.target.value.length > 0
    );
  }, 200);

  // Search

  window.addEventListener("DOMContentLoaded", () => {
    // Set up clear functionality for the search field
    const searchForms = [...document.querySelectorAll(searchFormSelector)];
    const searchInputs = searchForms.map((form) =>
      form.querySelector("input[type='search']")
    );
    searchInputs.forEach((input) => {
      appendClearSearchButton(input, input.closest(searchFormSelector));
      input.addEventListener("keyup", clearSearchInputOnKeypress);
      input.addEventListener("keyup", toggleClearSearchButtonAvailability);
    });
  });

  const key = "returnFocusTo";

  function saveFocus() {
    const activeElementId = document.activeElement.getAttribute("id");
    sessionStorage.setItem(key, "#" + activeElementId);
  }

  function returnFocus() {
    const returnFocusTo = sessionStorage.getItem(key);
    if (returnFocusTo) {
      sessionStorage.removeItem("returnFocusTo");
      const returnFocusToEl = document.querySelector(returnFocusTo);
      returnFocusToEl && returnFocusToEl.focus && returnFocusToEl.focus();
    }
  }

  // Forms

  window.addEventListener("DOMContentLoaded", () => {
    // In some cases we should preserve focus after page reload
    returnFocus();

    // show form controls when the textarea receives focus or back button is used and value exists
    const commentContainerTextarea = document.querySelector(
      ".comment-container textarea"
    );
    const commentContainerFormControls = document.querySelector(
      ".comment-form-controls, .comment-ccs"
    );

    if (commentContainerTextarea) {
      commentContainerTextarea.addEventListener(
        "focus",
        function focusCommentContainerTextarea() {
          commentContainerFormControls.style.display = "block";
          commentContainerTextarea.removeEventListener(
            "focus",
            focusCommentContainerTextarea
          );
        }
      );

      if (commentContainerTextarea.value !== "") {
        commentContainerFormControls.style.display = "block";
      }
    }

    // Expand Request comment form when Add to conversation is clicked
    const showRequestCommentContainerTrigger = document.querySelector(
      ".request-container .comment-container .comment-show-container"
    );
    const requestCommentFields = document.querySelectorAll(
      ".request-container .comment-container .comment-fields"
    );
    const requestCommentSubmit = document.querySelector(
      ".request-container .comment-container .request-submit-comment"
    );

    if (showRequestCommentContainerTrigger) {
      showRequestCommentContainerTrigger.addEventListener("click", () => {
        showRequestCommentContainerTrigger.style.display = "none";
        Array.prototype.forEach.call(requestCommentFields, (element) => {
          element.style.display = "block";
        });
        requestCommentSubmit.style.display = "inline-block";

        if (commentContainerTextarea) {
          commentContainerTextarea.focus();
        }
      });
    }

    // Mark as solved button
    const requestMarkAsSolvedButton = document.querySelector(
      ".request-container .mark-as-solved:not([data-disabled])"
    );
    const requestMarkAsSolvedCheckbox = document.querySelector(
      ".request-container .comment-container input[type=checkbox]"
    );
    const requestCommentSubmitButton = document.querySelector(
      ".request-container .comment-container input[type=submit]"
    );

    if (requestMarkAsSolvedButton) {
      requestMarkAsSolvedButton.addEventListener("click", () => {
        requestMarkAsSolvedCheckbox.setAttribute("checked", true);
        requestCommentSubmitButton.disabled = true;
        requestMarkAsSolvedButton.setAttribute("data-disabled", true);
        requestMarkAsSolvedButton.form.submit();
      });
    }

    // Change Mark as solved text according to whether comment is filled
    const requestCommentTextarea = document.querySelector(
      ".request-container .comment-container textarea"
    );

    const usesWysiwyg =
      requestCommentTextarea &&
      requestCommentTextarea.dataset.helper === "wysiwyg";

    function isEmptyPlaintext(s) {
      return s.trim() === "";
    }

    function isEmptyHtml(xml) {
      const doc = new DOMParser().parseFromString(`<_>${xml}</_>`, "text/xml");
      const img = doc.querySelector("img");
      return img === null && isEmptyPlaintext(doc.children[0].textContent);
    }

    const isEmpty = usesWysiwyg ? isEmptyHtml : isEmptyPlaintext;

    if (requestCommentTextarea) {
      requestCommentTextarea.addEventListener("input", () => {
        if (isEmpty(requestCommentTextarea.value)) {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute("data-solve-translation");
          }
        } else {
          if (requestMarkAsSolvedButton) {
            requestMarkAsSolvedButton.innerText =
              requestMarkAsSolvedButton.getAttribute(
                "data-solve-and-submit-translation"
              );
          }
        }
      });
    }

    const selects = document.querySelectorAll(
      "#request-status-select, #request-organization-select"
    );

    selects.forEach((element) => {
      element.addEventListener("change", (event) => {
        event.stopPropagation();
        saveFocus();
        element.form.submit();
      });
    });

    // Submit requests filter form on search in the request list page
    const quickSearch = document.querySelector("#quick-search");
    if (quickSearch) {
      quickSearch.addEventListener("keyup", (event) => {
        if (event.keyCode === ENTER) {
          event.stopPropagation();
          saveFocus();
          quickSearch.form.submit();
        }
      });
    }

    // Submit organization form in the request page
    const requestOrganisationSelect = document.querySelector(
      "#request-organization select"
    );

    if (requestOrganisationSelect) {
      requestOrganisationSelect.addEventListener("change", () => {
        requestOrganisationSelect.form.submit();
      });

      requestOrganisationSelect.addEventListener("click", (e) => {
        // Prevents Ticket details collapsible-sidebar to close on mobile
        e.stopPropagation();
      });
    }

    // If there are any error notifications below an input field, focus that field
    const notificationElm = document.querySelector(".notification-error");
    if (
      notificationElm &&
      notificationElm.previousElementSibling &&
      typeof notificationElm.previousElementSibling.focus === "function"
    ) {
      notificationElm.previousElementSibling.focus();
    }
  });

})();

/* ### BEGIN part to custom JS from template ### */
document.addEventListener("DOMContentLoaded", function() {
  document.querySelectorAll('pre').forEach(function(pre) {
    // Evita duplicar o botão copiar
    if (pre.querySelector('.copy-btn')) return;

    pre.style.position = 'relative'; // importante para posicionamento absoluto do botão

    // Criar botão copiar com ícone SVG
    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.type = 'button';
    copyBtn.setAttribute('aria-label', 'Copiar código');

    // Ícone clipboard SVG inline
    copyBtn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
      </svg>
    `;

    copyBtn.addEventListener('click', function() {
      const codeElement = pre.querySelector('code');
      let textToCopy = '';

      if (codeElement) {
        textToCopy = codeElement.innerText;
      } else {
        // Copiar apenas texto puro do <pre> ignorando o botão
        textToCopy = Array.from(pre.childNodes)
          .filter(node => node.nodeType === Node.TEXT_NODE)
          .map(node => node.textContent)
          .join('');
      }

      navigator.clipboard.writeText(textToCopy).then(() => {
        // Feedback visual simples
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" >
            <path fill="green" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
            </svg>
          `;
        }, 1500);
      }).catch(() => {
        // Se erro, exibe ícone de erro (vermelho)
        copyBtn.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" >
            <path fill="red" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.29 13.29-1.41 1.41L12 13.41l-2.88 2.88-1.41-1.41L10.59 12 7.71 9.12l1.41-1.41L12 10.59l2.88-2.88 1.41 1.41L13.41 12l2.88 2.88z"/>
          </svg>`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
            </svg>`;
        }, 1500);
      });
    });

    pre.appendChild(copyBtn);
  });
});

/* ===== Dynamic Form Injection Logic ===== */
document.addEventListener("DOMContentLoaded", function() {
  console.log("[DynamicForm] Script loaded and DOMContentLoaded fired.");
  // CONFIGURATION START
  // Map Form IDs to their specific configuration
  const FORMS_CONFIG = {
    "10380383729805": { // Example Form ID
      type: "sharepoint",
      webhookUrl: "https://workflow.ivancarlos.com.br/webhook/6339afb8-45c7-46f0-a857-41dc110cca73", // Replace with actual n8n webhook
      targetFieldId: "request_custom_fields_42426725381261",   // Replace with actual field ID
      label: "Select SharePoint Site"
    },
    // Add more forms here
    // "123456789": { ... }
  };
  // CONFIGURATION END

  // Core logic to inject the form
  async function injectDynamicForm(formId, anchorElement) {
    console.log(`[DynamicForm] injectDynamicForm called for Form ID: ${formId}`);
    if (!formId) return;

    // Avoid duplicate injection
    if (document.querySelector(".dynamic-form-container")) {
        console.log("[DynamicForm] Container already exists. Skipping.");
        return;
    }

    const config = FORMS_CONFIG[formId];
    if (!config) {
        console.log(`[DynamicForm] No config found for Form ID: ${formId}`);
        return;
    }

    // Create container
    const container = document.createElement("div");
    container.className = "dynamic-form-container";
    
    const label = document.createElement("label");
    label.innerText = config.label || "Select Resource";
    container.appendChild(label);

    // Loader
    const loader = document.createElement("div");
    loader.className = "dynamic-form-loader";
    container.appendChild(loader);

    // Inject container
    if (anchorElement && anchorElement.parentNode) {
         anchorElement.parentNode.insertBefore(container, anchorElement.nextSibling);
    } else {
        // Fallback injection logic
        const mainForm = document.querySelector("form.request-form") || 
                         document.querySelector(".request-form") || 
                         document.getElementById("new_request") || 
                         document.getElementById("new-request-form") ||
                         document.querySelector("form[action*='/requests']");
                         
        if (mainForm) {
            console.log("[DynamicForm] Injecting into main form container (top).");
            const subjectField = mainForm.querySelector(".request_subject");
            if (subjectField) {
                 mainForm.insertBefore(container, subjectField);
            } else {
                 mainForm.insertBefore(container, mainForm.firstChild);
            }
        } else {
             console.warn("[DynamicForm] Could not find a place to inject the container.");
             return; 
        }
    }

    // Helper to get User Organization ID
    async function getUserOrganizationId() {
        // 1. Try to get from the UI Dropdown (most accurate as it is what the user Selected)
        const orgSelect = document.querySelector("select.request_organization_id") || 
                          document.querySelector("select#request_organization_id") ||
                          document.querySelector(".request_organization select"); 

        if (orgSelect && orgSelect.value) {
             console.log(`[DynamicForm] Found Org ID from dropdown: ${orgSelect.value}`);
             return orgSelect.value;
        }

        // 2. Fallback to HelpCenter user object
        // NOTE: Sometimes Zendesk themes don't populate 'id' in HelpCenter.user.organizations for end-users
        if (window.HelpCenter && window.HelpCenter.user && window.HelpCenter.user.organizations) {
            if (window.HelpCenter.user.organizations.length > 0) {
                 const firstOrg = window.HelpCenter.user.organizations[0];
                 console.log("[DynamicForm] Checking HelpCenter org:", firstOrg);
                 
                 // Prefer ID if available
                 if (firstOrg.id) {
                     return firstOrg.id;
                 } 
                     // Fallback to Name if ID is missing (User Request)
                 else if (firstOrg.name) {
                     console.log(`[DynamicForm] Org ID missing in HelpCenter object. Will attempt API fetch.`);
                     // Do NOT return name here; let it fall through to API
                 }
                 else {
                     console.warn("[DynamicForm] HelpCenter org found but missing 'id' and 'name' properties.");
                 }
            } else {
                 console.log("[DynamicForm] HelpCenter.user.organizations is empty.");
            }
        }
        
        // 3. API Fallback (Last Resort)
        // Note: Can fail with 400/403 depending on permissions
        try {
            console.log("[DynamicForm] Fetching Organization via API fallback...");
            const response = await fetch('/api/v2/users/me/organizations.json');
            if (response.ok) {
                const data = await response.json();
                if (data.organizations && data.organizations.length > 0) {
                    console.log(`[DynamicForm] API returned Org ID: ${data.organizations[0].id}`);
                    return data.organizations[0].id;
                }
            } else {
                console.warn(`[DynamicForm] API Fallback failed with status: ${response.status}`);
            }
        } catch (e) {
            console.error("[DynamicForm] API fetch failed:", e);
        }

        console.warn("[DynamicForm] Could not determine User Organization ID.");
        return "undefined";
    }

    let userOrgId = await getUserOrganizationId();

    console.log(`[DynamicForm] Fetching for Form: ${formId}, Org: ${userOrgId}`);

    // Fetch Data
    // Ensure we encode the component in case it's a name with spaces
    const finalUrl = config.webhookUrl + "?orgId=" + encodeURIComponent(userOrgId);
    console.log("[DynamicForm] Calling Webhook URL:", finalUrl);

    fetch(finalUrl)
      .then(async response => {
        if (!response.ok) throw new Error("Network response was not ok");
        const text = await response.text();
        console.log("[DynamicForm] Response Text:", text); // Debugging empty response
        return text ? JSON.parse(text) : {};
      })
      .catch(err => {
        console.warn("[DynamicForm] Webhook failed, using mock data for demo", err);
        return [
            { name: "Global Marketing Sharepoint", value: "https://sharepoint.com/marketing" },
            { name: "IT Secure Drop", value: "https://sharepoint.com/it-secure" },
            { name: "HR Archive", value: "https://sharepoint.com/hr-archive" }
        ];
      })
      .then(responseData => {
        loader.remove();
        console.log("[DynamicForm] Raw response from n8n:", responseData);
        
        let options = [];
        if (Array.isArray(responseData)) {
            console.log("[DynamicForm] Response is an Array. Length:", responseData.length);
            options = responseData;
        } else if (responseData && Array.isArray(responseData.data)) {
             console.log("[DynamicForm] Response has .data Array. Length:", responseData.data.length);
             options = responseData.data;
        } else if (responseData && Array.isArray(responseData.results)) {
             console.log("[DynamicForm] Response has .results Array. Length:", responseData.results.length);
             options = responseData.results;
        } else if (responseData && responseData.message === 'Workflow was started') {
             console.error("[DynamicForm] n8n Workflow returned 'started' instead of data. Check webhook settings.");
             const error = document.createElement("div");
             error.className = "dynamic-form-error";
             error.innerText = "Configuration Error: Webhook response mode must be 'Last Node' (Sync).";
             error.style.color = "red";
             container.appendChild(error);
             return;
        } else {
            console.error("[DynamicForm] Unexpected API response format:", responseData);
            const error = document.createElement("div");
            error.className = "dynamic-form-error";
            error.innerText = "Error: Invalid data format from server.";
            error.style.color = "red";
            container.appendChild(error);
            return;
        }
        
        const select = document.createElement("select");
        select.innerHTML = `<option value="">- Select Option -</option>`;
        
        options.forEach(item => {
            const option = document.createElement("option");
            // Mapping for generic usage + user specific n8n response
            // Priority: item.value -> item.common_ids -> item.id
            const val = item.value || item.common_ids || item.id;
            // Priority: item.name -> item.label -> item.common_ids -> item.id
            const label = item.name || item.label || item.common_ids || item.id;

            if (val) {
                option.value = val;
                option.innerText = label; 
                select.appendChild(option);
            }
        });

        select.addEventListener("change", function() {
            const targetField = document.getElementById(config.targetFieldId);
            if (targetField) {
                targetField.value = this.value;
                targetField.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                console.warn(`[DynamicForm] Target field #${config.targetFieldId} not found!`);
            }
        });

        container.appendChild(select);
      })
      .catch(err => {
        if (loader.parentNode) loader.remove();
        const error = document.createElement("div");
        error.className = "dynamic-form-error";
        error.innerText = "Error loading options.";
        container.appendChild(error);
        console.error("[DynamicForm] Error:", err);
      });
  }

  // Function to find the form element and init
  function checkAndInit() {
    let formId = null;
    let anchorElement = null;

    const formSelect = document.querySelector(".request_ticket_form_id") || document.getElementById("request_issue_type_select");
    console.log("[DynamicForm] checkAndInit running. Form Select found:", formSelect ? "Yes" : "No", formSelect);
    
    if (formSelect) {
        formId = formSelect.value;
        anchorElement = formSelect;
    } else {
        // Fallback: Check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        formId = urlParams.get('ticket_form_id');
        console.log(`[DynamicForm] Fallback check. URL 'ticket_form_id': ${formId}`);
    }

    if (formId) {
        // If we found an ID, try to inject. 
        // Note: anchorElement might be null if we got ID from URL. 
        // injectDynamicForm handles null anchorElement by prepending to form.
        injectDynamicForm(formId, anchorElement);

        // Attach listener if we have a select element (Ticket Form)
        if (formSelect && !formSelect.dataset.dynamicFormListenerAttached) {
            formSelect.addEventListener("change", function() {
                // Clear existing on change
                const existing = document.querySelector(".dynamic-form-container");
                if (existing) existing.remove();
                
                injectDynamicForm(this.value, this);
            });
            formSelect.dataset.dynamicFormListenerAttached = "true";
        }

        // Attach listener to Organization Select if it exists
        const orgSelect = document.querySelector("select.request_organization_id") || 
                          document.querySelector("select#request_organization_id") ||
                          document.querySelector(".request_organization select");
                          
        if (orgSelect && !orgSelect.dataset.dynamicFormOrgListenerAttached) {
             console.log("[DynamicForm] Attaching change listener to Organization Select.");
             orgSelect.addEventListener("change", function() {
                 console.log("[DynamicForm] Organization changed. Re-fetching.");
                 // Clear existing to force re-fetch with new Org ID
                 const existing = document.querySelector(".dynamic-form-container");
                 if (existing) existing.remove();

                 // Re-inject (using current form ID)
                 const currentFormId = formSelect ? formSelect.value : (new URLSearchParams(window.location.search).get('ticket_form_id'));
                 if (currentFormId) {
                     injectDynamicForm(currentFormId, formSelect || null);
                 }
             });
             orgSelect.dataset.dynamicFormOrgListenerAttached = "true";
        }
    }
  }

  // Initial Check
  checkAndInit();

  // MutationObserver to watch for form injection (Zendesk often interacts via JS)
  const observerTarget = document.getElementById("new-request-form") || document.body;
  
  const observer = new MutationObserver((mutations) => {
    // Debounce or check efficiently
    for (const mutation of mutations) {
        if (mutation.type === 'childList') {
           // If the form select references appear
           // If the form select references appear OR if the main form appears (re-hydration)
           const formDetected = document.querySelector(".request_ticket_form_id") || 
                                document.getElementById("request_issue_type_select") || 
                                document.querySelector("form.request-form") || 
                                document.getElementById("new_request");
           
           if (formDetected) {
               console.log("[DynamicForm] MutationObserver detected form activity.");
               checkAndInit();
           }
        }
    }
  });

  observer.observe(observerTarget, { childList: true, subtree: true });
});

/* ===== Footer Version Injection ===== */
document.addEventListener("DOMContentLoaded", function() {
    // Current Version: 22.0.33
    const footerInner = document.querySelector(".footer-inner");
    const langSelector = document.querySelector(".footer-language-selector");
    
    if (footerInner && !document.querySelector(".footer-version-text")) {
        const versionDiv = document.createElement("div");
        versionDiv.className = "footer-version-text";
        // Flex: 1 to push content, text-align center to center the text itself
        versionDiv.style.cssText = "flex: 1; font-size: 0.75rem; color: #aaa; text-align: center; margin-top: 10px;";
        versionDiv.innerText = "v22.0.33";
        
        if (langSelector) {
            footerInner.insertBefore(versionDiv, langSelector);
        } else {
            footerInner.appendChild(versionDiv);
        }
    }
});

/* ### END part to custom JS from template ### */
