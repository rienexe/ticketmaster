let networks = [];

// Load networks and initialize filters
async function loadNetworks() {
    const response = await fetch('/ticketmaster/data/networks.json');
    const data = await response.json();
    networks = Object.entries(data.networks).map(([id, network]) => ({ id, ...network }));

    // Check for locally saved networks
    const localData = localStorage.getItem('localNetworks.json');
    if (localData) {
        try {
            const localNetworks = JSON.parse(localData).networks;
            const localNetworksArray = Object.entries(localNetworks).map(([id, network]) => ({ id, ...network }));
            networks = [...networks, ...localNetworksArray];

            console.log(networks);
        } catch (error) {
            console.error('Error loading localNetworks from LocalStorage:', error);
        }
    }

    populateCountryFilters();
    populateServiceFilters();
    displayCards(networks);

    // Add event listeners for filters
    document.getElementById('sort-dropdown').addEventListener('change', applyFilters);
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('country-checkboxes').addEventListener('change', applyFilters);
    document.getElementById('service-checkboxes').addEventListener('change', applyFilters);
}

// Populate country filter checkboxes
function populateCountryFilters() {
    const countries = [...new Set(Object.values(networks).map(net => net.country))].sort();
    const container = document.getElementById('country-checkboxes');

    countries.forEach(country => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check me-3';
        checkbox.innerHTML = `
      <input class="form-check-input" type="checkbox" id="country-${country}" value="${country}">
      <label class="form-check-label" for="country-${country}">${country}</label>
    `;
        container.appendChild(checkbox);
    });
}

// Populate service filter checkboxes
function populateServiceFilters() {
    const services = [...new Set(Object.values(networks).flatMap(net => net.services))].sort();
    const container = document.getElementById('service-checkboxes');

    services.forEach(service => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check me-3';
        checkbox.innerHTML = `
      <input class="form-check-input" type="checkbox" id="service-${service}" value="${service}">
      <label class="form-check-label" for="service-${service}">${service}</label>
    `;
        container.appendChild(checkbox);
    });
}

// Display network cards
function displayCards(filteredNetworks) {
    const grid = document.getElementById('network-grid');
    grid.innerHTML = ''; // Clear existing cards

    filteredNetworks.forEach(network => {
        const card = document.createElement('div');
        card.className = 'col';

        card.innerHTML = `
      <div class="card text-bg-light h-100 text-center">
        <div class="card-body d-grid">
          <h3 class="card-title">
            <span class="h6">${network.country}</span><br>
            ${network.location}
          </h3>
          <p class="card-text">${network.operators.join(', ')}</p>
          <a href="/ticketmaster/pages/ticket/quiz?network=${network.id}" class="btn btn-primary">Find your Ticket</a>
        </div>
        <div class="card-footer">
          ${network.services.join(', ')}
        </div>
      </div>
    `;

        grid.appendChild(card);
    });
}

// Apply filters and sorting
function applyFilters() {
    let filteredNetworks = Object.values(networks);

    // Sort
    const sortValue = document.getElementById('sort-dropdown').value;
    filteredNetworks.sort((a, b) => {
        if (sortValue === 'location-asc') return a.location.localeCompare(b.location);
        if (sortValue === 'location-desc') return b.location.localeCompare(a.location);
        if (sortValue === 'country-asc') return a.country.localeCompare(b.country);
        if (sortValue === 'country-desc') return b.country.localeCompare(a.country);
        return 0;
    });

    // Search
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    if (searchValue) {
        filteredNetworks = filteredNetworks.filter(network =>
            network.operators.some(op => op.toLowerCase().includes(searchValue))
        );
    }

    // Filter by country
    const selectedCountries = Array.from(
        document.querySelectorAll('#country-checkboxes input:checked')
    ).map(checkbox => checkbox.value);

    if (selectedCountries.length > 0) {
        filteredNetworks = filteredNetworks.filter(network =>
            selectedCountries.includes(network.country)
        );
    }

    // Filter by service
    const selectedServices = Array.from(
        document.querySelectorAll('#service-checkboxes input:checked')
    ).map(checkbox => checkbox.value);

    if (selectedServices.length > 0) {
        filteredNetworks = filteredNetworks.filter(network =>
            network.services.some(service => selectedServices.includes(service))
        );
    }

    // Update cards
    displayCards(filteredNetworks);
}

// Initialize the page
loadNetworks();
