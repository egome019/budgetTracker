let db;

const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function(evt) {
    const db = evt.target.result;
    db.createObjectStore("pending", {autoIncrement: true});
};

request.onsuccess = function(evt) {
    db = evt.target.result;

    if(navigator.onLine) {
        checkDb();
    }
};

request.onerror = function(evt) {
    console.log("Error: " + evt.target.errorCode);
};

function record(record) {
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");

    store.add(record);
}

function checkDb() {
    const transaction = db.transaction(["pending"], "readwrite");

    const store = transaction.objectStore("pending");

    const getAll = store.getAll();

    getAll.onsuccess = function(){
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: "POST",
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json"
                }
            })
            .then(response => response.json())
            .then(() => {
                const transaction = db.transaction(["pending"], "readwrite");

                const store = transaction.objectStore("pending");

                store.clear();
            });
        }
    };
}

window.addEventListener("online", checkDb);