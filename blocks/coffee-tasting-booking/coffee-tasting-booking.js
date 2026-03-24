const API_URL = 'https://compute-backend-p188602-d568746-first-edge-function.adobeaemcloud.com/compute/coffee-tasting-booking';

function escapeHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function buildModal() {
  const overlay = document.createElement('div');
  overlay.className = 'ctb-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Nearby Frescopa Locations');
  overlay.hidden = true;

  overlay.innerHTML = `
    <div class="ctb-modal">
      <button type="button" class="ctb-modal-close" aria-label="Close">&times;</button>
      <h3 class="ctb-modal-title">Nearby Frescopa Locations</h3>
      <p class="ctb-modal-subtitle"></p>
      <div class="ctb-results"></div>
      <div class="ctb-modal-actions">
        <button type="button" class="ctb-confirm-btn" disabled>Confirm Reservation</button>
      </div>
    </div>
  `;
  return overlay;
}

function buildConfirmation() {
  const confirmation = document.createElement('div');
  confirmation.className = 'ctb-confirmation';
  confirmation.setAttribute('role', 'dialog');
  confirmation.setAttribute('aria-modal', 'true');
  confirmation.setAttribute('aria-label', 'Reservation Confirmation');
  confirmation.hidden = true;

  confirmation.innerHTML = `
    <div class="ctb-confirm-card">
      <div class="ctb-confirm-icon" aria-hidden="true">&#10003;</div>
      <h3 class="ctb-confirm-title">Reservation Confirmed!</h3>
      <div class="ctb-confirm-details"></div>
      <button type="button" class="ctb-confirm-close">Done</button>
    </div>
  `;
  return confirmation;
}

function renderLocations(resultsEl, locations, zip, radioGroupName) {
  resultsEl.innerHTML = '';
  if (!locations || locations.length === 0) {
    resultsEl.innerHTML = `<div class="ctb-no-results">No Frescopa locations found near <strong>${escapeHtml(zip)}</strong>.</div>`;
    return;
  }

  let hasAnySlots = false;
  locations.forEach((loc) => {
    const slots = loc.times || [];
    if (slots.length === 0) return;
    hasAnySlots = true;

    const card = document.createElement('div');
    card.className = 'ctb-location-card';
    card.setAttribute('data-location-id', loc.id);

    const timesHtml = slots.map((t, i) => {
      const id = `${loc.id}-time-${i}`;
      return `<span class="ctb-time-option">
        <input type="radio" id="${id}" name="${radioGroupName}" value="${t}" data-location-id="${loc.id}">
        <label class="ctb-time-label" for="${id}">${t}</label>
      </span>`;
    }).join('');

    card.innerHTML = `
      <div class="ctb-location-header">
        <h4 class="ctb-location-name">${escapeHtml(loc.name)}</h4>
        <span class="ctb-location-distance">${escapeHtml(loc.distance)}</span>
      </div>
      <p class="ctb-location-address">${escapeHtml(loc.address)}</p>
      <div class="ctb-times">${timesHtml}</div>
    `;
    resultsEl.appendChild(card);
  });

  if (!hasAnySlots) {
    resultsEl.innerHTML = `<div class="ctb-no-results">No available time slots for today near <strong>${escapeHtml(zip)}</strong>.</div>`;
  }
}

