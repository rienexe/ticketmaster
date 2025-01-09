document.addEventListener("DOMContentLoaded", function() {
    const quizContainer = document.getElementById("quiz-container");
    const progressBar = document.getElementById("progress");
    const remainingTicketsContainer = document.getElementById("remaining-tickets-container");
    let currentQuestionIndex = 0;
    let remainingTickets = [];
    let questions = [];

    function getUrlParam(param) {
        const params = new URLSearchParams(window.location.search);
        return params.get(param);
    }

    // Fetch questions and tickets
    async function loadQuizData() {
        const networkId = getUrlParam("network");

        const questionsResponse = await fetch("/ticketmaster/data/quizQuestions.json");
        questions = await questionsResponse.json();

        const ticketsResponse = await fetch("/ticketmaster/data/tickets.json");
        const ticketsData = await ticketsResponse.json();
        let tickets = ticketsData.tickets[networkId];

        if (!tickets) {
            const localData = localStorage.getItem('localTickets.json');
            if (localData) {
                tickets = JSON.parse(localData).tickets[networkId];
            }
        }

        remainingTickets = [...tickets];

        // Shuffle questions
        questions = shuffleArray(questions.questions);

        updateRemainingTickets();

        // Start quiz
        showNextQuestion();
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function showNextQuestion() {
        if (currentQuestionIndex < questions.length && remainingTickets.length > 1) {
            const question = questions[currentQuestionIndex];
            renderQuestion(question);
        } else {
            displayResults();
        }
    }

    function renderQuestion(question) {
        quizContainer.innerHTML = `<h3>${question.text}</h3>`;

        question.options.forEach(option => {
            const button = document.createElement("button");
            button.classList.add("btn", "btn-primary", "m-1");
            button.textContent = option.text;
            button.addEventListener("click", () => handleAnswer(question, option.value));
            quizContainer.appendChild(button);
        });

        const skipButton = document.createElement("button");
        skipButton.classList.add("btn", "btn-outline-primary", "mx-3");
        skipButton.textContent = "Skip Question";
        skipButton.addEventListener("click", () => {
            currentQuestionIndex++;
            showNextQuestion();
        });
        quizContainer.appendChild(skipButton);

        updateProgressBar();
    }

    function handleAnswer(question, answer) {
        if (answer !== null) {
            remainingTickets = remainingTickets.filter(ticket => {
                return ticket[question.filter_property] === answer ||
                    (Array.isArray(ticket[question.filter_property]) && ticket[question.filter_property].includes(answer));
            });
        }

        currentQuestionIndex++;
        showNextQuestion();
        updateRemainingTickets();
    }
    
    function updateProgressBar() {
        const progress = (currentQuestionIndex / questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function updateRemainingTickets() {
        if (remainingTickets.length > 1) {
            remainingTicketsContainer.innerHTML = '<h4>Remaining Ticket to Filter</h4>';
            remainingTickets.forEach(ticket => {
                const ticketDiv = document.createElement("div");
                ticketDiv.classList.add("tm-ticket");
                ticketDiv.textContent = ticket.name;
                remainingTicketsContainer.appendChild(ticketDiv);
            });
        } else {
            remainingTicketsContainer.innerHTML = "";
        }
    }

    function displayResults() {
        quizContainer.innerHTML = "";
        remainingTicketsContainer.innerHTML = "";
        if (remainingTickets.length === 1) {
            progressBar.style.width = '100%';
            quizContainer.innerHTML = `<h3>Recommended Ticket:</h3><div class="tm-ticket-result">${remainingTickets[0].name}</div>`;
        } else if (remainingTickets.length > 1) {
            progressBar.style.width = '100%';
            quizContainer.innerHTML = `<h3>Multiple suitable tickets found:</h3>`;
            remainingTickets.forEach(ticket => {
                const ticketDiv = document.createElement("div");
                ticketDiv.classList.add("tm-ticket-result");
                ticketDiv.textContent = ticket.name;
                quizContainer.appendChild(ticketDiv);
            });
        } else {
            progressBar.style.width = '0%';
            quizContainer.innerHTML = `<h3>No suitable ticket found.</h3>`;
        }
    }

    loadQuizData();
});
