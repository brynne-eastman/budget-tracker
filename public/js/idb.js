// create variable to hold dbconnection
let db;

// establish a connection to IndexedDB database and set it to version 1
const request = indexedDB.open('budget_tracker', 1);

// this event will emit if the database version changes 
request.onupgradeneeded = function(event) {
    // save a reference to the database
    const db = event.target.result;
    // create an object store, set it to have an auto incrementing primary key
    db.createObjectStore('new_transaction', { autoIncrement: true });
};

// upon a successful
request.onsuccess = function(event) {
    // when db is successfully created with its object store
    db = event.target.result;

    // check if app is onlice
    if (navigator.onLine) {
        uploadTransaction();
    }
};

request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to subit a new transaction and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access the object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadTransaction() {
    //open a transaction on your db
    const transaction = db.transaction(['new_transaction'], 'readwrite');

    //access your object store
    const budgetObjectStore = transaction.objectStore('new_transaction');

    //get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

    // upon a successful .getAll() execution, run this information
    getAll.onsuccess = function() {
        // if there was data in indexedDB's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                // open one more transaction
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                // access the object store
                const budgetObjectStore = transaction.objectStore('new_transaction');
                // clear all items in your store
                budgetObjectStore.clear();

                alert('All saved transaction have been submitted!');
                
            })
            .catch(err => {
                console.log(err);
            });
        }
    }
}

// listen for app coming back online
window.addEventListener('online', uploadTransaction);