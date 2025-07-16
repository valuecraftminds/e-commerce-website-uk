    // index.js (or server.js)
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 3000; // Use environment variable or default to 3000

    // Basic route
    app.get('/', (req, res) => {
      res.send('Hello from Express Backend!');
    });

    // Start the server
    app.listen(port, () => {
      console.log(`Server listening at http://localhost:${port}`);
    });