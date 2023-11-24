const express = require('express');
const bodyParser = require('body-parser');
const amqp = require('amqplib');
const http = require('http');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;
const server = http.createServer(app);
app.use(express.json());

app.use(bodyParser.json());

// Configuration de RabbitMQ
const queue = 'inscription_queue';
let channel;

async function setupRabbitMQ(data) {
  // Utilisation du protocole amqp
  console.log(data);
  console.log("test");
  const connection = await amqp.connect('amqp://localhost');
  channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  channel.consume(queue, (message) => {
    const content = JSON.parse(message.content.toString());
    console.log(`Reçu un message: ${content.action} pour l'utilisateur ${content.user_id}`);
    console.log(data.email)
    // Envoi d'un e-mail de confirmation via MailHog
    sendConfirmationEmail(content.user_id, data.email);

    // Marquer le message comme traité
    channel.ack(message);
  });
}

// Route pour l'inscription d'utilisateur
app.post('/inscription', async (req, res) => {
  const data = req.body;
  // Traitement de l'inscription (à remplacer par votre logique métier)
  const userId = processInscription(data);
  // Envoi du message AMQP
  sendAMQPMessage(userId, data.email);
  await setupRabbitMQ(data);

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

function sendAMQPMessage(userId, email) {
  // Envoi du message AMQP à la file d'attente
  const message = { user_id: userId, email, action: 'inscription' };
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), { persistent: true });
}

// Démarrage du serveur Express et configuration de RabbitMQ
app.use(express.static(__dirname));

server.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
});

function sendConfirmationEmail(userId, email) {
  console.log(email);
  // Configurez le transporteur nodemailer pour utiliser MailHog
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025, // Port par défaut de MailHog
    secure: false, // Pas de connexion sécurisée pour MailHog
  });

  // Options du message
  const mailOptions = {
    from: 'bob.loctin0@gmail.com',
    to: email, // Utilisez l'adresse e-mail fournie
    subject: 'Confirmation d\'inscription',
    text: `Merci de vous être inscrit! Votre ID utilisateur est ${userId}.`,
  };

  // Envoi de l'e-mail
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Erreur lors de l\'envoi de l\'e-mail:', error);
    } else {
      console.log('E-mail de confirmation envoyé:', info.response);
    }
  });
}

setupRabbitMQ().catch(error => console.error('Erreur lors de la configuration de RabbitMQ:', error));
