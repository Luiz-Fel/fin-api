const express = require('express');
const { v4 } = require('uuid')

const app = express();
const accounts = []

function accountExists(request, response, next) {
    const { cpf } = request.headers;

    const customer = accounts.find((account) => account.cpf === cpf)

    if (!customer) {
        return response.status(400).json({ error: 'Customer not found'})
    }

    request.customer = customer

    return next()
}


app.use(express.json());


app.post('/account', (request, response) => {
    const {cpf, name} = request.body
    
    const userAlreadyExists = accounts.some((account) => account.cpf === cpf) 

    if (userAlreadyExists ) {
        return response.status(400).json({error: "Customer already exists"});
    }
        //adição no database
    accounts.push({
        cpf,
        name,
        id : v4(),
        statement: [],
    })

    return response.status(201).send()
})

app.get('/statement', accountExists, (request, response) => {
    const { customer } = request

    return response.status(200).json(customer.statement)
})

app.listen(3333);