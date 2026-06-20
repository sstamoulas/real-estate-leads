document.documentElement.classList.add("js");

const defaultConfig = {
  businessName: "Georgia Stavrou Rentals",
  ownerName: "Georgia Stavrou",
  brokerageName: "Coldwell Banker",
  market: "Baltimore City, Baltimore County, Harford County, Cecil County, and Howard County",
  contactEmail: "georgia07.realtor@gmail.com",
  contactPhone: "(410) 555-0148",
  websiteLabel: "georgiastavrourentals.com",
  websiteUrl: "https://georgiastavrourentals.com",
  leadEndpoint: "",
  calendarUrl: "",
  listings: [
    {
      title: "Maple Street Residence",
      price: "$2,250 / mo",
      beds: "2 bd",
      baths: "2 ba",
      area: "Northside",
      status: "Available now",
      description:
        "Updated two-bedroom home with in-unit laundry, driveway parking, and a clean layout for quick lease-up.",
      tags: ["Pet-friendly", "Parking", "In-unit laundry"],
    },
    {
      title: "Parkside Duplex",
      price: "$2,450 / mo",
      beds: "3 bd",
      baths: "1.5 ba",
      area: "Park District",
      status: "Tours this week",
      description:
        "Bright duplex near transit and neighborhood retail, ideal for renters who want a move-in ready space.",
      tags: ["Near transit", "Updated kitchen", "Private entry"],
    },
    {
      title: "Downtown Loft",
      price: "$1,850 / mo",
      beds: "Studio",
      baths: "1 ba",
      area: "Central",
      status: "Coming soon",
      description:
        "Loft-style unit with tall ceilings, flexible lease terms, and strong appeal for young professionals.",
      tags: ["Loft layout", "Walkable", "Flexible lease"],
    },
  ],
  showingSlots: [
    { dayOffset: 1, time: "16:30", label: "Tomorrow at 4:30 PM" },
    { dayOffset: 2, time: "11:00", label: "In two days at 11:00 AM" },
    { dayOffset: 4, time: "18:00", label: "Later this week at 6:00 PM" },
    { dayOffset: 6, time: "10:00", label: "Weekend at 10:00 AM" },
  ],
};

const rawConfig = window.RENTAL_SITE_CONFIG || {};
const config = {
  ...defaultConfig,
  ...rawConfig,
  listings:
    Array.isArray(rawConfig.listings) && rawConfig.listings.length
      ? rawConfig.listings
      : defaultConfig.listings,
  showingSlots:
    Array.isArray(rawConfig.showingSlots) && rawConfig.showingSlots.length
      ? rawConfig.showingSlots
      : defaultConfig.showingSlots,
};

document.title = `${config.businessName} | ${config.brokerageName} Rental Leads`;
const defaultLeadEndpoint = "/.netlify/functions/send-lead";
const leadEndpoint = config.leadEndpoint || defaultLeadEndpoint;

const revealTargets = document.querySelectorAll("[data-reveal]");
const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const form = document.querySelector("#rentalLeadForm");
const formStatus = document.querySelector("#form-status");
const submitButton = form?.querySelector('button[type="submit"]') ?? null;
const calendarLinks = document.querySelectorAll("[data-calendar-link]");

let revealObserver = null;

function bindText(selector, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.textContent = value;
  });
}

function bindContactLink(selector, href, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute("href", href);
    node.textContent = value;
  });
}

function bindWebsiteLink(selector, href, value) {
  document.querySelectorAll(selector).forEach((node) => {
    node.setAttribute("href", href);
    node.textContent = value;
  });
}

function sanitizeValue(value) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function toLocalDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromOffset(dayOffset) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  return date;
}

function formatDateLabel(dayOffset) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dateFromOffset(dayOffset));
}

