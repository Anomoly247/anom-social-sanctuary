(function (window, document) {
  "use strict";

  var STORAGE = {
    house: "anom_selectedHouse",
    houseName: "anom_selectedHouseName",
    mount: "anom_selectedMount",
    returnUrl: "ao_return_url",
    source: "ao_source",
    mission: "ao_mission",
    eventId: "ao_event_id"
  };

  var HOUSES = {
    "1": "Pixel & Dot",
    "2": "Clifford & Tater",
    "3": "Mood Buddies",
    "4": "Patrol Guardians"
  };

  function read(key, fallback) {
    try { return window.localStorage.getItem(key) || fallback; } catch (error) { return fallback; }
  }

  function write(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* private mode */ }
  }

  function safeReturn(value) {
    if (!value) return "https://anomartsy.xyz/";
    try {
      var parsed = new URL(value, window.location.href);
      return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "https://anomartsy.xyz/";
    } catch (error) { return "https://anomartsy.xyz/"; }
  }

  function context() {
    var params = new URLSearchParams(window.location.search);
    var house = params.get("house") || read(STORAGE.house, "1");
    var mount = params.get("mount") || read(STORAGE.mount, "aurora");
    var returnUrl = safeReturn(params.get("return") || read(STORAGE.returnUrl, "https://anomartsy.xyz/"));
    var source = params.get("source") || read(STORAGE.source, "homeworld");
    var mission = params.get("mission") || read(STORAGE.mission, "");
    var eventId = params.get("event") || read(STORAGE.eventId, "");
    var houseName = HOUSES[house] || read(STORAGE.houseName, house);
    write(STORAGE.house, house);
    write(STORAGE.houseName, houseName);
    write(STORAGE.mount, mount);
    write(STORAGE.returnUrl, returnUrl);
    write(STORAGE.source, source);
    write(STORAGE.mission, mission);
    write(STORAGE.eventId, eventId);
    return { house: house, houseName: houseName, mount: mount, returnUrl: returnUrl, source: source, mission: mission, eventId: eventId };
  }

  function decorateUrl(rawUrl, extra) {
    var current = context();
    var url;
    try { url = new URL(rawUrl, window.location.href); } catch (error) { return rawUrl; }
    var values = extra || {};
    if (values.houseAware !== false) {
      url.searchParams.set("house", values.house || current.house);
      url.searchParams.set("mount", values.mount || current.mount);
      url.searchParams.set("return", values.returnUrl || current.returnUrl || window.location.href);
      url.searchParams.set("source", values.source || current.source);
      if (values.mission || current.mission) url.searchParams.set("mission", values.mission || current.mission);
      if (values.eventId || current.eventId) url.searchParams.set("event", values.eventId || current.eventId);
    }
    return url.href;
  }

  function decorateLinks(root) {
    var scope = root || document;
    scope.querySelectorAll("a[data-ao-bridge], a[data-house-aware='true']").forEach(function (link) {
      link.href = decorateUrl(link.href, { houseAware: link.dataset.houseAware !== "false" });
    });
  }

  function injectReturnPill() {
    var current = context();
    if (!new URLSearchParams(window.location.search).has("return")) return;
    if (document.getElementById("ao-bridge-return")) return;
    var pill = document.createElement("a");
    pill.id = "ao-bridge-return";
    pill.href = current.returnUrl;
    pill.textContent = "← RETURN TO AO • " + current.houseName;
    pill.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:2147483001;padding:10px 14px;border:1px solid rgba(0,234,255,.45);border-radius:999px;background:rgba(8,10,18,.92);color:#8af0ff;text-decoration:none;font:11px/1.2 monospace;letter-spacing:.08em;backdrop-filter:blur(14px)";
    document.body.appendChild(pill);
  }

  window.AOBridge = {
    context: context,
    decorateUrl: decorateUrl,
    decorateLinks: decorateLinks,
    injectReturnPill: injectReturnPill,
    storage: STORAGE
  };

  function boot() {
    context();
    decorateLinks();
    injectReturnPill();
    window.dispatchEvent(new CustomEvent("ao:bridge-ready", { detail: context() }));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window, document);
