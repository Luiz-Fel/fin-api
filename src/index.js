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

function getBalance(statement) {

   const balance = statement.reduce((acc, transaction) => {
        if(transaction.type === 'credit') {
            return acc + transaction.amount
        } else if (transaction.type === 'debit') {
            return acc - transaction.amount
        }
    }, 0)

    return balance

}


app.use(express.json());


app.get('/account', accountExists, (request, response) => {
    const { customer } = request;

    return response.status(200).json(customer)
})

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

app.put('/account' , accountExists, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(200).send()
})

app.delete('/account' , accountExists, (request, response) => {
    const { customer } = request;

    accounts.splice(accounts.indexOf(customer), 1)

    return response.status(200).json(accounts)
})

app.get('/statement', accountExists, (request, response) => {
    const { customer } = request

    return response.status(200).json(customer.statement)
})

app.get('/statement/date', accountExists, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + ' 00:00')

    const statement = customer.statement.filter(
        transaction => transaction.created_at.toDateString() 
        === 
        dateFormat.toDateString())

    return response.status(200).json(statement);
})

app.post("/deposit", accountExists, (request, response) => {
    const {description, amount} = request.body
    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).send();

})

app.post('/withdraw', accountExists, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;
    const balance = getBalance(customer.statement)

    if (balance < amount) {
        return response.status(400).json({ error: 'Insufficient funds'})
    }

    const withdrawTransaction = {
        amount,
        created_at: new Date(),
        type: "debit"
    } 
    customer.statement.push(withdrawTransaction);
    return response.status(201).send();
})

app.get('/balance', accountExists , (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement)

    return response.status(200).json(balance)
})


app.listen(3333);