function formatDateForBody(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = dateValue.split("-").map((part) => Number(part));
  if (!year || !month || !day) return dateValue;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function formatTimeForBody(timeValue) {
  if (!timeValue) return "";
  const [hours, minutes] = timeValue.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeValue;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function setFormStatus(message, color = "#7eb89d") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.style.color = color;
}

function scrollToForm() {
  if (!form) return;
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applyRevealObservation(container = document) {
  if (!revealObserver) {
    container.querySelectorAll("[data-reveal]").forEach((node) => {
      node.classList.add("is-visible");
    });
    return;
  }

  container.querySelectorAll("[data-reveal]").forEach((node) => {
    if (!node.classList.contains("is-visible")) {
      revealObserver.observe(node);
    }
  });
}

function setLeadField(name, value) {
  if (!form) return;
  const field = form.querySelector(`[name="${name}"]`);
  if (field && value !== undefined && value !== null) {
    field.value = value;
  }
}

function fillLeadContext({ listing, goal, tourDate, tourTime, details }) {
  if (!form) return;

  if (listing) {
    setLeadField("location", listing);
  }

  if (goal) {
    setLeadField("goal", goal);
  }

  if (tourDate) {
    setLeadField("tourDate", tourDate);
  }

  if (tourTime) {
    setLeadField("tourTime", tourTime);
  }

  if (details) {
    const detailsField = form.querySelector('[name="details"]');
    if (detailsField && !sanitizeValue(detailsField.value)) {
      detailsField.value = details;
    }
  }

  setFormStatus("Lead details loaded into the request form.");
  scrollToForm();
}

function renderListings() {
  const container = document.querySelector("[data-listings]");
  if (!container) return;

  const cards = config.listings
    .map(
      (listing) => `
        <article class="listing-card" data-reveal>
          <div class="listing-top">
            <span class="listing-status">${escapeHtml(listing.status)}</span>
            <strong class="listing-price">${escapeHtml(listing.price)}</strong>
          </div>
          <h3>${escapeHtml(listing.title)}</h3>
          <p class="listing-area">${escapeHtml(listing.area)}</p>
          <div class="listing-meta" aria-label="Property details">
            <span>${escapeHtml(listing.beds)}</span>
            <span>${escapeHtml(listing.baths)}</span>
          </div>
          <p class="listing-copy">${escapeHtml(listing.description)}</p>
          <div class="listing-tags" aria-label="Listing features">
            ${(listing.tags || [])
              .map((tag) => `<span>${escapeHtml(tag)}</span>`)
              .join("")}
          </div>
          <button
            class="button button-secondary listing-action"
            type="button"
            data-listing-pick
            data-listing-title="${escapeHtml(listing.title)}"
            data-listing-area="${escapeHtml(listing.area)}"
          >
            Request this home
          </button>
        </article>
      `
    )
    .join("");

  container.innerHTML = cards;
  container.querySelectorAll("[data-listing-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      const title = button.getAttribute("data-listing-title") || "";
      const area = button.getAttribute("data-listing-area") || "";
      fillLeadContext({
        listing: `${title}${area ? ` - ${area}` : ""}`,
        goal: "Find a rental home",
        details: `Interested in ${title}. Please share next steps for a showing.`,
      });
      form?.querySelector('[name="tourDate"]')?.focus();
    });
  });

  applyRevealObservation(container);
}

function renderShowingSlots() {
  const container = document.querySelector("[data-showing-slots]");
  if (!container) return;

  const slots = config.showingSlots
    .map((slot) => {
      const dateValue = toLocalDateInputValue(dateFromOffset(slot.dayOffset));
      return `
        <button
          class="slot-chip"
          type="button"
          data-slot-pick
          data-slot-date="${dateValue}"
          data-slot-time="${escapeHtml(slot.time)}"
        >
          <strong>${escapeHtml(slot.label)}</strong>
          <span>${formatDateLabel(slot.dayOffset)}</span>
        </button>
      `;
    })
    .join("");

  container.innerHTML = slots;
  container.querySelectorAll("[data-slot-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      const dateValue = button.getAttribute("data-slot-date") || "";
      const timeValue = button.getAttribute("data-slot-time") || "";
      fillLeadContext({
        goal: "Find a rental home",
        tourDate: dateValue,
        tourTime: timeValue,
        details: "Requested from the showing calendar on the website.",
      });
      form?.querySelector('[name="details"]')?.focus();
    });
  });

  applyRevealObservation(container);
}

function buildMailto(values) {
  const subject = encodeURIComponent(`Rental inquiry from ${values.name}`);
  const body = encodeURIComponent(
    [
      `Business: ${config.businessName}`,
      `Owner: ${config.ownerName}`,
      `Brokerage: ${config.brokerageName}`,
      `Market: ${config.market}`,
      `Name: ${values.name}`,
      `Email: ${values.email}`,
      `Phone: ${values.phone}`,
      `Need: ${values.goal}`,
      `Property or neighborhood: ${values.location}`,
      `Preferred showing date: ${formatDateForBody(values.tourDate) || values.tourDate}`,
      `Preferred showing time: ${formatTimeForBody(values.tourTime) || values.tourTime}`,
      "",
      "Details:",
      values.details,
    ].join("\n")
  );

  return `mailto:${config.contactEmail}?subject=${subject}&body=${body}`;
}

