document.addEventListener('DOMContentLoaded', function () { // Gjør at scriptet kjører når siden er ferdig lastet
    const params = new URLSearchParams(window.location.search); // Hent array med query-params
    const pageName = params.get('page'); // Hent query-param med navn "page"
    if (pageName) { //Hvis query-parameter funnet
        fetch(`/pages/${pageName}.html`) //Hent siden fra "/?page=<pagename>.html"
            .then(response => response.text()) // Hent innholdet (HTML) fra siden
            .then(html => {
                document.getElementById('content').innerHTML = html; // "inject" HTML fra siden til div med id "content"
            })
            .then(() => {
                //load page specific js
                fetch(`/js/${pageName}.js`) // Hent scriptet fra "/js/<pagename>.js"
                    .then(response => response.text()) // Hent innholdet (JS) fra scriptet
                    .then(js => {
                        eval(js); // Evaluer scriptet
                    })
            })
            .catch(error => console.error('Error loading page:', error)); // Dersom det skjer en feil, vis feilmelding i konsollen
    }
});

// TODO: plagiatkontroll!