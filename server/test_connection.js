const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://leonidasloutou_db_user:Callofduty47@cluster0.huuube1.mongodb.net/?appName=Cluster0";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        console.log("Tentative de connexion...");
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("✅ SUCCES : Connexion réussie à MongoDB !");
    } catch (error) {
        console.error("❌ ECHEC :", error.message);
        if (error.codeName === 'BadAuth') {
            console.log("-> Le mot de passe semble incorrect.");
        } else if (error.message.includes('MongooseServerSelectionError') || error.message.includes('timed out')) {
            console.log("-> Problème réseau ou Adresse IP non autorisée (Network Access).");
        }
    } finally {
        await client.close();
    }
}
run();
