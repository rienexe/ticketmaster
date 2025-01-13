document.addEventListener("DOMContentLoaded", () => {
    let networkIdCounter = 1;
    let ticketId = 0;

    const zonesSelection = document.getElementById("inputZoneCoverage");
    const serviceSelection = document.getElementById("inputServiceCoverage");

    const networkTab = document.getElementById("collapseOneButton");
    const networkForm = document.getElementById("networkForm");
    const ticketTab = document.getElementById("collapseTwoButton");
    const ticketForm = document.getElementById("ticketForm");

    const localNetworks = { networks: {} };
    const localTickets = { tickets: {} };

    // temporarily deactivate second form
    ticketTab.disabled = true;

    async function populateCountryDropdown() {
        const countrySelect = document.getElementById("inputCountry");
        try {
            const response = await fetch("https://restcountries.com/v3.1/all");
            const countries = await response.json();
            countries.sort((a, b) => a.name.common.localeCompare(b.name.common));
            countries.forEach((country) => {
                const option = document.createElement("option");
                option.value = country;
                option.textContent = country.name.common;
                countrySelect.appendChild(option);
            });
        } catch (error) {
            var countryArr = ["Austria", "Germany", "Switzerland"];

            for (var i = 0; i < countryArr.length; i++) {
                var opt = countryArr[i];
                var el = document.createElement("option");
                el.text = opt;
                el.value = opt;
                
                countrySelect.add(el);
            }
            console.error("Error fetching country data:", error);
        }
    }

    populateCountryDropdown();

    networkForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const location = document.getElementById("inputLocation").value;
        const country = document.getElementById("inputCountry").value;
        const operators = document.getElementById("inputOperators").value.split(",").map(op => op.trim());
        const zones = document.getElementById("inputZones").value.split(",").map(zone => zone.trim());
        const services = Array.from(document.getElementById("inputServices").selectedOptions).map(option => option.value);

        const networkId = `l${networkIdCounter++}`;
        localNetworks.networks[networkId] = {
            location,
            country,
            operators,
            services
        };

        zonesSelection.innerHTML = ""; // Reset
        zones.forEach(zone => {
            const option = document.createElement("option");
            option.value = zone;
            option.textContent = zone;
            zonesSelection.appendChild(option);
        });

        serviceSelection.innerHTML = ""; // Reset
        services.forEach(service => {
            const option = document.createElement("option");
            option.value = service;
            option.textContent = service;
            serviceSelection.appendChild(option);
        });

        localStorage.setItem("localNetworks.json", JSON.stringify(localNetworks));

        // activate second form
        ticketTab.disabled = false;
        ticketForm.disabled = false;
        networkForm.disabled = true;

        networkTab.click();
        ticketTab.click();
    });

    const validatePriceInput = (input) => {
        const value = input.value.trim();
        const isValid = /^(\d+(\.\d{1,2})?)?$/.test(value);
        if (isValid) {
            input.classList.remove("is-invalid");
        } else {
            input.classList.add("is-invalid");
        }
    };

    document.getElementById("inputPrice").addEventListener("input", (e) => validatePriceInput(e.target));
    document.getElementById("inputReducedPrice").addEventListener("input", (e) => validatePriceInput(e.target));

    ticketForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const category = document.getElementById("inputCategory").value.trim();
        const name = document.getElementById("inputTicketName").value.trim();
        const validityType = document.querySelector("input[name='inputValidityType']:checked");
        const regularPrice = parseFloat(document.getElementById("inputPrice").value.trim());
        const reducedPrice = parseFloat(document.getElementById("inputReducedPrice").value.trim()) || null;
        const transferability = document.getElementById("inputTransferable").checked;
        const carriageOfChildren = document.getElementById("inputTransferableChildren").checked;
        const carriageOfDogs = document.getElementById("inputTransferableDogs").checked;
        const passengerType = document.querySelector("input[name='inputPassengerType']:checked")?.value;
        const travelZoneCoverage = Array.from(zonesSelection.selectedOptions).map(option => option.value);
        const serviceCoverage = Array.from(serviceSelection.selectedOptions).map(option => option.value);

        let validity;
        if (validityType) {
            if (validityType.id === "duration") {
                const duration = document.getElementById("inputValidityDuration").value.trim();
                const durationUnit = document.getElementById("inputValidityDurationUnit").value.trim();
                if (!duration || !durationUnit) {
                    alert("Please specify a valid duration and unit for validity.");
                    return;
                }
                validity = `${duration} ${durationUnit}`;
            } else if (validityType.id === "trip") {
                const trips = document.getElementById("inputValidityTrip").value.trim();
                const tripType = document.getElementById("inputValidityTripType").value.trim();
                if (!trips || !tripType) {
                    alert("Please specify a valid number of trips and trip type.");
                    return;
                }
                validity = `${trips} ${tripType} trip(s)`;
            } else {
                alert("Please select a validity type.");
                return;
            }
        } else {
            alert("Please select a validity type.");
            return;
        }

        const ticket = {
            id: ticketId++,
            category,
            name,
            validity_type: validityType.id,
            validity,
            regular_price: regularPrice,
            reduced_price: reducedPrice,
            transferability,
            carriage_of_children: carriageOfChildren,
            carriage_of_dogs: carriageOfDogs,
            passenger_type: passengerType,
            travel_zone_coverage: travelZoneCoverage,
            service_coverage: serviceCoverage
        };

        const currentNetworkId = `l${networkIdCounter - 1}`;

        if (!localTickets.tickets[currentNetworkId]) {
            localTickets.tickets[currentNetworkId] = [];
        }
        localTickets.tickets[currentNetworkId].push(ticket);

        const ticketTable = document.querySelector("#ticketTable tbody");
        const row = document.createElement("tr");
        row.innerHTML = `
        <td>${ticket.id}</td>
        <td>${ticket.category}</td>
        <td>${ticket.name}</td>
        <td>${validityType.id === "validityByTime" ? "Time" : "Trips"}</td>
        <td>${ticket.validity}</td>
        <td>${ticket.regular_price.toFixed(2)}</td>
        <td>${ticket.reduced_price !== null ? ticket.reduced_price.toFixed(2) : "N/A"}</td>
        <td>${ticket.transferability ? "Yes" : "No"}</td>
        <td>${ticket.carriage_of_children ? "Yes" : "No"}</td>
        <td>${ticket.carriage_of_dogs ? "Yes" : "No"}</td>
        <td>${ticket.passenger_type}</td>
        <td>${ticket.travel_zone_coverage.join(", ")}</td>
        <td>${ticket.service_coverage.join(", ")}</td>
    `;
        ticketTable.appendChild(row);

        ticketForm.reset();
    });


    document.querySelector("#collapseTwo .btn-primary:last-of-type").addEventListener("click", () => {
        if (localTickets.length === 0) {
            alert("No tickets added yet.");
            return;
        }

        localStorage.setItem("localTickets.json", JSON.stringify(localTickets));

        window.location.href = "/ticketmaster/pages/ticket/networks.html";
    });
});
