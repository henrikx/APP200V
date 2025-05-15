document.addEventListener('DOMContentLoaded', function () { // Run script on page load
    const params = new URLSearchParams(window.location.search); // Get array with query-params
    const pageName = params.get('page'); // Get query-parameter "page"
    if (pageName) { //if pageName from queryparam is not null
        fetch(`/pages/${pageName}.html`) //get the html file from the pages folder
            .then(response => response.text()) // get the text from the response
            .then(html => {
                document.getElementById('content').innerHTML = html; // inject the html into the content div
            })
            .then(() => {
                //load page specific js
                const script = document.createElement('script');
                script.src = `/js/${pageName}.js`;
                script.type = 'module';
                document.body.appendChild(script);
            })
            .catch(error => console.error('Error loading page:', error)); // log errors to the console
    }
});