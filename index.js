const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  process.env.DATABASE_URL ||
    "postgres://postgres@localhost/acme_ice_cream"
);
const app = express();

app.use(express.json());
app.use(require('morgan')('dev'));
app.post('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
        INSERT INTO flavors(name, is_favorite) VALUES($1, $2) RETURNING *;
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite]);
        res.send(response.rows[0]);
    } catch (error) {
        console.log('Unable to create flavor');
        console.log(error);
        next(error);
    }
});
app.get('/api/flavors', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM flavors;
        `;
        const response = await client.query(SQL)
        res.send(response.rows);
    } catch (error) {
        console.log('Unable to get flavors');
        console.log(error);
        next(error);
    }
});
app.get('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        SELECT * FROM flavors WHERE id = $1;
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.log('Unable to get flavor by id ' + req.params.id);
        console.log(error);
        next(error);
    }
});
app.put('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        UPDATE flavors SET name = $1, is_favorite = $2, updated_at = now() WHERE id = $3 RETURNING *;
        `;
        const response = await client.query(SQL, [req.body.name, req.body.is_favorite, req.params.id]);
        res.send(response.rows[0]);
    } catch (error) {
        console.log('Unable to update flavor by id ' + req.params.id);
        console.log(error);
        next(error);
    }
});
app.delete('/api/flavors/:id', async (req, res, next) => {
    try {
        const SQL = `
        DELETE FROM flavors WHERE id = $1;
        `;
        const response = await client.query(SQL, [req.params.id]);
        res.sendStatus(204);
    } catch (error) {
        console.log('Unable to delete flavor by id ' + req.params.id);
        console.log(error);
        next(error);
    }
});

app.use((err, req, res, next) => {
    res.status(500).send({ error: err.message });
});

const init = async () => {
  await client.connect();
  console.log("connected to database");
  let SQL = `
    DROP TABLE IF EXISTS flavors;
    CREATE TABLE flavors(
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    is_favorite BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT NULL
    );
   `;
  await client.query(SQL);
  console.log("tables created");
  SQL = `
    INSERT INTO flavors(name, is_favorite) VALUES('vanilla', true);
    INSERT INTO flavors(name, is_favorite) VALUES('chocolate', false);
    INSERT INTO flavors(name, is_favorite) VALUES('pistachio', true);
    `;
  await client.query(SQL);
  console.log("data seeded");
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
};

init();
