let detected = false;

const observer = new MutationObserver(() => {

    if (detected) return;

    const pageText = document.body.innerText;

    if (pageText.includes("Accepted")) {

        detected = true;

    setTimeout(() => {

    let code = document.querySelector("pre code")?.innerText || "";

     code = code
        .split("\n")
        .map(line => line.replace(/^\d+/, ""))
        .join("\n");

    console.log(code);

}, 3000);



        const problemData = {
            title: document.title,
            url: window.location.href.split("/submissions")[0],
            code: code
        };

        console.log("Solution Accepted!");
        console.log(problemData);

        chrome.storage.local.set({
            lastSolution: problemData
        }, () => {
            console.log("Saved Successfully!");
        });
    }

});

observer.observe(document.body, {
    childList: true,
    subtree: true
});