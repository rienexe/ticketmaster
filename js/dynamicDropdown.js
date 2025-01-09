document.addEventListener("DOMContentLoaded", () => {
    const countrySelect = document.getElementById("inputCountry");
    const networkSelect = document.getElementById("inputNetwork");
    const submitButton = document.getElementById("submitButton");

    let networks = [];

    function loadNetworks() {
        fetch("data/networks.json")
            .then(response => response.json())
            .then(data => {
                networks = Object.entries(data.networks).map(([id, network]) => ({ id, ...network }));
                populateCountryDropdown();
                detectUserLocation();
            })
            .catch(error => console.error("Error loading networks.json:", error));
    }

    function populateCountryDropdown() {
        const countries = [...new Set(networks.map(n => n.country))];
        countries.forEach(country => {
            const option = document.createElement("option");
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
    }

    function populateNetworkDropdown(selectedCountry) {
        networkSelect.innerHTML = '<option selected disabled></option>';
        networkSelect.disabled = false;

        networks
            .filter(network => network.country === selectedCountry)
            .forEach(network => {
                const option = document.createElement("option");
                option.value = network.id;
                option.textContent = network.location;
                networkSelect.appendChild(option);
            });
    }

    function detectUserLocation() {
        if (!navigator.geolocation) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
                    .then(response => response.json())
                    .then(data => {
                        const userCountry = data.countryName;

                        const countryOption = Array.from(countrySelect.options).find(option => option.value === userCountry);
                        if (countryOption) {
                            countryOption.selected = true;
                            populateNetworkDropdown(userCountry);
                        }
                    })
                    .catch(error => console.error("Error detecting user location:", error));
            },
            (error) => {
                console.error("Error getting user location:", error);
            }
        );
    }

    countrySelect.addEventListener("change", () => {
        const selectedCountry = countrySelect.value;
        populateNetworkDropdown(selectedCountry);
    });

    networkSelect.addEventListener("change", () => {
        submitButton.disabled = false;
        const selectedNetworkId = networkSelect.value;
        submitButton.setAttribute("onclick", `location.href='pages/ticket/quiz?network=${selectedNetworkId}'`);
    });

    // Initialisieren
    loadNetworks();
});
