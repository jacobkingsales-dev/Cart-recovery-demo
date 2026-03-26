const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require("openai");
const sgMail = require('@sendgrid/mail');

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/webhook', async (req, res) => {
    const data = req.body;
    const email = data.email;
    const items = data.line_items;

    if (!email) {
        return res.sendStatus(200);
    }

    const aiMessage = await generateEmail(items);
    await sendEmail(email, aiMessage);

    res.sendStatus(200);
});

async function generateEmail(items) {
    const response = await openai.chat.completions.create({
        model: "gpt-4.1",
        messages: [
            { role: "system", content: "You are an expert eCommerce sales assistant." },
            { role: "user", content: `Customer left these items in cart: ${JSON.stringify(items)}. Write a persuasive recovery email.` }
        ]
    });
    return response.choices[0].message.content;
}

async function sendEmail(to, message) {
    const msg = {
        to,
        from: 'your-email@example.com',
        subject: 'You forgot something in your cart!',
        html: message,
    };
    await sgMail.send(msg);
}

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(3000, () => console.log('Server running on port 3000'));
