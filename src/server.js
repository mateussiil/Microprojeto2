const PORT = process.env.PORT || 3000;
const INDEX = './index.html';

const express = require("express");

const server = express()
    .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
    .listen(PORT, () => console.log(`Servidor up and running na porta ${PORT}!`));


const WebSocket = require("ws");

// cria o objeto do servidor WebSocket
const wss = new WebSocket.Server({ server });

const foods = [
    {
        "index": 1,
        "name": "Macarrao",
        "value": 15.00
    },
    {
        "index": 2,
        "name": "Feijão",
        "value": 4.50
    },
    {
        "index": 3,
        "name": "Cachorro quente",
        "value": 10.00
    },
    {
        "index": 4,
        "name": "Pizza",
        "value": 30.00
    },
]

const users = []

// evento que ocorre quando um cliente se conectar neste servidor
wss.on("connection", (socket) => {
    // imprime uma mensagem quando um cliente conectar
    const enviarMensagem = (message, type, objeto) => {
        socket.send(JSON.stringify({
            message: message,
            type: type
        }))
    }

    socket.on("message", (message_stringfy) => {

        var message_parse = JSON.parse(message_stringfy)
        var message = message_parse.message
        var type = message_parse.type

        const { message_, user } = message
        const userIndex = users.findIndex(item => item.id === user)

        const valorTotal = () => {
            enviarMensagem('Ta dando ' + users[userIndex].pedido.reduce((total, item) => {
                return total + (item.value * item.quantity);
            }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "valorTotal")
        }

        if (type === "newUser") {
            users.push({ ...message, pedido: [] })
            if (!!message.name) {
                enviarMensagem(`Querido ${message.name}, Bem vindo ao nosso restaurante, Deliciousocket :)`, "inicial")
            } else {
                enviarMensagem(`Bem vindo ao nosso restaurante, Deliciousocket :)`, "inicial")
            }
            enviarMensagem('---------------------------------------------------', "cardapio")

        }

        if (type === "consultarCardapio") {
            enviarMensagem('Digite o número correspondente ao seu pedido :)', "cardapio")
            enviarMensagem('---------------------------------------------------', "cardapio")
            foods.map(item => {
                enviarMensagem(`${item.index} - ${item.name} - Valor: ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, "cardapio")
            })
        }

        if (type === "sugestao") {
            valor = Math.floor(Math.random() * (40 - 20)) + 20
            foods.push({
                "index": foods.length + 1,
                "name": message_,
                "value": valor
            })

            wss.clients.forEach((client) => {
                client.send(JSON.stringify({
                    message: `${foods.length} - ${message_} - Valor: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                    type: "cardapio"
                }));
            });
        }

        if (type === "excluir") {
            users[userIndex].pedido = users[userIndex].pedido.filter(item => item.index !== message_)
            enviarMensagem('Ok, Excluir pedido de ' + foods[(message_ - 1)].name, "info")
            valorTotal()
        }

        if (type === "diminuir") {
            const findFoodIndex = users[userIndex].pedido.findIndex(item => item.index === message_)
            users[userIndex].pedido[findFoodIndex] = { ...users[userIndex].pedido[findFoodIndex], quantity: users[userIndex].pedido[findFoodIndex].quantity - 1 }
            enviarMensagem(users[userIndex].pedido[findFoodIndex], "diminuir")
            valorTotal()
        }

        if (type == "escolher") {
            if (message_ > foods.length) {
                enviarMensagem('Inválido', "info")
            } else {
                console.log(`Cliente ${user} vai querer: ` + foods[(message_ - 1)].name);
                enviarMensagem('Ok, 1 pedido de ' + foods[(message_ - 1)].name, "info")

                const findFoodIndex = users[userIndex].pedido.findIndex(item => item.index === foods[(message_ - 1)].index)

                if (findFoodIndex >= 0) {
                    users[userIndex].pedido[findFoodIndex] = { ...users[userIndex].pedido[findFoodIndex], quantity: users[userIndex].pedido[findFoodIndex].quantity + 1 }
                    enviarMensagem(users[userIndex].pedido[findFoodIndex], "carrinho")

                } else {
                    users[userIndex].pedido.push({ ...foods[(message_ - 1)], quantity: 1 })
                    enviarMensagem({ ...foods[(message_ - 1)], quantity: 1 }, "carrinho")
                }

                valorTotal()
            }
        }
    });
});