export default function decorate(block) {
  const row = block.children[0];
  const textCol = row?.children[0];
  const title = textCol?.querySelector('h2')?.textContent || 'Schedule a Frescopa coffee bean tasting experience';
  const label = textCol?.querySelector('p')?.textContent || 'Find a Location NOW';

  // clear block and rebuild
  block.textContent = '';

  // panel (left side)
  const panel = document.createElement('div');
  panel.className = 'ctb-panel';
  panel.innerHTML = `
    <h2 class="ctb-title">${escapeHtml(title)}</h2>
    <p class="ctb-label">${escapeHtml(label)}</p>
    <div class="ctb-search">
      <input type="text" class="ctb-input" placeholder="Zip code" aria-label="${escapeHtml(label)}" maxlength="10">
      <button type="button" class="ctb-button">Search</button>
    </div>
  `;

  // map placeholder (right side)
  const map = document.createElement('div');
  map.className = 'ctb-map';
  map.setAttribute('aria-hidden', 'true');
  map.innerHTML = `
    <div class="ctb-map-placeholder">
      <svg class="ctb-map-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/>
      </svg>
      <span>Map View</span>
    </div>
  `;

  // modal & confirmation
  const overlay = buildModal();
  const confirmation = buildConfirmation();

  // layout wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'ctb-wrapper';
  wrapper.append(panel, map);
  block.append(wrapper, overlay, confirmation);

  // state
  let selectedLocation = null;
  let selectedTime = null;
  const input = panel.querySelector('.ctb-input');
  const searchBtn = panel.querySelector('.ctb-button');
  const resultsEl = overlay.querySelector('.ctb-results');
  const confirmBtn = overlay.querySelector('.ctb-confirm-btn');
  const subtitleEl = overlay.querySelector('.ctb-modal-subtitle');

  function openModal() {
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.ctb-modal-close').focus();
  }

  function closeModal() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    input.focus();
  }

  function closeConfirmation() {
    confirmation.hidden = true;
    document.body.style.overflow = '';
    input.value = '';
    input.focus();
  }

  async function handleSearch() {
    const zip = (input.value || '').trim();
    if (!zip) { input.focus(); return; }

    selectedLocation = null;
    selectedTime = null;
    confirmBtn.disabled = true;
    searchBtn.disabled = true;

    try {
      const resp = await fetch(`${API_URL}?zipcode=${encodeURIComponent(zip)}`);
      const data = await resp.json();
      const locations = Array.isArray(data) ? data : (data?.locations || null);
      subtitleEl.textContent = locations?.length ? `Showing results for zip code ${zip}` : '';
      const groupName = `ctb-time-${Date.now()}`;
      renderLocations(resultsEl, locations, zip, groupName);
      openModal();
    } catch {
      subtitleEl.textContent = '';
      renderLocations(resultsEl, null, zip, '');
      openModal();
    } finally {
      searchBtn.disabled = false;
    }
  }

  function handleTimeSelected(radio, locations) {
    const locId = radio.getAttribute('data-location-id');
    selectedTime = radio.value;
    selectedLocation = locations?.find((l) => l.id === locId) || null;

    resultsEl.querySelectorAll('.ctb-location-card').forEach((card) => {
      if (card.getAttribute('data-location-id') === locId) {
        card.classList.add('ctb-location-card-selected');
      } else {
        card.classList.remove('ctb-location-card-selected');
      }
    });
    confirmBtn.disabled = false;
  }

  function placeOrder() {
    if (!selectedLocation || !selectedTime) return;
    const orderNum = `FRS-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    confirmation.querySelector('.ctb-confirm-details').innerHTML = `
      <strong>Order #:</strong> ${orderNum}<br>
      <strong>Location:</strong> ${escapeHtml(selectedLocation.name)}<br>
      <strong>Address:</strong> ${escapeHtml(selectedLocation.address)}<br>
      <strong>Pickup Time:</strong> ${escapeHtml(selectedTime)}<br>
      <strong>Date:</strong> ${dateStr}
    `;
    closeModal();
    confirmation.hidden = false;
    document.body.style.overflow = 'hidden';
  }

  // event listeners
  searchBtn.addEventListener('click', handleSearch);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } });
  overlay.querySelector('.ctb-modal-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  confirmBtn.addEventListener('click', placeOrder);
  confirmation.querySelector('.ctb-confirm-close').addEventListener('click', closeConfirmation);
  confirmation.addEventListener('click', (e) => { if (e.target === confirmation) closeConfirmation(); });

  // delegate radio change to results container
  resultsEl.addEventListener('change', (e) => {
    if (e.target.type === 'radio') {
      // read locations from DOM
      const cards = resultsEl.querySelectorAll('.ctb-location-card');
      const locs = [...cards].map((c) => ({
        id: c.getAttribute('data-location-id'),
        name: c.querySelector('.ctb-location-name')?.textContent || '',
        address: c.querySelector('.ctb-location-address')?.textContent || '',
        distance: c.querySelector('.ctb-location-distance')?.textContent || '',
      }));
      handleTimeSelected(e.target, locs);
    }
  });
}
