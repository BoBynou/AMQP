const amqp = require('amqplib');
const nodemailer = require('nodemailer');

// Configuration de RabbitMQ
const queue = 'inscription_queue';

async function setupRabbitMQ() {
  const connection = await amqp.connect('amqp://localhost');
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });

  // Définir la fonction de callback pour traiter les messages
  channel.consume(queue, (message) => {
    const content = JSON.parse(message.content.toString());
    console.log(`Reçu un message: ${content.action} pour l'utilisateur ${content.user_id}`);

    // Envoi d'un e-mail de confirmation via MailHog
    sendConfirmationEmail(content.user_id);

    // Marquer le message comme traité
    channel.ack(message);
  });
}

// Envoi d'un e-mail de confirmation via MailHog
function sendConfirmationEmail(userId) {
  // Configurez le transporteur nodemailer pour utiliser MailHog
  const transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 1025, // Port par défaut de MailHog
    secure: false, // Pas de connexion sécurisée pour MailHog
  });

  // Options du message
  const email = document.getElementById('email').value;
  const mailOptions = {
    from: 'bob.loctin0@gmail.com',
    to: email,
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

// Démarrage du Consumer
setupRabbitMQ().catch(error => console.error('Erreur lors de la configuration de RabbitMQ:', error));
