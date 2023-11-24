const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const http = require('http');

const app = express();
const port = 3000;
const server = http.createServer(app);
app.use(express.json());

app.use(bodyParser.json());

// Configuration de RabbitMQ
const queue = 'inscription_queue';
let channel;

async function setupRabbitMQ() {
  // Utilisation du protocole amqp
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
}

// Route pour l'inscription d'utilisateur
app.post('/inscription', async (req, res) => {
  const data = req.body;

  // Traitement de l'inscription (à remplacer par votre logique métier)
  const userId = processInscription(data);

  // Envoi du message AMQP
  sendAMQPMessage(userId);

  res.json({ message: 'Inscription réussie' });
});

function processInscription(data) {
  // Logique métier pour le traitement de l'inscription
  // Vous pouvez ajouter votre propre logique ici
  // Par exemple, sauvegarder l'utilisateur dans la base de données
  // et retourner l'ID de l'utilisateur créé
  // Ici, nous simulons simplement en renvoyant un ID statique
  return 1;
}

function sendAMQPMessage(userId) {
  // Envoi du message AMQP à la file d'attente
  const message = { user_id: userId, action: 'inscription' };
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}

// Démarrage du serveur Express et configuration de RabbitMQ
app.use(express.static(__dirname));

server.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
  await setupRabbitMQ();
});
