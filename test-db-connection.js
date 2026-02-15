const mongoose = require('mongoose');

// Updated to match .env.local
const uri = "mongodb+srv://jeetamar3944_db_user:24SHr4jY0RPlXANc@clustor0.8szo2da.mongodb.net/business-dashboard";

console.log("Attempting to connect to MongoDB...");
console.log("URI:", uri.replace(/:([^:@]+)@/, ':****@')); // Log masked URI

mongoose.connect(uri)
    .then(() => {
        console.log("✅ Connection Successful!");
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ Connection Failed:");
        if (err.name === 'MongooseServerSelectionError') {
            console.error("Reason: Could not connect to any servers (Likely Network/Firewall or IP Whitelist).");
        } else {
            console.error(err);
        }
        process.exit(1);
    });
