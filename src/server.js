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

const user = []

let pedido = []


// evento que ocorre quando um cliente se conectar neste servidor
wss.on("connection", (socket) => {
    // imprime uma mensagem quando um cliente conectar
    console.log("Cliente conectado!");

    const enviarMensagem = (message, type, objeto) => {
        socket.send(JSON.stringify({
            message: message,
            type: type
        }))
    }

    enviarMensagem('Bem vindo ao restaurante, Deliciousocket :)', "cardapio")
    enviarMensagem('---------------------------------------------------', "cardapio")
    enviarMensagem('Digite o número correspondente ao seu pedido :)', "cardapio")
    enviarMensagem('---------------------------------------------------', "cardapio")
    foods.map(item=>{
        enviarMensagem(`${item.index} - ${item.name} - Valor: ${item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,"cardapio")
    })
    
    socket.on("message", (message_stringfy) => {

        var message_parse = JSON.parse(message_stringfy)
        var message = message_parse.message
        var type = message_parse.type


        if (type === "newUser") {
            user.push({message, pedido:[]})
        }

        if (type === "sugestao") {
            valor = Math.floor(Math.random() * (40 - 20)) + 20
            foods.push({
                "index": foods.length+1,
                "name": message,
                "value": valor
            })

            wss.clients.forEach((client) => {
                client.send(JSON.stringify({
                    message: `${foods.length} - ${message} - Valor: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
                    type: "cardapio"
                }));
            });
        }

        if (type === "excluir") {
            pedido = pedido.filter(item => item.index !== message)
            enviarMensagem('Ok, Excluir pedido de ' + foods[(message - 1)].name, "info")
            if(pedido.quantity===0){
                enviarMensagem('Ok, Excluir pedido de ' + foods[(message - 1)].name, "excluir")
            }
        }

        if(type==="diminuir"){
            const findFoodIndex = pedido.findIndex(item => item.index === message)
            pedido[findFoodIndex] = { ...pedido[findFoodIndex], quantity: pedido[findFoodIndex].quantity - 1 }
            enviarMensagem(pedido[findFoodIndex], "diminuir")
        }

        if (type == "escolher") {
            if (message > foods.length) {
                enviarMensagem('Inválido', "info")
            } else {
                console.log("Cliente vai querer: " + foods[(message - 1)].name);
                enviarMensagem('Ok, 1 pedido de ' + foods[(message - 1)].name, "info")

                const findFoodIndex = pedido.findIndex(item => item.index === foods[(message - 1)].index)

                if (findFoodIndex >= 0) {
                    pedido[findFoodIndex] = { ...pedido[findFoodIndex], quantity: pedido[findFoodIndex].quantity + 1 }
                    enviarMensagem(pedido[findFoodIndex], "carrinho")

                } else {
                    pedido.push({ ...foods[(message - 1)], quantity: 1 })
                    enviarMensagem({ ...foods[(message - 1)], quantity: 1 }, "carrinho")

                }
            }
        }

        enviarMensagem('Ta dando ' + pedido.reduce((total, item) => {
            return total + (item.value * item.quantity);
        }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "valorTotal")


        // envia a mensagem para todos os clientes conectados
        // wss.clients.forEach((client) => {
        //     client.send(message);
        // });
    });
});