const mysql = require("mysql");

const connection = () => {
  const db = mysql.createConnection({
    host: process.env.HOST,
    port: process.env.PORT,
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  });

  db.connect(function (error: Error | null) {
    if (error) {
      console.error("Error connecting to database", error);
    } else {
      console.log("Database connected....");
    }
  });
};

export default connection;
