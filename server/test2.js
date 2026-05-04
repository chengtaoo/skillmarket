import express from 'express';
const app = express();

app.get('/api/stats', (req, res) => res.json({test: true}));
app.get('/', (req, res) => res.send('ROOT OK'));
app.get('*', (req, res) => res.send('CATCH ALL: ' + req.path));

app.listen(3002, () => console.log('Test on 3002'));
