const http = require('http');

async function test() {
    console.log("Fetching global categories to see schema...");
    const res = await fetch("http://localhost:5000/api/v1/global/categories");
    const data = await res.json();
    console.log(data);
}
test();
