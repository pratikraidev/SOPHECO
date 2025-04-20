const dotenv = require("dotenv");
const cassandra = require("cassandra-driver");
dotenv.config();

const createConnection = () => {
    const cloud = {
        secureConnectBundle: "public/secure-connect-sopheco-db-nv.zip",
      };
      const authProvider = new cassandra.auth.PlainTextAuthProvider(
        "token",
        process.env.ASTRA_DB_APPLICATION_TOKEN
      );
      return new cassandra.Client({ cloud, authProvider });
}

module.exports = { createConnection }