async function submitLeadToEndpoint(payload) {
  const response = await fetch(leadEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Lead endpoint returned ${response.status}`);
  }
}

function initializeBindings() {
  bindText("[data-brand-name]", config.businessName);
  bindText("[data-brand-subtitle]", `Owned by ${config.ownerName} | ${config.brokerageName}`);
  bindText("[data-market-line]", `Serving ${config.market}.`);
  bindContactLink("[data-contact-email]", `mailto:${config.contactEmail}`, config.contactEmail);
  bindContactLink(
    "[data-contact-phone]",
    `tel:${String(config.contactPhone).replace(/[^\d+]/g, "")}`,
    config.contactPhone
  );
  bindWebsiteLink(
    "[data-contact-website]",
    config.websiteUrl,
    config.websiteLabel || config.websiteUrl
  );
  bindText("[data-service-area]", config.market);

  calendarLinks.forEach((link) => {
    if (config.calendarUrl) {
      link.setAttribute("href", config.calendarUrl);
      link.setAttribute("target", "_blank");
      link.setAttribute("rel", "noreferrer");
      link.textContent = "Open full calendar";
    } else {
      link.setAttribute("href", "#lead-form");
      link.removeAttribute("target");
      link.removeAttribute("rel");
      link.textContent = "Use the request form";
    }
  });
}

function initializeRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    applyRevealObservation();
    return;
  }

  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver?.unobserve(entry.target);
      }
    });
  }, {
    root: null,
    threshold: 0.18,
    rootMargin: "0px 0px -10% 0px",
  });

  revealTargets.forEach((target) => revealObserver?.observe(target));
}

function initializeNavigation() {
  if (!navToggle || !siteNav) return;

  navToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (siteNav.classList.contains("is-open")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

function initializeForm() {
  if (!form) return;

  const fieldLabels = {
    name: "full name",
    email: "email",
    phone: "phone number",
    goal: "service goal",
    location: "property or neighborhood",
    tourDate: "preferred showing date",
    tourTime: "preferred showing time",
    details: "details",
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = Object.fromEntries(new FormData(form).entries());
    const values = {
      name: sanitizeValue(String(data.name || "")),
      email: sanitizeValue(String(data.email || "")),
      phone: sanitizeValue(String(data.phone || "")),
      goal: sanitizeValue(String(data.goal || "")),
      location: sanitizeValue(String(data.location || "")),
      tourDate: sanitizeValue(String(data.tourDate || "")),
      tourTime: sanitizeValue(String(data.tourTime || "")),
      details: sanitizeValue(String(data.details || "")),
    };

    const missingField = Object.entries(values).find(([, value]) => !value);

    if (missingField) {
      const [fieldName] = missingField;
      setFormStatus(
        `Please fill in your ${fieldLabels[fieldName] || fieldName} before submitting.`,
        "#d7a39a"
      );
      return;
    }

    const payload = {
      ...values,
      businessName: config.businessName,
      ownerName: config.ownerName,
      brokerageName: config.brokerageName,
      market: config.market,
      source: "website",
      pageUrl: window.location.href,
      submittedAt: new Date().toISOString(),
      preferredShowing: {
        dateLabel: formatDateForBody(values.tourDate),
        timeLabel: formatTimeForBody(values.tourTime),
      },
    };

    const originalLabel = submitButton?.textContent || "Send my rental request";

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending request...";
      }

      setFormStatus("Sending your request to the lead pipeline...");
      await submitLeadToEndpoint(payload);
      setFormStatus("Request sent. We will follow up shortly.");
      form.reset();
      return;
    } catch (error) {
      setFormStatus(
        "Direct send is unavailable right now. Opening your email app instead.",
        "#d7a39a"
      );
      if (submitButton) {
        submitButton.textContent = "Opening email app...";
      }
      window.location.href = buildMailto(values);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });
}

initializeBindings();
initializeRevealObserver();
initializeNavigation();
initializeForm();
renderListings();
renderShowingSlots();
